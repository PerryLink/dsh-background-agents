/**
 * The `backgroundAgents` session-projection unit: folds the parent session's
 * log into the dashboard value the Web UI and `bg_list` consume. The fold
 * reads ONLY event types the harness already knows —
 * `tool/result` replay metadata (registration / message / stop facts written
 * by this plugin's tools) and `user/message` (this plugin's injected notices
 * plus the official `subagent-settled` account) — so the value reconstructs
 * from the durable log on every reopen without any custom session event.
 *
 * @module dsh-background-agents/projection
 */

import { z } from 'zod'
import type { ProjectionDefinition } from '@deepseek-ai/dsh-session-projection'
import type { SessionEvent, UserMessage } from '@deepseek-ai/dsh-session'
import type {} from '@deepseek-ai/dsh-subagent'
import {
  backgroundAgentsSchema, type BackgroundAgentEntry, type BackgroundAgentsProjection,
} from './projection-schema.ts'
import { FACT_EVENT } from './events.ts'
import { isBackgroundAgentsMeta, parseNotice, PLUGIN } from './vocabulary.ts'

/**
 * Mutable fold state; plain JSON so the persisted projection cache can store
 * it. `source` is fold-internal only (never in the wire value): `legacy`
 * entries were built from the pre-event channels (`tool/result` replay
 * metadata and notice text), `event` entries from the structured
 * `background-agents/fact` records. Once the structured channel owns a row
 * the legacy folds stop for it, so a log that carries both channels (the
 * v0.3.0 write path keeps writing both) never double-counts.
 */
interface State {
  entries: StateEntry[]
}

/** One fold row plus its channel provenance. */
interface StateEntry extends BackgroundAgentEntry {
  readonly source: 'legacy' | 'event'
}

/** The folded entry without its identity; `state` owns order and the base fills the rest. */
type EntryDelta = Partial<Omit<StateEntry, 'agentId'>>

/** Concatenate the text blocks of one user-role message. */
function messageText(message: UserMessage): string {
  return message.content
    .filter((block): block is Extract<(typeof message.content)[number], { type: 'text' }> => block.type === 'text')
    .map(block => block.text)
    .join('')
}

/** Merge one delta over the present entry or the base; `delta` wins field by field. */
function merge(agentId: string, entry: StateEntry, delta: EntryDelta): StateEntry {
  return {
    agentId,
    label: delta.label ?? entry.label,
    activity: delta.activity ?? entry.activity,
    messageCount: delta.messageCount ?? entry.messageCount,
    createdAt: delta.createdAt ?? entry.createdAt,
    lastActiveAt: delta.lastActiveAt ?? entry.lastActiveAt,
    source: delta.source ?? entry.source,
    ...(delta.lastMessage !== undefined || entry.lastMessage !== undefined
      ? { lastMessage: delta.lastMessage ?? entry.lastMessage }
      : {}),
    ...(delta.archivedAt !== undefined || entry.archivedAt !== undefined
      ? { archivedAt: delta.archivedAt ?? entry.archivedAt }
      : {}),
    ...(delta.stopRequestedAt !== undefined || entry.stopRequestedAt !== undefined
      ? { stopRequestedAt: delta.stopRequestedAt ?? entry.stopRequestedAt }
      : {}),
  }
}

/** Return a new state whose entry for `agentId` carries `delta`; `base` fills unknown agents. */
function upsert(state: State, agentId: string, delta: EntryDelta, base: Omit<StateEntry, 'agentId'>): State {
  const found = state.entries.some(entry => entry.agentId === agentId)
  if (found) {
    const entries = state.entries.map(entry =>
      entry.agentId === agentId ? merge(agentId, entry, delta) : entry)
    return { entries }
  }
  const created: StateEntry = { agentId, ...base }
  return { entries: [...state.entries, merge(agentId, created, delta)] }
}

/** The base for a row opened by a fact whose own payload carries no full identity. */
function factBase(at: number): Omit<StateEntry, 'agentId'> {
  return {
    label: '',
    activity: 'running',
    messageCount: 0,
    createdAt: at,
    lastActiveAt: at,
    source: 'event',
  }
}

/**
 * The registered projection unit. `stateVersion` bumps whenever the fold
 * semantics or the serialized state fields change, so persisted checkpoint
 * rows from an older unit refold instead of replaying into garbage.
 */
export const backgroundAgentsProjectionDefinition:
ProjectionDefinition<'backgroundAgents', State> = {
  key: 'backgroundAgents',
  // The cast mirrors the subagent package's projection units: the zod object's
  // inferred input type is narrower than the wire `unknown` the registry parses.
  schema: backgroundAgentsSchema as unknown as z.ZodType<BackgroundAgentsProjection>,
  init: () => ({ entries: [] }),
  apply(state, event: SessionEvent) {
    switch (event.type) {
      case FACT_EVENT: {
        // The structured channel: every fact is folded from its event, and
        // the row it touches switches to `event` provenance.
        const fact = event.data
        const existing = state.entries.find(entry => entry.agentId === fact.agentId)
        switch (fact.kind) {
          case 'registered':
            return upsert(state, fact.agentId, {
              label: fact.label,
              activity: 'running',
              messageCount: 1,
              createdAt: event.time,
              lastActiveAt: event.time,
              source: 'event',
            }, factBase(event.time))
          case 'message':
            return upsert(state, fact.agentId, {
              activity: 'running',
              messageCount: (existing?.messageCount ?? 0) + 1,
              lastActiveAt: event.time,
              source: 'event',
            }, factBase(event.time))
          case 'stop':
            // A stop fact for an unknown child records nothing (mirrors the legacy fold).
            if (existing === undefined) return state
            return upsert(state, fact.agentId, {
              stopRequestedAt: event.time,
              lastActiveAt: event.time,
              source: 'event',
            }, factBase(event.time))
          case 'progress':
            if (existing === undefined) return state
            return upsert(state, fact.agentId, {
              activity: 'running',
              lastMessage: fact.text,
              lastActiveAt: event.time,
              source: 'event',
            }, factBase(event.time))
          case 'archived':
            if (existing === undefined) return state
            return upsert(state, fact.agentId, {
              activity: 'archived',
              archivedAt: event.time,
              lastActiveAt: event.time,
              source: 'event',
            }, factBase(event.time))
          /* v8 ignore next 2 -- the closed union is total by construction. */
          default:
            return state
        }
      }
      case 'tool/result': {
        const meta = isBackgroundAgentsMeta(event.data.meta)
        if (meta === undefined) return state
        // The structured channel already folded this row's facts; the legacy
        // meta replay must not fold them a second time.
        if (state.entries.some(entry => entry.agentId === meta.agentId && entry.source === 'event')) return state
        const shared = { lastActiveAt: event.time }
        const emptyBase: Omit<StateEntry, 'agentId'> = {
          label: '',
          activity: 'running',
          messageCount: 0,
          createdAt: event.time,
          lastActiveAt: event.time,
          source: 'legacy',
        }
        switch (meta.action) {
          case 'registered':
            return upsert(state, meta.agentId, {
              label: meta.label,
              activity: 'running',
              messageCount: 1,
              createdAt: event.time,
              ...shared,
            }, emptyBase)
          case 'message': {
            const entry = state.entries.find(candidate => candidate.agentId === meta.agentId)
            return upsert(state, meta.agentId, {
              activity: 'running',
              messageCount: (entry?.messageCount ?? 0) + 1,
              ...shared,
            }, emptyBase)
          }
          case 'stop':
            // A stop request changes no durable lifecycle fact of its own; the
            // interruption's settlement lands through the settled fold.
            if (!state.entries.some(entry => entry.agentId === meta.agentId)) return state
            return upsert(state, meta.agentId, { stopRequestedAt: event.time, ...shared }, emptyBase)
          /* v8 ignore next 2 -- the guard's closed switch is total by construction. */
          default:
            return state
        }
      }
      case 'user/message': {
        const source = event.data.source
        if (source.kind === 'plugin' && source.plugin === PLUGIN && source.form === 'notice') {
          const head = parseNotice(messageText(event.data))
          if (head === undefined) return state
          const entry = state.entries.find(candidate => candidate.agentId === head.agentId)
          if (entry === undefined || entry.source === 'event') return state
          const emptyBase: Omit<StateEntry, 'agentId'> = {
            label: '',
            activity: 'running',
            messageCount: 0,
            createdAt: event.time,
            lastActiveAt: event.time,
            source: 'legacy',
          }
          if (head.kind === 'progress') {
            return upsert(state, head.agentId, {
              activity: 'running',
              lastMessage: head.text,
              lastActiveAt: event.time,
            }, emptyBase)
          }
          return upsert(state, head.agentId, {
            activity: 'archived',
            archivedAt: event.time,
            lastActiveAt: event.time,
          }, emptyBase)
        }
        if (source.kind === 'subagent-settled') {
          // The official account of a settled activation epoch. Only fold it
          // for children this plugin tracks: a foreign child (started through
          // another delegation tool) has no row and must not gain a
          // label-less one. The official channel has no structured
          // counterpart, so it folds regardless of provenance.
          if (!state.entries.some(entry => entry.agentId === source.senderSessionId)) return state
          return upsert(state, source.senderSessionId, {
            activity: 'inactive',
            lastMessage: source.summary,
            lastActiveAt: event.time,
          }, {
            label: '',
            activity: 'inactive',
            messageCount: 0,
            createdAt: event.time,
            lastActiveAt: event.time,
            source: 'legacy',
          })
        }
        return state
      }
      default:
        return state
    }
  },
  view: (state): BackgroundAgentsProjection => ({
    agents: state.entries
      .map((entry): BackgroundAgentEntry => {
        const { source: _source, ...wire } = entry
        return wire
      })
      .sort((a, b) =>
        a.createdAt !== b.createdAt ? a.createdAt - b.createdAt : (a.agentId < b.agentId ? -1 : 1)),
  }),
  stateVersion: 2,
}

declare module '@deepseek-ai/dsh-session-projection/types' {
  interface SessionProjectionMap {
    /** Background-agent dashboard rows folded from the parent session log. */
    backgroundAgents: BackgroundAgentsProjection
  }
}
