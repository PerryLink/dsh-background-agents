/**
 * The four model-facing tools: `background_agent` starts a durable continuable
 * child through the official seam, `bg_message` delivers one later turn,
 * `bg_list` merges the official child catalog with this plugin's projection
 * facts, and `bg_stop` requests interruption. Every execution path is a thin
 * adapter over `ctx.subagents` — the plugin performs no lifecycle routing of
 * its own, and every durable fact rides official `tool/result` replay
 * metadata or injected `user/message` notices (see `vocabulary.ts`).
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
}
/** One bg_list row's activity vocabulary. */
export type BgListActivity = 'running' | 'idle' | 'ready' | 'settled' | 'archived';
/** One row returned by bg_list (schema-validated canonical value). */
export interface BgListAgent {
    agentId: string;
    label: string;
    mode: 'continuable';
    activity: BgListActivity;
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
/**
 * Register the four background-agent tools.
 * @param ctx - context carrying tools, subagents, and the agent registry.
 * @param config - provider, cap, and label bound.
 * @param lifecycle - the live tracked-children registry.
 */
export declare function registerBackgroundAgentTools(ctx: Context, config: ToolConfig, lifecycle: BackgroundAgentLifecycle): void;
//# sourceMappingURL=tools.d.ts.map