import { describe, expect, it, vi } from 'vitest'
import { SessionId } from '@deepseek-ai/dsh-session'
import { SubagentError } from '@deepseek-ai/dsh-subagent'
import {
  BackgroundAgentLifecycle, countBackgroundAgents, reportProgress, sessionLastText, sweepIdle,
  type LifecycleConfig, type LiveAgents, type LiveSessions,
} from '../src/lifecycle.ts'
import { parseNotice } from '../src/vocabulary.ts'
import { FactAppender } from '../src/facts.ts'

const childId = SessionId('child-1')
const parentId = SessionId('parent')

/** Permissive appender: lifecycle specs assert the raw append call shape, not host gating. */
const facts = new FactAppender(true, () => {})

function policy(over: Partial<LifecycleConfig> = {}): LifecycleConfig {
  return {
    autoReport: true,
    reportThrottleMs: 15_000,
    reportSummaryMaxChars: 120,
    autoArchive: true,
    idleTimeoutMinutes: 120,
    idleSweepIntervalMs: 60_000,
    reportDelivery: 'quiet',
    ...over,
  }
}

interface FakeParent {
  readonly id: SessionId
  readonly inject: ReturnType<typeof vi.fn>
  readonly followup: ReturnType<typeof vi.fn>
  readonly session: { readonly append: ReturnType<typeof vi.fn> }
}

function makeAgents(parent: FakeParent | undefined): LiveAgents {
  const map = new Map<string, unknown>()
  if (parent !== undefined) map.set(parentId, parent)
  return { get: id => map.get(id) as never } as LiveAgents
}

function childSessionWithAssistant(text: string): { events: unknown[] } {
  const message = {
    id: 'msg-1',
    role: 'assistant',
    content: [{ type: 'text', text }],
    source: { kind: 'model', provider: 'mock', model: 'mock' },
  }
  return {
    events: [{
      type: 'assistant/message',
      seq: 0,
      time: 1,
      data: { turn: 1, step: 1, message },
    }],
  }
}

function childSessionWithReasoning(text: string): { events: unknown[] } {
  const message = {
    id: 'msg-1',
    role: 'assistant',
    content: [{ type: 'reasoning', text }],
    source: { kind: 'model', provider: 'mock', model: 'mock' },
  }
  return {
    events: [{
      type: 'assistant/message',
      seq: 0,
      time: 1,
      data: { turn: 1, step: 1, message },
    }],
  }
}

function makeSessions(child?: unknown): LiveSessions {
  const map = new Map<string, unknown>()
  if (child !== undefined) map.set(childId, child)
  return { get: id => map.get(id) as never }
}

describe('reportProgress throttle and bounds', () => {
  it('emits one report per child within the throttle window', () => {
    const lifecycle = new BackgroundAgentLifecycle()
    lifecycle.register(childId, parentId, 'writer', 0)
    const inject = vi.fn()
    const parent: FakeParent = { id: parentId, inject, followup: vi.fn(), session: { append: vi.fn() } }
    const agents = makeAgents(parent)
    const sessions = makeSessions(childSessionWithAssistant('wrote line 1'))
    const child = lifecycle.get(childId)!

    const first = reportProgress(agents, sessions, policy(), lifecycle, child, 10_000, facts)
    const second = reportProgress(agents, sessions, policy(), lifecycle, child, 20_000, facts)

    expect(first).toBe(true)
    expect(second).toBe(false)
    expect(inject).toHaveBeenCalledTimes(1)
    const message = inject.mock.calls[0]![0]
    expect(message.source).toMatchObject({ kind: 'plugin', plugin: 'dsh-background-agents', form: 'notice' })
    const head = parseNotice(message.content[0].text)
    expect(head).toMatchObject({ agentId: childId, kind: 'progress' })
    expect(head!.text).toContain('wrote line 1')
    expect(parent.session.append).toHaveBeenCalledExactlyOnceWith(
      'background-agents/fact',
      { kind: 'progress', agentId: childId, text: expect.stringContaining('wrote line 1') },
      { ignorable: true },
    )
  })

  it('emits again after the throttle window elapses', () => {
    const lifecycle = new BackgroundAgentLifecycle()
    lifecycle.register(childId, parentId, 'writer', 0)
    const inject = vi.fn()
    const parent: FakeParent = { id: parentId, inject, followup: vi.fn(), session: { append: vi.fn() } }
    const agents = makeAgents(parent)
    const sessions = makeSessions(childSessionWithAssistant('first'))
    const child = lifecycle.get(childId)!
    reportProgress(agents, sessions, policy(), lifecycle, child, 0, facts)
    expect(reportProgress(agents, sessions, policy(), lifecycle, child, 20_000, facts)).toBe(true)
    expect(inject).toHaveBeenCalledTimes(2)
  })

  it('stays silent when autoReport is off', () => {
    const lifecycle = new BackgroundAgentLifecycle()
    lifecycle.register(childId, parentId, 'writer', 0)
    const inject = vi.fn()
    const parent: FakeParent = { id: parentId, inject, followup: vi.fn(), session: { append: vi.fn() } }
    const child = lifecycle.get(childId)!
    expect(reportProgress(makeAgents(parent), makeSessions(childSessionWithAssistant('x')), policy({ autoReport: false }), lifecycle, child, 10_000, facts)).toBe(false)
    expect(inject).not.toHaveBeenCalled()
  })

  it('wakeup delivery starts a parent turn through followup instead of inject', () => {
    const lifecycle = new BackgroundAgentLifecycle()
    lifecycle.register(childId, parentId, 'writer', 0)
    const inject = vi.fn()
    const followup = vi.fn()
    const parent: FakeParent = { id: parentId, inject, followup, session: { append: vi.fn() } }
    const child = lifecycle.get(childId)!

    expect(reportProgress(makeAgents(parent), makeSessions(childSessionWithAssistant('wake line')), policy({ reportDelivery: 'wakeup' }), lifecycle, child, 10_000, facts)).toBe(true)
    expect(followup).toHaveBeenCalledTimes(1)
    expect(inject).not.toHaveBeenCalled()
    const head = parseNotice(followup.mock.calls[0]![0].content[0].text)
    expect(head).toMatchObject({ agentId: childId, kind: 'progress' })
    expect(head!.text).toContain('wake line')
    expect(parent.session.append).toHaveBeenCalledExactlyOnceWith(
      'background-agents/fact',
      { kind: 'progress', agentId: childId, text: expect.stringContaining('wake line') },
      { ignorable: true },
    )
  })

  it('stays silent when the parent agent is gone', () => {
    const lifecycle = new BackgroundAgentLifecycle()
    lifecycle.register(childId, parentId, 'writer', 0)
    const child = lifecycle.get(childId)!
    expect(reportProgress(makeAgents(undefined), makeSessions(childSessionWithAssistant('x')), policy(), lifecycle, child, 10_000, facts)).toBe(false)
  })

  it('bounds the injected line by reportSummaryMaxChars with an ellipsis', () => {
    const lifecycle = new BackgroundAgentLifecycle()
    lifecycle.register(childId, parentId, 'writer', 0)
    const inject = vi.fn()
    const parent: FakeParent = { id: parentId, inject, followup: vi.fn(), session: { append: vi.fn() } }
    const child = lifecycle.get(childId)!
    reportProgress(makeAgents(parent), makeSessions(childSessionWithAssistant('a'.repeat(500))), policy({ reportSummaryMaxChars: 50 }), lifecycle, child, 0, facts)
    const head = parseNotice(inject.mock.calls[0]![0].content[0].text)!
    expect(head.text.length).toBeLessThanOrEqual(100)
    expect(head.text.endsWith('…')).toBe(true)
  })
})

describe('idle sweep', () => {
  function fakeCtx(interrupt: ReturnType<typeof vi.fn>) {
    return {
      subagents: { interrupt },
      logger: () => ({ warn: vi.fn() }),
      get: () => undefined,
    } as never
  }

  it('archives a quiet child past the idle window, notices the parent, and requests interruption', () => {
    const lifecycle = new BackgroundAgentLifecycle()
    lifecycle.register(childId, parentId, 'writer', 0)
    const inject = vi.fn()
    const parent: FakeParent = { id: parentId, inject, followup: vi.fn(), session: { append: vi.fn() } }
    const interrupt = vi.fn()
    // The live child sits idle (not running): eligible for archiving.
    const childAgent = { id: childId, status: 'idle' }
    const agentFace = { get: (id: SessionId) => (id === childId ? childAgent : parent) } as unknown as LiveAgents

    sweepIdle(fakeCtx(interrupt), agentFace, policy({ idleTimeoutMinutes: 120 }), lifecycle, 121 * 60_000, facts)

    expect(lifecycle.get(childId)!.archived).toBe(true)
    expect(interrupt).toHaveBeenCalledExactlyOnceWith(childId, { kind: 'ancestor', agent: parent })
    const message = inject.mock.calls[0]![0]
    const head = parseNotice(message.content[0].text)
    expect(head).toMatchObject({ agentId: childId, kind: 'archived' })
    expect(parent.session.append).toHaveBeenCalledExactlyOnceWith(
      'background-agents/fact',
      { kind: 'archived', agentId: childId },
      { ignorable: true },
    )
  })

  it('leaves a mid-turn child alone even past the idle window', () => {
    const lifecycle = new BackgroundAgentLifecycle()
    lifecycle.register(childId, parentId, 'writer', 0)
    const inject = vi.fn()
    const parent: FakeParent = { id: parentId, inject, followup: vi.fn(), session: { append: vi.fn() } }
    const interrupt = vi.fn()
    const childAgent = { id: childId, status: 'running' }
    const agentFace = { get: (id: SessionId) => (id === childId ? childAgent : parent) } as unknown as LiveAgents

    sweepIdle(fakeCtx(interrupt), agentFace, policy(), lifecycle, 121 * 60_000, facts)

    expect(lifecycle.get(childId)!.archived).toBe(false)
    expect(interrupt).not.toHaveBeenCalled()
    expect(inject).not.toHaveBeenCalled()
  })

  it('never archives when autoArchive is off, but still reclaims dead cache entries', () => {
    const lifecycle = new BackgroundAgentLifecycle()
    lifecycle.register(childId, parentId, 'writer', 0)
    const inject = vi.fn()
    const parent: FakeParent = { id: parentId, inject, followup: vi.fn(), session: { append: vi.fn() } }
    const interrupt = vi.fn()
    const childAgent = { id: childId, status: 'idle' }
    const agentFace = { get: (id: SessionId) => (id === childId ? childAgent : parent) } as unknown as LiveAgents

    sweepIdle(fakeCtx(interrupt), agentFace, policy({ autoArchive: false }), lifecycle, 121 * 60_000, facts)

    // The quiet child survives the idle window: no archive fact, no notice,
    // no interrupt request.
    expect(lifecycle.get(childId)!.archived).toBe(false)
    expect(interrupt).not.toHaveBeenCalled()
    expect(inject).not.toHaveBeenCalled()
    expect(parent.session.append).not.toHaveBeenCalled()

    // The dead-entry reclamation branch still runs: both agents gone -> drop.
    sweepIdle(fakeCtx(interrupt), { get: () => undefined }, policy({ autoArchive: false }), lifecycle, 1_000, facts)
    expect(lifecycle.has(childId)).toBe(false)
  })

  it('drops cache entries whose parent and child agents are both gone', () => {
    const lifecycle = new BackgroundAgentLifecycle()
    lifecycle.register(childId, parentId, 'writer', 0)
    const interrupt = vi.fn()
    sweepIdle(fakeCtx(interrupt), { get: () => undefined }, policy(), lifecycle, 1_000, facts)
    expect(lifecycle.has(childId)).toBe(false)
  })

  it('releases archived entries on the next pass', () => {
    const lifecycle = new BackgroundAgentLifecycle()
    lifecycle.register(childId, parentId, 'writer', 0)
    lifecycle.archive(childId)
    sweepIdle(fakeCtx(vi.fn()), { get: () => undefined }, policy(), lifecycle, 1_000, facts)
    expect(lifecycle.has(childId)).toBe(false)
  })
})

describe('sessionLastText extraction', () => {
  it('returns the text blocks by default', () => {
    expect(sessionLastText(childSessionWithAssistant('final answer') as never)).toBe('final answer')
  })

  it('returns empty for a reasoning-only message without the fallback', () => {
    expect(sessionLastText(childSessionWithReasoning('thinking hard') as never)).toBe('')
  })

  it('falls back to reasoning blocks when allowed and flags the source', () => {
    const reasoning = { used: false }
    expect(sessionLastText(childSessionWithReasoning('thinking hard') as never, { allowReasoning: true, reasoning })).toBe('thinking hard')
    expect(reasoning.used).toBe(true)
  })

  it('does not flag the source when the fallback finds no reasoning either', () => {
    const reasoning = { used: false }
    expect(sessionLastText({ events: [] } as never, { allowReasoning: true, reasoning })).toBe('')
    expect(reasoning.used).toBe(false)
  })
})

describe('cap counting', () => {
  it('falls back to the live registry count when the durable listing throws', async () => {
    const ctx = {
      subagents: {
        listChildren: () => Promise.reject(new SubagentError('no store', 'SUBAGENT_CONTROL_SESSION_STORE_UNAVAILABLE')),
      },
      get: () => undefined,
    } as never
    const lifecycle = new BackgroundAgentLifecycle()
    lifecycle.register(childId, parentId, 'writer', 0)
    const parent = { id: parentId, session: { events: [] } } as never
    expect(await countBackgroundAgents(ctx, parent, lifecycle, new AbortController().signal)).toBe(1)
  })

  it('propagates non-catalog failures', async () => {
    const ctx = {
      subagents: { listChildren: () => Promise.reject(new Error('boom')) },
      get: () => undefined,
    } as never
    const lifecycle = new BackgroundAgentLifecycle()
    const parent = { id: parentId, session: { events: [] } } as never
    await expect(countBackgroundAgents(ctx, parent, lifecycle, new AbortController().signal)).rejects.toThrow('boom')
  })
})
