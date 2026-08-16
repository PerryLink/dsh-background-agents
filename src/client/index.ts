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
import type { Context } from '@deepseek-ai/cordis'
import type { ConnectionHandle } from '@deepseek-ai/dsh-api-remotes/client'
import type { ISessions, SessionId, ObservableSnapshot } from '@deepseek-ai/dsh-client-runtime/client'
import { BackgroundAgentsAction, type BackgroundAgentsInjected } from './BackgroundAgentsAction.tsx'
import { extractResultText } from './presenter.ts'
import { en, NS, zh, type BackgroundAgentsKey } from './locales.ts'
import {
  TeamRoomsSection, type TeamRoomsInjected,
} from './TeamRoomsSection.tsx'
import {
  buildRoomPanels, emptyTeamRoomsState, type SessionListLike, type TeamRoomsState,
} from './room-presenter.ts'
import { en as roomEn, zh as roomZh, ROOM_NS, type TeamRoomsKey } from './room-locales.ts'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Background-agent panel copy. */
    'background-agents': BackgroundAgentsKey
    /** Team-room settings panel copy. */
    teamRooms: TeamRoomsKey
  }
}

export type {
  BackgroundAgentsActionProps, BackgroundAgentsInjected,
} from './BackgroundAgentsAction.tsx'
export type {
  TeamRoomsInjected, TeamRoomsSectionProps,
} from './TeamRoomsSection.tsx'

/** Required services: sessions (list + bindings), slots, locale, the wire client, and the remote (command execution). */
export const inject = ['sessions', 'slots', 'locale', 'connection', 'remote']

/**
 * Live team-room controller: derives the settings-panel state from the
 * current session's `teamRoom` projection (via the binding's `faceOf`
 * observable) overlaid with the session-list live bits. Re-subscribes when
 * the current session changes.
 */
class TeamRoomsController implements ObservableSnapshot<TeamRoomsState> {
  private state: TeamRoomsState = emptyTeamRoomsState()
  private readonly listeners = new Set<() => void>()
  private stopList: (() => void) | undefined
  private stopFace: (() => void) | undefined
  private boundSessionId: string | undefined

  constructor(private readonly sessions: ISessions) {}

  getSnapshot(): TeamRoomsState {
    return this.state
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  /** Attach the subscriptions; returns the disposer (owned by the caller's effect). */
  start(): () => void {
    this.stopList = this.sessions.list.subscribe(() => { this.refresh() })
    this.refresh()
    return () => {
      this.stopList?.()
      this.stopFace?.()
    }
  }

  /** The current session id, for command execution. */
  currentSessionId(): string | undefined {
    return this.state.sessionId
  }

  private set(next: TeamRoomsState): void {
    this.state = next
    for (const listener of [...this.listeners]) listener()
  }

  private refresh(): void {
    const list = this.sessions.list.getSnapshot() as unknown as {
      current?: string
    } & SessionListLike
    const current = list.current
    // Re-bind the projection face when the current session changes.
    if (current !== this.boundSessionId) {
      this.stopFace?.()
      this.stopFace = undefined
      this.boundSessionId = current
      if (current !== undefined) {
        const face = this.sessions.binding(current as SessionId)?.session.projections.faceOf('teamRoom')
        if (face !== undefined) {
          this.stopFace = face.subscribe(() => { this.refresh() })
        }
      }
    }
    if (current === undefined) {
      this.set(emptyTeamRoomsState())
      return
    }
    const face = this.sessions.binding(current as SessionId)?.session.projections.faceOf('teamRoom')
    const panels = face === undefined ? undefined : buildRoomPanels(face.getSnapshot(), list)
    this.set({ status: 'ready', sessionId: current, rooms: panels ?? [] })
  }
}

/**
 * Register the background-agent sidebar panel and the Team Rooms settings
 * page.
 * @param ctx - client root context.
 */
export function apply(ctx: Context): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-background-agents: dictionaries')
  ctx.effect(() => ctx.locale.register(ROOM_NS, { zh: roomZh, en: roomEn }), 'dsh-background-agents: room dictionaries')
  // The client sessions face is the runtime's ISessions; the host merge can
  // shadow it in mixed programs, so the cast reads the runtime contract.
  const sessions = ctx.get('sessions') as ISessions
  const { api } = ctx.get('connection') as ConnectionHandle
  const remote = ctx.remote
  ctx.slots.inject('sidebar.footer.action', () => ctx.slots.register({
    name: 'sidebar.footer.action',
    id: 'background-agents',
    order: 0,
    locale: NS,
    inject: (): BackgroundAgentsInjected => ({
      async openChild(parentSessionId: string, childSessionId: string): Promise<string | undefined> {
        try {
          await sessions.refreshSubagents(parentSessionId as SessionId)
          sessions.openSubagent({
            parentSessionId: parentSessionId as SessionId,
            childSessionId: childSessionId as SessionId,
            mode: 'continuable',
          })
          return undefined
        } catch (error) {
          return error instanceof Error ? error.message : String(error)
        }
      },
      async stopChild(parentSessionId: string, childSessionId: string): Promise<string | undefined> {
        try {
          const result = await api.subagents.interrupt({
            parentSessionId: parentSessionId as SessionId,
            childSessionId: childSessionId as SessionId,
            mode: 'continuable',
          })
          if (result.result.ok) return undefined
          return `${result.result.error.code}: ${result.result.error.message}`
        } catch (error) {
          return error instanceof Error ? error.message : String(error)
        }
      },
      async sendMessage(parentSessionId: string, childSessionId: string, text: string): Promise<string | undefined> {
        try {
          // The same wire RPC the shipped subagent catalog uses: a queued
          // delivery that wakes the child (its next turn answers).
          const result = await api.subagents.prompt({
            parentSessionId: parentSessionId as SessionId,
            childSessionId: childSessionId as SessionId,
            mode: 'continuable',
            content: [{ type: 'text', text }],
            clientTimeZone: new Intl.DateTimeFormat().resolvedOptions().timeZone,
          })
          if (result.result.ok) return undefined
          return `${result.result.error.code}: ${result.result.error.message}`
        } catch (error) {
          return error instanceof Error ? error.message : String(error)
        }
      },
      async readResult(parentSessionId: string, childSessionId: string): Promise<{ text: string; error?: string }> {
        try {
          // A read-only transcript peek through the official history RPC: the
          // last few messages suffice for the final assistant text, and the
          // child Agent is never activated.
          const result = await api.subagents.history({
            parentSessionId: parentSessionId as SessionId,
            childSessionId: childSessionId as SessionId,
            mode: 'continuable',
            maxMessages: 4,
          })
          if (!result.result.ok) {
            return { text: '', error: `${result.result.error.code}: ${result.result.error.message}` }
          }
          return { text: extractResultText(result.result.value.events) }
        } catch (error) {
          return { text: '', error: error instanceof Error ? error.message : String(error) }
        }
      },
    }),
  }, BackgroundAgentsAction))

  // ── the Team Rooms settings page ───────────────────────────────────────────

  const controller = new TeamRoomsController(sessions)
  ctx.effect(() => controller.start(), 'dsh-background-agents: team rooms store')

  /** Execute one `/room` line against the current session; undefined on success. */
  const executeRoom = async (line: string): Promise<string | undefined> => {
    const sessionId = controller.currentSessionId()
    if (sessionId === undefined) return 'no active session'
    try {
      const result = await remote.commands.execute(sessionId as SessionId, line)
      if (!result.ok) return `${result.error.code}: ${result.error.message}`
      if (result.value === undefined) return `unknown or malformed command: ${line}`
      return result.value.result.kind === 'error' ? result.value.result.text : undefined
    } catch (error) {
      return error instanceof Error ? error.message : String(error)
    }
  }

  const injected = (): TeamRoomsInjected => ({
    hooks: { teamRooms: controller },
    getSessionId: () => controller.currentSessionId(),
    create: name => executeRoom(`/room create ${name}`),
    join: roomId => executeRoom(`/room join ${roomId}`),
    leave: roomId => executeRoom(`/room leave ${roomId}`),
    post: (roomId, text) => executeRoom(`/room send ${roomId} ${text}`),
    addTask: (roomId, title) => executeRoom(`/room task add ${roomId} ${title}`),
    claimTask: (roomId, taskId) => executeRoom(`/room task claim ${roomId} ${taskId}`),
    completeTask: (roomId, taskId) => executeRoom(`/room task done ${roomId} ${taskId}`),
    assignTask: (roomId, taskId, member) => executeRoom(`/room task assign ${roomId} ${taskId} ${member}`),
  })

  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'team-rooms',
    // After Models/Agent Presets: rooms are a collaboration surface, not a
    // deployment-shaping one.
    order: 30,
    label: () => ctx.locale.bind(ROOM_NS)('nav'),
    locale: ROOM_NS,
    inject: injected,
  }, TeamRoomsSection))
}
