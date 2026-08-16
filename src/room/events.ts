/**
 * The room-owned durable fact event: `team-room/fact`, appended to every
 * MEMBER session log as a log-only record stamped with the envelope's
 * `ignorable: true` marker (the same discipline as the background-agents
 * fact channel). Two invariants hold:
 *
 * - model-visible ⟺ recorded: the messages the member's model sees are
 *   delivered through the official inbox (`agent.followup`/`agent.inject`,
 *   durable `user/message` events), while the shared timeline rides these
 *   log-only facts — the room store (`team_rooms` domain) stays the
 *   cross-session authority;
 * - catch-up completeness: members offline while a fact landed receive every
 *   missed fact (and bus message) in store order on their next activation, so
 *   the `teamRoom` projection always reconstructs the shared view from the
 *   member's own log.
 *
 * Every timeline-bearing fact carries the canonical store `timelineSeq`, so
 * the folded view orders exactly like the room store.
 *
 * @module dsh-background-agents/room/events
 */

import type { RoomMember, TaskRecord, TimelineEvent } from './schema.ts'

/** The log-only fact event type this plugin appends to member sessions. */
export const TEAM_ROOM_FACT = 'team-room/fact' as const

/** One structured room fact, discriminated on `kind`. */
export type TeamRoomFact =
  | {
    /**
     * This session became a member (create or join). Carries the full
     * snapshot — room identity, member list, open tasks, and the retained
     * timeline — so a cold member log reconstructs the shared view without
     * reading the room store.
     */
    readonly kind: 'room-joined'
    readonly roomId: string
    readonly name: string
    readonly createdAt: number
    readonly members: RoomMember[]
    readonly tasks: TaskRecord[]
    readonly timeline: TimelineEvent[]
  }
  | {
    /** Another session joined the room. */
    readonly kind: 'member-joined'
    readonly roomId: string
    readonly sessionId: string
    readonly role: RoomMember['role']
    readonly joinedAt: number
    readonly timelineSeq: number
  }
  | {
    /** A member left (or the room was deleted). */
    readonly kind: 'member-left'
    readonly roomId: string
    readonly sessionId: string
    readonly timelineSeq: number
  }
  | {
    /** One bus message; `toSessionId` marks a directed delivery. */
    readonly kind: 'message-posted'
    readonly roomId: string
    readonly seq: number
    readonly timelineSeq: number
    readonly senderSessionId: string
    readonly toSessionId?: string
    readonly text: string
    readonly createdAt: number
  }
  | {
    /** A new task entered the board. */
    readonly kind: 'task-created'
    readonly roomId: string
    readonly taskId: string
    readonly title: string
    readonly description: string
    readonly assigneeSessionId: string | null
    readonly createdBy: string
    readonly createdAt: number
    readonly timelineSeq: number
  }
  | {
    /** A member claimed a task (assignee + in-progress). */
    readonly kind: 'task-claimed'
    readonly roomId: string
    readonly taskId: string
    readonly assigneeSessionId: string
    readonly at: number
    readonly timelineSeq: number
  }
  | {
    /** The owner handed a task to another member. */
    readonly kind: 'task-assigned'
    readonly roomId: string
    readonly taskId: string
    readonly assigneeSessionId: string
    readonly bySessionId: string
    readonly at: number
    readonly timelineSeq: number
  }
  | {
    /** A task reached `done`. */
    readonly kind: 'task-completed'
    readonly roomId: string
    readonly taskId: string
    readonly at: number
    readonly timelineSeq: number
  }

declare module '@deepseek-ai/dsh-session/types' {
  interface SessionEventMap {
    [TEAM_ROOM_FACT]: TeamRoomFact
  }
}
