/**
 * dsh-background-agents: interactive long-session background agents on the
 * official subagent seam, plus persistent multi-agent team rooms.
 *
 * `background_agent` starts a durable continuable child whose conversation
 * stays open; progress lines are injected into the parent after each child
 * turn (throttled, optional); `bg_message` delivers later turns; `bg_list`
 * merges the official child catalog with this plugin's dashboard projection;
 * `bg_result` reads a child's latest result text; `bg_stop` requests
 * interruption. The Web UI sidebar gains a background-agent panel through the
 * client half, fed by the `backgroundAgents` session projection.
 *
 * The team-room half (v0.5.0+) upgrades the plugin to a persistent
 * multi-agent collaboration form: rooms {members (each an independent
 * session), message bus (directed/broadcast), task board, shared timeline}
 * persist in the harness's own storage layer (`team_rooms` storage domain —
 * SQLite or JSONL, zero extra services) and recover across DSH restarts. The
 * `/room` command family drives rooms from the user; the model gets eight
 * `room_*` tools; cross-member task handoffs route through the official
 * approval seam; and member sessions receive a one-line-role-statement brief
 * (Minimal persona style) on join and resume. Model-visible ⟺ recorded:
 * every delivered room message is a durable `user/message` in the member's
 * own session log, and the shared timeline mirrors as log-only
 * `team-room/fact` events folded by the `teamRoom` projection the settings
 * panel renders.
 *
 * Everything the plugin writes is durable through channels the harness
 * already knows (`tool/result` replay metadata, injected `user/message`
 * notices, the official `subagent-settled` account, ignorable plugin fact
 * events, and the storage domain), so the dashboard and room views
 * reconstruct on every reopen.
 *
 * @module dsh-background-agents
 */

import type { Context } from '@deepseek-ai/cordis'
import Schema from '@deepseek-ai/schemastery'
import { BackgroundAgentLifecycle, reportProgress, startIdleSweep } from './lifecycle.ts'
import { backgroundAgentsProjectionDefinition } from './projection.ts'
import { registerBackgroundAgentTools } from './tools.ts'
import { RoomHub } from './room/hub.ts'
import type { RoomConfig } from './room/hub.ts'
import { registerRoomCommand } from './room/commands.ts'
import { registerRoomTools } from './room/tools.ts'
import { teamRoomProjectionDefinition } from './room/projection.ts'

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
  /**
   * Idle archive toggle: when false, the sweep never archives quiet children
   * (the idle window only gates the auto-archive when enabled). Disable it for
   * workflows where a long-lived watcher agent should stay parked, not
   * archived.
   */
  autoArchive?: boolean
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
  /** Hard cap on team rooms across the profile. */
  maxRooms?: number
  /** Hard cap on members per room. */
  maxMembersPerRoom?: number
  /** Hard cap on rooms one member session may join. */
  maxRoomsPerMember?: number
  /** Bus messages kept per room (the message retention window). */
  busRetention?: number
  /** Timeline events kept per room. */
  timelineRetention?: number
  /** Completed tasks kept per room; older `done` rows are pruned. */
  taskRetention?: number
  /** Hard cap on one room message's text (rejected above, never truncated). */
  maxMessageChars?: number
  /** Inject the short room brief into member sessions (join + resume). */
  injectRoomBrief?: boolean
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
  autoArchive: true,
  idleTimeoutMinutes: 120,
  idleSweepIntervalMs: 60_000,
  maxLabelChars: 120,
  reportDelivery: 'quiet',
  maxRooms: 16,
  maxMembersPerRoom: 8,
  maxRoomsPerMember: 4,
  busRetention: 200,
  timelineRetention: 500,
  taskRetention: 50,
  maxMessageChars: 4_000,
  injectRoomBrief: true,
} as const

export const Config: Schema<Config> = Schema.object({
  provider: Schema.string().required(),
  autoReport: Schema.boolean().default(DEFAULTS.autoReport),
  reportThrottleMs: Schema.natural().max(Number.MAX_SAFE_INTEGER).default(DEFAULTS.reportThrottleMs),
  reportSummaryMaxChars: Schema.natural().max(Number.MAX_SAFE_INTEGER).default(DEFAULTS.reportSummaryMaxChars),
  // 0 would erase every bg_result answer; the schema forbids it.
  resultMaxChars: Schema.natural().min(1).max(Number.MAX_SAFE_INTEGER).default(DEFAULTS.resultMaxChars),
  maxBackgroundAgents: Schema.natural().max(Number.MAX_SAFE_INTEGER).default(DEFAULTS.maxBackgroundAgents),
  autoArchive: Schema.boolean().default(DEFAULTS.autoArchive),
  // 0 would archive any quiet child on the next sweep pass; the schema forbids it.
  idleTimeoutMinutes: Schema.natural().min(1).max(Number.MAX_SAFE_INTEGER).default(DEFAULTS.idleTimeoutMinutes),
  // 0 would turn the sweep into a 1ms hot loop; the schema forbids it.
  idleSweepIntervalMs: Schema.natural().min(1).max(Number.MAX_SAFE_INTEGER).default(DEFAULTS.idleSweepIntervalMs),
  maxLabelChars: Schema.natural().max(Number.MAX_SAFE_INTEGER).default(DEFAULTS.maxLabelChars),
  reportDelivery: Schema.union([
    Schema.const('quiet'),
    Schema.const('wakeup'),
  ]).default(DEFAULTS.reportDelivery),
  childProvider: Schema.string(),
  childModel: Schema.string(),
  maxChildDepth: Schema.natural(),
  allowedChildTools: Schema.array(Schema.string()),
  maxRooms: Schema.natural().max(Number.MAX_SAFE_INTEGER).default(DEFAULTS.maxRooms),
  maxMembersPerRoom: Schema.natural().min(2).max(Number.MAX_SAFE_INTEGER).default(DEFAULTS.maxMembersPerRoom),
  maxRoomsPerMember: Schema.natural().min(1).max(Number.MAX_SAFE_INTEGER).default(DEFAULTS.maxRoomsPerMember),
  // 0 retention would erase every message as it lands; the schema forbids it.
  busRetention: Schema.natural().min(1).max(Number.MAX_SAFE_INTEGER).default(DEFAULTS.busRetention),
  timelineRetention: Schema.natural().min(1).max(Number.MAX_SAFE_INTEGER).default(DEFAULTS.timelineRetention),
  taskRetention: Schema.natural().max(Number.MAX_SAFE_INTEGER).default(DEFAULTS.taskRetention),
  maxMessageChars: Schema.natural().min(1).max(Number.MAX_SAFE_INTEGER).default(DEFAULTS.maxMessageChars),
  injectRoomBrief: Schema.boolean().default(DEFAULTS.injectRoomBrief),
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
    autoArchive: config.autoArchive ?? DEFAULTS.autoArchive,
    idleTimeoutMinutes: config.idleTimeoutMinutes ?? DEFAULTS.idleTimeoutMinutes,
    idleSweepIntervalMs: config.idleSweepIntervalMs ?? DEFAULTS.idleSweepIntervalMs,
    maxLabelChars: config.maxLabelChars ?? DEFAULTS.maxLabelChars,
    reportDelivery: config.reportDelivery ?? DEFAULTS.reportDelivery,
    childProvider: config.childProvider,
    childModel: config.childModel,
    maxChildDepth: config.maxChildDepth,
    allowedChildTools: config.allowedChildTools,
  }
  const roomPolicy: RoomConfig = {
    maxRooms: config.maxRooms ?? DEFAULTS.maxRooms,
    maxMembersPerRoom: config.maxMembersPerRoom ?? DEFAULTS.maxMembersPerRoom,
    maxRoomsPerMember: config.maxRoomsPerMember ?? DEFAULTS.maxRoomsPerMember,
    busRetention: config.busRetention ?? DEFAULTS.busRetention,
    timelineRetention: config.timelineRetention ?? DEFAULTS.timelineRetention,
    taskRetention: config.taskRetention ?? DEFAULTS.taskRetention,
    maxMessageChars: config.maxMessageChars ?? DEFAULTS.maxMessageChars,
    injectRoomBrief: config.injectRoomBrief ?? DEFAULTS.injectRoomBrief,
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

  // Team rooms mount only where the storage domain exists (the same optional
  // seam as sessionProjections): the background-agent core never depends on
  // the durable store, so headless assemblies without storage still load the
  // five bg_* tools. The hub opens the `team_rooms` storage domain (the
  // domain's single write chain is the ordering authority) and closes it
  // with this fiber; an open failure fails every room operation loud at its
  // first call.
  if (ctx.get('storageDomain') === undefined) {
    ctx.logger('background-agents').info('team rooms disabled: no storage domain composed (add @deepseek-ai/dsh-storage-domain to enable the /room command and the room_* tools)')
  }
  ctx.inject(['storageDomain'], (roomCtx) => {
    const hub = new RoomHub(roomCtx, roomPolicy, roomCtx.agents, roomCtx.sessions)
    void hub.open().catch((error: unknown) => {
      roomCtx.logger('background-agents').error(`team room store failed to open: ${String(error)}`)
    })
    registerRoomTools(roomCtx, hub)
    roomCtx.effect(() => registerRoomCommand(roomCtx, hub) ?? (() => {}), 'dsh-background-agents: /room command')

    // Offline catch-up: whenever a member session starts (fresh or resume),
    // replay the facts and bus messages it missed, in store order.
    roomCtx.on('agent/session-start', ({ agent }) => {
      void hub.catchUp(agent.id).catch((error: unknown) => {
        roomCtx.logger('background-agents').warn(`room catch-up failed for ${agent.id}: ${String(error)}`)
      })
    })
  })

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

  // The projection units mount only where the registry exists, so headless
  // assemblies without session projections still load the tools.
  ctx.inject(['sessionProjections'], (projectionCtx) => {
    projectionCtx.sessionProjections.register(backgroundAgentsProjectionDefinition)
    projectionCtx.sessionProjections.register(teamRoomProjectionDefinition)
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
    promptCtx.systemPrompt.section({
      name: 'tool:team-rooms',
      order: 108,
      text:
        'When this session is a member of a team room, room messages are delivered into this conversation '
        + 'automatically — do not busy-poll room_read. Keep room turns brief: room_post sends messages, '
        + 'room_list_tasks/room_claim_task work the shared board, and room_transfer_task asks approval before '
        + 'handing a task to another member.',
    })
  })
}
