import { afterEach, describe, expect, it } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Context } from '@deepseek-ai/cordis'
import { ToolCallId } from '@deepseek-ai/dsh-llm'
const CallId = ToolCallId
import AgentLoop from '@deepseek-ai/dsh-agent-loop'
import { mountAgentLoopTestDependencies } from '@deepseek-ai/dsh-agent-loop-testkit'
import CommandRuntime from '@deepseek-ai/dsh-commands'
import { SessionId } from '@deepseek-ai/dsh-session'
import JsonlSessionPersistence from '@deepseek-ai/dsh-session-persistence-jsonl'
import SessionProjectionRegistry from '@deepseek-ai/dsh-session-projection'
import Storage from '@deepseek-ai/dsh-storage'
import * as StorageJson from '@deepseek-ai/dsh-storage-json'
import * as StorageDomain from '@deepseek-ai/dsh-storage-domain'
import SubagentRuntime from '@deepseek-ai/dsh-subagent'
import * as SubagentSpawn from '@deepseek-ai/dsh-subagent-spawn-in-process'
import * as plugin from '../src/index.ts'

const testToolSignal = new AbortController().signal

const roots: string[] = []
afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 })
})

/** Mount the full stack plus the storage domain so the room half activates. */
async function setup(config: Partial<plugin.Config> = {}) {
  const ctx = new Context()
  await mountAgentLoopTestDependencies(ctx)
  const root = mkdtempSync(join(tmpdir(), 'dsh-background-agents-room-'))
  roots.push(root)
  await ctx.plugin(JsonlSessionPersistence, { root })
  await ctx.plugin(AgentLoop, { agents: [] })
  await ctx.plugin(SessionProjectionRegistry)
  await ctx.plugin(SubagentRuntime)
  await ctx.plugin(SubagentSpawn, { providerName: 'spawn' })
  await ctx.plugin(Storage)
  await ctx.plugin(StorageJson, { root: join(root, 'storages') })
  await ctx.plugin(StorageDomain, { backend: 'json' })
  await ctx.plugin(CommandRuntime)
  await ctx.plugin(plugin, {
    provider: 'spawn',
    autoReport: false,
    idleSweepIntervalMs: 60_000,
    allowUnmarkedFacts: true,
    ...config,
  })
  const parent = ctx.agentLoop.create(SessionId('parent'), { provider: 'mock', model: 'mock' })
  return { ctx, parent, root }
}

let calls = 0
function callTool(ctx: Context, name: string, args: unknown, agent: unknown) {
  return ctx.tools.execute({
    signal: testToolSignal,
    callId: CallId(`call-${++calls}`),
    name,
    arguments: args,
    agent: agent as never,
  })
}

/** Create one room through the real `/room create` command and return its id. */
async function createRoom(ctx: Context, agent: unknown, name: string): Promise<string> {
  const execution = await ctx.commands.execute(agent as never, `/room create ${name}`, [], new AbortController().signal)
  const text = execution?.result.kind === 'success' ? execution.result.text : undefined
  if (text === undefined) throw new Error(`/room create failed: ${JSON.stringify(execution?.result)}`)
  const roomId = text.match(/Room created: (\S+)/u)?.[1]
  if (roomId === undefined) throw new Error(`/room create returned no room id: ${text}`)
  return roomId
}

describe('dsh-background-agents room tools', () => {
  it('registers the eight room tools once the storage domain is composed', async () => {
    const { ctx } = await setup()
    const names = ctx.tools.schemas().map(schema => schema.name)
    expect(names).toEqual(expect.arrayContaining([
      'room_list_rooms', 'room_post', 'room_read', 'room_list_tasks',
      'room_create_task', 'room_claim_task', 'room_transfer_task', 'room_complete_task',
    ]))
  })

  it('keeps room_create_task schema, canonical value, and content blocks stable', async () => {
    const { ctx, parent } = await setup()
    const roomId = await createRoom(ctx, parent, 'test room')

    const schema = ctx.tools.schemas().find(entry => entry.name === 'room_create_task')!
    expect(schema.parameters).toEqual({
      type: 'object',
      properties: {
        room_id: { type: 'string', description: 'The room id from room_list_rooms.' },
        title: { type: 'string', description: 'Short task title (the board row).' },
        description: { type: 'string', description: 'Optional task details.' },
        assignee: { type: 'string', description: 'Optional member session id to assign the task to; omit to leave it unassigned.' },
      },
      required: ['room_id', 'title'],
    })

    const result = await callTool(ctx, 'room_create_task', { room_id: roomId, title: 'write the report' }, parent)
    expect(result.isError).toBe(false)
    const value = result.value as { taskId: string; status: string }
    expect(value.status).toBe('todo')
    expect(typeof value.taskId).toBe('string')
    expect(result.content).toEqual([
      { type: 'text', text: `task ${value.taskId} created on room ${roomId}` },
    ])
  })

  it('keeps room_post schema, canonical value, and content blocks stable', async () => {
    const { ctx, parent } = await setup()
    const roomId = await createRoom(ctx, parent, 'post room')

    const result = await callTool(ctx, 'room_post', { room_id: roomId, text: 'hello team' }, parent)
    expect(result.isError).toBe(false)
    const value = result.value as { roomId: string; seq: number }
    expect(value.roomId).toBe(roomId)
    expect(value.seq).toBe(0)
    expect(result.content).toEqual([
      { type: 'text', text: `posted to room ${roomId} (broadcast, seq 0)` },
    ])
  })

  it('serializes concurrent room task creation through the hub write chain', async () => {
    const { ctx, parent } = await setup()
    const roomId = await createRoom(ctx, parent, 'concurrency room')

    const settled = await Promise.all(Array.from({ length: 8 }, (_, index) =>
      callTool(ctx, 'room_create_task', { room_id: roomId, title: `task ${index}` }, parent)))
    expect(settled.every(result => result.isError === false)).toBe(true)

    const board = await callTool(ctx, 'room_list_tasks', { room_id: roomId }, parent)
    expect(board.isError).toBe(false)
    const tasks = (board.value as { tasks: Array<{ title: string }> }).tasks
    expect(tasks).toHaveLength(8)
    expect(tasks.map(task => task.title).sort()).toEqual(Array.from({ length: 8 }, (_, index) => `task ${index}`).sort())
  })

  it('claims and completes a task through the write chain without hanging', async () => {
    const { ctx, parent } = await setup()
    const roomId = await createRoom(ctx, parent, 'claim room')
    const created = await callTool(ctx, 'room_create_task', { room_id: roomId, title: 'finish the draft' }, parent)
    const taskId = (created.value as { taskId: string }).taskId

    const claimed = await callTool(ctx, 'room_claim_task', { room_id: roomId, task_id: taskId }, parent)
    expect(claimed.isError).toBe(false)
    expect(claimed.value).toEqual({ taskId, status: 'in-progress', assigneeSessionId: parent.id })

    const completed = await callTool(ctx, 'room_complete_task', { room_id: roomId, task_id: taskId }, parent)
    expect(completed.isError).toBe(false)
    expect(completed.value).toEqual({ taskId, status: 'done' })
  })

  it('fails closed for a room transfer without an approval service', async () => {
    const { ctx, parent } = await setup()
    const roomId = await createRoom(ctx, parent, 'transfer room')
    const created = await callTool(ctx, 'room_create_task', { room_id: roomId, title: 'handoff' }, parent)
    const taskId = (created.value as { taskId: string }).taskId

    // No approval service is composed here, so the cross-member handoff must
    // fail closed with the stable approval-unavailable code.
    const transfer = await callTool(ctx, 'room_transfer_task', { room_id: roomId, task_id: taskId, to: 'other-session' }, parent)
    expect(transfer.isError).toBe(true)
    expect((transfer.content as Array<{ text: string }>).map(block => block.text).join('')).toContain('no approval service is composed')
  })
})
