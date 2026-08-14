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
import { isBackgroundAgentsMeta, parseNotice, PLUGIN } from './vocabulary.ts'

/** Mutable fold state; plain JSON so the persisted projection cache can store it. */
interface State {
  entries: BackgroundAgentEntry[]
}

/** The folded entry without its identity; `state` owns order and the base fills the rest. */
type EntryDelta = Partial<Omit<BackgroundAgentEntry, 'agentId'>>

/** Concatenate the text blocks of one user-role message. */
function messageText(message: UserMessage): string {
  return message.content
    .filter((block): block is Extract<(typeof message.content)[number], { type: 'text' }> => block.type === 'text')
    .map(block => block.text)
    .join('')
}

/** Return a new state whose entry for `agentId` carries `delta`; `base` fills unknown agents. */
function upsert(state: State, agentId: string, delta: EntryDelta, base: Omit<BackgroundAgentEntry, 'agentId'>): State {
  const found = state.entries.some(entry => entry.agentId === agentId)
  if (found) {
    const entries = state.entries.map((entry): BackgroundAgentEntry => entry.agentId === agentId
      ? {
        agentId,
        label: delta.label ?? entry.label,
        activity: delta.activity ?? entry.activity,
        messageCount: delta.messageCount ?? entry.messageCount,
        createdAt: delta.createdAt ?? entry.createdAt,
        lastActiveAt: delta.lastActiveAt ?? entry.lastActiveAt,
        ...(delta.lastMessage !== undefined || entry.lastMessage !== undefined
          ? { lastMessage: delta.lastMessage ?? entry.lastMessage }
          : {}),
      }
      : entry)
    return { entries }
  }
  const merged: BackgroundAgentEntry = {
    agentId,
    label: delta.label ?? base.label,
    activity: delta.activity ?? base.activity,
    messageCount: delta.messageCount ?? base.messageCount,
    createdAt: delta.createdAt ?? base.createdAt,
    lastActiveAt: delta.lastActiveAt ?? base.lastActiveAt,
    ...(delta.lastMessage !== undefined || base.lastMessage !== undefined
      ? { lastMessage: delta.lastMessage ?? base.lastMessage }
      : {}),
  }
  return { entries: [...state.entries, merged] }
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
      case 'tool/result': {
        const meta = isBackgroundAgentsMeta(event.data.meta)
        if (meta === undefined) return state
        const shared = { lastActiveAt: event.time }
        const emptyBase: Omit<BackgroundAgentEntry, 'agentId'> = {
          label: '',
          activity: 'running',
          messageCount: 0,
          createdAt: event.time,
          lastActiveAt: event.time,
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
            return upsert(state, meta.agentId, shared, emptyBase)
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
          const known = state.entries.some(entry => entry.agentId === head.agentId)
          if (!known) return state
          const emptyBase: Omit<BackgroundAgentEntry, 'agentId'> = {
            label: '',
            activity: 'running',
            messageCount: 0,
            createdAt: event.time,
            lastActiveAt: event.time,
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
            lastActiveAt: event.time,
          }, emptyBase)
        }
        if (source.kind === 'subagent-settled') {
          // The official account of a settled activation epoch. Only fold it
          // for children this plugin tracks: a foreign child (started through
          // another delegation tool) has no row and must not gain a
          // label-less one.
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
          })
        }
        return state
      }
      default:
        return state
    }
  },
  view: (state): BackgroundAgentsProjection => ({
    agents: [...state.entries].sort((a, b) =>
      a.createdAt !== b.createdAt ? a.createdAt - b.createdAt : (a.agentId < b.agentId ? -1 : 1)),
  }),
  stateVersion: 1,
}

declare module '@deepseek-ai/dsh-session-projection/types' {
  interface SessionProjectionMap {
    /** Background-agent dashboard rows folded from the parent session log. */
    backgroundAgents: BackgroundAgentsProjection
  }
}
