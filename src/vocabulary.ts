/**
 * Durable vocabulary of dsh-background-agents: the canonical notice-line
 * format carried by model-visible injections and the replay metadata the
 * four tools attach to their `tool/result` events. Both channels use ONLY
 * event types the harness already knows (`user/message`, `tool/result`), so
 * the facts survive persistence reloads and the `backgroundAgents`
 * projection folds them back out of the parent log — the same discipline as
 * model-visible ⟺ logged, applied to dashboard state.
 *
 * @module dsh-background-agents/vocabulary
 */

/** The producer tag stamped on every model-visible notice and replay meta this plugin writes. */
export const PLUGIN = 'dsh-background-agents' as const

/** Prefix that opens every injected notice line, carrying the durable child agent id. */
export const NOTICE_PREFIX = '[background-agent ' as const

/**
 * Join one injected notice line from the child id, the fact kind, and the
 * human text. The projection folds the line back apart; the model reads the
 * whole line verbatim.
 * @param agentId - durable child session id.
 * @param kind - which lifecycle fact the line states.
 * @param text - human-readable account.
 * @returns the canonical notice line.
 */
export function noticeLine(agentId: string, kind: 'progress' | 'archived', text: string): string {
  return `${NOTICE_PREFIX}${agentId}] ${kind}: ${text}`
}

/** One parsed notice line: the durable child id and the stated fact kind. */
export interface NoticeHead {
  /** Durable child session id from the line prefix. */
  readonly agentId: string
  /** The fact kind (`progress` or `archived`). */
  readonly kind: 'progress' | 'archived'
  /** The human text after the head. */
  readonly text: string
}

/**
 * Parse the canonical notice head. Returns undefined for any line this
 * plugin did not produce, so foreign plugin notices never fold into the
 * projection.
 * @param text - one injected notice line.
 * @returns the head, or undefined when the line is not this plugin's format.
 */
export function parseNotice(text: string): NoticeHead | undefined {
  if (!text.startsWith(NOTICE_PREFIX)) return undefined
  const close = text.indexOf(']', NOTICE_PREFIX.length)
  if (close === -1) return undefined
  const agentId = text.slice(NOTICE_PREFIX.length, close)
  if (agentId === '') return undefined
  const rest = text.slice(close + 1)
  if (rest.startsWith(' progress: ')) return { agentId, kind: 'progress', text: rest.slice(' progress: '.length) }
  if (rest.startsWith(' archived: ')) return { agentId, kind: 'archived', text: rest.slice(' archived: '.length) }
  return undefined
}

/**
 * Replay metadata attached to the background_agent tool result: the durable
 * registration fact the projection folds into the new agent row.
 */
export interface RegisteredMeta {
  readonly plugin: typeof PLUGIN
  readonly action: 'registered'
  /** Durable child session id. */
  readonly agentId: string
  /** Creation label persisted with the child. */
  readonly label: string
}

/**
 * Replay metadata attached to the bg_message tool result: one accepted
 * follow-up delivery.
 */
export interface MessageMeta {
  readonly plugin: typeof PLUGIN
  readonly action: 'message'
  /** Durable child session id. */
  readonly agentId: string
  /** Inbox message id of the accepted delivery. */
  readonly messageId: string
}

/**
 * Replay metadata attached to the bg_stop tool result: one interrupt request.
 */
export interface StopMeta {
  readonly plugin: typeof PLUGIN
  readonly action: 'stop'
  /** Durable child session id. */
  readonly agentId: string
}

/** The closed replay-metadata union this plugin writes into `tool/result.meta`. */
export type BackgroundAgentsMeta = RegisteredMeta | MessageMeta | StopMeta

/**
 * Runtime-guard one opaque `tool/result.meta` value as this plugin's metadata.
 * The meta channel is tool-private JSON, so the projection validates before
 * folding rather than trusting shape by position.
 * @param value - the opaque meta value.
 * @returns the typed meta, or undefined when another tool wrote it.
 */
export function isBackgroundAgentsMeta(value: unknown): BackgroundAgentsMeta | undefined {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return undefined
  const candidate = value as Record<string, unknown>
  if (candidate.plugin !== PLUGIN) return undefined
  if (typeof candidate.agentId !== 'string' || candidate.agentId === '') return undefined
  switch (candidate.action) {
    case 'registered':
      return typeof candidate.label === 'string'
        ? { plugin: PLUGIN, action: 'registered', agentId: candidate.agentId, label: candidate.label }
        : undefined
    case 'message':
      return typeof candidate.messageId === 'string'
        ? { plugin: PLUGIN, action: 'message', agentId: candidate.agentId, messageId: candidate.messageId }
        : undefined
    case 'stop':
      return { plugin: PLUGIN, action: 'stop', agentId: candidate.agentId }
    default:
      return undefined
  }
}
