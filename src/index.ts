/**
 * dsh-background-agents: interactive long-session background agents on the
 * official subagent seam. `background_agent` starts a durable continuable
 * child whose conversation stays open; progress lines are injected into the
 * parent after each child turn (throttled, optional); `bg_message` delivers
 * later turns; `bg_list` merges the official child catalog with this
 * plugin's dashboard projection; `bg_result` reads a child's latest result
 * text; `bg_stop` requests interruption. The Web UI sidebar gains a
 * background-agent panel through the client half, fed by the
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
 * the Schemastery schema materializes the documented defaults from
 * {@link DEFAULTS}, and direct apply() callers keep the same defaults.
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
  /** Hard cap on the bg_result text returned to the parent (ellipsized). */
  resultMaxChars?: number
  /** Hard cap on non-archived background agents per parent session. */
  maxBackgroundAgents?: number
  /** Idle window after which the sweep archives a quiet child (`>= 1`). */
  idleTimeoutMinutes?: number
  /** Sweep period. */
  idleSweepIntervalMs?: number
  /** Display-label cap (creation labels ellipsize). */
  maxLabelChars?: number
  /**
   * Progress delivery policy: `quiet` appends the line to the parent's next
   * model request; `wakeup` starts a parent turn when the parent is idle
   * (queues into its inbox when busy). Pair `wakeup` with a generous
   * `reportThrottleMs`.
   */
  reportDelivery?: 'quiet' | 'wakeup'
  /** Provider route for child model requests; default inherits the parent's. */
  childProvider?: string
  /** Model id for child model requests; default inherits the parent's. */
  childModel?: string
  /** Config ceiling for a start's optional `max_depth` argument. */
  maxChildDepth?: number
  /** Allowlist for `tool_filter` names a start may scope; empty/absent = no limit. */
  allowedChildTools?: string[]
}

/**
 * The single source of truth for every optional policy default: the schema
 * materializes from it and apply() falls back to it, so the two can never
 * drift apart.
 */
export const DEFAULTS = {
  autoReport: true,
  reportThrottleMs: 15_000,
  reportSummaryMaxChars: 300,
  resultMaxChars: 4_000,
  maxBackgroundAgents: 4,
  idleTimeoutMinutes: 120,
  idleSweepIntervalMs: 60_000,
  maxLabelChars: 120,
  reportDelivery: 'quiet',
} as const

export const Config: Schema<Config> = Schema.object({
  provider: Schema.string().required(),
  autoReport: Schema.boolean().default(DEFAULTS.autoReport),
  reportThrottleMs: Schema.natural().max(Number.MAX_SAFE_INTEGER).default(DEFAULTS.reportThrottleMs),
  reportSummaryMaxChars: Schema.natural().max(Number.MAX_SAFE_INTEGER).default(DEFAULTS.reportSummaryMaxChars),
  // 0 would erase every bg_result answer; the schema forbids it.
  resultMaxChars: Schema.natural().min(1).max(Number.MAX_SAFE_INTEGER).default(DEFAULTS.resultMaxChars),
  maxBackgroundAgents: Schema.natural().max(Number.MAX_SAFE_INTEGER).default(DEFAULTS.maxBackgroundAgents),
  // 0 would archive any quiet child on the next sweep pass; the schema forbids it.
  idleTimeoutMinutes: Schema.natural().min(1).max(Number.MAX_SAFE_INTEGER).default(DEFAULTS.idleTimeoutMinutes),
  idleSweepIntervalMs: Schema.natural().max(Number.MAX_SAFE_INTEGER).default(DEFAULTS.idleSweepIntervalMs),
  maxLabelChars: Schema.natural().max(Number.MAX_SAFE_INTEGER).default(DEFAULTS.maxLabelChars),
  reportDelivery: Schema.union([
    Schema.const('quiet'),
    Schema.const('wakeup'),
  ]).default(DEFAULTS.reportDelivery),
  childProvider: Schema.string(),
  childModel: Schema.string(),
  maxChildDepth: Schema.natural(),
  allowedChildTools: Schema.array(Schema.string()),
})

/**
 * Mount the four tools, the `backgroundAgents` projection unit, the
 * throttled turn observer, and the idle-archive sweep.
 * @param ctx - context carrying tools, subagents, and the agent registry.
 * @param config - provider and lifecycle policy (Schemastery-validated).
 */
export function apply(ctx: Context, config: Config): void {
  // Direct apply() bypasses Schemastery's constraints; every loader-omitted
  // field keeps its documented default from the shared DEFAULTS constant.
  const policy = {
    provider: config.provider,
    autoReport: config.autoReport ?? DEFAULTS.autoReport,
    reportThrottleMs: config.reportThrottleMs ?? DEFAULTS.reportThrottleMs,
    reportSummaryMaxChars: config.reportSummaryMaxChars ?? DEFAULTS.reportSummaryMaxChars,
    resultMaxChars: config.resultMaxChars ?? DEFAULTS.resultMaxChars,
    maxBackgroundAgents: config.maxBackgroundAgents ?? DEFAULTS.maxBackgroundAgents,
    idleTimeoutMinutes: config.idleTimeoutMinutes ?? DEFAULTS.idleTimeoutMinutes,
    idleSweepIntervalMs: config.idleSweepIntervalMs ?? DEFAULTS.idleSweepIntervalMs,
    maxLabelChars: config.maxLabelChars ?? DEFAULTS.maxLabelChars,
    reportDelivery: config.reportDelivery ?? DEFAULTS.reportDelivery,
    childProvider: config.childProvider,
    childModel: config.childModel,
    maxChildDepth: config.maxChildDepth,
    allowedChildTools: config.allowedChildTools,
  }
  if (policy.provider.trim() === '') {
    throw new Error('dsh-background-agents: `provider` must name a registered subagent provider')
  }
  // Misconfiguration fails loud at load when it is already decidable: a
  // registered provider without the continuable-creation capability can never
  // serve background_agent. An absent provider may mount later (the same
  // pattern as tool-subagent), so it only logs.
  const registeredProvider = ctx.subagents.getProvider(policy.provider)
  if (registeredProvider !== undefined && registeredProvider.prepareContinuable === undefined) {
    throw new Error(
      `dsh-background-agents: subagent provider "${policy.provider}" cannot serve continuable children `
      + '(no prepareContinuable capability)',
    )
  }
  if (registeredProvider === undefined) {
    ctx.logger('background-agents').info(`subagent provider "${policy.provider}" not registered yet; background_agent will fail until it appears`)
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
        + 'independent steps, use bg_message to steer an agent instead of waiting for it, read settled results '
        + 'with bg_result, and bg_stop agents that stopped mattering.',
    })
  })
}
