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
import type { ProjectionDefinition } from '@deepseek-ai/dsh-session-projection';
import { type RoomView, type TeamRoomView } from './schema.ts';
/** Mutable fold state; plain JSON so the persisted projection cache can store it. */
interface State {
    rooms: RoomView[];
}
/** The registered projection unit. */
export declare const teamRoomProjectionDefinition: ProjectionDefinition<'teamRoom', State>;
declare module '@deepseek-ai/dsh-session-projection/types' {
    interface SessionProjectionMap {
        /** Team-room views folded from one member session's room facts. */
        teamRoom: TeamRoomView;
    }
}
export {};
//# sourceMappingURL=projection.d.ts.map