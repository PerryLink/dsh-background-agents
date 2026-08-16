/**
 * Pure wire vocabulary of the team-room domain: zod schemas for every stored
 * record, shared by the domain spec (durable boundary validation), the
 * `teamRoom` session projection (wire value), and the client bundle guard.
 * All times are epoch ms; ids are plain strings.
 *
 * @module dsh-background-agents/room/schema
 */

import { z } from 'zod'

/** One member slot of a room: an independent session registered into the team. */
export const roomMemberSchema = z.object({
  /** Durable member session id (each member is its own session). */
  sessionId: z.string().min(1),
  /** `owner` created the room; `member` joined it. */
  role: z.enum(['owner', 'member']),
  /** Epoch ms of registration. */
  joinedAt: z.number().int().nonnegative(),
  /**
   * Bus seq up to which this member's session log has received the
   * model-visible delivery (0 = none yet). The offline outbox cursor.
   */
  lastDeliveredSeq: z.number().int().nonnegative(),
  /**
   * Timeline seq up to which this member's session log carries the log-only
   * facts (-1 = none yet). The offline fact-replay cursor.
   */
  lastFactSeq: z.number().int().min(-1),
}).strict()

/** The durable room record: membership plus the two append cursors. */
export const roomRecordSchema = z.object({
  roomId: z.string().min(1),
  name: z.string().min(1),
  createdAt: z.number().int().nonnegative(),
  /** Registration-order member list (each member is an independent session). */
  members: z.array(roomMemberSchema),
  /** Next bus seq to mint (monotonic per room; the ordering authority). */
  busNext: z.number().int().nonnegative(),
  /** Next timeline seq to mint. */
  timelineNext: z.number().int().nonnegative(),
}).strict()

/** One message on the room bus: broadcast, or directed when `toSessionId` is set. */
export const busMessageSchema = z.object({
  roomId: z.string().min(1),
  /** Monotonic per-room seq: the bus order every reader agrees on. */
  seq: z.number().int().nonnegative(),
  senderSessionId: z.string().min(1),
  /** Directed delivery target; absent = broadcast to every member. */
  toSessionId: z.string().min(1).optional(),
  text: z.string(),
  createdAt: z.number().int().nonnegative(),
}).strict()

/** One task-board card: todo / in-progress / done plus its assignee. */
export const taskRecordSchema = z.object({
  roomId: z.string().min(1),
  taskId: z.string().min(1),
  title: z.string().min(1),
  description: z.string(),
  status: z.enum(['todo', 'in-progress', 'done']),
  /** Assignee member session id; null = unassigned. */
  assigneeSessionId: z.string().nullable(),
  createdBy: z.string().min(1),
  createdAt: z.number().int().nonnegative(),
  updatedAt: z.number().int().nonnegative(),
  completedAt: z.number().int().nonnegative().optional(),
}).strict()

/** Timeline kinds the room appends; the shared event stream. */
export const timelineKindSchema = z.enum([
  'room-created',
  'member-joined',
  'member-left',
  'message-posted',
  'message-directed',
  'task-created',
  'task-claimed',
  'task-assigned',
  'task-completed',
])

/** One shared timeline event (append-only per room). */
export const timelineEventSchema = z.object({
  roomId: z.string().min(1),
  /** Monotonic per-room seq; the timeline order. */
  seq: z.number().int().nonnegative(),
  kind: timelineKindSchema,
  at: z.number().int().nonnegative(),
  /** Kind-specific payload; plain lossless JSON. */
  data: z.record(z.unknown()),
}).strict()

// ── the folded per-session wire value (`teamRoom` projection) ────────────────

/** One member row as the fold serves it. */
export const roomViewMemberSchema = z.object({
  sessionId: z.string().min(1),
  role: z.enum(['owner', 'member']),
  joinedAt: z.number().int().nonnegative(),
}).strict()

/** One task row as the fold serves it. */
export const roomViewTaskSchema = z.object({
  taskId: z.string().min(1),
  title: z.string(),
  description: z.string(),
  status: z.enum(['todo', 'in-progress', 'done']),
  assigneeSessionId: z.string().nullable(),
  createdBy: z.string(),
  createdAt: z.number().int().nonnegative(),
  updatedAt: z.number().int().nonnegative(),
}).strict()

/** One room as the fold serves it. */
export const roomViewSchema = z.object({
  roomId: z.string().min(1),
  name: z.string(),
  createdAt: z.number().int().nonnegative(),
  members: z.array(roomViewMemberSchema),
  tasks: z.array(roomViewTaskSchema),
  timeline: z.array(timelineEventSchema),
}).strict()

/** The whole `teamRoom` projection value: every room this session belongs to. */
export const teamRoomViewSchema = z.object({
  rooms: z.array(roomViewSchema),
}).strict()

// ── derived types ────────────────────────────────────────────────────────────

export type RoomMember = z.infer<typeof roomMemberSchema>
export type RoomRecord = z.infer<typeof roomRecordSchema>
export type BusMessage = z.infer<typeof busMessageSchema>
export type TaskRecord = z.infer<typeof taskRecordSchema>
export type TimelineEvent = z.infer<typeof timelineEventSchema>
export type TimelineKind = z.infer<typeof timelineKindSchema>
export type RoomView = z.infer<typeof roomViewSchema>
export type TeamRoomView = z.infer<typeof teamRoomViewSchema>

/**
 * Runtime-guard an opaque projection cell as the `teamRoom` value (the client
 * reads projection cells as unknown because it cannot merge the host's
 * `SessionProjectionMap`).
 * @param value - the opaque cell value.
 * @returns the typed view, or undefined when the cell is absent or invalid.
 */
export function isTeamRoomView(value: unknown): TeamRoomView | undefined {
  const parsed = teamRoomViewSchema.safeParse(value)
  return parsed.success ? parsed.data : undefined
}
