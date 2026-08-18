import { afterEach, describe, expect, it } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Context } from '@deepseek-ai/cordis'
import { CallId } from '@deepseek-ai/dsh-llm'
import AgentLoop from '@deepseek-ai/dsh-agent-loop'
import { mountAgentLoopTestDependencies } from '@deepseek-ai/dsh-agent-loop-testkit'
import CommandRuntime from '@deepseek-ai/dsh-commands'
import { SessionId } from '@deepseek-ai/dsh-session'
import JsonlSessionPersistence from '@deepseek-ai/dsh-session-persistence-jsonl'
import SessionProjectionRegistry from '@deepseek-ai/dsh-session-projection'
import Storage from '@deepseek-ai/dsh-storage'
import * as StorageJson from '@deepseek-ai/dsh-storage-json'
import SubagentRuntime from '@deepseek-ai/dsh-subagent'
import * as SubagentSpawn from '@deepseek-ai/dsh-subagent-spawn-in-process'
import * as plugin from '../src/index.ts'

const roots: string[] = []
afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 })
})

/**
 * Mount the full stack but replace the storage DOMAIN with a stuck provider
 * whose `open()` never settles — the `roomOpenTimeoutMs` timer must cut the
 * open off so `/room` and the room_* tools settle with `store-unavailable`
 * instead of hanging.
 */
async function setupWithStuckDomain() {
  const ctx = new Context()
  await mountAgentLoopTestDependencies(ctx)
  const root = mkdtempSync(join(tmpdir(), 'dsh-background-agents-stuck-'))
  roots.push(root)
  await ctx.plugin(JsonlSessionPersistence, { root })
  await ctx.plugin(AgentLoop, { agents: [] })
  await ctx.plugin(SessionProjectionRegistry)
  await ctx.plugin(SubagentRuntime)
  await ctx.plugin(SubagentSpawn, { providerName: 'spawn' })
  await ctx.plugin(Storage)
  await ctx.plugin(StorageJson, { root: join(root, 'storages') })
  // Deliberately NO StorageDomain: provide a stuck one so the plugin's room
  // half activates and its open-timeout path is exercised.
  ctx.provide('storageDomain', {
    open: () => new Promise<never>(() => {}),
  } as never)
  await ctx.plugin(CommandRuntime)
  await ctx.plugin(plugin, {
    provider: 'spawn',
    autoReport: false,
    idleSweepIntervalMs: 60_000,
    allowUnmarkedFacts: true,
    roomOpenTimeoutMs: 200,
  })
  const parent = ctx.agentLoop.create(SessionId('parent'), { provider: 'mock', model: 'mock' })
  return { ctx, parent }
}

describe('room open timeout against a stuck storage provider', () => {
  it('settles /room create with store-unavailable instead of hanging', async () => {
    const { ctx, parent } = await setupWithStuckDomain()
    const execution = await ctx.commands.execute(parent as never, '/room create stuck-room', new AbortController().signal)
    expect(execution?.result.kind).toBe('error')
    const text = String((execution?.result as { text?: string } | undefined)?.text ?? '')
    expect(text).toContain('store-unavailable')
  })

  it('settles room_create_task with a closed failure instead of hanging', async () => {
    const { ctx, parent } = await setupWithStuckDomain()
    const result = await ctx.tools.execute({
      signal: new AbortController().signal,
      callId: CallId('room-stuck-open-1'),
      name: 'room_create_task',
      arguments: { roomId: 'r-1', content: 'x' },
      agent: parent as never,
    })
    // The tool must settle (the executor normalizes the plugin's failure),
    // never park on the never-settling domain open.
    expect(result.isError).toBe(true)
  })

  it('still registers the room tools while the domain is stuck', async () => {
    const { ctx } = await setupWithStuckDomain()
    const names = ctx.tools.schemas().map(schema => schema.name)
    expect(names).toEqual(expect.arrayContaining(['room_list_rooms', 'room_create_task', 'room_post']))
  })
})
