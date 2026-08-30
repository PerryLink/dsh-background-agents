import { afterEach, describe, expect, it, vi } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Context } from '@deepseek-ai/cordis'
import { createUserMessage } from '@deepseek-ai/dsh-llm'
import { CallId } from './call-id.ts'
import type { StreamChunk } from '@deepseek-ai/dsh-llm'
import AgentLoop from '@deepseek-ai/dsh-agent-loop'
import { mountAgentLoopTestDependencies } from '@deepseek-ai/dsh-agent-loop-testkit'
import { SessionId } from '@deepseek-ai/dsh-session'
import JsonlSessionPersistence from '@deepseek-ai/dsh-session-persistence-jsonl'
import SessionProjectionRegistry from '@deepseek-ai/dsh-session-projection'
import SubagentRuntime from '@deepseek-ai/dsh-subagent'
import * as SubagentSpawn from '@deepseek-ai/dsh-subagent-spawn-in-process'
import { TestSessionQuery } from './test-session-query.ts'
import { isBackgroundAgentsProjection } from '../src/projection-schema.ts'
import { parseNotice, PLUGIN } from '../src/vocabulary.ts'
import * as plugin from '../src/index.ts'
import { MockAdapter, textResponse, toolCallResponse } from './mock-adapter.ts'

const testToolSignal = new AbortController().signal

const roots: string[] = []
afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 })
})

/** A scripted child answer that waits for a test-released gate before streaming. */
function gatedTextResponse(gate: Promise<undefined>, text: string): (() => Promise<StreamChunk[]>) {
  return async () => {
    await gate
    return textResponse(text)
  }
}

interface Mounts {
  readonly ctx: Context
  readonly root: string
  readonly adapter: MockAdapter
}

async function mount(root: string, adapter: MockAdapter, config: Partial<plugin.Config> = {}): Promise<Context> {
  const ctx = new Context()
  await mountAgentLoopTestDependencies(ctx)
  await ctx.plugin(JsonlSessionPersistence, { root })
  await ctx.plugin(AgentLoop, { agents: [] })
  await ctx.plugin(SessionProjectionRegistry)
  await ctx.plugin(TestSessionQuery)
  await ctx.plugin(SubagentRuntime)
  await ctx.plugin(SubagentSpawn, { providerName: 'spawn' })
  await ctx.plugin(plugin, {
    provider: 'spawn',
    autoReport: true,
    reportThrottleMs: 0,
    idleSweepIntervalMs: 60_000,
    // The rc.8 peer drops the ignorable marker; the default detect-and-skip
    // gate keeps logs loadable (the reopen test), while the in-memory fact
    // assertions opt back in so the fact pipeline is still exercised.
    allowUnmarkedFacts: true,
    ...config,
  })
  ctx.llm.registerAdapter(['mock'], adapter)
  return ctx
}

async function mountWith(adapter: MockAdapter, config: Partial<plugin.Config> = {}): Promise<Mounts> {
  const root = mkdtempSync(join(tmpdir(), 'dsh-background-agents-int-'))
  roots.push(root)
  const ctx = await mount(root, adapter, config)
  return { ctx, root, adapter }
}

async function settle(ctx: Context, childId: SessionId): Promise<void> {
  await vi.waitFor(() => { expect(ctx.agents.get(childId)).toBeUndefined() }, { timeout: 5_000 })
}

let calls = 0
function callTool(ctx: Context, name: string, args: unknown, agent?: unknown) {
  return ctx.tools.execute({
    signal: testToolSignal,
    callId: CallId(`call-${++calls}`),
    name,
    arguments: args,
    ...agent !== undefined ? { agent: agent as never } : {},
  })
}

describe('dsh-background-agents end-to-end', () => {
  it('starts a child through a real parent turn, auto-reports progress into the parent transcript, and folds the dashboard value from the log', async () => {
    // Script order: parent step 1 calls background_agent; the child's first
    // turn blocks on the gate so the parent's step 2 can close cleanly;
    // the final entry answers the parent's wake turn that claims the
    // injected progress notice and the official settled account.
    const childGate = Promise.withResolvers<undefined>()
    const adapter = new MockAdapter([
      toolCallResponse('c1', 'background_agent', { task: 'write progress lines', label: 'writer' }),
      gatedTextResponse(childGate.promise, 'line one'),
      textResponse('ok, started'),
      textResponse('noted'),
    ])
    const { ctx, adapter: adapterRef } = await mountWith(adapter)
    const parent = ctx.agentLoop.create(SessionId('parent'), { provider: 'mock', model: 'mock' })
    parent.followup(createUserMessage({
      content: [{ type: 'text', text: 'start the writer' }],
      source: { kind: 'user' },
    }))

    // The parent's first turn ends with the background_agent tool result; the
    // child is mid-first-turn, blocked on the gate (its gated model call may
    // land before the parent's closing step, so the request count is ≥ 2).
    await vi.waitFor(() => {
      expect(adapterRef.requests.length).toBeGreaterThanOrEqual(2) // parent step 1 + (child turn 1 | parent step 2)
    })
    let childId: SessionId | undefined
    await vi.waitFor(async () => {
      const entries = await ctx.subagents.listChildren(parent.id)
      expect(entries).toHaveLength(1)
      const entry = entries[0]
      expect(entry?.kind).toBe('child')
      childId = entry?.kind === 'child' ? entry.id : undefined
    }, { timeout: 5_000 })
    expect(childId).toBeDefined()

    // Release the child: its turn completes, autoReport injects the progress
    // line, the activation settles, and the official settled account lands.
    childGate.resolve(undefined)
    await settle(ctx, childId!)

    // The parent's wake turn claims the injected notices; wait for the turn to
    // consume the final script entry.
    await vi.waitFor(() => { expect(adapterRef.requests.length).toBeGreaterThanOrEqual(4) }, { timeout: 5_000 })
    await parent.whenIdle()

    const events = parent.session.events
    const progress = events.filter((event): event is Extract<typeof events[number], { type: 'user/message' }> =>
      event.type === 'user/message' && event.data.source.kind === 'plugin'
      && event.data.source.plugin === PLUGIN
      && event.data.source.form === 'notice')
    expect(progress.length).toBeGreaterThanOrEqual(1)
    const progressText = progress
      .flatMap(event => event.data.content)
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('\n')
    expect(parseNotice(progressText) ?? parseNotice(progressText.split('\n')[0]!)).toMatchObject({ kind: 'progress' })
    expect(progressText).toContain('line one')

    // The durable registration fact rides the tool result's replay metadata.
    const registeredMeta = events
      .filter(event => event.type === 'tool/result')
      .map(event => event.data.meta)
      .find(meta => meta !== undefined && (meta as { plugin?: unknown }).plugin === PLUGIN)
    expect(registeredMeta).toMatchObject({ plugin: PLUGIN, action: 'registered', agentId: childId, label: 'writer' })

    // The structured fact channel rides the same log. The rc.8 host drops
    // the envelope marker (the stamping fix exists on harness master only),
    // so with the documented opt-in the facts land unmarked — this session
    // never reopens, so the unmarked records stay harmless here; the reopen
    // test below covers the default detect-and-skip gate instead.
    const facts = events.filter(event => event.type === 'background-agents/fact')
    expect(facts.map(fact => fact.data.kind)).toEqual(expect.arrayContaining(['registered', 'progress']))

    // The projection folds the parent log into the dashboard value, including
    // the settled account from the official notice.
    const snapshot = ctx.sessionProjections.snapshot(parent.session)
    const projection = isBackgroundAgentsProjection(snapshot.values.backgroundAgents)
    expect(projection?.agents).toHaveLength(1)
    expect(projection!.agents[0]).toMatchObject({
      agentId: childId,
      label: 'writer',
      activity: 'inactive',
      messageCount: 1,
    })
  })

  it('recovers the child catalog and the projection facts after a parent-session reopen', async () => {
    const childGate = Promise.withResolvers<undefined>()
    const adapter = new MockAdapter([
      toolCallResponse('c1', 'background_agent', { task: 'durable work', label: 'durable' }),
      gatedTextResponse(childGate.promise, 'first line'),
      textResponse('ok, started'),
      textResponse('noted'),
    ])
    const first = await mountWith(adapter, { allowUnmarkedFacts: false })
    const { ctx, root } = first
    const parent = ctx.agentLoop.create(SessionId('parent'), { provider: 'mock', model: 'mock' })
    parent.followup(createUserMessage({
      content: [{ type: 'text', text: 'start it' }],
      source: { kind: 'user' },
    }))
    await vi.waitFor(() => { expect(adapter.requests.length).toBeGreaterThanOrEqual(2) }, { timeout: 5_000 })
    const entries = await ctx.subagents.listChildren(parent.id)
    const firstEntry = entries[0]!
    if (firstEntry.kind !== 'child') throw new Error('expected a child catalog entry')
    const childId = firstEntry.id
    childGate.resolve(undefined)
    await settle(ctx, childId)
    await vi.waitFor(() => { expect(adapter.requests.length).toBeGreaterThanOrEqual(4) }, { timeout: 5_000 })
    await parent.whenIdle()
    // Flush the parent log before the simulated crash.
    await ctx.sessions.flush(parent.session)
    await ctx.fiber.dispose()

    // Simulated restart on the same persistence root.
    const second = new Context()
    await mountAgentLoopTestDependencies(second)
    await second.plugin(JsonlSessionPersistence, { root })
    await second.plugin(AgentLoop, { agents: [] })
    await second.plugin(SessionProjectionRegistry)
    await second.plugin(TestSessionQuery)
    await second.plugin(SubagentRuntime)
    await second.plugin(SubagentSpawn, { providerName: 'spawn' })
    await second.plugin(plugin, { provider: 'spawn', autoReport: false, idleSweepIntervalMs: 60_000 })
    second.llm.registerAdapter(['mock'], new MockAdapter([]))
    const resumed = (await second.agents.resume({
      resumeSessionId: SessionId('parent'),
      agentOptions: { provider: 'mock', model: 'mock' },
    })).agent

    const listing = await callTool(second, 'bg_list', {}, resumed)
    expect(listing.isError).toBe(false)
    const value = listing.value as {
      kind: string
      agents: Array<Record<string, unknown>>
    }
    expect(value).toMatchObject({ kind: 'listing' })
    expect(value.agents).toEqual([
      expect.objectContaining({
        agentId: childId,
        label: 'durable',
        mode: 'continuable',
        activity: 'settled',
        messageCount: 1,
      }),
    ])

    // The projection value reconstructed from the durable log alone.
    const snapshot = second.sessionProjections.snapshot(resumed.session)
    const projection = isBackgroundAgentsProjection(snapshot.values.backgroundAgents)
    expect(projection?.agents.map(row => row.agentId)).toEqual([childId])

    // The rc.8 peer drops the ignorable marker, so no fact event ever
    // reached the durable log (the detect-and-skip gate runs before the
    // first append) — the log stays loadable precisely because the fact
    // channel stayed off; the catalog and projection above reconstructed
    // from the official replay meta + settled account alone.
    const reopenedFacts = (await second.sessionPersistence.load(SessionId('parent'))).events
      .filter(event => event.type === 'background-agents/fact')
    expect(reopenedFacts).toHaveLength(0)
    await second.fiber.dispose()
  })
})
