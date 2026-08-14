/**
 * Live lifecycle bookkeeping for background agents: the in-memory registry
 * of tracked children plus the two observers it serves — the throttled
 * auto-report of per-turn progress into the parent and the idle-archive
 * sweep. The durable facts live in the parent session log (folded by the
 * `backgroundAgents` projection); this module is a cache, never a second
 * source of truth, so losing it only costs throttles and timers.
 *
 * @module dsh-background-agents/lifecycle
 */

import type { Context } from '@deepseek-ai/cordis'
import type { Agent } from '@deepseek-ai/dsh-agent'
import { boundContextSummary, createUserMessage } from '@deepseek-ai/dsh-llm'
import type { Session, SessionEvent, SessionId } from '@deepseek-ai/dsh-session'
import type { AgentRegistry } from '@deepseek-ai/dsh-agent'
import { finalAssistantOutput, SubagentError } from '@deepseek-ai/dsh-subagent'
import { isBackgroundAgentsProjection } from './projection-schema.ts'
import { noticeLine, PLUGIN } from './vocabulary.ts'

/** Tunables the lifecycle honors; every threshold is a validated Config field. */
export interface LifecycleConfig {
  readonly autoReport: boolean
  /** Minimum ms between two progress injections for one child. */
  readonly reportThrottleMs: number
  /** Hard cap on the progress-line text injected per report. */
  readonly reportSummaryMaxChars: number
  /** Idle window after which the sweep archives a quiet child. */
  readonly idleTimeoutMinutes: number
  /** Sweep period. */
  readonly idleSweepIntervalMs: number
  /**
   * Progress delivery: `quiet` appends the notice to the parent's next model
   * request; `wakeup` starts a parent turn when idle (queues when busy).
   */
  readonly reportDelivery: 'quiet' | 'wakeup'
}

/** One tracked child: live bookkeeping only. */
export interface TrackedChild {
  /** Durable child session id. */
  readonly childId: SessionId
  /** Durable direct parent session id. */
  readonly parentSessionId: SessionId
  /** Creation label (display only; the projection holds the durable copy). */
  readonly label: string
  /** Epoch ms the child was accepted. */
  readonly createdAt: number
  /** Last observed activity epoch ms (any child session event). */
  lastActivityAt: number
  /** Last auto-report injection epoch ms (the throttle watermark). */
  lastReportAt: number
  /** Set by the sweep; archived children stop being observed. */
  archived: boolean
}

/** Read face of the live agent registry the lifecycle needs. */
export interface LiveAgents {
  get(id: SessionId): Agent | undefined
}

/** Read face of the live session store the lifecycle needs. */
export interface LiveSessions {
  get(id: SessionId): Session | undefined
}

/**
 * The in-memory tracked-children registry.
 */
export class BackgroundAgentLifecycle {
  private readonly children = new Map<string, TrackedChild>()

  /** Track one accepted child, replacing any stale record under the same id. */
  register(childId: SessionId, parentSessionId: SessionId, label: string, now: number): void {
    const existing = this.children.get(childId)
    this.children.set(childId, {
      childId,
      parentSessionId,
      // A re-registration (cold resume through bg_message) keeps the durable
      // facts authoritative: the projection still carries the old label.
      label: label === '' ? existing?.label ?? '' : label,
      createdAt: existing?.createdAt ?? now,
      lastActivityAt: now,
      // -1: never reported — the throttle gates only the gap BETWEEN reports,
      // never the first one (a child's first turn may end right after start).
      lastReportAt: existing?.lastReportAt ?? -1,
      archived: false,
    })
  }

  /** Record one observed child-session event. */
  touch(childId: SessionId, at: number): void {
    const child = this.children.get(childId)
    if (child === undefined) return
    child.lastActivityAt = at
  }

  /** Record one emitted progress report (throttle watermark). */
  noteReport(childId: SessionId, at: number): void {
    const child = this.children.get(childId)
    if (child === undefined) return
    child.lastReportAt = at
  }

  /** Mark archived; archived children leave the live observation set. */
  archive(childId: SessionId): void {
    const child = this.children.get(childId)
    if (child === undefined) return
    child.archived = true
  }

  /** Drop a stale cache entry (the parent log keeps the durable facts). */
  delete(childId: SessionId): void {
    this.children.delete(childId)
  }

  get(childId: SessionId): TrackedChild | undefined {
    return this.children.get(childId)
  }

  has(childId: SessionId): boolean {
    return this.children.has(childId)
  }

  /** Live non-archived children of one parent, in registration order. */
  activeFor(parentSessionId: SessionId): TrackedChild[] {
    return [...this.children.values()]
      .filter(child => !child.archived && child.parentSessionId === parentSessionId)
  }

  /** Every tracked child, archived included (the sweep iterates this). */
  all(): TrackedChild[] {
    return [...this.children.values()]
  }

  /** Live non-archived count for one parent (the fallback cap when listing fails). */
  activeCountFor(parentSessionId: SessionId): number {
    return this.activeFor(parentSessionId).length
  }
}

/**
 * One line of a session's last assistant text, empty when it produced none.
 * Accepts any event-log carrier so both live sessions and persistence
 * inspections can serve the same fold.
 */
export function sessionLastText(session: { events: readonly SessionEvent[] }): string {
  const output = finalAssistantOutput(session.events)
  if (output === undefined) return ''
  return output
    .filter((block): block is Extract<(typeof output)[number], { type: 'text' }> => block.type === 'text')
    .map(block => block.text)
    .join('')
    .trim()
}

/** One line of the child's last assistant text, empty when it produced none. */
export function childLastText(sessions: LiveSessions, childId: SessionId): string {
  const session = sessions.get(childId)
  if (session === undefined) return ''
  return sessionLastText(session)
}

/** Bound one line to the configured report cap with an explicit ellipsis. */
function boundLine(line: string, max: number): string {
  const trimmed = line.replaceAll(/\s+/g, ' ').trim()
  return trimmed.length <= max ? trimmed : `${trimmed.slice(0, max - 1)}…`
}

/**
 * Report one completed child turn into the parent: a model-visible injected
 * notice (source `{ kind: 'plugin', plugin: 'dsh-background-agents' }`) whose
 * canonical prefix lets the projection fold the durable fact back out of the
 * parent log. Honours the per-child throttle and the parent's presence.
 * `wakeup` delivery starts a parent turn through `Agent.followup` (queued
 * when the parent is busy); `quiet` delivery appends to the parent's next
 * request through `Agent.inject`.
 * @returns true when a report was emitted.
 */
export function reportProgress(
  agents: LiveAgents,
  sessions: LiveSessions,
  config: LifecycleConfig,
  lifecycle: BackgroundAgentLifecycle,
  child: TrackedChild,
  now: number,
): boolean {
  if (!config.autoReport || child.archived) return false
  if (child.lastReportAt >= 0 && now - child.lastReportAt < config.reportThrottleMs) return false
  const parent = agents.get(child.parentSessionId)
  if (parent === undefined) return false
  const text = childLastText(sessions, child.childId)
  const line = text === ''
    ? `${child.label} completed a turn (no assistant output)`
    : `${child.label} completed a turn: ${boundLine(text, config.reportSummaryMaxChars)}`
  const message = createUserMessage({
    content: [{ type: 'text', text: noticeLine(child.childId, 'progress', line) }],
    source: {
      kind: 'plugin',
      plugin: PLUGIN,
      form: 'notice',
      summary: boundContextSummary(`${child.label} progress`),
    },
  })
  if (config.reportDelivery === 'wakeup') {
    parent.followup(message)
  } else {
    parent.inject(message)
  }
  lifecycle.noteReport(child.childId, now)
  return true
}

/**
 * Archive one idle child: inject the archived notice into the live parent and
 * request interruption of a resident activation. The stop request is exactly
 * the official `interrupt` semantics — fire and return; teardown belongs to
 * the continuation manager. A child whose live agent is mid-turn is left
 * alone (a long tool execution emits no session events and would otherwise
 * read as idle).
 */
export function archiveChild(
  ctx: Context,
  agents: LiveAgents,
  config: LifecycleConfig,
  lifecycle: BackgroundAgentLifecycle,
  child: TrackedChild,
): void {
  const parent = agents.get(child.parentSessionId)
  const liveChild = agents.get(child.childId)
  if (liveChild?.status === 'running') return
  if (parent !== undefined) {
    parent.inject(createUserMessage({
      content: [{
        type: 'text',
        text: noticeLine(
          child.childId,
          'archived',
          `${child.label} archived: idle for ${config.idleTimeoutMinutes} minutes; send bg_message to wake it or start a new background_agent`,
        ),
      }],
      source: {
        kind: 'plugin',
        plugin: PLUGIN,
        form: 'notice',
        summary: boundContextSummary(`${child.label} archived (idle timeout)`),
      },
    }))
  }
  if (liveChild !== undefined && parent !== undefined) {
    // The service authorizes the exact live parent against the child's
    // lineage; a no-op when the target has no live turn.
    try {
      ctx.subagents.interrupt(child.childId, { kind: 'ancestor', agent: parent })
    } catch (error) {
      ctx.logger('background-agents').warn(`idle archive interrupt failed: ${String(error)}`)
    }
  }
  lifecycle.archive(child.childId)
}

/**
 * One sweep pass: archive quiet children past the idle window and drop cache
 * entries whose parent and child agents are both gone (the parent log keeps
 * the durable facts). Throwing archive notices are contained per child so one
 * failure never skips a sibling.
 */
export function sweepIdle(
  ctx: Context,
  agents: LiveAgents,
  config: LifecycleConfig,
  lifecycle: BackgroundAgentLifecycle,
  now: number,
): void {
  const timeoutMs = config.idleTimeoutMinutes * 60_000
  for (const child of lifecycle.all()) {
    if (child.archived) {
      lifecycle.delete(child.childId)
      continue
    }
    if (now - child.lastActivityAt >= timeoutMs) {
      try {
        archiveChild(ctx, agents, config, lifecycle, child)
      } catch (error) {
        ctx.logger('background-agents').warn(`idle archive failed for ${child.childId}: ${String(error)}`)
      }
      continue
    }
    if (agents.get(child.childId) === undefined && agents.get(child.parentSessionId) === undefined) {
      lifecycle.delete(child.childId)
    }
  }
}

/** Read the parent's projection value and return the archived agent ids, guarded. */
export function archivedIdsFor(ctx: Context, parent: Agent): string[] {
  const registry = ctx.get('sessionProjections')
  if (registry === undefined) return []
  const snapshot = registry.snapshot(parent.session)
  const projection = isBackgroundAgentsProjection(snapshot.values.backgroundAgents)
  return projection?.agents
    .filter(entry => entry.activity === 'archived')
    .map(entry => entry.agentId) ?? []
}

/**
 * Count one parent's non-archived background agents for the cap. The durable
 * listing is authoritative; when it is unavailable (projections or session
 * store missing), the live registry is the honest fallback and the next
 * start proceeds against it.
 * @returns the current count, or undefined when the durable listing threw.
 */
export async function countBackgroundAgents(
  ctx: Context,
  parent: Agent,
  lifecycle: BackgroundAgentLifecycle,
  signal: AbortSignal,
): Promise<number> {
  let entries
  try {
    entries = await ctx.subagents.listChildren(parent.id, signal)
  } catch (error) {
    if (error instanceof SubagentError) return lifecycle.activeCountFor(parent.id)
    throw error
  }
  const archivedIds = new Set(archivedIdsFor(ctx, parent))
  let count = 0
  for (const entry of entries) {
    if (entry.kind !== 'child' || entry.mode !== 'continuable') continue
    if (archivedIds.has(entry.id)) continue
    count += 1
  }
  return count
}

/** The idle sweep timer, owned by the caller's effect. */
export function startIdleSweep(
  ctx: Context,
  agents: AgentRegistry,
  config: LifecycleConfig,
  lifecycle: BackgroundAgentLifecycle,
): () => void {
  const timer = setInterval(() => {
    try {
      sweepIdle(ctx, agents, config, lifecycle, Date.now())
    } catch (error) {
      ctx.logger('background-agents').warn(`idle sweep pass failed: ${String(error)}`)
    }
  }, config.idleSweepIntervalMs)
  return () => { clearInterval(timer) }
}
