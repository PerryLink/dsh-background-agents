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
    /** Hard cap on non-archived background agents per parent session. */
    maxBackgroundAgents?: number;
    /** Idle window after which the sweep archives a quiet child (`>= 1`). */
    idleTimeoutMinutes?: number;
    /** Sweep period. */
    idleSweepIntervalMs?: number;
    /** Display-label cap (creation labels ellipsize). */
    maxLabelChars?: number;
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
    readonly maxBackgroundAgents: 4;
    readonly idleTimeoutMinutes: 120;
    readonly idleSweepIntervalMs: 60000;
    readonly maxLabelChars: 120;
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