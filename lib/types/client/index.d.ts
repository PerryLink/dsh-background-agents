/**
 * dsh-background-agents, browser half:
 *
 * - the sidebar `sidebar.footer.action` entry whose floating panel shows
 *   every background agent across sessions (rows derive from the
 *   `backgroundAgents` projection values riding the session-list snapshot);
 * - the Team Rooms `settings.section` page: member status, the shared task
 *   board, and the timeline, read from the current session's `teamRoom`
 *   projection (live `faceOf` snapshots) and written back through the HOST
 *   `/room` command (`remote.commands.execute`) so every action keeps the
 *   durable command lifecycle. Zero custom RPC: both surfaces ride the
 *   sanctioned plugin channels.
 */
import type { Context } from '@deepseek-ai/cordis';
import { type BackgroundAgentsKey } from './locales.js';
import { type TeamRoomsKey } from './room-locales.js';
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        /** Background-agent panel copy. */
        'background-agents': BackgroundAgentsKey;
        /** Team-room settings panel copy. */
        teamRooms: TeamRoomsKey;
    }
}
export type { BackgroundAgentsActionProps, BackgroundAgentsInjected, } from './BackgroundAgentsAction.js';
export type { TeamRoomsInjected, TeamRoomsSectionProps, } from './TeamRoomsSection.js';
/**
 * Required services: sessions (list + bindings), slots, locale, the wire
 * client, and the remote command executor (declared as `remote.commands`
 * because the team-room panel executes `/room` lines through it).
 */
export declare const inject: string[];
/**
 * Register the background-agent sidebar panel and the Team Rooms settings
 * page.
 * @param ctx - client root context.
 */
export declare function apply(ctx: Context): void;
//# sourceMappingURL=index.d.ts.map