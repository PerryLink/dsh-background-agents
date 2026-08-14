/**
 * dsh-background-agents: interactive long-session background agents on the
 * official subagent seam. `background_agent` starts a durable continuable
 * child whose conversation stays open; progress lines are injected into the
 * parent after each child turn (throttled, optional); `bg_message` delivers
 * later turns; `bg_list` merges the official child catalog with this
 * plugin's dashboard projection; `bg_stop` requests interruption. The Web UI
 * sidebar gains a background-agent panel through the client half, fed by the
 * `backgroundAgents` session projection.
 *
 * Everything the plugin writes is durable through channels the harness
 * already knows (`tool/result` replay metadata, injected `user/message`
 * notices, and the official `subagent-settled` account), so the dashboard
 * value reconstructs from the parent log on every reopen.
 *
 * @module dsh-background-agents
 */

import type { Context } from '@deepseek-ai/cordis'
import Schema from '@deepseek-ai/schemastery'
import { BackgroundAgentLifecycle, reportProgress, startIdleSweep } from './lifecycle.ts'
import { backgroundAgentsProjectionDefinition } from './projection.ts'
import { registerBackgroundAgentTools } from './tools.ts'

export const name = 'background-agents'

/** Hard service dependencies: tools, the subagent runtime, the agent registry, and the session store. */
export const inject = ['tools', 'subagents', 'agents', 'sessions']

/**
 * Lifecycle policy. Every tunable is a validated Config field: thresholds and
 * throttles belong in cordis.yml, never in code. Only `provider` is required;
 * the Schemastery schema materializes the documented defaults for the rest,
 * and direct apply() callers keep the same defaults.
 */
export interface Config {
  /** The `ctx.subagents` provider name that starts continuable children (e.g. `spawn`). */
  provider: string
  /** Inject one progress line into the parent after each child turn (throttled). */
  autoReport?: boolean
  /** Minimum ms between two progress injections for one child. */
  reportThrottleMs?: number
  /** Hard cap on the injected progress-line text (ellipsized). */
  reportSummaryMaxChars?: number
  /** Hard cap on non-archived background agents per parent session. */
  maxBackgroundAgents?: number
  /** Idle window after which the sweep archives a quiet child. */
  idleTimeoutMinutes?: number
  /** Sweep period. */
  idleSweepIntervalMs?: number
  /** Display-label cap (creation labels ellipsize). */
  maxLabelChars?: number
}

export const Config: Schema<Config> = Schema.object({
  provider: Schema.string().required(),
  autoReport: Schema.boolean().default(true),
  reportThrottleMs: Schema.natural().max(Number.MAX_SAFE_INTEGER).default(15_000),
  reportSummaryMaxChars: Schema.natural().max(Number.MAX_SAFE_INTEGER).default(300),
  maxBackgroundAgents: Schema.natural().max(Number.MAX_SAFE_INTEGER).default(4),
  idleTimeoutMinutes: Schema.natural().max(Number.MAX_SAFE_INTEGER).default(120),
  idleSweepIntervalMs: Schema.natural().max(Number.MAX_SAFE_INTEGER).default(60_000),
  maxLabelChars: Schema.natural().max(Number.MAX_SAFE_INTEGER).default(120),
})

/**
 * Mount the four tools, the `backgroundAgents` projection unit, the
 * throttled turn observer, and the idle-archive sweep.
 * @param ctx - context carrying tools, subagents, and the agent registry.
 * @param config - provider and lifecycle policy (Schemastery-validated).
 */
export function apply(ctx: Context, config: Config): void {
  // Direct apply() bypasses Schemastery's constraints; a loader-omitted field
  // keeps its documented default instead of failing at load.
  const policy: Required<Config> = {
    provider: config.provider,
    autoReport: config.autoReport ?? true,
    reportThrottleMs: config.reportThrottleMs ?? 15_000,
    reportSummaryMaxChars: config.reportSummaryMaxChars ?? 300,
    maxBackgroundAgents: config.maxBackgroundAgents ?? 4,
    idleTimeoutMinutes: config.idleTimeoutMinutes ?? 120,
    idleSweepIntervalMs: config.idleSweepIntervalMs ?? 60_000,
    maxLabelChars: config.maxLabelChars ?? 120,
  }
  if (policy.provider.trim() === '') {
    throw new Error('dsh-background-agents: `provider` must name a registered subagent provider')
  }

  const lifecycle = new BackgroundAgentLifecycle()

  // Per-turn progress: observe tracked children's session events. A turn end
  // reports (throttled); every event refreshes the idle watermark.
  ctx.on('session/event', (session, event) => {
    const child = lifecycle.get(session.id)
    if (child === undefined) return
    lifecycle.touch(session.id, event.time)
    if (event.type !== 'turn/end') return
    try {
      reportProgress(ctx.agents, ctx.sessions, policy, lifecycle, child, event.time)
    } catch (error) {
      // A report failure must never disturb the child's committed turn.
      ctx.logger('background-agents').warn(`progress report failed for ${child.childId}: ${String(error)}`)
    }
  })

  // The idle-archive sweep: owned by this fiber through a plain interval with
  // an effect disposer (no manual cleanup).
  ctx.effect(() => startIdleSweep(ctx, ctx.agents, policy, lifecycle), 'dsh-background-agents: idle sweep')

  // The projection unit mounts only where the registry exists, so headless
  // assemblies without session projections still load the tools.
  ctx.inject(['sessionProjections'], (projectionCtx) => {
    projectionCtx.sessionProjections.register(backgroundAgentsProjectionDefinition)
  })

  registerBackgroundAgentTools(ctx, policy, lifecycle)

  // Cross-call guidance so the model treats the agents as a managed fleet
  // instead of polling bg_list.
  ctx.inject(['systemPrompt'], (promptCtx) => {
    promptCtx.systemPrompt.section({
      name: 'tool:background-agents',
      order: 107,
      text:
        'Track every background agent id you start. You are notified in-session when a background agent '
        + 'completes a turn (autoReport) and when it settles — do not busy-poll bg_list. Keep working on '
        + 'independent steps, use bg_message to steer an agent instead of waiting for it, and bg_stop agents '
        + 'that stopped mattering.',
    })
  })
}
