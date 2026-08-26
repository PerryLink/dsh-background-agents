/**
 * Pure presentation of background-agent dashboard rows. The presenter reads
 * only the session-list snapshot (each parent summary carries its
 * `backgroundAgents` projection value) and derives every displayed fact —
 * no I/O, clock, or randomness — so the rows are testable and the component
 * stays a thin binder.
 *
 * @module dsh-background-agents/presenter
 */

import {
  isBackgroundAgentsProjection, type BackgroundAgentEntry, type BackgroundAgentMetrics,
} from '../projection-schema.ts'

/** Display status of one row: the durable fact overlaid with the live running bit. */
export type RowStatus = 'running' | 'idle' | 'settled' | 'archived'

/** One rendered dashboard row. */
export interface AgentRow {
  /** Durable direct parent session id (the jump and stop authority). */
  readonly parentSessionId: string
  /** Durable child session id (the agentId the tools return). */
  readonly agentId: string
  /** Display label: the projection label, else the child's session title. */
  readonly label: string
  /** The parent session's display title, for disambiguation when several parents project rows. */
  readonly parentTitle?: string
  readonly status: RowStatus
  /** Accepted deliveries: the initial task plus every follow-up. */
  readonly messageCount: number
  /** Last progress or settle summary, when recorded. */
  readonly lastMessage?: string
  /** Epoch ms of the registration fact. */
  readonly createdAt: number
  /** Epoch ms of the last folded fact. */
  readonly lastActiveAt: number
  /** Aggregated cost/status totals, when at least one metric fact folded. */
  readonly metrics?: BackgroundAgentMetrics
}

/** The session-list face the presenter reads (host-sampled `running` per session). */
export interface SessionListLike {
  byId: Record<string, {
    id: string
    running?: boolean
    displayTitle?: string
    projectionValues?: unknown
  }>
}

/** Read the plugin's projection cell out of the opaque client projection map. */
function cellOf(parent: SessionListLike['byId'][string]): unknown {
  return (parent.projectionValues as { backgroundAgents?: unknown } | undefined)?.backgroundAgents
}

/**
 * Overlay the durable lifecycle fact with the live running bit. The client
 * list cannot distinguish a live-but-idle child from a cold one, so both read
 * `idle`; `bg_list` refines with the host agent registry.
 * @param entry - the folded projection entry.
 * @param liveRunning - whether the child session's driver is running now.
 * @returns the display status.
 */
export function rowStatus(entry: BackgroundAgentEntry, liveRunning: boolean): RowStatus {
  if (entry.activity === 'archived') return 'archived'
  if (liveRunning) return 'running'
  if (entry.activity === 'inactive') return 'settled'
  return 'idle'
}

/**
 * Build every dashboard row from one session-list snapshot, ordered by
 * registration time (oldest first) with the id as tiebreak.
 * @param list - the session-list snapshot.
 * @returns the dashboard rows; empty when no session projects agents.
 */
export function buildAgentRows(list: SessionListLike): AgentRow[] {
  const rows: AgentRow[] = []
  for (const parent of Object.values(list.byId)) {
    const projection = isBackgroundAgentsProjection(cellOf(parent))
    if (projection === undefined) continue
    for (const entry of projection.agents) {
      const child = list.byId[entry.agentId]
      rows.push({
        parentSessionId: parent.id,
        agentId: entry.agentId,
        label: entry.label === '' ? (child?.displayTitle ?? entry.agentId) : entry.label,
        ...(parent.displayTitle === undefined ? {} : { parentTitle: parent.displayTitle }),
        status: rowStatus(entry, child?.running === true),
        messageCount: entry.messageCount,
        ...(entry.lastMessage === undefined ? {} : { lastMessage: entry.lastMessage }),
        createdAt: entry.createdAt,
        lastActiveAt: entry.lastActiveAt,
        ...(entry.metrics === undefined ? {} : { metrics: entry.metrics }),
      })
    }
  }
  rows.sort((a, b) =>
    a.createdAt !== b.createdAt ? a.createdAt - b.createdAt : (a.agentId < b.agentId ? -1 : 1))
  return rows
}

/** Relative-time bucket of a row's last activity, for the caller to localize. */
export type RelativeTimeUnit = 'now' | 'minutes' | 'hours' | 'days' | 'months' | 'years'

/** Structured relative time: the bucket plus its magnitude (0 for `now`). */
export interface RelativeTime {
  readonly unit: RelativeTimeUnit
  readonly n: number
}

/**
 * Compact relative time for a row's `lastActiveAt`.
 * @param at - epoch ms of the last activity.
 * @param now - epoch ms now (injected for purity).
 * @returns the bucket and magnitude.
 */
export function relativeTime(at: number, now: number): RelativeTime {
  const MIN = 60_000
  const HOUR = 3_600_000
  const DAY = 86_400_000
  const diff = Math.max(0, now - at)
  if (diff < MIN) return { unit: 'now', n: 0 }
  if (diff < HOUR) return { unit: 'minutes', n: Math.floor(diff / MIN) }
  if (diff < DAY) return { unit: 'hours', n: Math.floor(diff / HOUR) }
  if (diff < 30 * DAY) return { unit: 'days', n: Math.floor(diff / DAY) }
  if (diff < 365 * DAY) return { unit: 'months', n: Math.floor(diff / (30 * DAY)) }
  return { unit: 'years', n: Math.floor(diff / (365 * DAY)) }
}

/** One history page entry as the wire delivers it (structural; the client bundle never imports host types). */
export interface HistoryEntryLike {
  readonly event: {
    readonly type: string
    readonly data?: unknown
  }
}

/**
 * Extract the final assistant text from one history page. Scans forward for
 * the last assistant message that carries a text block; reasoning-only
 * messages are skipped (bg_result owns the reasoning fallback, the panel
 * shows plain text). Returns '' when the page has none — the caller renders
 * its own empty state.
 * @param entries - one `subagent.history` page's entries.
 * @returns the joined text of the last assistant text message.
 */
export function extractResultText(entries: readonly HistoryEntryLike[]): string {
  let text = ''
  for (const entry of entries) {
    if (entry.event.type !== 'assistant/message') continue
    const message = (entry.event.data as { message?: { content?: unknown } } | undefined)?.message
    if (message === undefined || !Array.isArray(message.content)) continue
    const joined = message.content
      .filter((block): block is { type: 'text'; text: string } =>
        typeof block === 'object' && block !== null && (block as { type?: unknown }).type === 'text')
      .map(block => block.text)
      .join('')
      .trim()
    if (joined !== '') text = joined
  }
  return text
}

/** One exported cost row (plain JSON: no host references, lossless over the wire). */
export interface CostReportRow {
  readonly agentId: string
  readonly label: string
  readonly status: RowStatus
  readonly turnCount: number
  readonly durationMs: number | null
  readonly inputTokens: number | null
  readonly outputTokens: number | null
  readonly errorCount: number
  /** Failed turns over observed turns; null when no turn was observed. */
  readonly errorRate: number | null
}

/** The whole export value (raw observability JSON; currency pricing is not applied). */
export interface CostReport {
  readonly generatedAt: number
  readonly agents: CostReportRow[]
}

/**
 * Build the plain-JSON cost report from the rendered rows. Token totals and
 * duration stay `null` for rows without a folded metric sample (absent = the
 * adapter reported none or the observability capture is disabled), so the
 * export never fabricates a zero. Error rate is `errorCount / turnCount`.
 * @param rows - the rendered dashboard rows.
 * @param now - epoch ms now (injected for purity).
 * @returns the JSON-serializable report.
 */
export function buildCostReport(rows: AgentRow[], now: number): CostReport {
  return {
    generatedAt: now,
    agents: rows.map(row => {
      const metrics = row.metrics
      const errorRate = metrics === undefined || metrics.turnCount === 0
        ? null
        : metrics.errorCount / metrics.turnCount
      return {
        agentId: row.agentId,
        label: row.label,
        status: row.status,
        turnCount: metrics?.turnCount ?? 0,
        durationMs: metrics === undefined ? null : metrics.totalDurationMs,
        inputTokens: metrics?.inputTokens ?? null,
        outputTokens: metrics?.outputTokens ?? null,
        errorCount: metrics?.errorCount ?? 0,
        errorRate,
      }
    }),
  }
}
