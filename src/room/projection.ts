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

import type { ProjectionDefinition } from '@deepseek-ai/dsh-session-projection'
import type { SessionEvent } from '@deepseek-ai/dsh-session'
import {
  teamRoomViewSchema, type RoomView, type TeamRoomView,
  type TaskRecord, type TimelineEvent,
} from './schema.ts'
import { TEAM_ROOM_FACT } from './events.ts'

/** Hard fold bound: timeline entries kept per room in the projection value. */
const TIMELINE_FOLD_BOUND = 1000
/** Hard fold bound: `done` tasks kept per room in the projection value. */
const DONE_TASK_FOLD_BOUND = 100

/** Mutable fold state; plain JSON so the persisted projection cache can store it. */
interface State {
  rooms: RoomView[]
}

/** Upsert one room view without mutating the incoming state. */
function withRoom(state: State, roomId: string, patch: (room: RoomView) => RoomView): State {
  const found = state.rooms.some(room => room.roomId === roomId)
  if (!found) return state
  return {
    rooms: state.rooms.map(room => (room.roomId === roomId ? patch(room) : room)),
  }
}

/** Append one timeline entry (dedupe by seq) and drop the oldest past the bound. */
function appendTimeline(timeline: TimelineEvent[], event: TimelineEvent): TimelineEvent[] {
  if (timeline.some(existing => existing.seq === event.seq)) return timeline
  return [...timeline, event]
    .sort((a, b) => a.seq - b.seq)
    .slice(-TIMELINE_FOLD_BOUND)
}

/** Upsert one task row (status/assignee deltas merge over the present row). */
function patchTask(
  room: RoomView,
  taskId: string,
  patch: (task: RoomView['tasks'][number]) => RoomView['tasks'][number],
): RoomView {
  const found = room.tasks.some(task => task.taskId === taskId)
  if (!found) return room
  return {
    ...room,
    tasks: room.tasks.map(task => (task.taskId === taskId ? patch(task) : task)),
  }
}

/**
 * Fold one `team-room/fact` into the per-session state.
 * @param state - the prior fold state.
 * @param event - the fact event (already typed by the discriminator).
 * @returns the next state; same reference when the event changes nothing.
 */
function applyFact(state: State, event: SessionEvent<typeof TEAM_ROOM_FACT>): State {
  const fact = event.data
  switch (fact.kind) {
    case 'room-joined': {
      if (state.rooms.some(room => room.roomId === fact.roomId)) return state
      const room: RoomView = {
        roomId: fact.roomId,
        name: fact.name,
        createdAt: fact.createdAt,
        members: fact.members.map(member => ({
          sessionId: member.sessionId,
          role: member.role,
          joinedAt: member.joinedAt,
        })),
        tasks: fact.tasks.map(task => ({
          taskId: task.taskId,
          title: task.title,
          description: task.description,
          status: task.status,
          assigneeSessionId: task.assigneeSessionId,
          createdBy: task.createdBy,
          createdAt: task.createdAt,
          updatedAt: task.updatedAt,
        })),
        timeline: [...fact.timeline].sort((a, b) => a.seq - b.seq).slice(-TIMELINE_FOLD_BOUND),
      }
      return { rooms: [...state.rooms, room] }
    }
    case 'member-joined':
      return withRoom(state, fact.roomId, room => {
        if (room.members.some(member => member.sessionId === fact.sessionId)) return room
        return {
          ...room,
          members: [...room.members, {
            sessionId: fact.sessionId,
            role: fact.role,
            joinedAt: fact.joinedAt,
          }],
          timeline: appendTimeline(room.timeline, {
            roomId: fact.roomId,
            seq: fact.timelineSeq,
            kind: 'member-joined',
            at: event.time,
            data: { sessionId: fact.sessionId, role: fact.role },
          }),
        }
      })
    case 'member-left':
      return withRoom(state, fact.roomId, room => ({
        ...room,
        members: room.members.filter(member => member.sessionId !== fact.sessionId),
        timeline: appendTimeline(room.timeline, {
          roomId: fact.roomId,
          seq: fact.timelineSeq,
          kind: 'member-left',
          at: event.time,
          data: { sessionId: fact.sessionId },
        }),
      }))
    case 'message-posted':
      return withRoom(state, fact.roomId, room => ({
        ...room,
        timeline: appendTimeline(room.timeline, {
          roomId: fact.roomId,
          seq: fact.timelineSeq,
          kind: fact.toSessionId === undefined ? 'message-posted' : 'message-directed',
          at: event.time,
          data: {
            seq: fact.seq,
            senderSessionId: fact.senderSessionId,
            ...(fact.toSessionId === undefined ? {} : { toSessionId: fact.toSessionId }),
            text: fact.text,
          },
        }),
      }))
    case 'task-created': {
      if (!state.rooms.some(room => room.roomId === fact.roomId)) return state
      return withRoom(state, fact.roomId, room => {
        if (room.tasks.some(task => task.taskId === fact.taskId)) return room
        const task: TaskRecord = {
          roomId: fact.roomId,
          taskId: fact.taskId,
          title: fact.title,
          description: fact.description,
          status: 'todo',
          assigneeSessionId: fact.assigneeSessionId,
          createdBy: fact.createdBy,
          createdAt: fact.createdAt,
          updatedAt: fact.createdAt,
        }
        return {
          ...room,
          tasks: [...room.tasks, task],
          timeline: appendTimeline(room.timeline, {
            roomId: fact.roomId,
            seq: fact.timelineSeq,
            kind: 'task-created',
            at: event.time,
            data: { taskId: fact.taskId, title: fact.title },
          }),
        }
      })
    }
    case 'task-claimed':
      return withRoom(state, fact.roomId, room => ({
        ...patchTask(room, fact.taskId, task => ({
          ...task,
          status: 'in-progress',
          assigneeSessionId: fact.assigneeSessionId,
          updatedAt: fact.at,
        })),
        timeline: appendTimeline(room.timeline, {
          roomId: fact.roomId,
          seq: fact.timelineSeq,
          kind: 'task-claimed',
          at: event.time,
          data: { taskId: fact.taskId, assigneeSessionId: fact.assigneeSessionId },
        }),
      }))
    case 'task-assigned':
      return withRoom(state, fact.roomId, room => ({
        ...patchTask(room, fact.taskId, task => ({
          ...task,
          status: 'in-progress',
          assigneeSessionId: fact.assigneeSessionId,
          updatedAt: fact.at,
        })),
        timeline: appendTimeline(room.timeline, {
          roomId: fact.roomId,
          seq: fact.timelineSeq,
          kind: 'task-assigned',
          at: event.time,
          data: { taskId: fact.taskId, assigneeSessionId: fact.assigneeSessionId, bySessionId: fact.bySessionId },
        }),
      }))
    case 'task-completed': {
      if (!state.rooms.some(room => room.roomId === fact.roomId)) return state
      return withRoom(state, fact.roomId, room => ({
        ...patchTask(room, fact.taskId, task => ({
          ...task,
          status: 'done',
          updatedAt: fact.at,
        })),
        timeline: appendTimeline(room.timeline, {
          roomId: fact.roomId,
          seq: fact.timelineSeq,
          kind: 'task-completed',
          at: event.time,
          data: { taskId: fact.taskId },
        }),
      }))
    }
    /* v8 ignore next 2 -- the closed union is total by construction. */
    default:
      return state
  }
}

/** Cap the done-task backlog per room, newest first. */
function capDoneTasks(room: RoomView): RoomView {
  const done = room.tasks.filter(task => task.status === 'done')
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, DONE_TASK_FOLD_BOUND)
  if (done.length === room.tasks.filter(task => task.status === 'done').length) return room
  const kept = new Set(done.map(task => task.taskId))
  return {
    ...room,
    tasks: room.tasks.filter(task => task.status !== 'done' || kept.has(task.taskId)),
  }
}

/** The registered projection unit. */
export const teamRoomProjectionDefinition = {
  key: 'teamRoom',
  // The fold state and the wire value share one shape (`{ rooms: RoomView[] }`);
  // only the done-task backlog differs (the state keeps every row, the view caps it).
  stateSchema: teamRoomViewSchema,
  init: (): State => ({ rooms: [] }),
  apply(state: State, event: SessionEvent): State {
    if (event.type !== TEAM_ROOM_FACT) return state
    return applyFact(state, event as SessionEvent<typeof TEAM_ROOM_FACT>)
  },
  wire: {
    viewSchema: teamRoomViewSchema,
    view: (state): TeamRoomView => ({
      rooms: state.rooms.map(capDoneTasks),
    }),
  },
  stateVersion: 1,
} satisfies ProjectionDefinition<'teamRoom', State>

declare module '@deepseek-ai/dsh-session-projection/types' {
  interface SessionProjectionStateMap {
    /** Host fold state for the team-room views. */
    teamRoom: State
  }
  interface SessionProjectionMap {
    /** Team-room views folded from one member session's room facts. */
    teamRoom: TeamRoomView
  }
}
