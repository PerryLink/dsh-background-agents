/**
 * The five model-facing tools: `background_agent` starts a durable continuable
 * child through the official seam (with optional per-child tool scoping,
 * persona, depth cap, and model route), `bg_message` delivers one later turn,
 * `bg_list` merges the official child catalog with this plugin's projection
 * facts (optionally as the descendant tree), `bg_result` reads a child's
 * latest result text, and `bg_stop` requests interruption. Every execution
 * path is a thin adapter over `ctx.subagents` — the plugin performs no
 * lifecycle routing of its own, and every durable fact rides official
 * `tool/result` replay metadata or injected `user/message` notices (see
 * `vocabulary.ts`).
 *
 * @module dsh-background-agents/tools
 */
import type { Context } from '@deepseek-ai/cordis';
import { type BackgroundAgentLifecycle } from './lifecycle.ts';
/** Lifecycle thresholds the tools enforce. */
export interface ToolConfig {
    /** Name of the `ctx.subagents` provider that starts continuable children. */
    readonly provider: string;
    /** Hard cap on non-archived background agents per parent session. */
    readonly maxBackgroundAgents: number;
    /** Display-label cap; longer labels ellipsize. */
    readonly maxLabelChars: number;
    /** Hard cap on the bg_result text; longer answers ellipsize with a truncated flag. */
    readonly resultMaxChars: number;
    /** Provider route for child model requests; undefined inherits the parent's. */
    readonly childProvider: string | undefined;
    /** Model id for child model requests; undefined inherits the parent's. */
    readonly childModel: string | undefined;
    /** Config ceiling for a start's optional `max_depth` argument. */
    readonly maxChildDepth: number | undefined;
    /** Allowlist for `tool_filter` names; empty/absent = no limit. */
    readonly allowedChildTools: string[] | undefined;
}
/** One bg_list row's activity vocabulary. */
export type BgListActivity = 'running' | 'idle' | 'ready' | 'settled' | 'archived';
/** One row returned by bg_list (schema-validated canonical value). */
export interface BgListAgent {
    agentId: string;
    label: string;
    mode: 'continuable';
    activity: BgListActivity;
    /** Durable direct parent (present only in recursive listings). */
    parentId?: string;
    /** Edge distance from the listed root (present only in recursive listings). */
    depth?: number;
    messageCount?: number;
    lastMessage?: string;
    createdAt?: number;
    lastActiveAt?: number;
}
/** One candidate the durable catalog could not serve. */
export interface BgListDiagnostic {
    readonly agentId: string;
    readonly reason: 'corrupt' | 'unsupported' | 'unavailable';
}
/** The bg_list canonical value: a listing, or an explicit unrecoverable marker. */
export type BgListResult = {
    readonly kind: 'listing';
    readonly agents: BgListAgent[];
    readonly diagnostics: BgListDiagnostic[];
} | {
    readonly kind: 'unrecoverable';
    readonly code: string;
    readonly message: string;
};
/** The bg_stop canonical value. */
export interface BgStopResult {
    readonly outcome: 'interrupt-requested' | 'not-found';
    readonly agentId: string;
}
/** One validated per-child tool filter, or undefined when none was requested. */
export interface ValidatedToolFilter {
    readonly allow?: string[];
    readonly deny?: string[];
}
/**
 * Validate one `tool_filter` argument against the deployment allowlist. The
 * official descriptor rejects a filter without at least one of `allow`/`deny`,
 * so the tool fails fast with the same rule plus the allowlist check.
 * @param raw - the raw argument (already JSON-validated by defineTool).
 * @param config - the deployment policy carrying `allowedChildTools`.
 * @returns the trimmed filter, or undefined when the caller passed none.
 */
export declare function validateToolFilter(raw: {
    allow?: string[];
    deny?: string[];
} | undefined, config: ToolConfig): ValidatedToolFilter | undefined;
/**
 * Validate one `max_depth` argument against the deployment ceiling. The seam
 * enforces the same non-negative-safe-integer rule at start; the tool fails
 * fast first and adds the configured ceiling.
 */
export declare function validateMaxDepth(raw: number | undefined, config: ToolConfig): number | undefined;
/**
 * Register the four background-agent tools.
 * @param ctx - context carrying tools, subagents, and the agent registry.
 * @param config - provider, cap, and label bound.
 * @param lifecycle - the live tracked-children registry.
 */
export declare function registerBackgroundAgentTools(ctx: Context, config: ToolConfig, lifecycle: BackgroundAgentLifecycle): void;
//# sourceMappingURL=tools.d.ts.map