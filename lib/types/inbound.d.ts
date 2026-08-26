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
import { type ChildProcess, type SpawnOptions } from 'node:child_process';
import { z } from 'zod';
/** A JSON-RPC 2.0 id: a string, a number, or null (notifications carry none). */
export type JsonRpcId = string | number | null;
/** The three recognized inbound event names (the JSON-RPC `method`). */
export declare const INBOUND_METHODS: readonly ["agent_started", "agent_message", "agent_finished"];
/** One recognized inbound event name. */
export type InboundMethod = (typeof INBOUND_METHODS)[number];
/** Optional token accounting the runtime may report on `agent_finished`. */
export declare const inboundUsageSchema: z.ZodObject<{
    /** Un-cached input tokens of the finished run. */
    inputTokens: z.ZodNumber;
    /** Output tokens of the finished run. */
    outputTokens: z.ZodNumber;
}, "strict", z.ZodTypeAny, {
    inputTokens: number;
    outputTokens: number;
}, {
    inputTokens: number;
    outputTokens: number;
}>;
/** Token accounting the runtime may report on `agent_finished`. */
export type InboundUsage = z.infer<typeof inboundUsageSchema>;
/**
 * The `params` payload every inbound notification carries. `name` is the
 * external agent's display name; `room` the team-room id; `traceId` the
 * correlation id; `status` the ok/error outcome (only `agent_finished`);
 * `message` the text (required for `agent_message`); `usage` optional token
 * accounting. `.strict()` rejects unknown fields — fail-closed by default.
 */
export declare const inboundParamsSchema: z.ZodObject<{
    name: z.ZodString;
    room: z.ZodString;
    traceId: z.ZodString;
    status: z.ZodOptional<z.ZodEnum<["ok", "error"]>>;
    message: z.ZodOptional<z.ZodString>;
    usage: z.ZodOptional<z.ZodObject<{
        /** Un-cached input tokens of the finished run. */
        inputTokens: z.ZodNumber;
        /** Output tokens of the finished run. */
        outputTokens: z.ZodNumber;
    }, "strict", z.ZodTypeAny, {
        inputTokens: number;
        outputTokens: number;
    }, {
        inputTokens: number;
        outputTokens: number;
    }>>;
}, "strict", z.ZodTypeAny, {
    name: string;
    room: string;
    traceId: string;
    message?: string | undefined;
    status?: "ok" | "error" | undefined;
    usage?: {
        inputTokens: number;
        outputTokens: number;
    } | undefined;
}, {
    name: string;
    room: string;
    traceId: string;
    message?: string | undefined;
    status?: "ok" | "error" | undefined;
    usage?: {
        inputTokens: number;
        outputTokens: number;
    } | undefined;
}>;
/** One decoded JSON-RPC request line (params left unknown until mapped). */
export interface InboundRequest {
    /** The JSON-RPC `method`, expected to be one of {@link INBOUND_METHODS}. */
    readonly method: string;
    /** The raw `params` value; validated by {@link mapInboundEvent}. */
    readonly params: unknown;
    /** The request id, or null when the line was a notification (no id). */
    readonly id: JsonRpcId;
}
/** A parsed stdin line: either a valid request or a protocol error to report back. */
export type InboundParse = {
    readonly ok: true;
    readonly request: InboundRequest;
} | {
    readonly ok: false;
    readonly id: JsonRpcId;
    readonly code: number;
    readonly message: string;
};
/** A mapped event: either a normalized event or an invalid-params error. */
export type InboundDecode = {
    readonly ok: true;
    readonly event: InboundEvent;
} | {
    readonly ok: false;
    readonly code: number;
    readonly message: string;
};
/**
 * One normalized inbound event, discriminated on the JSON-RPC `method`.
 * `name` is the external agent's display name; `roomId`/`traceId` come from
 * `params.room`/`params.traceId`.
 */
export type InboundEvent = {
    readonly method: 'agent_started';
    readonly name: string;
    readonly roomId: string;
    readonly traceId: string;
    readonly message?: string;
} | {
    readonly method: 'agent_message';
    readonly name: string;
    readonly roomId: string;
    readonly traceId: string;
    readonly message: string;
} | {
    readonly method: 'agent_finished';
    readonly name: string;
    readonly roomId: string;
    readonly traceId: string;
    readonly status: 'ok' | 'error';
    readonly message?: string;
    readonly usage?: InboundUsage;
};
/**
 * One room write the bridge performs for a normalized event: a task-board
 * card open/close or a message-bus post. `traceId` correlates the card with
 * the external run so `agent_finished` can close the card `agent_started`
 * opened.
 */
export type InboundDelivery = {
    readonly kind: 'task-open';
    readonly roomId: string;
    readonly traceId: string;
    readonly title: string;
} | {
    readonly kind: 'bus-post';
    readonly roomId: string;
    readonly traceId: string;
    readonly text: string;
} | {
    readonly kind: 'task-close';
    readonly roomId: string;
    readonly traceId: string;
    readonly status: 'ok' | 'error';
};
/** The host-side delivery target: receives normalized events, returns nothing (or a promise). */
export type InboundSink = (event: InboundEvent) => Promise<void> | void;
/** A minimal logger face; `console` and the Cordis logger both satisfy it. */
export interface InboundLogger {
    info(message: string): void;
    warn(message: string): void;
    error(message: string): void;
    debug?(message: string): void;
}
/** An adapter that listens for external events and forwards them to a sink. */
export interface InboundAdapter {
    /**
     * Begin listening; every mapped event goes to `sink`. Returns a disposer
     * that stops the adapter and releases every side effect it owns.
     * @param sink - the delivery target for normalized events.
     * @returns the stop disposer.
     */
    start(sink: InboundSink): () => void;
}
/** Spawn signature the stdio adapter uses; injectable for protocol tests. */
export type SpawnFn = (command: string, options: SpawnOptions) => ChildProcess;
/**
 * Parse one newline-delimited stdin line as a JSON-RPC 2.0 request or
 * notification. Malformed JSON and non-conforming envelopes fail closed with
 * a stable JSON-RPC error code; the caller reports the error back.
 * @param line - one raw line (whitespace tolerated).
 * @returns the parsed request, or a protocol error with its response id.
 */
export declare function parseInboundLine(line: string): InboundParse;
/**
 * Validate a parsed request's method and params and map them to a normalized
 * {@link InboundEvent}. Unknown methods and invalid params fail closed with a
 * stable JSON-RPC error code.
 * @param request - the parsed request from {@link parseInboundLine}.
 * @returns the normalized event, or an error to report back.
 */
export declare function mapInboundEvent(request: InboundRequest): InboundDecode;
/**
 * Map one normalized event to the team room's existing surfaces. The result
 * is a list of room writes the host executes in order against the `RoomHub`.
 * @param event - the normalized inbound event.
 * @returns the ordered room deliveries for the event.
 */
export declare function deliveriesFor(event: InboundEvent): InboundDelivery[];
/**
 * Serialize one JSON-RPC 2.0 error response. `id` is echoed when the request
 * carried one; null otherwise (best-effort observability for a notification,
 * which the JSON-RPC spec would normally not answer).
 * @param id - the request id to echo (or null).
 * @param code - the JSON-RPC error code.
 * @param message - the human-readable error text.
 * @returns one serialized error response line (no trailing newline).
 */
export declare function jsonRpcErrorResponse(id: JsonRpcId, code: number, message: string): string;
/**
 * The stdio JSON-RPC inbound adapter: spawns a runtime command and listens
 * for newline-delimited JSON-RPC notifications on its stdout. Invalid lines
 * are dropped (fail-closed) and answered with a JSON-RPC error on the child's
 * stdin. Start/stop are owned entirely by the returned disposer.
 */
export declare class StdioJsonRpcInbound implements InboundAdapter {
    private readonly command;
    private readonly logger;
    private readonly spawnFn;
    private child;
    private attempted;
    private disposed;
    /**
     * @param command - the runtime launch command (spawned with a shell).
     * @param logger - where lifecycle and rejection lines are logged.
     * @param spawnFn - injectable spawn for tests; defaults to `node:child_process` spawn.
     */
    constructor(command: string, logger?: InboundLogger, spawnFn?: SpawnFn);
    /**
     * Spawn the runtime and begin listening. A spawn failure degrades to a
     * logged warning and a no-op disposer (the bridge stays dormant).
     * @param sink - the delivery target for mapped events.
     * @returns the stop disposer (kills the child; further output is ignored).
     */
    start(sink: InboundSink): () => void;
    /** Stop the adapter: kill the child if still running; further output is ignored. Idempotent. */
    stop(): void;
    /** Decode one line, emit a mapped event, or report the failure back (fail-closed). */
    private handleLine;
    /** Best-effort write of one JSON-RPC error response to the child's stdin. */
    private writeResponse;
}
/**
 * The inbound adapter provider seam: registers adapters and owns their
 * disposers. Every registration returns a disposer that stops and unregisters
 * exactly that adapter; {@link stopAll} stops every registered adapter.
 */
export declare class InboundCoordinator {
    private readonly stops;
    /**
     * Register one adapter for a sink and start it. Returns a disposer that
     * stops the adapter and drops it from the registry (idempotent).
     * @param adapter - the adapter to start.
     * @param sink - the delivery target the adapter emits into.
     * @returns the stop-and-unregister disposer.
     */
    registerInboundAdapter(adapter: InboundAdapter, sink: InboundSink): () => void;
    /** Stop every registered adapter (idempotent). */
    stopAll(): void;
}
//# sourceMappingURL=inbound.d.ts.map