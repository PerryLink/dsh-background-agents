/**
 * Pure presentation of the team-room settings panel: derives the display
 * state from the `teamRoom` projection value plus the session-list snapshot
 * (the live overlay for member status). No I/O, clock, or randomness — the
 * component stays a thin binder and the rows stay testable.
 *
 * @module dsh-background-agents/room-presenter
 */
import { type TimelineEvent } from '../room/schema.js';
/** The session-list face the presenter reads (host-sampled `running` per session). */
export interface SessionListLike {
    byId: Record<string, {
        id: string;
        running?: boolean;
        displayTitle?: string;
    }>;
}
/** One member row with the live overlay applied. */
export interface RoomMemberRow {
    readonly sessionId: string;
    readonly role: 'owner' | 'member';
    readonly joinedAt: number;
    /** Live bit from the session list (this browser's own view of the process). */
    readonly live: boolean;
    readonly title?: string;
}
/** One task-board row. */
export interface RoomTaskRow {
    readonly taskId: string;
    readonly title: string;
    readonly description: string;
    readonly status: 'todo' | 'in-progress' | 'done';
    readonly assigneeSessionId: string | null;
    readonly createdBy: string;
}
/** One rendered timeline entry (the raw event plus its localized label inputs). */
export interface RoomTimelineRow {
    readonly seq: number;
    readonly kind: TimelineEvent['kind'];
    readonly data: TimelineEvent['data'];
}
/** One rendered room panel. */
export interface RoomPanel {
    readonly roomId: string;
    readonly name: string;
    readonly createdAt: number;
    readonly members: RoomMemberRow[];
    readonly tasks: RoomTaskRow[];
    readonly timeline: RoomTimelineRow[];
}
/** The controller state the section component selects from. */
export interface TeamRoomsState {
    readonly status: 'ready' | 'unavailable';
    /** The current session id, when a conversation is open. */
    readonly sessionId?: string;
    readonly rooms: RoomPanel[];
}
/** Empty ready state (no session open). */
export declare function emptyTeamRoomsState(): TeamRoomsState;
/**
 * Derive the room panels from one projection value and the session list.
 * @param value - the opaque `teamRoom` projection cell.
 * @param list - the session-list snapshot (live overlay source).
 * @returns the panels, or undefined when the cell is absent or invalid.
 */
export declare function buildRoomPanels(value: unknown, list: SessionListLike): RoomPanel[] | undefined;
//# sourceMappingURL=room-presenter.d.ts.map