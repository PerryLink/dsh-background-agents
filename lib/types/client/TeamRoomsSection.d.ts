import type { PropsLocale, PropsRuntime, InjectFace } from '@deepseek-ai/dsh-client-ui-slots';
import type { ObservableSnapshot } from '@deepseek-ai/dsh-client-runtime/client';
import type { TeamRoomsState } from './room-presenter.js';
import { ROOM_NS } from './room-locales.js';
/** Business actions supplied by the slot registration (all via /room command execution). */
export interface TeamRoomsInjected {
    hooks: {
        /** The live controller state: current session id + derived room panels. */
        teamRooms: ObservableSnapshot<TeamRoomsState>;
    };
    /** The current session id (commands execute against it), or undefined. */
    getSessionId(): string | undefined;
    create(name: string): Promise<string | undefined>;
    join(roomId: string): Promise<string | undefined>;
    leave(roomId: string): Promise<string | undefined>;
    post(roomId: string, text: string): Promise<string | undefined>;
    addTask(roomId: string, title: string): Promise<string | undefined>;
    claimTask(roomId: string, taskId: string): Promise<string | undefined>;
    completeTask(roomId: string, taskId: string): Promise<string | undefined>;
    assignTask(roomId: string, taskId: string, member: string): Promise<string | undefined>;
}
/** The action share one room card needs (everything except the bound hooks). */
export type RoomActions = Omit<TeamRoomsInjected, 'hooks'>;
/** Full component props: the settings-section owner share, locale, and the bound inject face. */
export type TeamRoomsSectionProps = PropsRuntime<'settings.section'> & PropsLocale<typeof ROOM_NS> & InjectFace<TeamRoomsInjected>;
/** The settings section: room management over the live session's projection. */
export declare function TeamRoomsSection(props: TeamRoomsSectionProps): import("react").JSX.Element;
//# sourceMappingURL=TeamRoomsSection.d.ts.map