/**
 * Cross-ecosystem inbound (P2): a minimal newline-delimited JSON-RPC 2.0
 * bridge over stdio that lets external agent runtimes — OpenAI Agents SDK,
 * CrewAI, and similar — publish into a team room.
 *
 * This is a JSON-RPC direct-connect minimal set, not the official ACP wire
 * protocol: full ACP compatibility waits for the upstream seam. The bridge
 * exposes one seam ({@link InboundCoordinator.registerInboundAdapter}) that
 * returns a disposer, and one concrete adapter ({@link StdioJsonRpcInbound})
 * that spawns a runtime command and listens on its stdout.
 *
 * Wire shape (one JSON notification per line on the child's stdout):
 *
 * - `jsonrpc` is always `"2.0"`; `method` is the event name
 *   (`agent_started` | `agent_message` | `agent_finished`).
 * - `params` carries the payload: `name` (the external agent's display
 *   name), `room` (the team-room id), `traceId` (the correlation id),
 *   `status` (`ok` | `error`, only meaningful on `agent_finished`),
 *   `message` (the text), and optional `usage` token accounting.
 *
 * Mapping onto the team room's existing surfaces (see {@link deliveriesFor}):
 * `agent_started` opens a task-board card, `agent_message` posts to the
 * message bus, and `agent_finished` closes the card and posts the outcome.
 * Every invalid message fails closed: it is dropped and a JSON-RPC error
 * response is written back to the child's stdin. The owning fiber disposes
 * the adapter (kills the child, removes listeners) through the returned
 * disposer; an unspawnable command degrades to a logged warning and a
 * dormant bridge.
 *
 * @module dsh-background-agents/inbound
 */

import { spawn, type ChildProcess, type SpawnOptions } from 'node:child_process'
import { z } from 'zod'

/** A JSON-RPC 2.0 id: a string, a number, or null (notifications carry none). */
export type JsonRpcId = string | number | null

/** The three recognized inbound event names (the JSON-RPC `method`). */
export const INBOUND_METHODS = ['agent_started', 'agent_message', 'agent_finished'] as const

/** One recognized inbound event name. */
export type InboundMethod = (typeof INBOUND_METHODS)[number]

/** Optional token accounting the runtime may report on `agent_finished`. */
export const inboundUsageSchema = z.object({
  /** Un-cached input tokens of the finished run. */
  inputTokens: z.number().int().nonnegative(),
  /** Output tokens of the finished run. */
  outputTokens: z.number().int().nonnegative(),
}).strict()

/** Token accounting the runtime may report on `agent_finished`. */
export type InboundUsage = z.infer<typeof inboundUsageSchema>

/**
 * The `params` payload every inbound notification carries. `name` is the
 * external agent's display name; `room` the team-room id; `traceId` the
 * correlation id; `status` the ok/error outcome (only `agent_finished`);
 * `message` the text (required for `agent_message`); `usage` optional token
 * accounting. `.strict()` rejects unknown fields — fail-closed by default.
 */
export const inboundParamsSchema = z.object({
  name: z.string().min(1).max(200),
  room: z.string().min(1),
  traceId: z.string().min(1),
  status: z.enum(['ok', 'error']).optional(),
  message: z.string().optional(),
  usage: inboundUsageSchema.optional(),
}).strict()

/** One decoded JSON-RPC request line (params left unknown until mapped). */
export interface InboundRequest {
  /** The JSON-RPC `method`, expected to be one of {@link INBOUND_METHODS}. */
  readonly method: string
  /** The raw `params` value; validated by {@link mapInboundEvent}. */
  readonly params: unknown
  /** The request id, or null when the line was a notification (no id). */
  readonly id: JsonRpcId
}

/** A parsed stdin line: either a valid request or a protocol error to report back. */
export type InboundParse =
  | { readonly ok: true; readonly request: InboundRequest }
  | { readonly ok: false; readonly id: JsonRpcId; readonly code: number; readonly message: string }

/** A mapped event: either a normalized event or an invalid-params error. */
export type InboundDecode =
  | { readonly ok: true; readonly event: InboundEvent }
  | { readonly ok: false; readonly code: number; readonly message: string }

/**
 * One normalized inbound event, discriminated on the JSON-RPC `method`.
 * `name` is the external agent's display name; `roomId`/`traceId` come from
 * `params.room`/`params.traceId`.
 */
export type InboundEvent =
  | {
    readonly method: 'agent_started'
    readonly name: string
    readonly roomId: string
    readonly traceId: string
    readonly message?: string
  }
  | {
    readonly method: 'agent_message'
    readonly name: string
    readonly roomId: string
    readonly traceId: string
    readonly message: string
  }
  | {
    readonly method: 'agent_finished'
    readonly name: string
    readonly roomId: string
    readonly traceId: string
    readonly status: 'ok' | 'error'
    readonly message?: string
    readonly usage?: InboundUsage
  }

/**
 * One room write the bridge performs for a normalized event: a task-board
 * card open/close or a message-bus post. `traceId` correlates the card with
 * the external run so `agent_finished` can close the card `agent_started`
 * opened.
 */
export type InboundDelivery =
  | { readonly kind: 'task-open'; readonly roomId: string; readonly traceId: string; readonly title: string }
  | { readonly kind: 'bus-post'; readonly roomId: string; readonly traceId: string; readonly text: string }
  | { readonly kind: 'task-close'; readonly roomId: string; readonly traceId: string; readonly status: 'ok' | 'error' }

/** The host-side delivery target: receives normalized events, returns nothing (or a promise). */
export type InboundSink = (event: InboundEvent) => Promise<void> | void

/** A minimal logger face; `console` and the Cordis logger both satisfy it. */
export interface InboundLogger {
  info(message: string): void
  warn(message: string): void
  error(message: string): void
  debug?(message: string): void
}

/** An adapter that listens for external events and forwards them to a sink. */
export interface InboundAdapter {
  /**
   * Begin listening; every mapped event goes to `sink`. Returns a disposer
   * that stops the adapter and releases every side effect it owns.
   * @param sink - the delivery target for normalized events.
   * @returns the stop disposer.
   */
  start(sink: InboundSink): () => void
}

/** Spawn signature the stdio adapter uses; injectable for protocol tests. */
export type SpawnFn = (command: string, options: SpawnOptions) => ChildProcess

/**
 * Parse one newline-delimited stdin line as a JSON-RPC 2.0 request or
 * notification. Malformed JSON and non-conforming envelopes fail closed with
 * a stable JSON-RPC error code; the caller reports the error back.
 * @param line - one raw line (whitespace tolerated).
 * @returns the parsed request, or a protocol error with its response id.
 */
export function parseInboundLine(line: string): InboundParse {
  let value: unknown
  try {
    value = JSON.parse(line)
  } catch {
    return { ok: false, id: null, code: -32700, message: 'Parse error: not valid JSON' }
  }
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return { ok: false, id: null, code: -32600, message: 'Invalid Request: not a JSON-RPC object' }
  }
  const record = value as Record<string, unknown>
  if (record.jsonrpc !== '2.0') {
    return { ok: false, id: toId(record.id), code: -32600, message: 'Invalid Request: jsonrpc must be "2.0"' }
  }
  if (typeof record.method !== 'string' || record.method === '') {
    return { ok: false, id: toId(record.id), code: -32600, message: 'Invalid Request: method must be a non-empty string' }
  }
  return { ok: true, request: { method: record.method, params: record.params, id: toId(record.id) } }
}

/**
 * Validate a parsed request's method and params and map them to a normalized
 * {@link InboundEvent}. Unknown methods and invalid params fail closed with a
 * stable JSON-RPC error code.
 * @param request - the parsed request from {@link parseInboundLine}.
 * @returns the normalized event, or an error to report back.
 */
export function mapInboundEvent(request: InboundRequest): InboundDecode {
  if (!(INBOUND_METHODS as readonly string[]).includes(request.method)) {
    return {
      ok: false,
      code: -32601,
      message: `Method not found: ${request.method} (expected ${INBOUND_METHODS.join(' | ')})`,
    }
  }
  const method = request.method as InboundMethod
  const parsed = inboundParamsSchema.safeParse(request.params)
  if (!parsed.success) {
    return { ok: false, code: -32602, message: `Invalid params: ${zodIssueText(parsed.error)}` }
  }
  const params = parsed.data
  const base = { name: params.name, roomId: params.room, traceId: params.traceId }
  switch (method) {
    case 'agent_started':
      return {
        ok: true,
        event: { method, ...base, ...(params.message === undefined ? {} : { message: params.message }) },
      }
    case 'agent_message': {
      if (params.message === undefined) {
        return { ok: false, code: -32602, message: 'Invalid params: message is required for agent_message' }
      }
      return { ok: true, event: { method, ...base, message: params.message } }
    }
    case 'agent_finished':
      return {
        ok: true,
        event: {
          method,
          ...base,
          status: params.status ?? 'ok',
          ...(params.message === undefined ? {} : { message: params.message }),
          ...(params.usage === undefined ? {} : { usage: params.usage }),
        },
      }
  }
}

/**
 * Map one normalized event to the team room's existing surfaces. The result
 * is a list of room writes the host executes in order against the `RoomHub`.
 * @param event - the normalized inbound event.
 * @returns the ordered room deliveries for the event.
 */
export function deliveriesFor(event: InboundEvent): InboundDelivery[] {
  switch (event.method) {
    case 'agent_started':
      return [{ kind: 'task-open', roomId: event.roomId, traceId: event.traceId, title: `${event.name} (${event.traceId})` }]
    case 'agent_message':
      return [{ kind: 'bus-post', roomId: event.roomId, traceId: event.traceId, text: `[${event.name}] ${event.message}` }]
    case 'agent_finished':
      return [
        { kind: 'task-close', roomId: event.roomId, traceId: event.traceId, status: event.status },
        {
          kind: 'bus-post',
          roomId: event.roomId,
          traceId: event.traceId,
          text: `[${event.name}] finished (${event.status})${event.message === undefined ? '' : `: ${event.message}`}`,
        },
      ]
  }
}

/**
 * Serialize one JSON-RPC 2.0 error response. `id` is echoed when the request
 * carried one; null otherwise (best-effort observability for a notification,
 * which the JSON-RPC spec would normally not answer).
 * @param id - the request id to echo (or null).
 * @param code - the JSON-RPC error code.
 * @param message - the human-readable error text.
 * @returns one serialized error response line (no trailing newline).
 */
export function jsonRpcErrorResponse(id: JsonRpcId, code: number, message: string): string {
  return JSON.stringify({ jsonrpc: '2.0', error: { code, message }, id })
}

/**
 * The stdio JSON-RPC inbound adapter: spawns a runtime command and listens
 * for newline-delimited JSON-RPC notifications on its stdout. Invalid lines
 * are dropped (fail-closed) and answered with a JSON-RPC error on the child's
 * stdin. Start/stop are owned entirely by the returned disposer.
 */
export class StdioJsonRpcInbound implements InboundAdapter {
  private child: ChildProcess | undefined
  private attempted = false
  private disposed = false

  /**
   * @param command - the runtime launch command (spawned with a shell).
   * @param logger - where lifecycle and rejection lines are logged.
   * @param spawnFn - injectable spawn for tests; defaults to `node:child_process` spawn.
   */
  constructor(
    private readonly command: string,
    private readonly logger: InboundLogger = console,
    private readonly spawnFn: SpawnFn = spawn,
  ) {}

  /**
   * Spawn the runtime and begin listening. A spawn failure degrades to a
   * logged warning and a no-op disposer (the bridge stays dormant).
   * @param sink - the delivery target for mapped events.
   * @returns the stop disposer (kills the child; further output is ignored).
   */
  start(sink: InboundSink): () => void {
    if (this.attempted) throw new Error('StdioJsonRpcInbound: start() called twice')
    this.attempted = true
    let child: ChildProcess
    try {
      child = this.spawnFn(this.command, { shell: true, stdio: ['pipe', 'pipe', 'pipe'] })
    } catch (error) {
      this.logger.warn(`inbound: cannot spawn "${this.command}" (${String(error)}); the stdio bridge is dormant`)
      return () => {}
    }
    this.child = child
    this.disposed = false

    let pending = ''
    const onStdout = (chunk: Buffer | string): void => {
      if (this.disposed) return
      pending += typeof chunk === 'string' ? chunk : chunk.toString()
      let index = pending.indexOf('\n')
      while (index !== -1) {
        const line = pending.slice(0, index)
        pending = pending.slice(index + 1)
        this.handleLine(line, sink)
        index = pending.indexOf('\n')
      }
    }
    const onStderr = (chunk: Buffer | string): void => {
      if (this.disposed) return
      this.logger.debug?.(`inbound: runtime stderr: ${(typeof chunk === 'string' ? chunk : chunk.toString()).trim()}`)
    }
    const onError = (error: Error): void => {
      if (this.disposed) return
      this.logger.warn(`inbound: runtime error: ${String(error)}`)
    }
    const onClose = (code: number | null, signal: NodeJS.Signals | null): void => {
      if (this.disposed) return
      this.logger.info(`inbound: runtime exited (code ${String(code)}, signal ${String(signal)}); bridge stopped`)
    }

    child.stdout?.on('data', onStdout)
    child.stderr?.on('data', onStderr)
    child.on('error', onError)
    child.on('close', onClose)

    return () => this.stop()
  }

  /** Stop the adapter: kill the child if still running; further output is ignored. Idempotent. */
  stop(): void {
    if (this.disposed) return
    this.disposed = true
    const child = this.child
    this.child = undefined
    if (child !== undefined && child.exitCode === null && child.signalCode === null) child.kill()
  }

  /** Decode one line, emit a mapped event, or report the failure back (fail-closed). */
  private handleLine(line: string, sink: InboundSink): void {
    const trimmed = line.trim()
    if (trimmed === '') return
    const parsed = parseInboundLine(trimmed)
    if (parsed.ok !== true) {
      this.writeResponse(parsed.id, parsed.code, parsed.message)
      this.logger.warn(`inbound: dropped line: ${parsed.message}`)
      return
    }
    const decoded = mapInboundEvent(parsed.request)
    if (decoded.ok !== true) {
      this.writeResponse(parsed.request.id, decoded.code, decoded.message)
      this.logger.warn(`inbound: dropped ${parsed.request.method}: ${decoded.message}`)
      return
    }
    try {
      const result = sink(decoded.event)
      if (result instanceof Promise) {
        result.catch((error: unknown) => {
          this.logger.warn(`inbound: sink rejected ${decoded.event.method}: ${String(error)}`)
        })
      }
    } catch (error) {
      this.logger.warn(`inbound: sink threw ${decoded.event.method}: ${String(error)}`)
    }
  }

  /** Best-effort write of one JSON-RPC error response to the child's stdin. */
  private writeResponse(id: JsonRpcId, code: number, message: string): void {
    const stdin = this.child?.stdin
    if (stdin === undefined || stdin === null) return
    try {
      stdin.write(jsonRpcErrorResponse(id, code, message) + '\n')
    } catch {
      // stdin closed under us; the message was already dropped — nothing to do.
    }
  }
}

/**
 * The inbound adapter provider seam: registers adapters and owns their
 * disposers. Every registration returns a disposer that stops and unregisters
 * exactly that adapter; {@link stopAll} stops every registered adapter.
 */
export class InboundCoordinator {
  private readonly stops = new Set<() => void>()

  /**
   * Register one adapter for a sink and start it. Returns a disposer that
   * stops the adapter and drops it from the registry (idempotent).
   * @param adapter - the adapter to start.
   * @param sink - the delivery target the adapter emits into.
   * @returns the stop-and-unregister disposer.
   */
  registerInboundAdapter(adapter: InboundAdapter, sink: InboundSink): () => void {
    const stop = adapter.start(sink)
    let stopped = false
    const disposer = (): void => {
      if (stopped) return
      stopped = true
      try {
        stop()
      } finally {
        this.stops.delete(disposer)
      }
    }
    this.stops.add(disposer)
    return disposer
  }

  /** Stop every registered adapter (idempotent). */
  stopAll(): void {
    for (const stop of [...this.stops]) stop()
    this.stops.clear()
  }
}

/** Read one JSON-RPC id field: a string, a number, or null when absent. */
function toId(value: unknown): JsonRpcId {
  return typeof value === 'string' || typeof value === 'number' ? value : null
}

/** Flatten a zod error into one stable, human-readable message. */
function zodIssueText(error: z.ZodError): string {
  return error.issues.map(issue => `${issue.path.length === 0 ? '(root)' : issue.path.join('.')}: ${issue.message}`).join('; ')
}
