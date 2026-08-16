/**
 * The `team_rooms` storage-domain declaration: rooms, the message bus, the
 * task board, and the shared timeline as four KV tables over the harness's
 * own storage layer (SQLite or JSONL backend — the deployment chooses; the
 * plugin adds no service of its own). Records are validated at the durable
 * boundary by the same zod schemas the projection and the client share.
 *
 * The domain's single write chain is the ordering authority: every bus
 * append and cursor bump queues on it, so concurrent posters can never
 * interleave a read-modify-write.
 *
 * @module dsh-background-agents/room/domain
 */

import { defineDomain, domainTable } from '@deepseek-ai/dsh-storage-domain'
import {
  busMessageSchema, type BusMessage, roomRecordSchema, type RoomRecord,
  taskRecordSchema, type TaskRecord, timelineEventSchema, type TimelineEvent,
} from './schema.ts'

/** Branded-ish key aliases: append-table keys are plain `${roomId}/${…}` strings. */
export type RoomKey = string & { readonly __roomKey?: never }
export type AppendKey = string & { readonly __appendKey?: never }

/**
 * The domain spec: identity, format version, and the four declared tables.
 * The same schemas validate every record at the durable read boundary.
 */
export const teamRoomsDomainSpec = defineDomain({
  name: 'team_rooms',
  version: 1,
  tables: {
    rooms: domainTable<RoomKey, RoomRecord>(roomRecordSchema),
    bus: domainTable<AppendKey, BusMessage>(busMessageSchema),
    tasks: domainTable<AppendKey, TaskRecord>(taskRecordSchema),
    timeline: domainTable<AppendKey, TimelineEvent>(timelineEventSchema),
  },
})
