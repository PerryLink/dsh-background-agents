/**
 * The human-facing `/room` command family: create, join, leave, list, send,
 * tasks, and the task board subcommands (add / assign / claim / done). The
 * command executes directly against the receiving session's agent — it never
 * goes through the model — and every write lands on the shared durable room
 * store. Because the human typed the command, command-side handoffs are
 * already user-authorized (the model-facing `room_transfer_task` tool is
 * what routes through the approval seam).
 *
 * @module dsh-background-agents/room/commands
 */

import type { Context } from '@deepseek-ai/cordis'
import type { CommandInvocation, CommandResult } from '@deepseek-ai/dsh-commands'
import { SessionId } from '@deepseek-ai/dsh-session'
import { RoomError, type RoomHub } from './hub.ts'
import type { TaskRecord } from './schema.ts'

const USAGE = 'Usage: /room [create <name>|join <roomId>|leave [roomId]|list|send [roomId] <text>|tasks [roomId]|task add <roomId> <title>|task assign <roomId> <task> <member|me>|task claim <roomId> <task>|task done <roomId> <task>|delete <roomId>]'

/** The parsed subcommand grammar. */
type RoomCommand =
  | { readonly kind: 'overview' }
  | { readonly kind: 'create'; readonly name: string }
  | { readonly kind: 'join'; readonly roomId: string }
  | { readonly kind: 'leave'; readonly roomId?: string }
  | { readonly kind: 'list' }
  | { readonly kind: 'send'; readonly first: string; readonly rest: string }
  | { readonly kind: 'tasks'; readonly roomId?: string }
  | { readonly kind: 'task-add'; readonly roomId: string; readonly title: string }
  | { readonly kind: 'task-assign'; readonly roomId: string; readonly task: string; readonly member: string }
  | { readonly kind: 'task-claim'; readonly roomId: string; readonly task: string }
  | { readonly kind: 'task-done'; readonly roomId: string; readonly task: string }
  | { readonly kind: 'delete'; readonly roomId: string }

/** Resolve `me` and raw session ids to a member session id; `me` = the caller. */
function memberRef(token: string, self: SessionId): SessionId | undefined {
  if (token === 'me') return self
  if (token === '') return undefined
  return SessionId(token)
}

/** Resolve a task ref: the exact task id, or a 1-based index into the board. */
async function resolveTask(hub: RoomHub, roomId: string, ref: string): Promise<TaskRecord> {
  const board = await hub.tasksOf(roomId)
  const byId = board.find(task => task.taskId === ref)
  if (byId !== undefined) return byId
  const index = Number(ref)
  if (!Number.isSafeInteger(index) || index < 1) {
    throw new RoomError('unknown-task', `room ${roomId}: "${ref}" is neither a task id nor a board position`)
  }
  const byIndex = board[index - 1]
  if (byIndex === undefined) {
    throw new RoomError('unknown-task', `room ${roomId}: board position ${index} is out of range (${board.length} tasks)`)
  }
  return byIndex
}

/** Split a line into whitespace-separated tokens (the room grammar is word-based). */
function tokens(raw: string): string[] {
  return raw.trim().split(/\s+/u).filter(token => token !== '')
}

/** Parse the subcommand grammar; unknown shapes answer a usage error. */
function parseRoomCommand(rawInput: string): RoomCommand | { readonly kind: 'usage' } {
  const words = tokens(rawInput)
  if (words.length === 0) return { kind: 'overview' }
  const verb = (words[0] ?? '').toLowerCase()
  switch (verb) {
    case 'create':
      return words.length >= 2
        ? { kind: 'create', name: words.slice(1).join(' ') }
        : { kind: 'usage' }
    case 'join':
      return words.length === 2 ? { kind: 'join', roomId: words[1]! } : { kind: 'usage' }
    case 'leave':
      return { kind: 'leave', ...(words.length === 2 ? { roomId: words[1] } : {}) }
    case 'list':
      return { kind: 'list' }
    case 'send':
      if (words.length < 2) return { kind: 'usage' }
      // The first word doubles as the room id when it resolves to one the
      // caller belongs to; otherwise the whole line is the message text.
      return { kind: 'send', first: words[1]!, rest: words.slice(2).join(' ') }
    case 'tasks':
      return { kind: 'tasks', ...(words.length === 2 ? { roomId: words[1] } : {}) }
    case 'task': {
      const sub = (words[1] ?? '').toLowerCase()
      if (sub === 'add' && words.length >= 4) {
        return { kind: 'task-add', roomId: words[2]!, title: words.slice(3).join(' ') }
      }
      if (sub === 'assign' && words.length === 5) {
        return { kind: 'task-assign', roomId: words[2]!, task: words[3]!, member: words[4]! }
      }
      if (sub === 'claim' && words.length === 4) {
        return { kind: 'task-claim', roomId: words[2]!, task: words[3]! }
      }
      if (sub === 'done' && words.length === 4) {
        return { kind: 'task-done', roomId: words[2]!, task: words[3]! }
      }
      return { kind: 'usage' }
    }
    case 'delete':
      return words.length === 2 ? { kind: 'delete', roomId: words[1]! } : { kind: 'usage' }
    default:
      return { kind: 'usage' }
  }
}

/** Render one room's board. */
async function renderTasks(hub: RoomHub, roomId: string, title: string): Promise<CommandResult> {
  const tasks = await hub.tasksOf(roomId)
  const lines = tasks.map((task, index) =>
    `${index + 1}. ${task.taskId} [${task.status}]${task.assigneeSessionId === null ? '' : ` → ${task.assigneeSessionId}`} — ${task.title}`)
  return {
    kind: 'success',
    text: [title, ...(lines.length === 0 ? ['(no tasks on the board)'] : lines)].join('\n'),
  }
}

/** Render the caller's membership overview. */
async function renderOverview(hub: RoomHub, sessionId: SessionId): Promise<CommandResult> {
  const rooms = await hub.roomsOfMember(sessionId)
  return {
    kind: 'success',
    text: [
      ...(rooms.length === 0
        ? ['You are not a member of any team room.', '']
        : rooms.map(room =>
          `${room.roomId} "${room.name}" — ${room.members.length} members (you: ${room.members.find(member => member.sessionId === sessionId)?.role ?? 'member'})`)),
      USAGE,
    ].join('\n'),
  }
}

/** Resolve the target room: explicit id, or the caller's single membership. */
async function resolveRoom(hub: RoomHub, sessionId: SessionId, roomId?: string): Promise<string> {
  if (roomId !== undefined && roomId !== '') return roomId
  const rooms = await hub.roomsOfMember(sessionId)
  if (rooms.length === 1) return rooms[0]!.roomId
  throw new RoomError(
    'ambiguous-room',
    `this session belongs to ${rooms.length} rooms; name the room id (${rooms.map(room => room.roomId).join(', ')})`,
  )
}

/** Execute one parsed command against the durable room store. */
async function executeRoomCommand(hub: RoomHub, sessionId: SessionId, command: RoomCommand): Promise<CommandResult> {
  switch (command.kind) {
    case 'overview':
      return await renderOverview(hub, sessionId)
    case 'create': {
      const room = await hub.createRoom(sessionId, command.name)
      return {
        kind: 'success',
        text: `Room created: ${room.roomId} "${room.name}" — you are the owner. Share the room id so other sessions can /room join ${room.roomId}.`,
      }
    }
    case 'join': {
      const room = await hub.joinRoom(sessionId, command.roomId)
      return {
        kind: 'success',
        text: `Joined room ${room.roomId} "${room.name}" (${room.members.length} members). /room send <text> posts to the room.`,
      }
    }
    case 'leave': {
      const roomId = await resolveRoom(hub, sessionId, command.roomId)
      const room = await hub.leaveRoom(sessionId, roomId)
      return {
        kind: 'success',
        text: room === undefined ? `Left room ${roomId}; the last member leaving deleted the room.` : `Left room ${roomId}.`,
      }
    }
    case 'list':
      return await renderOverview(hub, sessionId)
    case 'send': {
      // `/room send <roomId> <text>` when the first word names a room the
      // caller belongs to; `/room send <text>` otherwise (single-room
      // membership resolves the target implicitly).
      const targeted = command.rest !== ''
        && (await hub.room(command.first))?.members.some(member => member.sessionId === sessionId) === true
      const roomId = targeted ? command.first : await resolveRoom(hub, sessionId)
      const text = targeted ? command.rest : `${command.first}${command.rest === '' ? '' : ` ${command.rest}`}`
      const posted = await hub.postMessage({
        roomId,
        senderSessionId: sessionId,
        text,
      })
      return { kind: 'success', text: `Sent to room ${roomId} (seq ${posted.seq}).` }
    }
    case 'tasks': {
      const roomId = await resolveRoom(hub, sessionId, command.roomId)
      return await renderTasks(hub, roomId, `Tasks of room ${roomId}:`)
    }
    case 'task-add': {
      const task = await hub.createTask({
        roomId: command.roomId,
        bySessionId: sessionId,
        title: command.title,
      })
      return {
        kind: 'success',
        text: `Task created: ${task.taskId} [todo] — ${task.title} (/room task claim ${command.roomId} ${task.taskId})`,
      }
    }
    case 'task-assign': {
      const target = memberRef(command.member, sessionId)
      if (target === undefined) return { kind: 'error', text: 'assignee must be "me" or a member session id' }
      const task = await hub.assignTask({
        roomId: command.roomId,
        bySessionId: sessionId,
        taskId: (await resolveTask(hub, command.roomId, command.task)).taskId,
        toSessionId: target,
      })
      return {
        kind: 'success',
        text: `Task ${task.taskId} handed to ${target} (in-progress). The assignee was notified.`,
      }
    }
    case 'task-claim': {
      const task = await hub.claimTask({
        roomId: command.roomId,
        bySessionId: sessionId,
        taskId: (await resolveTask(hub, command.roomId, command.task)).taskId,
      })
      return {
        kind: 'success',
        text: `Claimed task ${task.taskId} [in-progress] — ${task.title} (assignee: you).`,
      }
    }
    case 'task-done': {
      const task = await hub.completeTask({
        roomId: command.roomId,
        bySessionId: sessionId,
        taskId: (await resolveTask(hub, command.roomId, command.task)).taskId,
      })
      return { kind: 'success', text: `Task ${task.taskId} completed [done] — ${task.title}.` }
    }
    case 'delete': {
      await hub.deleteRoom(sessionId, command.roomId)
      return { kind: 'success', text: `Room ${command.roomId} deleted.` }
    }
    /* v8 ignore next 2 -- the closed union is total by construction. */
    default:
      return { kind: 'error', text: USAGE }
  }
}

/**
 * Register the `/room` command when the harness composes the command
 * registry. The handler runs outside any model turn, so it performs the
 * mutations directly (the typing user is the authorizer). The command surface
 * is optional: without it the room_* tools still work from the model side.
 * @returns the exact command disposer, or undefined when no command registry
 *   is composed.
 */
export function registerRoomCommand(ctx: Context, hub: RoomHub): (() => void) | undefined {
  const commands = ctx.get('commands')
  if (commands === undefined) return undefined
  return commands.register({
    name: 'room',
    description: 'manage team rooms: create, join, list, send messages, and work the shared task board',
    input: { hint: '[create <name>|join <roomId>|leave|list|send <text>|tasks|task add|assign|claim|done|delete]' },
    handler: async (invocation: CommandInvocation): Promise<CommandResult> => {
      const sessionId = invocation.agent.id
      const command = parseRoomCommand(invocation.rawInput)
      if (command.kind === 'usage') return { kind: 'error', text: USAGE }
      try {
        return await executeRoomCommand(hub, sessionId, command)
      } catch (error) {
        if (error instanceof RoomError) {
          return { kind: 'error', text: `${error.code}: ${error.message}` }
        }
        throw error
      }
    },
  })
}
