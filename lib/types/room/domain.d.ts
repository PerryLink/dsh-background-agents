/**
 * The `team_rooms` storage-domain declaration: rooms, the message bus, the
 * task board, and the shared timeline as four KV tables over the harness's
 * own storage layer (SQLite or JSONL backend — the deployment chooses; the
 * plugin adds no service of its own). Records are validated at the durable
 * boundary by the same zod schemas the projection and the client share.
 *
 * The domain's single write chain is the ordering authority: every bus
 * append and cursor bump queues on it, so concurrent posters can never
 * interleave a read-modify-write.
 *
 * @module dsh-background-agents/room/domain
 */
/** Branded-ish key aliases: append-table keys are plain `${roomId}/${…}` strings. */
export type RoomKey = string & {
    readonly __roomKey?: never;
};
export type AppendKey = string & {
    readonly __appendKey?: never;
};
/**
 * The domain spec: identity, format version, and the four declared tables.
 * The same schemas validate every record at the durable read boundary.
 */
export declare const teamRoomsDomainSpec: {
    name: string;
    version: number;
    tables: {
        rooms: import("@deepseek-ai/dsh-storage-domain").DomainTableSpec<RoomKey, {
            createdAt: number;
            roomId: string;
            name: string;
            members: {
                role: "owner" | "member";
                sessionId: string;
                joinedAt: number;
                lastDeliveredSeq: number;
                lastFactSeq: number;
            }[];
            busNext: number;
            timelineNext: number;
        }>;
        bus: import("@deepseek-ai/dsh-storage-domain").DomainTableSpec<AppendKey, {
            createdAt: number;
            text: string;
            senderSessionId: string;
            roomId: string;
            seq: number;
            toSessionId?: string | undefined;
        }>;
        tasks: import("@deepseek-ai/dsh-storage-domain").DomainTableSpec<AppendKey, {
            status: "todo" | "in-progress" | "done";
            createdAt: number;
            roomId: string;
            taskId: string;
            title: string;
            description: string;
            assigneeSessionId: string | null;
            createdBy: string;
            updatedAt: number;
            completedAt?: number | undefined;
        }>;
        timeline: import("@deepseek-ai/dsh-storage-domain").DomainTableSpec<AppendKey, {
            at: number;
            kind: "room-created" | "member-joined" | "member-left" | "message-posted" | "message-directed" | "task-created" | "task-claimed" | "task-assigned" | "task-completed";
            roomId: string;
            seq: number;
            data: Record<string, unknown>;
        }>;
    };
};
//# sourceMappingURL=domain.d.ts.map