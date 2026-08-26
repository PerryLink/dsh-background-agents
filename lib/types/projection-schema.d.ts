/**
 * The `backgroundAgents` session-projection vocabulary: one foldable row per
 * background agent, in whole-value shape. The zod schema validates the wire
 * payload on the host and guards the same value inside the client bundle, so
 * the two halves share one runtime shape.
 *
 * @module dsh-background-agents/projection-schema
 */
import { z } from 'zod';
/** Durable lifecycle state of one background agent, folded from the parent log. */
export declare const backgroundAgentEntrySchema: z.ZodObject<{
    /** Durable child session id (the `agentId` every tool returns). */
    agentId: z.ZodString;
    /** Creation label persisted with the child. */
    label: z.ZodString;
    /**
     * Last folded lifecycle fact: `running` while registrations/messages/progress
     * keep landing, `inactive` after the child's activation settled (folded from
     * the official `subagent-settled` notice), `archived` after the idle sweep.
     */
    activity: z.ZodEnum<["running", "inactive", "archived"]>;
    /** Accepted deliveries to the child: the initial task plus every follow-up. */
    messageCount: z.ZodNumber;
    /** Last progress or settle summary, when one was recorded. */
    lastMessage: z.ZodOptional<z.ZodString>;
    /** Epoch ms of the registration fact. */
    createdAt: z.ZodNumber;
    /** Epoch ms of the last folded fact for this agent. */
    lastActiveAt: z.ZodNumber;
    /** Epoch ms of the idle-sweep archive fact, when the row is parked. */
    archivedAt: z.ZodOptional<z.ZodNumber>;
    /** Epoch ms of the latest interrupt request, when one was recorded. */
    stopRequestedAt: z.ZodOptional<z.ZodNumber>;
    /**
     * Aggregated per-agent cost/status totals, present once at least one
     * `metrics` fact has folded. Absent = no turn has been observed yet (or the
     * observability capture is disabled), so consumers render it as "unknown".
     */
    metrics: z.ZodOptional<z.ZodObject<{
        /** Completed child turns that reported a metric sample. */
        turnCount: z.ZodNumber;
        /** Summed turn wall time over reported turns, ms. */
        totalDurationMs: z.ZodNumber;
        /** Summed uncached input tokens; null until a turn reports token accounting. */
        inputTokens: z.ZodNullable<z.ZodNumber>;
        /** Summed output tokens; null until a turn reports token accounting. */
        outputTokens: z.ZodNullable<z.ZodNumber>;
        /** Failed turns (`turn/end` with `reason.kind === 'error'`). */
        errorCount: z.ZodNumber;
    }, "strict", z.ZodTypeAny, {
        turnCount: number;
        totalDurationMs: number;
        inputTokens: number | null;
        outputTokens: number | null;
        errorCount: number;
    }, {
        turnCount: number;
        totalDurationMs: number;
        inputTokens: number | null;
        outputTokens: number | null;
        errorCount: number;
    }>>;
}, "strict", z.ZodTypeAny, {
    agentId: string;
    label: string;
    activity: "running" | "inactive" | "archived";
    messageCount: number;
    createdAt: number;
    lastActiveAt: number;
    lastMessage?: string | undefined;
    archivedAt?: number | undefined;
    stopRequestedAt?: number | undefined;
    metrics?: {
        turnCount: number;
        totalDurationMs: number;
        inputTokens: number | null;
        outputTokens: number | null;
        errorCount: number;
    } | undefined;
}, {
    agentId: string;
    label: string;
    activity: "running" | "inactive" | "archived";
    messageCount: number;
    createdAt: number;
    lastActiveAt: number;
    lastMessage?: string | undefined;
    archivedAt?: number | undefined;
    stopRequestedAt?: number | undefined;
    metrics?: {
        turnCount: number;
        totalDurationMs: number;
        inputTokens: number | null;
        outputTokens: number | null;
        errorCount: number;
    } | undefined;
}>;
/** The whole wire value of the `backgroundAgents` projection unit. */
export declare const backgroundAgentsSchema: z.ZodObject<{
    agents: z.ZodArray<z.ZodObject<{
        /** Durable child session id (the `agentId` every tool returns). */
        agentId: z.ZodString;
        /** Creation label persisted with the child. */
        label: z.ZodString;
        /**
         * Last folded lifecycle fact: `running` while registrations/messages/progress
         * keep landing, `inactive` after the child's activation settled (folded from
         * the official `subagent-settled` notice), `archived` after the idle sweep.
         */
        activity: z.ZodEnum<["running", "inactive", "archived"]>;
        /** Accepted deliveries to the child: the initial task plus every follow-up. */
        messageCount: z.ZodNumber;
        /** Last progress or settle summary, when one was recorded. */
        lastMessage: z.ZodOptional<z.ZodString>;
        /** Epoch ms of the registration fact. */
        createdAt: z.ZodNumber;
        /** Epoch ms of the last folded fact for this agent. */
        lastActiveAt: z.ZodNumber;
        /** Epoch ms of the idle-sweep archive fact, when the row is parked. */
        archivedAt: z.ZodOptional<z.ZodNumber>;
        /** Epoch ms of the latest interrupt request, when one was recorded. */
        stopRequestedAt: z.ZodOptional<z.ZodNumber>;
        /**
         * Aggregated per-agent cost/status totals, present once at least one
         * `metrics` fact has folded. Absent = no turn has been observed yet (or the
         * observability capture is disabled), so consumers render it as "unknown".
         */
        metrics: z.ZodOptional<z.ZodObject<{
            /** Completed child turns that reported a metric sample. */
            turnCount: z.ZodNumber;
            /** Summed turn wall time over reported turns, ms. */
            totalDurationMs: z.ZodNumber;
            /** Summed uncached input tokens; null until a turn reports token accounting. */
            inputTokens: z.ZodNullable<z.ZodNumber>;
            /** Summed output tokens; null until a turn reports token accounting. */
            outputTokens: z.ZodNullable<z.ZodNumber>;
            /** Failed turns (`turn/end` with `reason.kind === 'error'`). */
            errorCount: z.ZodNumber;
        }, "strict", z.ZodTypeAny, {
            turnCount: number;
            totalDurationMs: number;
            inputTokens: number | null;
            outputTokens: number | null;
            errorCount: number;
        }, {
            turnCount: number;
            totalDurationMs: number;
            inputTokens: number | null;
            outputTokens: number | null;
            errorCount: number;
        }>>;
    }, "strict", z.ZodTypeAny, {
        agentId: string;
        label: string;
        activity: "running" | "inactive" | "archived";
        messageCount: number;
        createdAt: number;
        lastActiveAt: number;
        lastMessage?: string | undefined;
        archivedAt?: number | undefined;
        stopRequestedAt?: number | undefined;
        metrics?: {
            turnCount: number;
            totalDurationMs: number;
            inputTokens: number | null;
            outputTokens: number | null;
            errorCount: number;
        } | undefined;
    }, {
        agentId: string;
        label: string;
        activity: "running" | "inactive" | "archived";
        messageCount: number;
        createdAt: number;
        lastActiveAt: number;
        lastMessage?: string | undefined;
        archivedAt?: number | undefined;
        stopRequestedAt?: number | undefined;
        metrics?: {
            turnCount: number;
            totalDurationMs: number;
            inputTokens: number | null;
            outputTokens: number | null;
            errorCount: number;
        } | undefined;
    }>, "many">;
}, "strict", z.ZodTypeAny, {
    agents: {
        agentId: string;
        label: string;
        activity: "running" | "inactive" | "archived";
        messageCount: number;
        createdAt: number;
        lastActiveAt: number;
        lastMessage?: string | undefined;
        archivedAt?: number | undefined;
        stopRequestedAt?: number | undefined;
        metrics?: {
            turnCount: number;
            totalDurationMs: number;
            inputTokens: number | null;
            outputTokens: number | null;
            errorCount: number;
        } | undefined;
    }[];
}, {
    agents: {
        agentId: string;
        label: string;
        activity: "running" | "inactive" | "archived";
        messageCount: number;
        createdAt: number;
        lastActiveAt: number;
        lastMessage?: string | undefined;
        archivedAt?: number | undefined;
        stopRequestedAt?: number | undefined;
        metrics?: {
            turnCount: number;
            totalDurationMs: number;
            inputTokens: number | null;
            outputTokens: number | null;
            errorCount: number;
        } | undefined;
    }[];
}>;
/** One background-agent row of the projection. */
export type BackgroundAgentEntry = z.infer<typeof backgroundAgentEntrySchema>;
/** Per-agent aggregated cost/status totals carried on a projection row. */
export type BackgroundAgentMetrics = NonNullable<BackgroundAgentEntry['metrics']>;
/** The whole `backgroundAgents` projection value. */
export type BackgroundAgentsProjection = z.infer<typeof backgroundAgentsSchema>;
/**
 * Guard an opaque projection value (the client reads projection cells as
 * unknown because it cannot merge the host's `SessionProjectionMap`).
 * @param value - the opaque cell value.
 * @returns the typed projection, or undefined when the cell is absent or invalid.
 */
export declare function isBackgroundAgentsProjection(value: unknown): BackgroundAgentsProjection | undefined;
//# sourceMappingURL=projection-schema.d.ts.map