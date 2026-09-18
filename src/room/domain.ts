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
 * Bridge one of this package's zod-v3 record schemas into a domain-table slot.
 *
 * The alpha.2 `@deepseek-ai/dsh-storage-domain` types its table schema with the
 * zod **v4** copy it depends on (`zod: ^4.4.3`), while this package builds its
 * schemas with zod v3 (`dependencies.zod: ^3.24.0`); the two majors are not
 * structurally assignable. The durable read boundary only calls `parse` on the
 * schema, which both majors implement identically — the cast is a deliberate,
 * documented boundary bridge, not a hidden mismatch.
 * @param schema - the zod-v3 record schema built by this package.
 * @returns the same schema, typed for the domain-table slot.
 */
function asDomainTableSchema<K extends string, V>(schema: unknown): Parameters<typeof domainTable<K, V>>[0] {
  return schema as Parameters<typeof domainTable<K, V>>[0]
}

/**
 * The domain spec: identity, format version, and the four declared tables.
 * The same schemas validate every record at the durable read boundary.
 */
export const teamRoomsDomainSpec = defineDomain({
  name: 'team_rooms',
  version: 1,
  tables: {
    rooms: domainTable<RoomKey, RoomRecord>(asDomainTableSchema<RoomKey, RoomRecord>(roomRecordSchema)),
    bus: domainTable<AppendKey, BusMessage>(asDomainTableSchema<AppendKey, BusMessage>(busMessageSchema)),
    tasks: domainTable<AppendKey, TaskRecord>(asDomainTableSchema<AppendKey, TaskRecord>(taskRecordSchema)),
    timeline: domainTable<AppendKey, TimelineEvent>(asDomainTableSchema<AppendKey, TimelineEvent>(timelineEventSchema)),
  },
})
