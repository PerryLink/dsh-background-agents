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
import type {} from '@deepseek-ai/dsh-api-remotes/client'
import type { SessionId } from '@deepseek-ai/dsh-client-connection/client'
import type { ISessions } from '@deepseek-ai/dsh-api-session-controller/client'
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

/**
 * Required services: sessions (list + bindings), slots, locale, the wire
 * client, and the remote command executor (declared as `remote.commands`
 * because the team-room panel executes `/room` lines through it).
 */
export const inject = ['sessions', 'slots', 'locale', 'connection', 'remote', 'remote.commands']

/**
 * Minimal structural contract of an observable snapshot. Declared locally
 * because the owner package of `ISessions` no longer re-exports the
 * generic; the runtime contract is structural.
 */
interface ObservableSnapshot<T> {
  getSnapshot(): T
  subscribe(listener: () => void): () => void
}

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
    const panels = face === undefined
      ? undefined
      : buildRoomPanels(face.getSnapshot() as Parameters<typeof buildRoomPanels>[0], list)
    this.set({ status: 'ready', sessionId: current, rooms: panels ?? [] })
  }
}

/**
 * The structural shape of the api-remotes `commands` Remote namespace the
 * team-room panel needs. Declared locally because the ambient namespace
 * merge onto the client remote is assembled from several generated
 * modules and can resolve to a different physical copy under strict
 * package managers — the runtime contract is what this client depends on.
 */
interface CommandsRemote {
  readonly execute: (
    agent: SessionId,
    line: string,
    images?: readonly { mediaType: string; data: string; name?: string }[],
    signal?: AbortSignal,
  ) => Promise<
    | { ok: false; error: { code: string; message: string } }
    | { ok: true; value?: { commandId: string; result: { kind: string; text: string } } }
  >
}

/**
 * The structural shape of the `subagents` Remote namespace the background
 * agent panel needs, mirroring the host's current control surface:
 * `interruptByParent` takes the durable address positionally, `prompt`
 * requires a client-minted `requestId`, and the transcript `history` RPC
 * no longer exists (the panel peeks the child session's `conversation`
 * projection through the sessions binding instead).
 */
interface SubagentsRemote {
  readonly prompt: (
    request: {
      requestId: string
      parentSessionId: SessionId
      childSessionId: SessionId
      mode: 'continuable'
      content: readonly { type: 'text'; text: string }[]
      clientTimeZone?: string
    },
    signal?: AbortSignal,
  ) => Promise<{
    result:
      | { ok: true; value: { messageId: string } }
      | { ok: false; error: { code: string; message: string } }
  }>
  readonly interruptByParent: (
    childSessionId: SessionId,
    parentSessionId: SessionId,
    mode: 'continuable',
  ) => Promise<{
    result:
      | { ok: true; value: { accepted: true } }
      | { ok: false; error: { code: string; message: string } }
  }>
}

/** One row of a `conversation` projection snapshot: role plus content blocks. */
interface TranscriptEntry {
  readonly role?: string
  readonly content?: readonly { readonly type: string; readonly text?: string }[]
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
  const { api } = ctx.get('connection') as unknown as { api: { subagents: SubagentsRemote } }
  const remote = ctx.remote as unknown as { commands: CommandsRemote }
  // The owning package declares the slots service with a different arity;
  // read it through this structural contract instead.
  const slots = ctx.get('slots') as unknown as {
    inject(slot: string, callback: () => unknown): void
    register(options: unknown, component: unknown): unknown
  }
  slots.inject('sidebar.footer.action', () => slots.register({
    name: 'sidebar.footer.action',
    id: 'background-agents',
    order: 0,
    locale: NS,
    inject: (): BackgroundAgentsInjected => ({
      sessions: sessions.list as unknown as ObservableSnapshot<SessionListLike>,
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
          const result = await api.subagents.interruptByParent(
            childSessionId as SessionId,
            parentSessionId as SessionId,
            'continuable',
          )
          if (result.result.ok) return undefined
          return `${result.result.error.code}: ${result.result.error.message}`
        } catch (error) {
          return error instanceof Error ? error.message : String(error)
        }
      },
      async sendMessage(parentSessionId: string, childSessionId: string, text: string): Promise<string | undefined> {
        try {
          // The same wire RPC the shipped subagent catalog uses: a queued
          // delivery that wakes the child (its next turn answers). The
          // requestId is the identity the host persists on the accepted
          // message, minted by the client before the call.
          const result = await api.subagents.prompt({
            requestId: crypto.randomUUID(),
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
      async readResult(_parentSessionId: string, childSessionId: string): Promise<{ text: string; error?: string }> {
        try {
          // The transcript `history` RPC no longer exists: peek the child
          // session's `conversation` projection through the sessions
          // binding. The child Agent is never activated.
          const face = sessions.binding(childSessionId as SessionId)?.session.projections.faceOf('conversation')
          if (face === undefined) return { text: '', error: 'child transcript projection unavailable' }
          const snapshot = face.getSnapshot() as unknown as { entries?: readonly TranscriptEntry[] }
          const events = snapshot.entries ?? (snapshot as unknown as readonly unknown[])
          return { text: extractResultText(events as unknown as Parameters<typeof extractResultText>[0]) }
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
      const result = await remote.commands.execute(sessionId as SessionId, line, [])
      if (!result.ok) return `${result.error.code}: ${result.error.message}`
      if (result.value === undefined || result.value.result === undefined) return `unknown or malformed command: ${line}`
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

  slots.inject('settings.section', () => slots.register({
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
