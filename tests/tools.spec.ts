import { afterEach, describe, expect, it, vi } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Context } from '@deepseek-ai/cordis'
import { CallId } from '@deepseek-ai/dsh-llm'
import { defineTool } from '@deepseek-ai/dsh-tools'
import AgentLoop from '@deepseek-ai/dsh-agent-loop'
import { mountAgentLoopTestDependencies } from '@deepseek-ai/dsh-agent-loop-testkit'
import { SessionId } from '@deepseek-ai/dsh-session'
import JsonlSessionPersistence from '@deepseek-ai/dsh-session-persistence-jsonl'
import SessionProjectionRegistry from '@deepseek-ai/dsh-session-projection'
import SubagentRuntime from '@deepseek-ai/dsh-subagent'
import * as SubagentSpawn from '@deepseek-ai/dsh-subagent-spawn-in-process'
import * as plugin from '../src/index.ts'
import { MockAdapter, textResponse } from './mock-adapter.ts'

const testToolSignal = new AbortController().signal

const roots: string[] = []
afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 })
})

async function setup(config: Partial<plugin.Config> = {}) {
  const ctx = new Context()
  await mountAgentLoopTestDependencies(ctx)
  const root = mkdtempSync(join(tmpdir(), 'dsh-background-agents-'))
  roots.push(root)
  await ctx.plugin(JsonlSessionPersistence, { root })
  await ctx.plugin(AgentLoop, { agents: [] })
  await ctx.plugin(SessionProjectionRegistry)
  await ctx.plugin(SubagentRuntime)
  await ctx.plugin(SubagentSpawn, { providerName: 'spawn' })
  await ctx.plugin(plugin, {
    provider: 'spawn',
    autoReport: false,
    idleSweepIntervalMs: 60_000,
    ...config,
  })
  // No adapter registered here: tests that need model turns register their own.
  const parent = ctx.agentLoop.create(SessionId('parent'), { provider: 'mock', model: 'mock' })
  return { ctx, parent, root }
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

function text(result: { content: { type: string; text?: string }[] }): string {
  return result.content.filter(block => block.type === 'text').map(block => block.text).join('')
}

/** Read a tool result's canonical value as the expected schema type. */
function valueOf<T>(result: { value?: unknown }): T {
  return result.value as T
}

describe('dsh-background-agents tools', () => {
  it('registers the five tools with their canonical parameter sets', async () => {
    const { ctx } = await setup()
    const names = ctx.tools.schemas().map(schema => schema.name)
    expect(names).toEqual(expect.arrayContaining(['background_agent', 'bg_message', 'bg_list', 'bg_result', 'bg_stop']))
    const start = ctx.tools.schemas().find(schema => schema.name === 'background_agent')!
    const props = (start.parameters as { properties?: Record<string, unknown> }).properties ?? {}
    expect(Object.keys(props).sort()).toEqual(['label', 'max_depth', 'persona', 'task', 'tool_filter'])
    const stop = ctx.tools.schemas().find(schema => schema.name === 'bg_stop')!
    expect(Object.keys((stop.parameters as { properties: Record<string, unknown> }).properties)).toEqual(['agent_id'])
  })

  it('starts a continuable child, returns stable ids, and stamps registered replay meta', async () => {
    const { ctx, parent } = await setup()
    const result = await callTool(ctx, 'background_agent', { task: 'write one line' }, parent)
    expect(result.isError).toBe(false)
    const started = valueOf<{ agentId: string; messageId: string }>(result)
    expect(typeof started.agentId).toBe('string')
    expect(typeof started.messageId).toBe('string')
    expect(result.meta).toEqual({
      plugin: 'dsh-background-agents',
      action: 'registered',
      agentId: started.agentId,
      label: 'write one line',
    })
    const child = ctx.agents.get(SessionId(started.agentId))
    expect(child).toBeDefined()
  })

  it('derives the label from the optional argument and bounds it by maxLabelChars', async () => {
    const { ctx, parent } = await setup({ maxLabelChars: 5 })
    const result = await callTool(ctx, 'background_agent', { task: 'the task', label: 'a very long label' }, parent)
    expect(result.isError).toBe(false)
    expect((result.meta as { label: string }).label).toBe('a ve…')
    const second = await callTool(ctx, 'background_agent', { task: 'first line\nsecond line' }, parent)
    expect((second.meta as { label: string }).label).toBe('firs…')
  })

  it('rejects a start at the configured cap with the cap named in the error', async () => {
    const { ctx, parent } = await setup({ maxBackgroundAgents: 1 })
    const first = await callTool(ctx, 'background_agent', { task: 'first' }, parent)
    expect(first.isError).toBe(false)
    const second = await callTool(ctx, 'background_agent', { task: 'second' }, parent)
    expect(second.isError).toBe(true)
    expect(text(second)).toContain('maxBackgroundAgents=1')
  })

  it('rejects a start when the configured provider cannot continue', async () => {
    const { ctx, parent } = await setup({ provider: 'no-such-provider' })
    const result = await callTool(ctx, 'background_agent', { task: 'x' }, parent)
    expect(result.isError).toBe(true)
    expect(text(result)).toContain('no subagent provider registered')
  })

  it('delivers a follow-up through the official seam with coordinator attribution', async () => {
    const { ctx, parent } = await setup()
    ctx.llm.registerAdapter(['mock'], new MockAdapter([textResponse('first answer'), textResponse('second answer')]))
    const started = await ctx.subagents.startContinuable({
      provider: 'spawn',
      label: 'child task',
      request: { prompt: [{ type: 'text', text: 'child task' }], parent },
      signal: testToolSignal,
    })
    await vi.waitFor(() => { expect(ctx.agents.get(started.childId)).toBeUndefined() }, { timeout: 5_000 })

    const result = await callTool(ctx, 'bg_message', { agent_id: started.childId, message: 'and then?' }, parent)
    expect(result.isError).toBe(false)
    const message = valueOf<{ messageId: string }>(result)
    expect(result.meta).toEqual({
      plugin: 'dsh-background-agents',
      action: 'message',
      agentId: started.childId,
      messageId: message.messageId,
    })
    await vi.waitFor(() => { expect(ctx.agents.get(started.childId)).toBeUndefined() }, { timeout: 5_000 })
    const loaded = await ctx.sessionPersistence.load(started.childId)
    const followUp = loaded.events.findLast(event => event.type === 'user/message')
    expect(followUp?.type === 'user/message' && followUp.data.source).toEqual({
      kind: 'coordinator',
      form: 'relay',
      senderSessionId: parent.id,
    })
  })

  it('reports a delivery failure for an unknown agent id', async () => {
    const { ctx, parent } = await setup()
    const result = await callTool(ctx, 'bg_message', { agent_id: 'no-such-child', message: 'hello?' }, parent)
    expect(result.isError).toBe(true)
  })

  it('reports an explicit unrecoverable listing when the projection registry is absent', async () => {
    const ctx = new Context()
    await mountAgentLoopTestDependencies(ctx)
    const root = mkdtempSync(join(tmpdir(), 'dsh-background-agents-'))
    roots.push(root)
    await ctx.plugin(JsonlSessionPersistence, { root })
    await ctx.plugin(AgentLoop, { agents: [] })
    // Deliberately NO SessionProjectionRegistry: listChildren must fail loud
    // instead of fabricating an empty catalog.
    await ctx.plugin(SubagentRuntime)
    await ctx.plugin(SubagentSpawn, { providerName: 'spawn' })
    await ctx.plugin(plugin, { provider: 'spawn', autoReport: false })
    ctx.llm.registerAdapter(['mock'], new MockAdapter([]))
    const parent = ctx.agentLoop.create(SessionId('parent'), { provider: 'mock', model: 'mock' })

    const result = await callTool(ctx, 'bg_list', {}, parent)
    expect(result.isError).toBe(false)
    expect(valueOf<{ kind: string; code: string; message: string }>(result)).toEqual({
      kind: 'unrecoverable',
      code: 'SUBAGENT_CONTROL_PROJECTIONS_UNAVAILABLE',
      message: expect.stringContaining('sessionProjections'),
    })
  })

  it('lists started children through the official catalog', async () => {
    const { ctx, parent } = await setup()
    const started = await callTool(ctx, 'background_agent', { task: 'writer task', label: 'writer' }, parent)
    const startedValue = valueOf<{ agentId: string }>(started)
    await vi.waitFor(() => { expect(ctx.agents.get(SessionId(startedValue.agentId))).toBeUndefined() }, { timeout: 5_000 })

    const listing = await callTool(ctx, 'bg_list', {}, parent)
    expect(listing.isError).toBe(false)
    const value = valueOf<{ kind: string; agents: Array<Record<string, unknown>> }>(listing)
    expect(value.kind).toBe('listing')
    expect(value.agents).toHaveLength(1)
    expect(value.agents[0]).toEqual({
      agentId: startedValue.agentId,
      label: 'writer',
      mode: 'continuable',
      activity: 'ready',
    })
  })

  it('rejects a tool_filter without allow or deny', async () => {
    const { ctx, parent } = await setup()
    const result = await callTool(ctx, 'background_agent', { task: 'x', tool_filter: {} }, parent)
    expect(result.isError).toBe(true)
    expect(text(result)).toContain('tool_filter must declare allow and/or deny')
  })

  it('rejects tool_filter names outside allowedChildTools', async () => {
    const { ctx, parent } = await setup({ allowedChildTools: ['read'] })
    const result = await callTool(ctx, 'background_agent', { task: 'x', tool_filter: { deny: ['edit'] } }, parent)
    expect(result.isError).toBe(true)
    expect(text(result)).toContain('outside allowedChildTools')
  })

  it('rejects max_depth that is not a non-negative integer or exceeds the ceiling', async () => {
    const { ctx, parent } = await setup({ maxChildDepth: 2 })
    const fractional = await callTool(ctx, 'background_agent', { task: 'x', max_depth: 1.5 }, parent)
    expect(fractional.isError).toBe(true)
    expect(text(fractional)).toContain('non-negative safe integer')
    const over = await callTool(ctx, 'background_agent', { task: 'x', max_depth: 5 }, parent)
    expect(over.isError).toBe(true)
    expect(text(over)).toContain('maxChildDepth=2')
  })

  it('passes tool_filter, persona, max_depth, and the configured child route to the official start', async () => {
    const { ctx, parent } = await setup({ childProvider: 'mock', childModel: 'cheap-model', maxChildDepth: 3 })
    // The seam validates filter names loudly, so the scoped tool must exist.
    ctx.tools.register(defineTool({
      name: 'read',
      description: 'fixture tool for tool_filter tests',
      parameters: {},
      output: { schema: { type: 'string' }, render: () => [{ type: 'text', text: 'ok' }] },
      isConcurrencySafe: () => true,
      execute: async () => 'ok',
    }))
    const spy = vi.spyOn(ctx.subagents, 'startContinuable')
    const result = await callTool(ctx, 'background_agent', {
      task: 'scoped work',
      tool_filter: { allow: ['read'], deny: [] },
      persona: 'researcher',
      max_depth: 2,
    }, parent)
    expect(result.isError).toBe(false)
    expect(spy).toHaveBeenCalledTimes(1)
    const spec = spy.mock.calls[0]![0]
    expect(spec.request.toolFilter).toEqual({ allow: ['read'] })
    expect(spec.request.persona).toBe('researcher')
    expect(spec.request.maxDepth).toBe(2)
    expect(spec.request.agentOptions).toEqual({ provider: 'mock', model: 'cheap-model' })
  })

  it('bg_result reads the settled child\'s final text and errors for untracked ids', async () => {
    const { ctx, parent } = await setup()
    ctx.llm.registerAdapter(['mock'], new MockAdapter([textResponse('final answer text')]))
    const started = await callTool(ctx, 'background_agent', { task: 'answer one thing' }, parent)
    expect(started.isError).toBe(false)
    const childId = valueOf<{ agentId: string }>(started).agentId
    await vi.waitFor(() => { expect(ctx.agents.get(SessionId(childId))).toBeUndefined() }, { timeout: 5_000 })

    const result = await callTool(ctx, 'bg_result', { agent_id: childId }, parent)
    expect(result.isError).toBe(false)
    // Direct tool execution appends no parent turn, so the projection fact is
    // absent and the activity falls back to the live catalog view ('ready').
    expect(valueOf<{ agentId: string; activity: string; text?: string }>(result)).toEqual({
      agentId: childId,
      activity: 'ready',
      text: 'final answer text',
    })

    const ghost = await callTool(ctx, 'bg_result', { agent_id: 'ghost-child' }, parent)
    expect(ghost.isError).toBe(true)
    expect(text(ghost)).toContain('not one of this conversation\'s tracked children')
  })

  it('lists the descendant tree with parentId and depth when recursive', async () => {
    const { ctx, parent } = await setup()
    ctx.llm.registerAdapter(['mock'], new MockAdapter(['hang', 'hang']))
    const childStart = await callTool(ctx, 'background_agent', { task: 'root task' }, parent)
    expect(childStart.isError).toBe(false)
    const childId = valueOf<{ agentId: string }>(childStart).agentId
    await vi.waitFor(() => { expect(ctx.agents.get(SessionId(childId))?.status).toBe('running') }, { timeout: 5_000 })
    const childAgent = ctx.agents.get(SessionId(childId))!
    // A background agent is itself an agent: it starts a grandchild of its own.
    const grand = await ctx.subagents.startContinuable({
      provider: 'spawn',
      label: 'grand',
      request: { prompt: [{ type: 'text', text: 'grand task' }], parent: childAgent },
      signal: testToolSignal,
    })
    expect(typeof grand.childId).toBe('string')

    const listing = await callTool(ctx, 'bg_list', { recursive: true }, parent)
    expect(listing.isError).toBe(false)
    const value = valueOf<{ kind: string; agents: Array<{ agentId: string; parentId?: string; depth?: number }> }>(listing)
    expect(value.kind).toBe('listing')
    expect(value.agents).toHaveLength(2)
    const childRow = value.agents.find(row => row.agentId === childId)!
    expect(childRow).toMatchObject({ depth: 1, parentId: parent.id })
    const grandRow = value.agents.find(row => row.agentId === grand.childId)!
    expect(grandRow).toMatchObject({ depth: 2, parentId: childId })

    const direct = await callTool(ctx, 'bg_list', {}, parent)
    const directValue = valueOf<{ agents: Array<{ parentId?: string; depth?: number }> }>(direct)
    expect(directValue.agents).toHaveLength(1)
    expect(directValue.agents[0]!.parentId).toBeUndefined()
  })

  it('reports not-found for an agent id outside this parent\'s children', async () => {
    const { ctx, parent } = await setup()
    const result = await callTool(ctx, 'bg_stop', { agent_id: 'no-such-child' }, parent)
    expect(result.isError).toBe(false)
    expect(result.value).toEqual({ outcome: 'not-found', agentId: 'no-such-child' })
  })

  it('requests interruption of a running child with keepInbox, without killing anything itself', async () => {
    const { ctx, parent } = await setup()
    ctx.llm.registerAdapter(['mock'], new MockAdapter(['hang', textResponse('after stop')]))
    const started = await ctx.subagents.startContinuable({
      provider: 'spawn',
      label: 'long work',
      request: { prompt: [{ type: 'text', text: 'long work' }], parent },
      signal: testToolSignal,
    })
    await vi.waitFor(() => {
      const agent = ctx.agents.get(started.childId)
      expect(agent?.status).toBe('running')
    }, { timeout: 5_000 })
    const child = ctx.agents.get(started.childId)!
    const cancelSpy = vi.spyOn(child, 'cancel')

    const result = await callTool(ctx, 'bg_stop', { agent_id: started.childId }, parent)

    expect(result.isError).toBe(false)
    expect(result.value).toEqual({ outcome: 'interrupt-requested', agentId: started.childId })
    expect(cancelSpy).toHaveBeenCalledExactlyOnceWith({ kind: 'parent' }, { keepInbox: true })
    await vi.waitFor(() => { expect(ctx.agents.get(started.childId)).toBeUndefined() }, { timeout: 5_000 })
  })

  it('fails loud when invoked without a calling agent', async () => {
    const { ctx } = await setup()
    for (const [name, args] of [
      ['background_agent', { task: 'x' }],
      ['bg_message', { agent_id: 'x', message: 'y' }],
      ['bg_list', {}],
      ['bg_stop', { agent_id: 'x' }],
    ] as const) {
      const result = await callTool(ctx, name, args)
      expect(result.isError).toBe(true)
      expect(text(result)).toContain('requires a calling agent')
    }
  })

  it('unregisters everything with its plugin fiber (HMR safety)', async () => {
    const ctx = new Context()
    await mountAgentLoopTestDependencies(ctx)
    await ctx.plugin(AgentLoop, { agents: [] })
    await ctx.plugin(SessionProjectionRegistry)
    await ctx.plugin(SubagentRuntime)
    await ctx.plugin(SubagentSpawn, { providerName: 'spawn' })
    const fiber = await ctx.plugin(plugin, { provider: 'spawn' })
    expect(ctx.tools.schemas().some(schema => schema.name === 'background_agent')).toBe(true)
    await fiber.dispose()
    expect(ctx.tools.schemas().some(schema => schema.name === 'background_agent')).toBe(false)
    expect(ctx.tools.schemas().some(schema => schema.name === 'bg_list')).toBe(false)
  })

  it('has the namespace-plugin export shape (no stray default)', () => {
    expect('default' in plugin).toBe(false)
    expect(plugin.name).toBe('background-agents')
    expect(plugin.inject).toEqual(['tools', 'subagents', 'agents', 'sessions'])
    expect(typeof plugin.apply).toBe('function')
  })
})
