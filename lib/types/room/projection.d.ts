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
    stateSchema: import("zod").ZodType<State, import("zod").ZodTypeDef, State>;
    init: () => State;
    apply(state: State, event: SessionEvent): State;
    wire: {
        viewSchema: import("zod").ZodType<{
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
        }, import("zod").ZodTypeDef, {
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