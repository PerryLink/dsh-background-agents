/**
 * The `backgroundAgents` session-projection unit: folds the parent session's
 * log into the dashboard value the Web UI and `bg_list` consume. The fold
 * reads ONLY event types the harness already knows —
 * `tool/result` replay metadata (registration / message / stop facts written
 * by this plugin's tools) and `user/message` (this plugin's injected notices
 * plus the official `subagent-settled` account) — so the value reconstructs
 * from the durable log on every reopen without any custom session event. The
 * `metrics` fact kind aggregates per-agent cost/status totals (tokens, turn
 * wall time, error count) into each row's optional `metrics` field.
 *
 * @module dsh-background-agents/projection
 */
import { z } from 'zod';
import type { SessionEvent } from '@deepseek-ai/dsh-session';
import { type BackgroundAgentEntry, type BackgroundAgentsProjection } from './projection-schema.js';
/**
 * Mutable fold state; plain JSON so the persisted projection cache can store
 * it. `source` is fold-internal only (never in the wire value): `legacy`
 * entries were built from the pre-event channels (`tool/result` replay
 * metadata and notice text), `event` entries from the structured
 * `background-agents/fact` records. Once the structured channel owns a row
 * the legacy folds stop for it, so a log that carries both channels (the
 * v0.3.0 write path keeps writing both) never double-counts.
 */
interface State {
    entries: StateEntry[];
}
/** One fold row plus its channel provenance. */
interface StateEntry extends BackgroundAgentEntry {
    readonly source: 'legacy' | 'event';
}
/**
 * The registered projection unit. `stateVersion` bumps whenever the fold
 * semantics or the serialized state fields change, so persisted checkpoint
 * rows from an older unit refold instead of replaying into garbage.
 */
export declare const backgroundAgentsProjectionDefinition: {
    key: "backgroundAgents";
    stateSchema: z.ZodType<State, z.ZodTypeDef, State>;
    init: () => State;
    apply(state: State, event: SessionEvent): State;
    wire: {
        viewSchema: z.ZodObject<{
            agents: z.ZodArray<z.ZodObject<{
                agentId: z.ZodString;
                label: z.ZodString;
                activity: z.ZodEnum<["running", "inactive", "archived"]>;
                messageCount: z.ZodNumber;
                lastMessage: z.ZodOptional<z.ZodString>;
                createdAt: z.ZodNumber;
                lastActiveAt: z.ZodNumber;
                archivedAt: z.ZodOptional<z.ZodNumber>;
                stopRequestedAt: z.ZodOptional<z.ZodNumber>;
                metrics: z.ZodOptional<z.ZodObject<{
                    turnCount: z.ZodNumber;
                    totalDurationMs: z.ZodNumber;
                    inputTokens: z.ZodNullable<z.ZodNumber>;
                    outputTokens: z.ZodNullable<z.ZodNumber>;
                    errorCount: z.ZodNumber;
                }, "strict", z.ZodTypeAny, {
                    inputTokens: number | null;
                    outputTokens: number | null;
                    turnCount: number;
                    totalDurationMs: number;
                    errorCount: number;
                }, {
                    inputTokens: number | null;
                    outputTokens: number | null;
                    turnCount: number;
                    totalDurationMs: number;
                    errorCount: number;
                }>>;
            }, "strict", z.ZodTypeAny, {
                agentId: string;
                label: string;
                activity: "archived" | "running" | "inactive";
                messageCount: number;
                createdAt: number;
                lastActiveAt: number;
                metrics?: {
                    inputTokens: number | null;
                    outputTokens: number | null;
                    turnCount: number;
                    totalDurationMs: number;
                    errorCount: number;
                } | undefined;
                lastMessage?: string | undefined;
                archivedAt?: number | undefined;
                stopRequestedAt?: number | undefined;
            }, {
                agentId: string;
                label: string;
                activity: "archived" | "running" | "inactive";
                messageCount: number;
                createdAt: number;
                lastActiveAt: number;
                metrics?: {
                    inputTokens: number | null;
                    outputTokens: number | null;
                    turnCount: number;
                    totalDurationMs: number;
                    errorCount: number;
                } | undefined;
                lastMessage?: string | undefined;
                archivedAt?: number | undefined;
                stopRequestedAt?: number | undefined;
            }>, "many">;
        }, "strict", z.ZodTypeAny, {
            agents: {
                agentId: string;
                label: string;
                activity: "archived" | "running" | "inactive";
                messageCount: number;
                createdAt: number;
                lastActiveAt: number;
                metrics?: {
                    inputTokens: number | null;
                    outputTokens: number | null;
                    turnCount: number;
                    totalDurationMs: number;
                    errorCount: number;
                } | undefined;
                lastMessage?: string | undefined;
                archivedAt?: number | undefined;
                stopRequestedAt?: number | undefined;
            }[];
        }, {
            agents: {
                agentId: string;
                label: string;
                activity: "archived" | "running" | "inactive";
                messageCount: number;
                createdAt: number;
                lastActiveAt: number;
                metrics?: {
                    inputTokens: number | null;
                    outputTokens: number | null;
                    turnCount: number;
                    totalDurationMs: number;
                    errorCount: number;
                } | undefined;
                lastMessage?: string | undefined;
                archivedAt?: number | undefined;
                stopRequestedAt?: number | undefined;
            }[];
        }>;
        view: (state: NoInfer<State>) => BackgroundAgentsProjection;
    };
    stateVersion: number;
};
declare module '@deepseek-ai/dsh-session-projection/types' {
    interface SessionProjectionStateMap {
        /** Host fold state for the background-agent dashboard rows. */
        backgroundAgents: State;
    }
    interface SessionProjectionMap {
        /** Background-agent dashboard rows folded from the parent session log. */
        backgroundAgents: BackgroundAgentsProjection;
    }
}
export {};
//# sourceMappingURL=projection.d.ts.map