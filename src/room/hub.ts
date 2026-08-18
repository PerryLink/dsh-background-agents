/**
 * RoomHub: the host-side service behind team rooms. It opens the
 * `team_rooms` storage domain, owns every room mutation (membership, the
 * message bus, the task board, the timeline), and drives delivery:
 *
 * - every write queues on ONE hub chain (the domain's single write chain is
 *   the ordering authority — concurrent posters cannot interleave a
 *   read-modify-write, and bus seqs mint strictly in commit order);
 * - model-visible delivery goes through the official inbox
 *   (`agent.followup` wakes live members; offline members receive their
 *   backlog through `agent.inject` when their session next starts), so every
 *   model-visible room message is a durable `user/message` event in the
 *   member's own session log — model-visible ⟺ recorded;
 * - the shared timeline mirrors into every member's log as log-only
 *   `team-room/fact` events (ignorable), so the `teamRoom` projection
 *   reconstructs the room view from each member's own durable log;
 * - per-member delivery is at-least-once and ordered: a crash between bus
 *   commit and delivery re-delivers on catch-up (the cursor only advances
 *   after delivery), and per-member chains serialize delivery order.
 *
 * @module dsh-background-agents/room/hub
 */

import { randomUUID } from 'node:crypto'
import { Context, Service } from '@deepseek-ai/cordis'
import { boundContextSummary, createUserMessage } from '@deepseek-ai/dsh-llm'
import type { Agent } from '@deepseek-ai/dsh-agent'
import { SessionId, type Session } from '@deepseek-ai/dsh-session'
import type { KvTable } from '@deepseek-ai/dsh-storage-domain'
import { teamRoomsDomainSpec, type AppendKey, type RoomKey } from './domain.ts'
import {
  type BusMessage, type RoomMember, type RoomRecord, type TaskRecord,
  type TimelineEvent, type TimelineKind,
} from './schema.ts'
import { TEAM_ROOM_FACT, type TeamRoomFact } from './events.ts'
import type { FactAppender } from '../facts.ts'
import { PLUGIN } from '../vocabulary.ts'

/** Tunables the room feature honors; every threshold is a validated Config field. */
export interface RoomConfig {
  /** Hard cap on rooms across the profile. */
  readonly maxRooms: number
  /** Hard cap on members per room. */
  readonly maxMembersPerRoom: number
  /** Hard cap on rooms one member session may join. */
  readonly maxRoomsPerMember: number
  /** Bus entries kept per room (the message retention window). */
  readonly busRetention: number
  /** Timeline entries kept per room. */
  readonly timelineRetention: number
  /** Completed tasks kept per room (older `done` rows are pruned). */
  readonly taskRetention: number
  /** Hard cap on one bus message's text (rejected above, never truncated). */
  readonly maxMessageChars: number
  /** Inject the short room brief into member sessions (join + resume). */
  readonly injectRoomBrief: boolean
  /**
   * How long the `team_rooms` storage-domain open may take before every
   * room operation fails loud (`store-unavailable`) instead of hanging
   * forever (a stuck storage provider used to leave `/room` commands
   * without a `command/done`).
   */
  readonly roomOpenTimeoutMs: number
}

/** A domain-level rejection with a stable code; tools and commands render it. */
export class RoomError extends Error {
  constructor(readonly code: string, message: string) {
    super(message)
    this.name = 'RoomError'
  }
}

/** Read face of the live agent registry (kept narrow for tests). */
export interface LiveAgents {
  get(id: SessionId): Agent | undefined
}

/** Read face of the live session store (kept narrow for tests). */
export interface LiveSessions {
  get(id: SessionId): Session | undefined
}

const roomKey = (roomId: string): RoomKey => roomId as RoomKey
const appendKey = (roomId: string, seq: number | string): AppendKey => `${roomId}/${seq}` as AppendKey
const seqOf = (key: AppendKey): number => Number(String(key).slice(String(key).lastIndexOf('/') + 1))

/** Bus record the hub mints from a committed post. */
export interface PostedMessage {
  readonly roomId: string
  readonly seq: number
  readonly senderSessionId: string
  readonly toSessionId?: string
  readonly text: string
  readonly createdAt: number
}

/**
 * The team-room service. Constructed in apply() with the validated room
 * policy once the storage domain is available; {@link open} opens the
 * `team_rooms` storage domain and the owning fiber closes it.
 */
export class RoomHub extends Service {
  private rooms?: KvTable<RoomKey, RoomRecord>
  private bus?: KvTable<AppendKey, BusMessage>
  private tasks?: KvTable<AppendKey, TaskRecord>
  private timeline?: KvTable<AppendKey, TimelineEvent>

  /** One write chain: every mutation (create/join/post/task) queues here. */
  private tail: Promise<void> = Promise.resolve()
  /** Per-room delivery chains: posts to one room serialize delivery order. */
  private readonly roomChains = new Map<string, Promise<void>>()
  /** Per-member delivery chains: live delivery and catch-up never interleave. */
  private readonly memberChains = new Map<string, Promise<void>>()

  /** Resolves once the storage domain is open (or failed); gates every operation. */
  private readonly ready: Promise<void>
  private readyResolve: () => void = () => {}
  private initError: unknown

  constructor(
    ctx: Context,
    private readonly config: RoomConfig,
    private readonly agents: LiveAgents,
    private readonly sessions: LiveSessions,
    private readonly facts: FactAppender,
  ) {
    super(ctx, 'roomHub')
    this.ready = new Promise<void>(resolve => { this.readyResolve = resolve })
  }

  /**
   * Open the `team_rooms` storage domain and load its four tables. Called
   * once by the mount site after the storage domain becomes available; every
   * hub operation gates on this resolution. A failed open fails every
   * operation loud through {@link requireRooms} instead of hanging — and a
   * STUCK open (a storage provider whose open promise never settles) is cut
   * off by the `roomOpenTimeoutMs` timer so `/room` commands still settle
   * with a `store-unavailable` error instead of never emitting
   * `command/done`.
   */
  async open(): Promise<void> {
    let timer: ReturnType<typeof setTimeout> | undefined
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        reject(new RoomError(
          'store-unavailable',
          `the team_rooms storage domain did not open within ${this.config.roomOpenTimeoutMs} ms `
          + '(the storage provider may be missing or stuck) — /room and the room_* tools are disabled for this profile',
        ))
      }, this.config.roomOpenTimeoutMs)
    })
    const openPromise = this.ctx.storageDomain.open(teamRoomsDomainSpec)
    // A late open after a timeout must still be closed (no orphaned domain).
    void openPromise.then(domain => {
      if (this.initError !== undefined) void domain.close()
    }, () => {})
    try {
      const domain = await Promise.race([openPromise, timeout])
      clearTimeout(timer)
      if (this.initError !== undefined) return // already timed out; the late domain was closed above
      this.ctx.effect(() => () => { void domain.close() }, 'dsh-background-agents: team_rooms domain close')
      this.rooms = domain.table('rooms')
      this.bus = domain.table('bus')
      this.tasks = domain.table('tasks')
      this.timeline = domain.table('timeline')
    } catch (error) {
      this.initError = error
      throw error
    } finally {
      clearTimeout(timer)
      this.readyResolve()
    }
  }

  // ── read faces (gated on the domain open; then synchronous in-memory) ──────

  /** One room record, or undefined. */
  async room(roomId: string): Promise<RoomRecord | undefined> {
    await this.ready
    return this.requireRooms().get(roomKey(roomId))
  }

  /** Every room one session is a member of, in creation order. */
  async roomsOfMember(sessionId: SessionId): Promise<RoomRecord[]> {
    await this.ready
    return [...this.requireRooms().entries()]
      .map(([, record]) => record)
      .filter(record => record.members.some(member => member.sessionId === sessionId))
  }

  /** All rooms (used by the command surface for the roster). */
  async allRooms(): Promise<RoomRecord[]> {
    await this.ready
    return [...this.requireRooms().entries()].map(([, record]) => record)
  }

  /** Bus messages of one room with seq > since, in seq order. */
  async busMessages(roomId: string, since = 0): Promise<BusMessage[]> {
    await this.ready
    return [...this.requireBus().entries()]
      .map(([, message]) => message)
      .filter(message => message.roomId === roomId && message.seq > since)
      .sort((a, b) => a.seq - b.seq)
  }

  /** The task board of one room, creation order. */
  async tasksOf(roomId: string): Promise<TaskRecord[]> {
    await this.ready
    return [...this.requireTasks().entries()]
      .map(([, task]) => task)
      .filter(task => task.roomId === roomId)
      .sort((a, b) => a.createdAt - b.createdAt)
  }

  /** The timeline of one room with seq > since, in seq order. */
  async timelineOf(roomId: string, since = 0): Promise<TimelineEvent[]> {
    await this.ready
    return [...this.requireTimeline().entries()]
      .map(([, event]) => event)
      .filter(event => event.roomId === roomId && event.seq > since)
      .sort((a, b) => a.seq - b.seq)
  }

  /** The member slot of one session in one room, or undefined. */
  memberOf(room: RoomRecord, sessionId: SessionId): RoomMember | undefined {
    return room.members.find(member => member.sessionId === sessionId)
  }

  // ── mutations (all queued on the single write chain) ────────────────────────

  /**
   * Create one room; the creator becomes its owner member. Enforces the
   * profile-wide `maxRooms` cap inside the write chain.
   */
  createRoom(sessionId: SessionId, name: string, now = Date.now()): Promise<RoomRecord> {
    return this.enqueue(async () => {
      const rooms = this.requireRooms()
      const trimmed = name.trim()
      if (trimmed === '') throw new RoomError('empty-name', 'room name must not be empty')
      if (rooms.size >= this.config.maxRooms) {
        throw new RoomError('room-cap', `room limit reached: maxRooms=${this.config.maxRooms}`)
      }
      const roomId = randomUUID()
      const record: RoomRecord = {
        roomId,
        name: trimmed,
        createdAt: now,
        members: [{ sessionId, role: 'owner', joinedAt: now, lastDeliveredSeq: 0, lastFactSeq: -1 }],
        busNext: 0,
        timelineNext: 0,
      }
      await rooms.put(roomKey(roomId), record)
      const event = this.timelineEvent(roomId, 0, 'room-created', now, { sessionId })
      await this.requireTimeline().put(appendKey(roomId, event.seq), event)
      const current = await rooms.update(roomKey(roomId), latest => ({ ...latest, timelineNext: 1 }))
      this.appendFactTo(sessionId, this.joinFact(current, [], [event]))
      this.injectBrief(sessionId, current)
      return current
    })
  }

  /**
   * Register one session as a member of an existing room (cross-session
   * membership). Enforces the per-room and per-member caps inside the chain.
   */
  joinRoom(sessionId: SessionId, roomId: string, now = Date.now()): Promise<RoomRecord> {
    return this.enqueue(async () => {
      const rooms = this.requireRooms()
      const record = this.requireRoom(roomId)
      if (this.memberOf(record, sessionId) !== undefined) return record
      if (record.members.length >= this.config.maxMembersPerRoom) {
        throw new RoomError('member-cap', `room ${roomId} is full: maxMembersPerRoom=${this.config.maxMembersPerRoom}`)
      }
      if ((await this.roomsOfMember(sessionId)).length >= this.config.maxRoomsPerMember) {
        throw new RoomError('membership-cap', `membership limit reached: maxRoomsPerMember=${this.config.maxRoomsPerMember}`)
      }
      const member: RoomMember = {
        sessionId,
        role: 'member',
        joinedAt: now,
        lastDeliveredSeq: record.busNext,
        lastFactSeq: record.timelineNext - 1,
      }
      const event = this.timelineEvent(roomId, record.timelineNext, 'member-joined', now, {
        sessionId, role: member.role,
      })
      await this.requireTimeline().put(appendKey(roomId, event.seq), event)
      const next: RoomRecord = {
        ...record,
        members: [...record.members, member],
        timelineNext: record.timelineNext + 1,
      }
      await rooms.put(roomKey(roomId), next)
      // The new member's log gets the full snapshot; the others get the fact.
      this.appendFactTo(sessionId, this.joinFact(next, await this.tasksOf(roomId), await this.timelineOf(roomId)))
      this.broadcastFact(next, {
        kind: 'member-joined',
        roomId,
        sessionId,
        role: member.role,
        joinedAt: now,
        timelineSeq: event.seq,
      })
      this.injectBrief(sessionId, next)
      return next
    })
  }

  /** Remove one member. The owner leaving deletes the room. */
  leaveRoom(sessionId: SessionId, roomId: string, now = Date.now()): Promise<RoomRecord | undefined> {
    return this.enqueue(async () => {
      const rooms = this.requireRooms()
      const record = this.requireRoom(roomId)
      const member = this.memberOf(record, sessionId)
      if (member === undefined) return record
      if (member.role === 'owner' && record.members.length > 1) {
        throw new RoomError('owner-leave', 'the owner cannot leave while other members remain; delete the room instead (/room delete)')
      }
      if (record.members.length <= 1) {
        await rooms.delete(roomKey(roomId))
        await this.purgeRoom(roomId)
        return undefined
      }
      const event = this.timelineEvent(roomId, record.timelineNext, 'member-left', now, { sessionId })
      await this.requireTimeline().put(appendKey(roomId, event.seq), event)
      const next: RoomRecord = {
        ...record,
        members: record.members.filter(candidate => candidate.sessionId !== sessionId),
        timelineNext: record.timelineNext + 1,
      }
      await rooms.put(roomKey(roomId), next)
      this.broadcastFact(next, {
        kind: 'member-left', roomId, sessionId, timelineSeq: event.seq,
      })
      return next
    })
  }

  /** Owner-only room deletion. */
  deleteRoom(sessionId: SessionId, roomId: string): Promise<void> {
    return this.enqueue(async () => {
      const record = this.requireRoom(roomId)
      const member = this.memberOf(record, sessionId)
      if (member?.role !== 'owner') {
        throw new RoomError('not-owner', `room ${roomId}: only the owner can delete the room`)
      }
      await this.requireRooms().delete(roomKey(roomId))
      await this.purgeRoom(roomId)
    })
  }

  /**
   * Post one message onto the bus: broadcast, or directed when `toSessionId`
   * names a member. Runs on the per-room delivery chain so per-member
   * delivery order always equals bus seq order, and commits the store write
   * before any delivery (cursors advance only after delivery — at-least-once).
   */
  postMessage(input: {
    readonly roomId: string
    readonly senderSessionId: SessionId
    readonly text: string
    readonly toSessionId?: SessionId
  }, now = Date.now()): Promise<PostedMessage> {
    return this.onRoomChain(input.roomId, async () => {
      const text = input.text.trim()
      if (text === '') throw new RoomError('empty-message', 'room message must not be empty')
      if (text.length > this.config.maxMessageChars) {
        throw new RoomError('message-too-long', `room message exceeds maxMessageChars=${this.config.maxMessageChars}`)
      }
      const posted = await this.enqueue(async () => {
        const rooms = this.requireRooms()
        const record = this.requireRoom(input.roomId)
        if (this.memberOf(record, input.senderSessionId) === undefined) {
          throw new RoomError('not-member', `session ${input.senderSessionId} is not a member of room ${input.roomId}`)
        }
        if (input.toSessionId !== undefined && this.memberOf(record, input.toSessionId) === undefined) {
          throw new RoomError('unknown-target', `session ${input.toSessionId} is not a member of room ${input.roomId}`)
        }
        const message: BusMessage = {
          roomId: input.roomId,
          seq: record.busNext,
          senderSessionId: input.senderSessionId,
          ...(input.toSessionId === undefined ? {} : { toSessionId: input.toSessionId }),
          text,
          createdAt: now,
        }
        await this.requireBus().put(appendKey(input.roomId, message.seq), message)
        const event = this.timelineEvent(
          input.roomId,
          record.timelineNext,
          input.toSessionId === undefined ? 'message-posted' : 'message-directed',
          now,
          { seq: message.seq, senderSessionId: input.senderSessionId, text, ...(input.toSessionId === undefined ? {} : { toSessionId: input.toSessionId }) },
        )
        await this.requireTimeline().put(appendKey(input.roomId, event.seq), event)
        const next: RoomRecord = {
          ...record,
          busNext: record.busNext + 1,
          timelineNext: record.timelineNext + 1,
        }
        await rooms.put(roomKey(input.roomId), next)
        await this.pruneRoom(input.roomId, next)
        return { record: next, message, event }
      })
      // Facts + model-visible delivery, serialized per member.
      await this.deliverPosted(posted.record, posted.message, posted.event)
      // Cursor advance only after the member's delivery/fact landed.
      await this.advanceCursors(posted.record, posted.message, posted.event)
      // A fresh object: the bus record's optional field is `string | undefined`
      // under zod, while PostedMessage declares the exact-optional shape.
      return {
        roomId: posted.message.roomId,
        seq: posted.message.seq,
        senderSessionId: posted.message.senderSessionId,
        ...(posted.message.toSessionId === undefined ? {} : { toSessionId: posted.message.toSessionId }),
        text: posted.message.text,
        createdAt: posted.message.createdAt,
      }
    })
  }

  /** Create a task on the board (assignee optional; default unassigned). */
  createTask(input: {
    readonly roomId: string
    readonly bySessionId: SessionId
    readonly title: string
    readonly description?: string
    readonly assigneeSessionId?: SessionId
  }, now = Date.now()): Promise<TaskRecord> {
    return this.enqueue(async () => {
      const record = this.requireRoom(input.roomId)
      if (this.memberOf(record, input.bySessionId) === undefined) {
        throw new RoomError('not-member', `session ${input.bySessionId} is not a member of room ${input.roomId}`)
      }
      if (input.assigneeSessionId !== undefined && this.memberOf(record, input.assigneeSessionId) === undefined) {
        throw new RoomError('unknown-target', `session ${input.assigneeSessionId} is not a member of room ${input.roomId}`)
      }
      const title = input.title.trim()
      if (title === '') throw new RoomError('empty-title', 'task title must not be empty')
      const task: TaskRecord = {
        roomId: input.roomId,
        taskId: randomUUID(),
        title,
        description: (input.description ?? '').trim(),
        status: 'todo',
        assigneeSessionId: input.assigneeSessionId ?? null,
        createdBy: input.bySessionId,
        createdAt: now,
        updatedAt: now,
      }
      await this.requireTasks().put(appendKey(input.roomId, task.taskId), task)
      const event = this.timelineEvent(input.roomId, record.timelineNext, 'task-created', now, {
        taskId: task.taskId, title: task.title,
      })
      await this.requireTimeline().put(appendKey(input.roomId, event.seq), event)
      const next = await this.requireRooms().update(roomKey(input.roomId), current => ({
        ...current, timelineNext: current.timelineNext + 1,
      }))
      this.broadcastFact(next, this.taskCreatedFact(task, event.seq))
      await this.advanceFactsForLive(next, event.seq)
      return task
    })
  }

  /** Claim a task for the calling member (in-progress + assignee). */
  claimTask(input: {
    readonly roomId: string
    readonly bySessionId: SessionId
    readonly taskId: string
  }, now = Date.now()): Promise<TaskRecord> {
    return this.mutateTask(input, now, 'claim')
  }

  /**
   * Hand a task to another member. Callers outside a tool (the /room command)
   * are the user themselves; the room_transfer_task TOOL gates this same
   * mutation behind the approval service.
   */
  assignTask(input: {
    readonly roomId: string
    readonly bySessionId: SessionId
    readonly taskId: string
    readonly toSessionId: SessionId
  }, now = Date.now()): Promise<TaskRecord> {
    return this.mutateTask(input, now, 'assign')
  }

  /** Complete a task (done). Only the assignee or the owner may complete it. */
  completeTask(input: {
    readonly roomId: string
    readonly bySessionId: SessionId
    readonly taskId: string
  }, now = Date.now()): Promise<TaskRecord> {
    return this.mutateTask(input, now, 'complete')
  }

  // ── activation catch-up ─────────────────────────────────────────────────────

  /**
   * Deliver everything a member missed while offline: the log-only facts
   * (shared timeline) and the model-visible bus backlog, both in store order.
   * Runs on the member's delivery chain so a live post cannot interleave.
   * Idempotent: cursors make a second call a no-op.
   */
  catchUp(sessionId: SessionId): Promise<void> {
    return this.onMemberChain(sessionId, async () => {
      const rooms = this.requireRooms()
      const agent = this.agents.get(sessionId)
      const session = this.sessions.get(sessionId)
      if (session === undefined) return
      for (const [, record] of rooms.entries()) {
        const member = this.memberOf(record, sessionId)
        if (member === undefined) continue
        // Log-only timeline facts first, in store order.
        for (const event of await this.timelineOf(record.roomId, member.lastFactSeq)) {
          const fact = this.factFromTimeline(record, event)
          if (fact !== undefined) this.facts.append(session, TEAM_ROOM_FACT, fact)
        }
        // Model-visible bus backlog: injected as durable user messages that
        // the member's next step claims (no wake: the user is opening the
        // session; the backlog enters the next request context). Messages the
        // member sent themselves are skipped (their log already records them).
        const backlog = (await this.busMessages(record.roomId, member.lastDeliveredSeq))
          .filter(message => message.senderSessionId !== sessionId)
        if (agent !== undefined) {
          for (const message of backlog) agent.inject(this.roomUserMessage(record, message))
        }
        // Advance the cursors only after the facts and messages landed.
        await this.enqueue(async () => {
          await this.requireRooms().update(roomKey(record.roomId), current => {
            const currentMember = current.members.find(candidate => candidate.sessionId === sessionId)
            if (currentMember === undefined) return current
            return {
              ...current,
              members: current.members.map(candidate => (candidate.sessionId === sessionId
                ? {
                  ...candidate,
                  lastFactSeq: Math.max(candidate.lastFactSeq, current.timelineNext - 1),
                  lastDeliveredSeq: Math.max(candidate.lastDeliveredSeq, current.busNext - 1),
                }
                : candidate)),
            }
          })
        })
        if (this.config.injectRoomBrief) this.injectBrief(sessionId, record)
      }
    })
  }

  // ── brief injection ─────────────────────────────────────────────────────────

  /**
   * The member brief: a SHORT injected paragraph that starts with the
   * one-line role statement (Minimal-persona style) and names the room id,
   * the member count, and the collaboration tools. Injected on join and on
   * every session start (resume included), as a durable user message — the
   * member's model sees exactly what the member's log records.
   */
  injectBrief(sessionId: SessionId, room: RoomRecord): void {
    if (!this.config.injectRoomBrief) return
    const agent = this.agents.get(sessionId)
    if (agent === undefined) return
    agent.inject(createUserMessage({
      content: [{ type: 'text', text: this.briefText(room) }],
      source: {
        kind: 'plugin',
        plugin: PLUGIN,
        form: 'notice',
        summary: boundContextSummary(`team room ${room.name}`),
      },
    }))
  }

  /** Build the minimal brief paragraph for one room. */
  briefText(room: RoomRecord): string {
    const others = room.members.filter(member => member.sessionId !== '').length
    return [
      `You are a helpful assistant in team room ${room.name}.`,
      `Room id: ${room.roomId}. Members: ${others} other session(s); each member is an independent session.`,
      'Collaborate with room_post (broadcast or direct a message), room_list_tasks, room_claim_task, room_create_task, room_transfer_task, room_complete_task, and room_list_rooms.',
      'You are notified here when room messages arrive. Keep your room turns brief and prefer your own session for private work.',
    ].join(' ')
  }

  // ── internals ───────────────────────────────────────────────────────────────

  /**
   * Queue one mutation on the single write chain; rejections are contained.
   * The previous tail is captured SYNCHRONOUSLY: reading `this.tail` after
   * `ready` resolves would see the just-assigned tail (a promise that settles
   * with this very result) and deadlock the whole write chain — the exact
   * hang that left `/room create` without a `command/done`.
   */
  private enqueue<T>(job: () => Promise<T>): Promise<T> {
    const previous = this.tail
    const result = this.ready.then(() => previous).then(job)
    this.tail = result.then(() => {}, () => {})
    return result
  }

  /** Serialize work per room (delivery order = bus order). */
  private onRoomChain<T>(roomId: string, job: () => Promise<T>): Promise<T> {
    const previous = this.roomChains.get(roomId) ?? Promise.resolve()
    const result = previous.then(job, job)
    const slot = result.then(() => {}, () => {})
    this.roomChains.set(roomId, slot)
    return result.finally(() => {
      // Reclaim the map slot once this job is the tail (mirrors the start-gate pattern).
      if (this.roomChains.get(roomId) === slot) this.roomChains.delete(roomId)
    })
  }

  /** Serialize delivery per member (live delivery vs catch-up). */
  private onMemberChain<T>(sessionId: SessionId, job: () => Promise<T>): Promise<T> {
    const key = String(sessionId)
    const previous = this.memberChains.get(key) ?? Promise.resolve()
    const result = previous.then(job, job)
    const slot = result.then(() => {}, () => {})
    this.memberChains.set(key, slot)
    return result.finally(() => {
      if (this.memberChains.get(key) === slot) this.memberChains.delete(key)
    })
  }

  /** One task-board mutation shared by claim/assign/complete. */
  private mutateTask(input: {
    readonly roomId: string
    readonly bySessionId: SessionId
    readonly taskId: string
    readonly toSessionId?: SessionId
  }, now: number, operation: 'claim' | 'assign' | 'complete'): Promise<TaskRecord> {
    return this.enqueue(async () => {
      const record = this.requireRoom(input.roomId)
      const byMember = this.memberOf(record, input.bySessionId)
      if (byMember === undefined) {
        throw new RoomError('not-member', `session ${input.bySessionId} is not a member of room ${input.roomId}`)
      }
      const tasks = this.requireTasks()
      const current = tasks.get(appendKey(input.roomId, input.taskId))
      if (current === undefined) {
        throw new RoomError('unknown-task', `room ${input.roomId} has no task ${input.taskId}`)
      }
      if (operation === 'complete' && current.status === 'done') return current
      if (operation === 'complete' && current.assigneeSessionId !== input.bySessionId && byMember.role !== 'owner') {
        throw new RoomError('not-assignee', `task ${input.taskId}: only the assignee or the room owner can complete it`)
      }
      const target = operation === 'assign'
        ? this.memberOf(record, input.toSessionId!)
        : undefined
      if (operation === 'assign' && target === undefined) {
        throw new RoomError('unknown-target', `session ${input.toSessionId} is not a member of room ${input.roomId}`)
      }
      const next: TaskRecord = {
        ...current,
        status: operation === 'complete' ? 'done' : 'in-progress',
        assigneeSessionId: operation === 'assign'
          ? input.toSessionId!
          : operation === 'claim'
            ? input.bySessionId
            : current.assigneeSessionId,
        updatedAt: now,
        ...(operation === 'complete' ? { completedAt: now } : {}),
      }
      await tasks.put(appendKey(input.roomId, input.taskId), next)
      const kind: TimelineKind = operation === 'complete'
        ? 'task-completed'
        : operation === 'assign'
          ? 'task-assigned'
          : 'task-claimed'
      const event = this.timelineEvent(input.roomId, record.timelineNext, kind, now, {
        taskId: input.taskId,
        ...(next.assigneeSessionId === null ? {} : { assigneeSessionId: next.assigneeSessionId }),
        ...(operation === 'assign' ? { bySessionId: input.bySessionId } : {}),
      })
      await this.requireTimeline().put(appendKey(input.roomId, event.seq), event)
      const nextRoom = await this.requireRooms().update(roomKey(input.roomId), room => ({
        ...room, timelineNext: room.timelineNext + 1,
      }))
      const fact = this.taskMutationFact(operation, next, event.seq, input.bySessionId)
      this.broadcastFact(nextRoom, fact)
      await this.advanceFactsForLive(nextRoom, event.seq)
      if (operation === 'assign') {
        // The handoff lands in the new assignee's inbox as a directed message.
        await this.postMessage({
          roomId: input.roomId,
          senderSessionId: input.bySessionId,
          toSessionId: input.toSessionId!,
          text: `Task assigned to you: ${next.title}`,
        }, now)
      }
      return next
    })
  }

  /** Append the room-joined snapshot fact to one session's live log. */
  private appendFactTo(sessionId: SessionId, fact: TeamRoomFact): void {
    const session = this.sessions.get(sessionId)
    if (session === undefined) return
    this.facts.append(session, TEAM_ROOM_FACT, fact)
  }

  /** Append one fact to every LIVE member session (offline members catch up). */
  private broadcastFact(room: RoomRecord, fact: TeamRoomFact): void {
    for (const member of room.members) {
      this.appendFactTo(SessionId(member.sessionId), fact)
    }
  }

  /** Deliver one posted message's fact + model-visible copy, per member. */
  private async deliverPosted(room: RoomRecord, message: BusMessage, event: TimelineEvent): Promise<void> {
    const fact: TeamRoomFact = {
      kind: 'message-posted',
      roomId: message.roomId,
      seq: message.seq,
      timelineSeq: event.seq,
      senderSessionId: message.senderSessionId,
      ...(message.toSessionId === undefined ? {} : { toSessionId: message.toSessionId }),
      text: message.text,
      createdAt: message.createdAt,
    }
    for (const member of room.members) {
      const memberId = SessionId(member.sessionId)
      const isRecipient = message.toSessionId === undefined
        ? member.sessionId !== message.senderSessionId
        : member.sessionId === message.toSessionId
      await this.onMemberChain(memberId, async () => {
        if (this.sessions.get(memberId) !== undefined) {
          this.appendFactTo(memberId, fact)
        }
        if (isRecipient) {
          const agent = this.agents.get(memberId)
          if (agent !== undefined) agent.followup(this.roomUserMessage(room, message))
        }
      })
    }
  }

  /** Advance delivery cursors for the members that just received the post. */
  private async advanceCursors(room: RoomRecord, message: BusMessage, event: TimelineEvent): Promise<void> {
    await this.enqueue(async () => {
      await this.requireRooms().update(roomKey(room.roomId), current => ({
        ...current,
        members: current.members.map(member => {
          const memberId = SessionId(member.sessionId)
          const gotFact = this.sessions.get(memberId) !== undefined
          const gotDelivery = message.toSessionId === undefined
            ? member.sessionId !== message.senderSessionId
            : member.sessionId === message.toSessionId
          const wasLive = this.sessions.get(memberId) !== undefined
          return {
            ...member,
            ...(gotFact ? { lastFactSeq: event.seq } : {}),
            ...(gotDelivery && wasLive ? { lastDeliveredSeq: message.seq } : {}),
          }
        }),
      }))
    })
  }

  /** Advance the fact cursor for every member whose session is live now. */
  private async advanceFactsForLive(room: RoomRecord, timelineSeq: number): Promise<void> {
    await this.enqueue(async () => {
      await this.requireRooms().update(roomKey(room.roomId), current => ({
        ...current,
        members: current.members.map(member =>
          this.sessions.get(SessionId(member.sessionId)) === undefined
            ? member
            : { ...member, lastFactSeq: timelineSeq }),
      }))
    })
  }

  /** One model-visible delivery: a durable user message with a room header. */
  private roomUserMessage(room: RoomRecord, message: BusMessage) {
    const direction = message.toSessionId === undefined ? 'broadcast' : 'to you'
    return createUserMessage({
      content: [{
        type: 'text',
        text: `[team-room ${room.roomId}] ${message.senderSessionId} (${direction}): ${message.text}`,
      }],
      source: {
        kind: 'plugin',
        plugin: PLUGIN,
        form: 'relay',
      },
    })
  }

  /** The room-joined snapshot fact. */
  private joinFact(room: RoomRecord, tasks: TaskRecord[], timeline: TimelineEvent[]): TeamRoomFact {
    return {
      kind: 'room-joined',
      roomId: room.roomId,
      name: room.name,
      createdAt: room.createdAt,
      members: room.members,
      tasks,
      timeline,
    }
  }

  /** Rebuild the fact one timeline event corresponds to (catch-up replay). */
  private factFromTimeline(room: RoomRecord, event: TimelineEvent): TeamRoomFact | undefined {
    const data = event.data
    switch (event.kind) {
      case 'room-created':
        return undefined // the member joined later; the snapshot covers it.
      case 'member-joined':
        return {
          kind: 'member-joined',
          roomId: room.roomId,
          sessionId: String(data.sessionId),
          role: data.role === 'owner' ? 'owner' : 'member',
          joinedAt: Number(event.at),
          timelineSeq: event.seq,
        }
      case 'member-left':
        return {
          kind: 'member-left',
          roomId: room.roomId,
          sessionId: String(data.sessionId),
          timelineSeq: event.seq,
        }
      case 'message-posted':
      case 'message-directed': {
        const message = this.requireBus().get(appendKey(room.roomId, Number(data.seq)))
        if (message === undefined) return undefined
        return {
          kind: 'message-posted',
          roomId: room.roomId,
          seq: message.seq,
          timelineSeq: event.seq,
          senderSessionId: message.senderSessionId,
          ...(message.toSessionId === undefined ? {} : { toSessionId: message.toSessionId }),
          text: message.text,
          createdAt: message.createdAt,
        }
      }
      case 'task-created': {
        const task = this.requireTasks().get(appendKey(room.roomId, String(data.taskId)))
        if (task === undefined) return undefined
        return this.taskCreatedFact(task, event.seq)
      }
      case 'task-claimed': {
        const task = this.requireTasks().get(appendKey(room.roomId, String(data.taskId)))
        if (task === undefined) return undefined
        return {
          kind: 'task-claimed',
          roomId: room.roomId,
          taskId: task.taskId,
          assigneeSessionId: String(data.assigneeSessionId ?? task.assigneeSessionId ?? ''),
          at: event.at,
          timelineSeq: event.seq,
        }
      }
      case 'task-assigned': {
        const task = this.requireTasks().get(appendKey(room.roomId, String(data.taskId)))
        if (task === undefined) return undefined
        return {
          kind: 'task-assigned',
          roomId: room.roomId,
          taskId: task.taskId,
          assigneeSessionId: String(data.assigneeSessionId ?? task.assigneeSessionId ?? ''),
          bySessionId: String(data.bySessionId),
          at: event.at,
          timelineSeq: event.seq,
        }
      }
      case 'task-completed':
        return {
          kind: 'task-completed',
          roomId: room.roomId,
          taskId: String(data.taskId),
          at: event.at,
          timelineSeq: event.seq,
        }
      /* v8 ignore next 2 -- the closed union is total by construction. */
      default:
        return undefined
    }
  }

  private taskCreatedFact(task: TaskRecord, timelineSeq: number): TeamRoomFact {
    return {
      kind: 'task-created',
      roomId: task.roomId,
      taskId: task.taskId,
      title: task.title,
      description: task.description,
      assigneeSessionId: task.assigneeSessionId,
      createdBy: task.createdBy,
      createdAt: task.createdAt,
      timelineSeq,
    }
  }

  private taskMutationFact(
    operation: 'claim' | 'assign' | 'complete',
    task: TaskRecord,
    timelineSeq: number,
    bySessionId: SessionId,
  ): TeamRoomFact {
    if (operation === 'complete') {
      return {
        kind: 'task-completed',
        roomId: task.roomId,
        taskId: task.taskId,
        at: task.updatedAt,
        timelineSeq,
      }
    }
    if (operation === 'assign') {
      return {
        kind: 'task-assigned',
        roomId: task.roomId,
        taskId: task.taskId,
        assigneeSessionId: task.assigneeSessionId!,
        bySessionId,
        at: task.updatedAt,
        timelineSeq,
      }
    }
    return {
      kind: 'task-claimed',
      roomId: task.roomId,
      taskId: task.taskId,
      assigneeSessionId: task.assigneeSessionId!,
      at: task.updatedAt,
      timelineSeq,
    }
  }

  private timelineEvent(roomId: string, seq: number, kind: TimelineKind, at: number, data: Record<string, unknown>): TimelineEvent {
    return { roomId, seq, kind, at, data }
  }

  /** Retention pruning: bus, timeline, and completed tasks. */
  private async pruneRoom(roomId: string, record: RoomRecord): Promise<void> {
    const bus = this.requireBus()
    for (const [key] of bus.entries()) {
      if (!String(key).startsWith(`${roomId}/`)) continue
      if (seqOf(key) <= record.busNext - 1 - this.config.busRetention) await bus.delete(key)
    }
    const timeline = this.requireTimeline()
    for (const [key] of timeline.entries()) {
      if (!String(key).startsWith(`${roomId}/`)) continue
      if (seqOf(key) <= record.timelineNext - 1 - this.config.timelineRetention) await timeline.delete(key)
    }
    const tasks = this.requireTasks()
    const done = (await this.tasksOf(roomId))
      .filter(task => task.status === 'done')
      .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0))
    for (const task of done.slice(this.config.taskRetention)) {
      await tasks.delete(appendKey(roomId, task.taskId))
    }
  }

  /** Delete every bus/task/timeline row of a deleted room. */
  private async purgeRoom(roomId: string): Promise<void> {
    for (const table of [this.requireBus(), this.requireTasks(), this.requireTimeline()]) {
      for (const [key] of table.entries()) {
        if (String(key).startsWith(`${roomId}/`)) await table.delete(key)
      }
    }
  }

  private requireRoom(roomId: string): RoomRecord {
    const record = this.requireRooms().get(roomKey(roomId))
    if (record === undefined) throw new RoomError('unknown-room', `room ${roomId} does not exist`)
    return record
  }

  private requireRooms(): KvTable<RoomKey, RoomRecord> {
    if (this.initError !== undefined) throw this.initError
    if (this.rooms === undefined) throw new Error('room hub is not started yet')
    return this.rooms
  }

  private requireBus(): KvTable<AppendKey, BusMessage> {
    if (this.initError !== undefined) throw this.initError
    if (this.bus === undefined) throw new Error('room hub is not started yet')
    return this.bus
  }

  private requireTasks(): KvTable<AppendKey, TaskRecord> {
    if (this.initError !== undefined) throw this.initError
    if (this.tasks === undefined) throw new Error('room hub is not started yet')
    return this.tasks
  }

  private requireTimeline(): KvTable<AppendKey, TimelineEvent> {
    if (this.initError !== undefined) throw this.initError
    if (this.timeline === undefined) throw new Error('room hub is not started yet')
    return this.timeline
  }
}
