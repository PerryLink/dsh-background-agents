/**
 * Start and list background children across every host line this plugin
 * declares.
 *
 * The 0.1.x–0.2.1 lines expose `SubagentRuntime.startContinuable({ provider,
 * label, request, signal })` and accept the per-child `toolFilter`/`persona`
 * request fields. The 0.2.2 line replaced it with
 * `startActivation({ provider, label, request | flattened task fields, signal,
 * delivery })` and moved per-child composition to presets: the task fields are
 * flat on the post-release harness and nested in `request` on the published
 * `0.2.2-rc.1` build, and the runtime reads only the shape it knows, so one
 * activation object carrying both serves either. Both shapes ignore
 * `toolFilter`/`persona`, which `supportsPerChildComposition()` reports before
 * a caller promises them to a model.
 *
 * Direct-child discovery is a parent-catalog read on every published line
 * (`listChildren`), but the harness master removed that method while keeping
 * the recursive `listDescendants`; direct rows are the `depth === 1` children
 * of that walk.
 *
 * @module dsh-background-agents/subagent-compat
 */
import type { Context } from '@deepseek-ai/cordis';
import type { Agent, AgentOptions } from '@deepseek-ai/dsh-agent';
import type { ContentBlock, MessageId } from '@deepseek-ai/dsh-llm';
import type { SessionId } from '@deepseek-ai/dsh-session';
/** One validated per-child tool filter (the descriptor's `ToolRestriction` shape). */
export interface ChildToolFilter {
    readonly allow?: readonly string[];
    readonly deny?: readonly string[];
}
/** One continuable child start, expressed on the plugin's view of the seam. */
export interface ContinuableStartInput {
    /** Registered provider that establishes the child. */
    readonly provider: string;
    /** Durable creation label shown in listings. */
    readonly label: string;
    /** Initial user prompt for the child. */
    readonly prompt: ContentBlock[];
    /** Exact live parent that owns the child. */
    readonly parent: Agent;
    /** Per-child tool scoping; only representable below 0.2.2. */
    readonly toolFilter?: ChildToolFilter;
    /** Per-child persona shadow; only representable below 0.2.2. */
    readonly persona?: string;
    /** Absolute delegation-depth cap for the child. */
    readonly maxDepth?: number;
    /** Provider/model route overrides for the child's model requests. */
    readonly agentOptions?: AgentOptions;
    /** Caller cancellation, owning the start until inbox acceptance. */
    readonly signal: AbortSignal;
}
/** Identities returned once the child accepted its initial prompt. */
export interface ContinuableStartResult {
    /** Durable child session id. */
    readonly childId: SessionId;
    /** Accepted initial prompt's inbox message id. */
    readonly messageId: MessageId;
}
/** One direct child as both catalog surfaces express it. */
export interface DirectChildRow {
    readonly id: SessionId;
    readonly mode: 'one-shot' | 'external' | 'continuable' | 'unknown';
    readonly label?: string;
}
/**
 * Whether the live seam takes per-child composition (`toolFilter`/`persona`).
 * The 0.2.2 line moved that decision to presets, so a start on it cannot honor
 * either field; callers use this to warn instead of silently claiming support.
 * @param subagents - the `ctx.subagents` service.
 * @returns true when the legacy continuable start is available.
 */
export declare function supportsPerChildComposition(subagents: unknown): boolean;
/**
 * Start one durable continuable child on either seam.
 * @param subagents - the `ctx.subagents` service.
 * @param input - task, parent, optional composition, and cancellation.
 * @returns the child id and the accepted initial message id.
 * @throws when the service exposes neither start shape, or accepts no message.
 */
export declare function startContinuableChild(subagents: unknown, input: ContinuableStartInput): Promise<ContinuableStartResult>;
/**
 * List one parent's direct children on either seam.
 * @param ctx - context carrying the subagent service.
 * @param parentId - parent whose direct children are requested.
 * @param signal - cancellation forwarded to the catalog read.
 * @returns direct-child rows in catalog event order.
 */
export declare function listDirectChildren(ctx: Context, parentId: SessionId, signal?: AbortSignal): Promise<readonly DirectChildRow[]>;
//# sourceMappingURL=subagent-compat.d.ts.map