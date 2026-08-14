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
}, "strict", z.ZodTypeAny, {
    agentId: string;
    label: string;
    activity: "running" | "inactive" | "archived";
    messageCount: number;
    createdAt: number;
    lastActiveAt: number;
    lastMessage?: string | undefined;
}, {
    agentId: string;
    label: string;
    activity: "running" | "inactive" | "archived";
    messageCount: number;
    createdAt: number;
    lastActiveAt: number;
    lastMessage?: string | undefined;
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
    }, "strict", z.ZodTypeAny, {
        agentId: string;
        label: string;
        activity: "running" | "inactive" | "archived";
        messageCount: number;
        createdAt: number;
        lastActiveAt: number;
        lastMessage?: string | undefined;
    }, {
        agentId: string;
        label: string;
        activity: "running" | "inactive" | "archived";
        messageCount: number;
        createdAt: number;
        lastActiveAt: number;
        lastMessage?: string | undefined;
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
    }[];
}>;
/** One background-agent row of the projection. */
export type BackgroundAgentEntry = z.infer<typeof backgroundAgentEntrySchema>;
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