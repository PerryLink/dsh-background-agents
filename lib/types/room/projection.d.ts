/**
 * The `teamRoom` session-projection unit: folds one MEMBER session's log of
 * `team-room/fact` records into the room view the settings panel renders —
 * rooms, members, the task board, and the shared timeline. The fold is pure
 * over the member's own durable log (the room store stays the cross-session
 * authority; this value is the per-session reconstructed copy), so it replays
 * identically after every reopen and on every restart.
 *
 * @module dsh-background-agents/room/projection
 */
import type { SessionEvent } from '@deepseek-ai/dsh-session';
import { type RoomView, type TeamRoomView } from './schema.js';
/** Mutable fold state; plain JSON so the persisted projection cache can store it. */
interface State {
    rooms: RoomView[];
}
/** The registered projection unit. */
export declare const teamRoomProjectionDefinition: {
    key: "teamRoom";
    stateSchema: import("zod").ZodObject<{
        rooms: import("zod").ZodArray<import("zod").ZodObject<{
            roomId: import("zod").ZodString;
            name: import("zod").ZodString;
            createdAt: import("zod").ZodNumber;
            members: import("zod").ZodArray<import("zod").ZodObject<{
                sessionId: import("zod").ZodString;
                role: import("zod").ZodEnum<["owner", "member"]>;
                joinedAt: import("zod").ZodNumber;
            }, "strict", import("zod").ZodTypeAny, {
                role: "owner" | "member";
                sessionId: string;
                joinedAt: number;
            }, {
                role: "owner" | "member";
                sessionId: string;
                joinedAt: number;
            }>, "many">;
            tasks: import("zod").ZodArray<import("zod").ZodObject<{
                taskId: import("zod").ZodString;
                title: import("zod").ZodString;
                description: import("zod").ZodString;
                status: import("zod").ZodEnum<["todo", "in-progress", "done"]>;
                assigneeSessionId: import("zod").ZodNullable<import("zod").ZodString>;
                createdBy: import("zod").ZodString;
                createdAt: import("zod").ZodNumber;
                updatedAt: import("zod").ZodNumber;
            }, "strict", import("zod").ZodTypeAny, {
                status: "todo" | "in-progress" | "done";
                title: string;
                createdAt: number;
                taskId: string;
                description: string;
                assigneeSessionId: string | null;
                createdBy: string;
                updatedAt: number;
            }, {
                status: "todo" | "in-progress" | "done";
                title: string;
                createdAt: number;
                taskId: string;
                description: string;
                assigneeSessionId: string | null;
                createdBy: string;
                updatedAt: number;
            }>, "many">;
            timeline: import("zod").ZodArray<import("zod").ZodObject<{
                roomId: import("zod").ZodString;
                seq: import("zod").ZodNumber;
                kind: import("zod").ZodEnum<["room-created", "member-joined", "member-left", "message-posted", "message-directed", "task-created", "task-claimed", "task-assigned", "task-completed"]>;
                at: import("zod").ZodNumber;
                data: import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodUnknown>;
            }, "strict", import("zod").ZodTypeAny, {
                at: number;
                data: Record<string, unknown>;
                kind: "room-created" | "member-joined" | "member-left" | "message-posted" | "message-directed" | "task-created" | "task-claimed" | "task-assigned" | "task-completed";
                roomId: string;
                seq: number;
            }, {
                at: number;
                data: Record<string, unknown>;
                kind: "room-created" | "member-joined" | "member-left" | "message-posted" | "message-directed" | "task-created" | "task-claimed" | "task-assigned" | "task-completed";
                roomId: string;
                seq: number;
            }>, "many">;
        }, "strict", import("zod").ZodTypeAny, {
            name: string;
            createdAt: number;
            roomId: string;
            members: {
                role: "owner" | "member";
                sessionId: string;
                joinedAt: number;
            }[];
            tasks: {
                status: "todo" | "in-progress" | "done";
                title: string;
                createdAt: number;
                taskId: string;
                description: string;
                assigneeSessionId: string | null;
                createdBy: string;
                updatedAt: number;
            }[];
            timeline: {
                at: number;
                data: Record<string, unknown>;
                kind: "room-created" | "member-joined" | "member-left" | "message-posted" | "message-directed" | "task-created" | "task-claimed" | "task-assigned" | "task-completed";
                roomId: string;
                seq: number;
            }[];
        }, {
            name: string;
            createdAt: number;
            roomId: string;
            members: {
                role: "owner" | "member";
                sessionId: string;
                joinedAt: number;
            }[];
            tasks: {
                status: "todo" | "in-progress" | "done";
                title: string;
                createdAt: number;
                taskId: string;
                description: string;
                assigneeSessionId: string | null;
                createdBy: string;
                updatedAt: number;
            }[];
            timeline: {
                at: number;
                data: Record<string, unknown>;
                kind: "room-created" | "member-joined" | "member-left" | "message-posted" | "message-directed" | "task-created" | "task-claimed" | "task-assigned" | "task-completed";
                roomId: string;
                seq: number;
            }[];
        }>, "many">;
    }, "strict", import("zod").ZodTypeAny, {
        rooms: {
            name: string;
            createdAt: number;
            roomId: string;
            members: {
                role: "owner" | "member";
                sessionId: string;
                joinedAt: number;
            }[];
            tasks: {
                status: "todo" | "in-progress" | "done";
                title: string;
                createdAt: number;
                taskId: string;
                description: string;
                assigneeSessionId: string | null;
                createdBy: string;
                updatedAt: number;
            }[];
            timeline: {
                at: number;
                data: Record<string, unknown>;
                kind: "room-created" | "member-joined" | "member-left" | "message-posted" | "message-directed" | "task-created" | "task-claimed" | "task-assigned" | "task-completed";
                roomId: string;
                seq: number;
            }[];
        }[];
    }, {
        rooms: {
            name: string;
            createdAt: number;
            roomId: string;
            members: {
                role: "owner" | "member";
                sessionId: string;
                joinedAt: number;
            }[];
            tasks: {
                status: "todo" | "in-progress" | "done";
                title: string;
                createdAt: number;
                taskId: string;
                description: string;
                assigneeSessionId: string | null;
                createdBy: string;
                updatedAt: number;
            }[];
            timeline: {
                at: number;
                data: Record<string, unknown>;
                kind: "room-created" | "member-joined" | "member-left" | "message-posted" | "message-directed" | "task-created" | "task-claimed" | "task-assigned" | "task-completed";
                roomId: string;
                seq: number;
            }[];
        }[];
    }>;
    init: () => State;
    apply(state: State, event: SessionEvent): State;
    wire: {
        viewSchema: import("zod").ZodObject<{
            rooms: import("zod").ZodArray<import("zod").ZodObject<{
                roomId: import("zod").ZodString;
                name: import("zod").ZodString;
                createdAt: import("zod").ZodNumber;
                members: import("zod").ZodArray<import("zod").ZodObject<{
                    sessionId: import("zod").ZodString;
                    role: import("zod").ZodEnum<["owner", "member"]>;
                    joinedAt: import("zod").ZodNumber;
                }, "strict", import("zod").ZodTypeAny, {
                    role: "owner" | "member";
                    sessionId: string;
                    joinedAt: number;
                }, {
                    role: "owner" | "member";
                    sessionId: string;
                    joinedAt: number;
                }>, "many">;
                tasks: import("zod").ZodArray<import("zod").ZodObject<{
                    taskId: import("zod").ZodString;
                    title: import("zod").ZodString;
                    description: import("zod").ZodString;
                    status: import("zod").ZodEnum<["todo", "in-progress", "done"]>;
                    assigneeSessionId: import("zod").ZodNullable<import("zod").ZodString>;
                    createdBy: import("zod").ZodString;
                    createdAt: import("zod").ZodNumber;
                    updatedAt: import("zod").ZodNumber;
                }, "strict", import("zod").ZodTypeAny, {
                    status: "todo" | "in-progress" | "done";
                    title: string;
                    createdAt: number;
                    taskId: string;
                    description: string;
                    assigneeSessionId: string | null;
                    createdBy: string;
                    updatedAt: number;
                }, {
                    status: "todo" | "in-progress" | "done";
                    title: string;
                    createdAt: number;
                    taskId: string;
                    description: string;
                    assigneeSessionId: string | null;
                    createdBy: string;
                    updatedAt: number;
                }>, "many">;
                timeline: import("zod").ZodArray<import("zod").ZodObject<{
                    roomId: import("zod").ZodString;
                    seq: import("zod").ZodNumber;
                    kind: import("zod").ZodEnum<["room-created", "member-joined", "member-left", "message-posted", "message-directed", "task-created", "task-claimed", "task-assigned", "task-completed"]>;
                    at: import("zod").ZodNumber;
                    data: import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodUnknown>;
                }, "strict", import("zod").ZodTypeAny, {
                    at: number;
                    data: Record<string, unknown>;
                    kind: "room-created" | "member-joined" | "member-left" | "message-posted" | "message-directed" | "task-created" | "task-claimed" | "task-assigned" | "task-completed";
                    roomId: string;
                    seq: number;
                }, {
                    at: number;
                    data: Record<string, unknown>;
                    kind: "room-created" | "member-joined" | "member-left" | "message-posted" | "message-directed" | "task-created" | "task-claimed" | "task-assigned" | "task-completed";
                    roomId: string;
                    seq: number;
                }>, "many">;
            }, "strict", import("zod").ZodTypeAny, {
                name: string;
                createdAt: number;
                roomId: string;
                members: {
                    role: "owner" | "member";
                    sessionId: string;
                    joinedAt: number;
                }[];
                tasks: {
                    status: "todo" | "in-progress" | "done";
                    title: string;
                    createdAt: number;
                    taskId: string;
                    description: string;
                    assigneeSessionId: string | null;
                    createdBy: string;
                    updatedAt: number;
                }[];
                timeline: {
                    at: number;
                    data: Record<string, unknown>;
                    kind: "room-created" | "member-joined" | "member-left" | "message-posted" | "message-directed" | "task-created" | "task-claimed" | "task-assigned" | "task-completed";
                    roomId: string;
                    seq: number;
                }[];
            }, {
                name: string;
                createdAt: number;
                roomId: string;
                members: {
                    role: "owner" | "member";
                    sessionId: string;
                    joinedAt: number;
                }[];
                tasks: {
                    status: "todo" | "in-progress" | "done";
                    title: string;
                    createdAt: number;
                    taskId: string;
                    description: string;
                    assigneeSessionId: string | null;
                    createdBy: string;
                    updatedAt: number;
                }[];
                timeline: {
                    at: number;
                    data: Record<string, unknown>;
                    kind: "room-created" | "member-joined" | "member-left" | "message-posted" | "message-directed" | "task-created" | "task-claimed" | "task-assigned" | "task-completed";
                    roomId: string;
                    seq: number;
                }[];
            }>, "many">;
        }, "strict", import("zod").ZodTypeAny, {
            rooms: {
                name: string;
                createdAt: number;
                roomId: string;
                members: {
                    role: "owner" | "member";
                    sessionId: string;
                    joinedAt: number;
                }[];
                tasks: {
                    status: "todo" | "in-progress" | "done";
                    title: string;
                    createdAt: number;
                    taskId: string;
                    description: string;
                    assigneeSessionId: string | null;
                    createdBy: string;
                    updatedAt: number;
                }[];
                timeline: {
                    at: number;
                    data: Record<string, unknown>;
                    kind: "room-created" | "member-joined" | "member-left" | "message-posted" | "message-directed" | "task-created" | "task-claimed" | "task-assigned" | "task-completed";
                    roomId: string;
                    seq: number;
                }[];
            }[];
        }, {
            rooms: {
                name: string;
                createdAt: number;
                roomId: string;
                members: {
                    role: "owner" | "member";
                    sessionId: string;
                    joinedAt: number;
                }[];
                tasks: {
                    status: "todo" | "in-progress" | "done";
                    title: string;
                    createdAt: number;
                    taskId: string;
                    description: string;
                    assigneeSessionId: string | null;
                    createdBy: string;
                    updatedAt: number;
                }[];
                timeline: {
                    at: number;
                    data: Record<string, unknown>;
                    kind: "room-created" | "member-joined" | "member-left" | "message-posted" | "message-directed" | "task-created" | "task-claimed" | "task-assigned" | "task-completed";
                    roomId: string;
                    seq: number;
                }[];
            }[];
        }>;
        view: (state: NoInfer<State>) => TeamRoomView;
    };
    stateVersion: number;
};
declare module '@deepseek-ai/dsh-session-projection/types' {
    interface SessionProjectionStateMap {
        /** Host fold state for the team-room views. */
        teamRoom: State;
    }
    interface SessionProjectionMap {
        /** Team-room views folded from one member session's room facts. */
        teamRoom: TeamRoomView;
    }
}
export {};
//# sourceMappingURL=projection.d.ts.map