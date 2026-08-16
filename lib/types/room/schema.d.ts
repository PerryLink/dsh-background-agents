/**
 * Pure wire vocabulary of the team-room domain: zod schemas for every stored
 * record, shared by the domain spec (durable boundary validation), the
 * `teamRoom` session projection (wire value), and the client bundle guard.
 * All times are epoch ms; ids are plain strings.
 *
 * @module dsh-background-agents/room/schema
 */
import { z } from 'zod';
/** One member slot of a room: an independent session registered into the team. */
export declare const roomMemberSchema: z.ZodObject<{
    /** Durable member session id (each member is its own session). */
    sessionId: z.ZodString;
    /** `owner` created the room; `member` joined it. */
    role: z.ZodEnum<["owner", "member"]>;
    /** Epoch ms of registration. */
    joinedAt: z.ZodNumber;
    /**
     * Bus seq up to which this member's session log has received the
     * model-visible delivery (0 = none yet). The offline outbox cursor.
     */
    lastDeliveredSeq: z.ZodNumber;
    /**
     * Timeline seq up to which this member's session log carries the log-only
     * facts (-1 = none yet). The offline fact-replay cursor.
     */
    lastFactSeq: z.ZodNumber;
}, "strict", z.ZodTypeAny, {
    role: "owner" | "member";
    sessionId: string;
    joinedAt: number;
    lastDeliveredSeq: number;
    lastFactSeq: number;
}, {
    role: "owner" | "member";
    sessionId: string;
    joinedAt: number;
    lastDeliveredSeq: number;
    lastFactSeq: number;
}>;
/** The durable room record: membership plus the two append cursors. */
export declare const roomRecordSchema: z.ZodObject<{
    roomId: z.ZodString;
    name: z.ZodString;
    createdAt: z.ZodNumber;
    /** Registration-order member list (each member is an independent session). */
    members: z.ZodArray<z.ZodObject<{
        /** Durable member session id (each member is its own session). */
        sessionId: z.ZodString;
        /** `owner` created the room; `member` joined it. */
        role: z.ZodEnum<["owner", "member"]>;
        /** Epoch ms of registration. */
        joinedAt: z.ZodNumber;
        /**
         * Bus seq up to which this member's session log has received the
         * model-visible delivery (0 = none yet). The offline outbox cursor.
         */
        lastDeliveredSeq: z.ZodNumber;
        /**
         * Timeline seq up to which this member's session log carries the log-only
         * facts (-1 = none yet). The offline fact-replay cursor.
         */
        lastFactSeq: z.ZodNumber;
    }, "strict", z.ZodTypeAny, {
        role: "owner" | "member";
        sessionId: string;
        joinedAt: number;
        lastDeliveredSeq: number;
        lastFactSeq: number;
    }, {
        role: "owner" | "member";
        sessionId: string;
        joinedAt: number;
        lastDeliveredSeq: number;
        lastFactSeq: number;
    }>, "many">;
    /** Next bus seq to mint (monotonic per room; the ordering authority). */
    busNext: z.ZodNumber;
    /** Next timeline seq to mint. */
    timelineNext: z.ZodNumber;
}, "strict", z.ZodTypeAny, {
    createdAt: number;
    roomId: string;
    members: {
        role: "owner" | "member";
        sessionId: string;
        joinedAt: number;
        lastDeliveredSeq: number;
        lastFactSeq: number;
    }[];
    name: string;
    busNext: number;
    timelineNext: number;
}, {
    createdAt: number;
    roomId: string;
    members: {
        role: "owner" | "member";
        sessionId: string;
        joinedAt: number;
        lastDeliveredSeq: number;
        lastFactSeq: number;
    }[];
    name: string;
    busNext: number;
    timelineNext: number;
}>;
/** One message on the room bus: broadcast, or directed when `toSessionId` is set. */
export declare const busMessageSchema: z.ZodObject<{
    roomId: z.ZodString;
    /** Monotonic per-room seq: the bus order every reader agrees on. */
    seq: z.ZodNumber;
    senderSessionId: z.ZodString;
    /** Directed delivery target; absent = broadcast to every member. */
    toSessionId: z.ZodOptional<z.ZodString>;
    text: z.ZodString;
    createdAt: z.ZodNumber;
}, "strict", z.ZodTypeAny, {
    createdAt: number;
    text: string;
    roomId: string;
    seq: number;
    senderSessionId: string;
    toSessionId?: string | undefined;
}, {
    createdAt: number;
    text: string;
    roomId: string;
    seq: number;
    senderSessionId: string;
    toSessionId?: string | undefined;
}>;
/** One task-board card: todo / in-progress / done plus its assignee. */
export declare const taskRecordSchema: z.ZodObject<{
    roomId: z.ZodString;
    taskId: z.ZodString;
    title: z.ZodString;
    description: z.ZodString;
    status: z.ZodEnum<["todo", "in-progress", "done"]>;
    /** Assignee member session id; null = unassigned. */
    assigneeSessionId: z.ZodNullable<z.ZodString>;
    createdBy: z.ZodString;
    createdAt: z.ZodNumber;
    updatedAt: z.ZodNumber;
    completedAt: z.ZodOptional<z.ZodNumber>;
}, "strict", z.ZodTypeAny, {
    status: "done" | "todo" | "in-progress";
    createdAt: number;
    title: string;
    roomId: string;
    taskId: string;
    description: string;
    assigneeSessionId: string | null;
    createdBy: string;
    updatedAt: number;
    completedAt?: number | undefined;
}, {
    status: "done" | "todo" | "in-progress";
    createdAt: number;
    title: string;
    roomId: string;
    taskId: string;
    description: string;
    assigneeSessionId: string | null;
    createdBy: string;
    updatedAt: number;
    completedAt?: number | undefined;
}>;
/** Timeline kinds the room appends; the shared event stream. */
export declare const timelineKindSchema: z.ZodEnum<["room-created", "member-joined", "member-left", "message-posted", "message-directed", "task-created", "task-claimed", "task-assigned", "task-completed"]>;
/** One shared timeline event (append-only per room). */
export declare const timelineEventSchema: z.ZodObject<{
    roomId: z.ZodString;
    /** Monotonic per-room seq; the timeline order. */
    seq: z.ZodNumber;
    kind: z.ZodEnum<["room-created", "member-joined", "member-left", "message-posted", "message-directed", "task-created", "task-claimed", "task-assigned", "task-completed"]>;
    at: z.ZodNumber;
    /** Kind-specific payload; plain lossless JSON. */
    data: z.ZodRecord<z.ZodString, z.ZodUnknown>;
}, "strict", z.ZodTypeAny, {
    at: number;
    roomId: string;
    seq: number;
    kind: "room-created" | "member-joined" | "member-left" | "message-posted" | "message-directed" | "task-created" | "task-claimed" | "task-assigned" | "task-completed";
    data: Record<string, unknown>;
}, {
    at: number;
    roomId: string;
    seq: number;
    kind: "room-created" | "member-joined" | "member-left" | "message-posted" | "message-directed" | "task-created" | "task-claimed" | "task-assigned" | "task-completed";
    data: Record<string, unknown>;
}>;
/** One member row as the fold serves it. */
export declare const roomViewMemberSchema: z.ZodObject<{
    sessionId: z.ZodString;
    role: z.ZodEnum<["owner", "member"]>;
    joinedAt: z.ZodNumber;
}, "strict", z.ZodTypeAny, {
    role: "owner" | "member";
    sessionId: string;
    joinedAt: number;
}, {
    role: "owner" | "member";
    sessionId: string;
    joinedAt: number;
}>;
/** One task row as the fold serves it. */
export declare const roomViewTaskSchema: z.ZodObject<{
    taskId: z.ZodString;
    title: z.ZodString;
    description: z.ZodString;
    status: z.ZodEnum<["todo", "in-progress", "done"]>;
    assigneeSessionId: z.ZodNullable<z.ZodString>;
    createdBy: z.ZodString;
    createdAt: z.ZodNumber;
    updatedAt: z.ZodNumber;
}, "strict", z.ZodTypeAny, {
    status: "done" | "todo" | "in-progress";
    createdAt: number;
    title: string;
    taskId: string;
    description: string;
    assigneeSessionId: string | null;
    createdBy: string;
    updatedAt: number;
}, {
    status: "done" | "todo" | "in-progress";
    createdAt: number;
    title: string;
    taskId: string;
    description: string;
    assigneeSessionId: string | null;
    createdBy: string;
    updatedAt: number;
}>;
/** One room as the fold serves it. */
export declare const roomViewSchema: z.ZodObject<{
    roomId: z.ZodString;
    name: z.ZodString;
    createdAt: z.ZodNumber;
    members: z.ZodArray<z.ZodObject<{
        sessionId: z.ZodString;
        role: z.ZodEnum<["owner", "member"]>;
        joinedAt: z.ZodNumber;
    }, "strict", z.ZodTypeAny, {
        role: "owner" | "member";
        sessionId: string;
        joinedAt: number;
    }, {
        role: "owner" | "member";
        sessionId: string;
        joinedAt: number;
    }>, "many">;
    tasks: z.ZodArray<z.ZodObject<{
        taskId: z.ZodString;
        title: z.ZodString;
        description: z.ZodString;
        status: z.ZodEnum<["todo", "in-progress", "done"]>;
        assigneeSessionId: z.ZodNullable<z.ZodString>;
        createdBy: z.ZodString;
        createdAt: z.ZodNumber;
        updatedAt: z.ZodNumber;
    }, "strict", z.ZodTypeAny, {
        status: "done" | "todo" | "in-progress";
        createdAt: number;
        title: string;
        taskId: string;
        description: string;
        assigneeSessionId: string | null;
        createdBy: string;
        updatedAt: number;
    }, {
        status: "done" | "todo" | "in-progress";
        createdAt: number;
        title: string;
        taskId: string;
        description: string;
        assigneeSessionId: string | null;
        createdBy: string;
        updatedAt: number;
    }>, "many">;
    timeline: z.ZodArray<z.ZodObject<{
        roomId: z.ZodString;
        /** Monotonic per-room seq; the timeline order. */
        seq: z.ZodNumber;
        kind: z.ZodEnum<["room-created", "member-joined", "member-left", "message-posted", "message-directed", "task-created", "task-claimed", "task-assigned", "task-completed"]>;
        at: z.ZodNumber;
        /** Kind-specific payload; plain lossless JSON. */
        data: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    }, "strict", z.ZodTypeAny, {
        at: number;
        roomId: string;
        seq: number;
        kind: "room-created" | "member-joined" | "member-left" | "message-posted" | "message-directed" | "task-created" | "task-claimed" | "task-assigned" | "task-completed";
        data: Record<string, unknown>;
    }, {
        at: number;
        roomId: string;
        seq: number;
        kind: "room-created" | "member-joined" | "member-left" | "message-posted" | "message-directed" | "task-created" | "task-claimed" | "task-assigned" | "task-completed";
        data: Record<string, unknown>;
    }>, "many">;
}, "strict", z.ZodTypeAny, {
    createdAt: number;
    roomId: string;
    members: {
        role: "owner" | "member";
        sessionId: string;
        joinedAt: number;
    }[];
    tasks: {
        status: "done" | "todo" | "in-progress";
        createdAt: number;
        title: string;
        taskId: string;
        description: string;
        assigneeSessionId: string | null;
        createdBy: string;
        updatedAt: number;
    }[];
    timeline: {
        at: number;
        roomId: string;
        seq: number;
        kind: "room-created" | "member-joined" | "member-left" | "message-posted" | "message-directed" | "task-created" | "task-claimed" | "task-assigned" | "task-completed";
        data: Record<string, unknown>;
    }[];
    name: string;
}, {
    createdAt: number;
    roomId: string;
    members: {
        role: "owner" | "member";
        sessionId: string;
        joinedAt: number;
    }[];
    tasks: {
        status: "done" | "todo" | "in-progress";
        createdAt: number;
        title: string;
        taskId: string;
        description: string;
        assigneeSessionId: string | null;
        createdBy: string;
        updatedAt: number;
    }[];
    timeline: {
        at: number;
        roomId: string;
        seq: number;
        kind: "room-created" | "member-joined" | "member-left" | "message-posted" | "message-directed" | "task-created" | "task-claimed" | "task-assigned" | "task-completed";
        data: Record<string, unknown>;
    }[];
    name: string;
}>;
/** The whole `teamRoom` projection value: every room this session belongs to. */
export declare const teamRoomViewSchema: z.ZodObject<{
    rooms: z.ZodArray<z.ZodObject<{
        roomId: z.ZodString;
        name: z.ZodString;
        createdAt: z.ZodNumber;
        members: z.ZodArray<z.ZodObject<{
            sessionId: z.ZodString;
            role: z.ZodEnum<["owner", "member"]>;
            joinedAt: z.ZodNumber;
        }, "strict", z.ZodTypeAny, {
            role: "owner" | "member";
            sessionId: string;
            joinedAt: number;
        }, {
            role: "owner" | "member";
            sessionId: string;
            joinedAt: number;
        }>, "many">;
        tasks: z.ZodArray<z.ZodObject<{
            taskId: z.ZodString;
            title: z.ZodString;
            description: z.ZodString;
            status: z.ZodEnum<["todo", "in-progress", "done"]>;
            assigneeSessionId: z.ZodNullable<z.ZodString>;
            createdBy: z.ZodString;
            createdAt: z.ZodNumber;
            updatedAt: z.ZodNumber;
        }, "strict", z.ZodTypeAny, {
            status: "done" | "todo" | "in-progress";
            createdAt: number;
            title: string;
            taskId: string;
            description: string;
            assigneeSessionId: string | null;
            createdBy: string;
            updatedAt: number;
        }, {
            status: "done" | "todo" | "in-progress";
            createdAt: number;
            title: string;
            taskId: string;
            description: string;
            assigneeSessionId: string | null;
            createdBy: string;
            updatedAt: number;
        }>, "many">;
        timeline: z.ZodArray<z.ZodObject<{
            roomId: z.ZodString;
            /** Monotonic per-room seq; the timeline order. */
            seq: z.ZodNumber;
            kind: z.ZodEnum<["room-created", "member-joined", "member-left", "message-posted", "message-directed", "task-created", "task-claimed", "task-assigned", "task-completed"]>;
            at: z.ZodNumber;
            /** Kind-specific payload; plain lossless JSON. */
            data: z.ZodRecord<z.ZodString, z.ZodUnknown>;
        }, "strict", z.ZodTypeAny, {
            at: number;
            roomId: string;
            seq: number;
            kind: "room-created" | "member-joined" | "member-left" | "message-posted" | "message-directed" | "task-created" | "task-claimed" | "task-assigned" | "task-completed";
            data: Record<string, unknown>;
        }, {
            at: number;
            roomId: string;
            seq: number;
            kind: "room-created" | "member-joined" | "member-left" | "message-posted" | "message-directed" | "task-created" | "task-claimed" | "task-assigned" | "task-completed";
            data: Record<string, unknown>;
        }>, "many">;
    }, "strict", z.ZodTypeAny, {
        createdAt: number;
        roomId: string;
        members: {
            role: "owner" | "member";
            sessionId: string;
            joinedAt: number;
        }[];
        tasks: {
            status: "done" | "todo" | "in-progress";
            createdAt: number;
            title: string;
            taskId: string;
            description: string;
            assigneeSessionId: string | null;
            createdBy: string;
            updatedAt: number;
        }[];
        timeline: {
            at: number;
            roomId: string;
            seq: number;
            kind: "room-created" | "member-joined" | "member-left" | "message-posted" | "message-directed" | "task-created" | "task-claimed" | "task-assigned" | "task-completed";
            data: Record<string, unknown>;
        }[];
        name: string;
    }, {
        createdAt: number;
        roomId: string;
        members: {
            role: "owner" | "member";
            sessionId: string;
            joinedAt: number;
        }[];
        tasks: {
            status: "done" | "todo" | "in-progress";
            createdAt: number;
            title: string;
            taskId: string;
            description: string;
            assigneeSessionId: string | null;
            createdBy: string;
            updatedAt: number;
        }[];
        timeline: {
            at: number;
            roomId: string;
            seq: number;
            kind: "room-created" | "member-joined" | "member-left" | "message-posted" | "message-directed" | "task-created" | "task-claimed" | "task-assigned" | "task-completed";
            data: Record<string, unknown>;
        }[];
        name: string;
    }>, "many">;
}, "strict", z.ZodTypeAny, {
    rooms: {
        createdAt: number;
        roomId: string;
        members: {
            role: "owner" | "member";
            sessionId: string;
            joinedAt: number;
        }[];
        tasks: {
            status: "done" | "todo" | "in-progress";
            createdAt: number;
            title: string;
            taskId: string;
            description: string;
            assigneeSessionId: string | null;
            createdBy: string;
            updatedAt: number;
        }[];
        timeline: {
            at: number;
            roomId: string;
            seq: number;
            kind: "room-created" | "member-joined" | "member-left" | "message-posted" | "message-directed" | "task-created" | "task-claimed" | "task-assigned" | "task-completed";
            data: Record<string, unknown>;
        }[];
        name: string;
    }[];
}, {
    rooms: {
        createdAt: number;
        roomId: string;
        members: {
            role: "owner" | "member";
            sessionId: string;
            joinedAt: number;
        }[];
        tasks: {
            status: "done" | "todo" | "in-progress";
            createdAt: number;
            title: string;
            taskId: string;
            description: string;
            assigneeSessionId: string | null;
            createdBy: string;
            updatedAt: number;
        }[];
        timeline: {
            at: number;
            roomId: string;
            seq: number;
            kind: "room-created" | "member-joined" | "member-left" | "message-posted" | "message-directed" | "task-created" | "task-claimed" | "task-assigned" | "task-completed";
            data: Record<string, unknown>;
        }[];
        name: string;
    }[];
}>;
export type RoomMember = z.infer<typeof roomMemberSchema>;
export type RoomRecord = z.infer<typeof roomRecordSchema>;
export type BusMessage = z.infer<typeof busMessageSchema>;
export type TaskRecord = z.infer<typeof taskRecordSchema>;
export type TimelineEvent = z.infer<typeof timelineEventSchema>;
export type TimelineKind = z.infer<typeof timelineKindSchema>;
export type RoomView = z.infer<typeof roomViewSchema>;
export type TeamRoomView = z.infer<typeof teamRoomViewSchema>;
/**
 * Runtime-guard an opaque projection cell as the `teamRoom` value (the client
 * reads projection cells as unknown because it cannot merge the host's
 * `SessionProjectionMap`).
 * @param value - the opaque cell value.
 * @returns the typed view, or undefined when the cell is absent or invalid.
 */
export declare function isTeamRoomView(value: unknown): TeamRoomView | undefined;
//# sourceMappingURL=schema.d.ts.map