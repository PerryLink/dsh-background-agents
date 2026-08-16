/**
 * The eight room tools the model calls inside a member session:
 * `room_list_rooms`, `room_post`, `room_read`, `room_list_tasks`,
 * `room_create_task`, `room_claim_task`, `room_transfer_task`,
 * `room_complete_task`. Every tool authorizes against the calling session's
 * membership; the cross-member handoff (`room_transfer_task`) routes through
 * the official approval seam and fails closed when no answerer grants it.
 *
 * @module dsh-background-agents/room/tools
 */

import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'
import type { Agent } from '@deepseek-ai/dsh-agent'
import type { CallId } from '@deepseek-ai/dsh-llm'
import { SessionId } from '@deepseek-ai/dsh-session'
import { RoomError, type RoomHub } from './hub.ts'
import { PLUGIN } from '../vocabulary.ts'

/** The approval seam face the tools ask through (optional in the composition). */
export interface ApprovalLike {
  request(req: {
    readonly agent: Agent
    readonly toolName: string
    readonly callId?: CallId
    readonly reason?: string
    readonly signal?: AbortSignal
  }): Promise<'allowed-once' | 'rejected' | 'cancelled' | 'unavailable'>
}

/** Resolve the optional approval service; fail closed when absent. */
function approvalOf(ctx: Context): ApprovalLike | undefined {
  return ctx.get('approval')
}

/**
 * Ask the approval seam for one sensitive room operation. A missing service,
 * a missing answerer, a rejection, or an abort all fail closed with the same
 * stable error, so the caller never guesses an outcome.
 */
async function requireApproval(
  approval: ApprovalLike | undefined,
  req: {
    readonly agent: Agent
    readonly toolName: string
    readonly callId?: CallId
    readonly reason: string
    readonly signal?: AbortSignal
  },
): Promise<void> {
  if (approval === undefined) {
    throw new RoomError(
      'approval-unavailable',
      'room operation requires approval but no approval service is composed — failing closed',
    )
  }
  const outcome = await approval.request(req)
  if (outcome !== 'allowed-once') {
    throw new RoomError(
      'approval-denied',
      `room operation not approved (outcome: ${outcome}); nothing changed`,
    )
  }
}

/** One room row as `room_list_rooms` serves it. */
interface RoomListRow {
  readonly roomId: string
  readonly name: string
  readonly createdAt: number
  readonly memberCount: number
  readonly openTasks: number
  readonly inProgressTasks: number
  readonly doneTasks: number
  readonly members: Array<{ readonly sessionId: string; readonly role: 'owner' | 'member' }>
  readonly myRole: 'owner' | 'member'
}

/** Build one room-list row from the durable record. */
async function roomRow(hub: RoomHub, sessionId: SessionId, roomId: string, name: string, createdAt: number): Promise<RoomListRow | undefined> {
  const room = await hub.room(roomId)
  if (room === undefined) return undefined
  const tasks = await hub.tasksOf(roomId)
  const member = room.members.find(candidate => candidate.sessionId === sessionId)
  if (member === undefined) return undefined
  return {
    roomId,
    name,
    createdAt,
    memberCount: room.members.length,
    openTasks: tasks.filter(task => task.status === 'todo').length,
    inProgressTasks: tasks.filter(task => task.status === 'in-progress').length,
    doneTasks: tasks.filter(task => task.status === 'done').length,
    members: room.members.map(candidate => ({ sessionId: candidate.sessionId, role: candidate.role })),
    myRole: member.role,
  }
}

/**
 * Register the eight room tools.
 * @param ctx - context carrying tools and the optional approval service.
 * @param hub - the room service owning the durable state.
 */
export function registerRoomTools(ctx: Context, hub: RoomHub): void {
  ctx.tools.register(defineTool({
    name: 'room_list_rooms',
    description:
      'List every team room this session belongs to: room ids, names, member rosters (each member is an '
      + 'independent session), and task-board counts. Rooms persist across DSH restarts and sessions. Use the '
      + 'returned room_id with the other room_* tools.',
    parameters: {},
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          rooms: {
            type: 'array',
            required: true,
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                roomId: { type: 'string', required: true },
                name: { type: 'string', required: true },
                createdAt: { type: 'number', required: true },
                memberCount: { type: 'number', required: true },
                openTasks: { type: 'number', required: true },
                inProgressTasks: { type: 'number', required: true },
                doneTasks: { type: 'number', required: true },
                members: {
                  type: 'array',
                  required: true,
                  items: {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                      sessionId: { type: 'string', required: true },
                      role: { type: 'string', required: true, enum: ['owner', 'member'] },
                    },
                  },
                },
                myRole: { type: 'string', required: true, enum: ['owner', 'member'] },
              },
            },
          },
        },
      },
      render: (_args, value) => [{
        type: 'text',
        text: value.rooms.length === 0
          ? '(this session is not a member of any team room)'
          : value.rooms.map((room: RoomListRow) =>
            `${room.roomId} "${room.name}" — ${room.memberCount} members, ${room.openTasks} open / ${room.inProgressTasks} in-progress / ${room.doneTasks} done (you: ${room.myRole})`)
            .join('\n'),
      }],
    },
    isConcurrencySafe: () => true,
    async execute(_args, exec) {
      const agent = exec.agent
      if (!agent) throw new Error('room_list_rooms requires a calling agent (exec.agent was undefined)')
      const rooms = await hub.roomsOfMember(agent.id)
      const rows: RoomListRow[] = []
      for (const room of rooms) {
        const row = await roomRow(hub, agent.id, room.roomId, room.name, room.createdAt)
        if (row !== undefined) rows.push(row)
      }
      return { rooms: rows }
    },
  }))

  ctx.tools.register(defineTool({
    name: 'room_post',
    description:
      'Post one message onto a team room\'s message bus. Without `to`, the message broadcasts to every member '
      + '(except you — your own turn already records it); with `to`, it is a directed message delivered only to '
      + 'that member session. Live members are woken with the message as their next turn; offline members receive '
      + 'it when their session next starts. Every message is durable: it lands on the shared room timeline and in '
      + 'each recipient\'s session log.',
    parameters: {
      room_id: {
        type: 'string',
        required: true,
        description: 'The room id from room_list_rooms.',
      },
      text: {
        type: 'string',
        required: true,
        description: 'The message text (bounded by maxMessageChars).',
      },
      to: {
        type: 'string',
        description:
          'Optional member session id for a directed message; omit to broadcast to every member.',
      },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          roomId: { type: 'string', required: true },
          seq: { type: 'number', required: true },
        },
      },
      render: (args, value) => [{
        type: 'text',
        text: args.to === undefined
          ? `posted to room ${value.roomId} (broadcast, seq ${value.seq})`
          : `posted to room ${value.roomId} for ${args.to} (directed, seq ${value.seq})`,
      }],
      presentationMeta: (_args, value) => ({
        plugin: PLUGIN,
        action: 'room-message',
        roomId: value.roomId,
        seq: value.seq,
      }),
    },
    isConcurrencySafe: () => true,
    async execute(args, exec) {
      const agent = exec.agent
      if (!agent) throw new Error('room_post requires a calling agent (exec.agent was undefined)')
      const posted = await hub.postMessage({
        roomId: String(args.room_id),
        senderSessionId: agent.id,
        text: String(args.text),
        ...(args.to === undefined ? {} : { toSessionId: SessionId(String(args.to)) }),
      })
      return { roomId: posted.roomId, seq: posted.seq }
    },
  }))

  ctx.tools.register(defineTool({
    name: 'room_read',
    description:
      'Read the message-bus history of one team room (seq > since, in order). Use it to catch up on a room '
      + 'conversation, e.g. right after joining, or to review what other members posted while you were busy.',
    parameters: {
      room_id: {
        type: 'string',
        required: true,
        description: 'The room id from room_list_rooms.',
      },
      since: {
        type: 'number',
        description: 'Only messages with seq > since. Defaults to 0 (the whole retained window).',
      },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          messages: {
            type: 'array',
            required: true,
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                seq: { type: 'number', required: true },
                senderSessionId: { type: 'string', required: true },
                toSessionId: { type: 'string' },
                text: { type: 'string', required: true },
                createdAt: { type: 'number', required: true },
              },
            },
          },
        },
      },
      render: (_args, value) => [{
        type: 'text',
        text: value.messages.length === 0
          ? '(no room messages in the retained window)'
          : value.messages.map((message: { seq: number; senderSessionId: string; toSessionId?: string; text: string }) =>
            `#${message.seq} ${message.senderSessionId}${message.toSessionId === undefined ? '' : ` → ${message.toSessionId}`}: ${message.text}`)
            .join('\n'),
      }],
    },
    isConcurrencySafe: () => true,
    async execute(args, exec) {
      const agent = exec.agent
      if (!agent) throw new Error('room_read requires a calling agent (exec.agent was undefined)')
      const roomId = String(args.room_id)
      if ((await hub.room(roomId))?.members.some(member => member.sessionId === agent.id) !== true) {
        throw new RoomError('not-member', `this session is not a member of room ${roomId}`)
      }
      const since = typeof args.since === 'number' && Number.isSafeInteger(args.since) && args.since >= 0
        ? args.since
        : 0
      return {
        messages: (await hub.busMessages(roomId, since)).map(message => ({
          seq: message.seq,
          senderSessionId: message.senderSessionId,
          ...(message.toSessionId === undefined ? {} : { toSessionId: message.toSessionId }),
          text: message.text,
          createdAt: message.createdAt,
        })),
      }
    },
  }))

  ctx.tools.register(defineTool({
    name: 'room_list_tasks',
    description:
      'List one team room\'s shared task board: every task with its status (todo / in-progress / done), '
      + 'assignee session id, and timestamps. The board is shared and durable — any member may claim an '
      + 'unassigned task with room_claim_task.',
    parameters: {
      room_id: {
        type: 'string',
        required: true,
        description: 'The room id from room_list_rooms.',
      },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          tasks: {
            type: 'array',
            required: true,
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                taskId: { type: 'string', required: true },
                title: { type: 'string', required: true },
                description: { type: 'string', required: true },
                status: { type: 'string', required: true, enum: ['todo', 'in-progress', 'done'] },
                assigneeSessionId: { type: 'string' },
                createdBy: { type: 'string', required: true },
                createdAt: { type: 'number', required: true },
                updatedAt: { type: 'number', required: true },
              },
            },
          },
        },
      },
      render: (_args, value) => [{
        type: 'text',
        text: value.tasks.length === 0
          ? '(no tasks on the board)'
          : value.tasks.map((task: { taskId: string; title: string; status: string; assigneeSessionId?: string }) =>
            `${task.taskId} [${task.status}]${task.assigneeSessionId === undefined ? '' : ` → ${task.assigneeSessionId}`} — ${task.title}`)
            .join('\n'),
      }],
    },
    isConcurrencySafe: () => true,
    async execute(args, exec) {
      const agent = exec.agent
      if (!agent) throw new Error('room_list_tasks requires a calling agent (exec.agent was undefined)')
      const roomId = String(args.room_id)
      if ((await hub.room(roomId))?.members.some(member => member.sessionId === agent.id) !== true) {
        throw new RoomError('not-member', `this session is not a member of room ${roomId}`)
      }
      return {
        tasks: (await hub.tasksOf(roomId)).map(task => ({
          taskId: task.taskId,
          title: task.title,
          description: task.description,
          status: task.status,
          ...(task.assigneeSessionId === null ? {} : { assigneeSessionId: task.assigneeSessionId }),
          createdBy: task.createdBy,
          createdAt: task.createdAt,
          updatedAt: task.updatedAt,
        })),
      }
    },
  }))

  ctx.tools.register(defineTool({
    name: 'room_create_task',
    description:
      'Create one task on a team room\'s shared board. Leave `assignee` empty for an unassigned task any '
      + 'member can claim, or name a member session id to assign it directly. The task is durable and every '
      + 'member sees it on the board and the timeline.',
    parameters: {
      room_id: {
        type: 'string',
        required: true,
        description: 'The room id from room_list_rooms.',
      },
      title: {
        type: 'string',
        required: true,
        description: 'Short task title (the board row).',
      },
      description: {
        type: 'string',
        description: 'Optional task details.',
      },
      assignee: {
        type: 'string',
        description: 'Optional member session id to assign the task to; omit to leave it unassigned.',
      },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          taskId: { type: 'string', required: true },
          status: { type: 'string', required: true, const: 'todo' },
        },
      },
      render: (args, value) => [{
        type: 'text',
        text: `task ${value.taskId} created on room ${args.room_id}${args.assignee === undefined ? '' : ` for ${args.assignee}`}`,
      }],
      presentationMeta: (args, value) => ({
        plugin: PLUGIN,
        action: 'room-task-created',
        roomId: String(args.room_id),
        taskId: value.taskId,
      }),
    },
    isConcurrencySafe: () => true,
    async execute(args, exec) {
      const agent = exec.agent
      if (!agent) throw new Error('room_create_task requires a calling agent (exec.agent was undefined)')
      const task = await hub.createTask({
        roomId: String(args.room_id),
        bySessionId: agent.id,
        title: String(args.title),
        ...(args.description === undefined ? {} : { description: String(args.description) }),
        ...(args.assignee === undefined ? {} : { assigneeSessionId: SessionId(String(args.assignee)) }),
      })
      return { taskId: task.taskId, status: 'todo' as const }
    },
  }))

  ctx.tools.register(defineTool({
    name: 'room_claim_task',
    description:
      'Claim one unassigned task on a team room\'s board for this session: it becomes in-progress with you as '
      + 'the assignee. Every member sees the claim on the timeline. Only the assignee (or the room owner) may '
      + 'later complete it; hand it to another member with room_transfer_task.',
    parameters: {
      room_id: {
        type: 'string',
        required: true,
        description: 'The room id from room_list_rooms.',
      },
      task_id: {
        type: 'string',
        required: true,
        description: 'The task id from room_list_tasks.',
      },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          taskId: { type: 'string', required: true },
          status: { type: 'string', required: true, const: 'in-progress' },
          assigneeSessionId: { type: 'string', required: true },
        },
      },
      render: (args, value) => [{
        type: 'text',
        text: `claimed task ${value.taskId} on room ${args.room_id} (in-progress, assignee ${value.assigneeSessionId})`,
      }],
      presentationMeta: (args, value) => ({
        plugin: PLUGIN,
        action: 'room-task-claimed',
        roomId: String(args.room_id),
        taskId: value.taskId,
      }),
    },
    isConcurrencySafe: () => true,
    async execute(args, exec) {
      const agent = exec.agent
      if (!agent) throw new Error('room_claim_task requires a calling agent (exec.agent was undefined)')
      const task = await hub.claimTask({
        roomId: String(args.room_id),
        bySessionId: agent.id,
        taskId: String(args.task_id),
      })
      return { taskId: task.taskId, status: 'in-progress' as const, assigneeSessionId: task.assigneeSessionId! }
    },
  }))

  ctx.tools.register(defineTool({
    name: 'room_transfer_task',
    description:
      'Hand one task to another member session. This is a cross-member handoff, so it goes through the '
      + 'approval flow: the request fails closed unless the user approves it. On approval, the task becomes '
      + 'in-progress under the new assignee, the handoff lands on the timeline, and the receiving member is '
      + 'woken with a directed message.',
    parameters: {
      room_id: {
        type: 'string',
        required: true,
        description: 'The room id from room_list_rooms.',
      },
      task_id: {
        type: 'string',
        required: true,
        description: 'The task id from room_list_tasks.',
      },
      to: {
        type: 'string',
        required: true,
        description: 'The member session id that receives the task.',
      },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          taskId: { type: 'string', required: true },
          assigneeSessionId: { type: 'string', required: true },
          approved: { type: 'boolean', required: true, const: true },
        },
      },
      render: (_args, value) => [{
        type: 'text',
        text: `task ${value.taskId} handed to ${value.assigneeSessionId} (approved)`,
      }],
      presentationMeta: (_args, value) => ({
        plugin: PLUGIN,
        action: 'room-task-assigned',
        roomId: String(_args.room_id),
        taskId: value.taskId,
      }),
    },
    isConcurrencySafe: () => true,
    async execute(args, exec) {
      const agent = exec.agent
      if (!agent) throw new Error('room_transfer_task requires a calling agent (exec.agent was undefined)')
      const approval = approvalOf(ctx)
      await requireApproval(approval, {
        agent,
        toolName: 'room_transfer_task',
        ...(exec.callId === undefined ? {} : { callId: exec.callId }),
        reason: `hand task ${String(args.task_id)} in room ${String(args.room_id)} to member ${String(args.to)}`,
        signal: exec.signal,
      })
      const task = await hub.assignTask({
        roomId: String(args.room_id),
        bySessionId: agent.id,
        taskId: String(args.task_id),
        toSessionId: SessionId(String(args.to)),
      })
      return { taskId: task.taskId, assigneeSessionId: task.assigneeSessionId!, approved: true }
    },
  }))

  ctx.tools.register(defineTool({
    name: 'room_complete_task',
    description:
      'Mark one task done. Only the task\'s assignee or the room owner may complete it; every member sees the '
      + 'completion on the timeline.',
    parameters: {
      room_id: {
        type: 'string',
        required: true,
        description: 'The room id from room_list_rooms.',
      },
      task_id: {
        type: 'string',
        required: true,
        description: 'The task id from room_list_tasks.',
      },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          taskId: { type: 'string', required: true },
          status: { type: 'string', required: true, const: 'done' },
        },
      },
      render: (args, value) => [{
        type: 'text',
        text: `task ${value.taskId} completed on room ${args.room_id}`,
      }],
      presentationMeta: (args, value) => ({
        plugin: PLUGIN,
        action: 'room-task-completed',
        roomId: String(args.room_id),
        taskId: value.taskId,
      }),
    },
    isConcurrencySafe: () => true,
    async execute(args, exec) {
      const agent = exec.agent
      if (!agent) throw new Error('room_complete_task requires a calling agent (exec.agent was undefined)')
      const task = await hub.completeTask({
        roomId: String(args.room_id),
        bySessionId: agent.id,
        taskId: String(args.task_id),
      })
      return { taskId: task.taskId, status: 'done' as const }
    },
  }))
}
