/**
 * A1 regression locks for the `agent/created` catch-up listener.
 *
 * The registry dispatches `agent/created` as a serialized, awaited listener
 * chain, so this listener must return `undefined` synchronously on every path:
 * a never-settling store open, a filtered session source, or a rejecting
 * catch-up must all leave the dispatch untouched. The locks below assert
 * "returns without awaiting / does not throw" 鈥?the historical mis-diagnosis
 * ("throws synchronously") is deliberately NOT what is pinned.
 * @module dsh-background-agents/test/agent-created-listener
 */

import { afterEach, describe, expect, it } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Context } from '@deepseek-ai/cordis'
import AgentLoop from '@deepseek-ai/dsh-agent-loop'
import { mountAgentLoopTestDependencies } from '@deepseek-ai/dsh-agent-loop-testkit'
import CommandRuntime from '@deepseek-ai/dsh-commands'
import { SessionId } from '@deepseek-ai/dsh-session'
import JsonlSessionPersistence from '@deepseek-ai/dsh-session-persistence-jsonl'
import Storage from '@deepseek-ai/dsh-storage'
import * as StorageJson from '@deepseek-ai/dsh-storage-json'
import SubagentRuntime from '@deepseek-ai/dsh-subagent'
import * as SubagentSpawn from '@deepseek-ai/dsh-subagent-spawn-in-process'
import * as plugin from '../src/index.ts'

const roots: string[] = []
afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 })
})

/** One fake room table that records every access and can be made to throw. */
interface FakeTableStats {
  reads: number
  writes: number
}

/**
 * Mount the stack with a controllable room-domain provider.
 * @param options.open - the provider's `open` behaviour: 'stuck' never settles.
 * @returns the context, a parent agent, the table access counters, and a switch
 * that starts failing every later table read (used after the hub has opened).
 */
async function setup(options: { open: 'immediate' | 'stuck' | 'rejecting' }) {
  const ctx = new Context()
  await mountAgentLoopTestDependencies(ctx)
  const root = mkdtempSync(join(tmpdir(), 'dsh-background-agents-a1-'))
  roots.push(root)
  await ctx.plugin(JsonlSessionPersistence, { root })
  await ctx.plugin(AgentLoop, { agents: [] })
  await ctx.plugin(SubagentRuntime)
  await ctx.plugin(SubagentSpawn, { providerName: 'spawn' })
  await ctx.plugin(Storage)
  await ctx.plugin(StorageJson, { root: join(root, 'storages') })
  const stats: FakeTableStats = { reads: 0, writes: 0 }
  let tableThrows = false
  // One room that lists the parent as a member, so the listener's membership
  // pre-filter passes and the catch-up path is really exercised.
  const memberRoom = {
    roomId: 'parent-room',
    name: 'parent-room',
    createdAt: 1,
    members: [{ sessionId: 'parent', role: 'owner', joinedAt: 1, lastFactSeq: 0, lastDeliveredSeq: 0 }],
    tasks: [],
    timeline: [],
  }
  const table = {
    get: () => { stats.reads += 1; if (tableThrows) throw new Error('table unavailable'); return undefined },
    entries: () => {
      stats.reads += 1
      if (tableThrows) throw new Error('table unavailable')
      return [['room/parent-room', memberRoom]] as [string, unknown][]
    },
    put: async () => { stats.writes += 1 },
    update: async () => undefined,
    delete: async () => undefined,
  }
  ctx.provide('storageDomain', {
    open: options.open === 'stuck'
      ? () => new Promise<never>(() => {})
      : options.open === 'rejecting'
        ? () => Promise.reject(new Error('storage provider refused to open'))
        : async () => ({ table: () => table, close: async () => {} }),
  } as never)
  await ctx.plugin(CommandRuntime)
  await ctx.plugin(plugin, {
    provider: 'spawn',
    autoReport: false,
    idleSweepIntervalMs: 60_000,
    allowUnmarkedFacts: true,
    // Generous: these locks exercise the LISTENER, not the open timeout, so the
    // immediate provider must be allowed to finish opening the hub.
    roomOpenTimeoutMs: options.open === 'stuck' ? 100 : 5_000,
  })
  const parent = await ctx.agentLoop.create(SessionId('parent'), { provider: 'mock', model: 'mock' })
  return {
    ctx,
    parent,
    stats,
    /** Start failing every later table read (the hub has opened by then). */
    failReads: () => { tableThrows = true },
  }
}

describe('agent/created catch-up listener (A1)', () => {
  it('returns synchronously while the storage domain open never settles', async () => {
    const { ctx, parent } = await setup({ open: 'stuck' })
    // The dispatch must not be handed a promise: the listener's own return value
    // is `undefined`, so a stuck store cannot serialize Agent creation.
    const result = ctx.emit('agent/created', { agent: parent, source: 'startup' } as never)
    expect(result).toBeUndefined()
  })

  it('never touches the room store for a clear/compact session start', async () => {
    const { ctx, parent, stats } = await setup({ open: 'immediate' })
    // Let the hub's own open settle first so a catch-up WOULD have a table.
    await new Promise(resolve => setTimeout(resolve, 20))
    const before = stats.reads
    ctx.emit('agent/created', { agent: parent, source: 'compact' } as never)
    ctx.emit('agent/created', { agent: parent, source: 'clear' } as never)
    await new Promise(resolve => setTimeout(resolve, 20))
    expect(stats.reads).toBe(before)
  })

  it('does not throw and stays synchronous when the awaited open rejects', async () => {
    const { ctx, parent } = await setup({ open: 'rejecting' })
    await new Promise(resolve => setTimeout(resolve, 50))
    let threw: unknown
    let result: unknown = 'unset'
    try {
      result = ctx.emit('agent/created', { agent: parent, source: 'resume' } as never)
    } catch (error) {
      threw = error
    }
    // The card's assertion is "the listener returns normally", NOT "it throws
    // synchronously": a rejection on the awaited path must never reach the
    // serialized dispatch.
    expect(threw).toBeUndefined()
    expect(result).toBeUndefined()
    await new Promise(resolve => setTimeout(resolve, 50))
    const lines = ctx.logger.buffer.map(message => `${String(message.name)}:${String(message.args[0])}`)
    // The failure is reported through the logger (the mount site owns this one),
    // and never escapes into the dispatch.
    expect(lines.some(line => line.includes('team room store failed to open')), JSON.stringify(lines)).toBe(true)
  })
})
