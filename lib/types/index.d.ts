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
import type { Context } from '@deepseek-ai/cordis';
import Schema from '@deepseek-ai/schemastery';
export declare const name = "background-agents";
/** Hard service dependencies: tools, the subagent runtime, the agent registry, and the session store. */
export declare const inject: string[];
/**
 * Lifecycle policy. Every tunable is a validated Config field: thresholds and
 * throttles belong in cordis.yml, never in code. Only `provider` is required;
 * the Schemastery schema materializes the documented defaults from
 * {@link DEFAULTS}, and direct apply() callers keep the same defaults.
 */
export interface Config {
    /** The `ctx.subagents` provider name that starts continuable children (e.g. `spawn`). */
    provider: string;
    /** Inject one progress line into the parent after each child turn (throttled). */
    autoReport?: boolean;
    /** Minimum ms between two progress injections for one child. */
    reportThrottleMs?: number;
    /** Hard cap on the injected progress-line text (ellipsized). */
    reportSummaryMaxChars?: number;
    /** Hard cap on the bg_result text returned to the parent (ellipsized). */
    resultMaxChars?: number;
    /** Hard cap on non-archived background agents per parent session. */
    maxBackgroundAgents?: number;
    /**
     * Idle archive toggle: when false, the sweep never archives quiet children
     * (the idle window only gates the auto-archive when enabled). Disable it for
     * workflows where a long-lived watcher agent should stay parked, not
     * archived.
     */
    autoArchive?: boolean;
    /** Idle window after which the sweep archives a quiet child (`>= 1`). */
    idleTimeoutMinutes?: number;
    /** Sweep period. */
    idleSweepIntervalMs?: number;
    /** Display-label cap (creation labels ellipsize). */
    maxLabelChars?: number;
    /**
     * Progress delivery policy: `quiet` appends the line to the parent's next
     * model request; `wakeup` starts a parent turn when the parent is idle
     * (queues into its inbox when busy). Pair `wakeup` with a generous
     * `reportThrottleMs`.
     */
    reportDelivery?: 'quiet' | 'wakeup';
    /** Provider route for child model requests; default inherits the parent's. */
    childProvider?: string;
    /** Model id for child model requests; default inherits the parent's. */
    childModel?: string;
    /** Config ceiling for a start's optional `max_depth` argument. */
    maxChildDepth?: number;
    /** Allowlist for `tool_filter` names a start may scope; empty/absent = no limit. */
    allowedChildTools?: string[];
}
/**
 * The single source of truth for every optional policy default: the schema
 * materializes from it and apply() falls back to it, so the two can never
 * drift apart.
 */
export declare const DEFAULTS: {
    readonly autoReport: true;
    readonly reportThrottleMs: 15000;
    readonly reportSummaryMaxChars: 300;
    readonly resultMaxChars: 4000;
    readonly maxBackgroundAgents: 4;
    readonly autoArchive: true;
    readonly idleTimeoutMinutes: 120;
    readonly idleSweepIntervalMs: 60000;
    readonly maxLabelChars: 120;
    readonly reportDelivery: "quiet";
};
export declare const Config: Schema<Config>;
/**
 * Mount the four tools, the `backgroundAgents` projection unit, the
 * throttled turn observer, and the idle-archive sweep.
 * @param ctx - context carrying tools, subagents, and the agent registry.
 * @param config - provider and lifecycle policy (Schemastery-validated).
 */
export declare function apply(ctx: Context, config: Config): void;
//# sourceMappingURL=index.d.ts.map