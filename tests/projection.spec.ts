import { describe, expect, it } from 'vitest'
import { createUserMessage } from '@deepseek-ai/dsh-llm'
import { CallId } from './call-id.ts'
import { SessionId } from '@deepseek-ai/dsh-session'
import type { SessionEvent, SessionEventMap, SessionEventType, UserMessage } from '@deepseek-ai/dsh-session'
import type { JsonValue } from '@deepseek-ai/dsh-util-values'
import { backgroundAgentsProjectionDefinition as unit } from '../src/projection.ts'
import type { BackgroundAgentEntry } from '../src/projection-schema.ts'
import { noticeLine, PLUGIN } from '../src/vocabulary.ts'

let seq = 0
function event<T extends SessionEventType>(type: T, data: SessionEventMap[T], time = ++seq): SessionEvent {
  return { type, seq, time, data } as unknown as SessionEvent
}

function toolResultEvent(meta: JsonValue, time?: number): SessionEvent {
  return event('tool/result', {
    turn: 1,
    step: 1,
    message: createUserMessage({
      source: { kind: 'tool', callId: CallId('call-1') },
      content: [{ type: 'tool-result', toolCallId: CallId('call-1'), content: [], isError: false }],
    }),
    meta,
  }, time)
}

function userMessageEvent(source: UserMessage['source'], text: string, time?: number): SessionEvent {
  return event('user/message', createUserMessage({
    content: [{ type: 'text', text }],
    source,
  }), time)
}

function fold(events: SessionEvent[]): BackgroundAgentEntry[] {
  return unit.wire.view(events.reduce((state, next) => unit.apply(state, next), unit.init())).agents
}

describe('backgroundAgents projection', () => {
  it('folds a registration fact into a running row with the initial message counted', () => {
    const rows = fold([
      toolResultEvent({ plugin: PLUGIN, action: 'registered', agentId: 'child-1', label: 'writer' }),
    ])
    expect(rows).toEqual([{
      agentId: 'child-1',
      label: 'writer',
      activity: 'running',
      messageCount: 1,
      createdAt: rows[0]!.createdAt,
      lastActiveAt: rows[0]!.lastActiveAt,
    }])
  })

  it('returns the same state reference for unrelated events', () => {
    const state = unit.init()
    const unrelated = event('turn/start', { turn: 1 })
    const foreignMeta = event('tool/result', {
      turn: 1,
      step: 1,
      message: createUserMessage({
        source: { kind: 'tool', callId: CallId('c') },
        content: [{ type: 'tool-result', toolCallId: CallId('c'), content: [], isError: false }],
      }),
      meta: { plugin: 'someone-else', action: 'registered', agentId: 'x' },
    })
    expect(unit.apply(state, unrelated)).toBe(state)
    expect(unit.apply(state, foreignMeta)).toBe(state)
  })

  it('counts accepted deliveries from message facts', () => {
    const rows = fold([
      toolResultEvent({ plugin: PLUGIN, action: 'registered', agentId: 'child-1', label: 'writer' }, 10),
      toolResultEvent({ plugin: PLUGIN, action: 'message', agentId: 'child-1', messageId: 'm1' }, 20),
    ])
    expect(rows[0]).toMatchObject({ messageCount: 2, activity: 'running', lastActiveAt: 20 })
  })

  it('folds progress notices into the last message and running activity', () => {
    const rows = fold([
      toolResultEvent({ plugin: PLUGIN, action: 'registered', agentId: 'child-1', label: 'writer' }, 10),
      userMessageEvent(
        { kind: 'plugin', plugin: PLUGIN, form: 'notice', summary: 'writer progress' },
        noticeLine('child-1', 'progress', 'writer completed a turn: wrote line 1'),
        30,
      ),
    ])
    expect(rows[0]).toMatchObject({ activity: 'running', lastMessage: 'writer completed a turn: wrote line 1', lastActiveAt: 30 })
  })

  it('ignores foreign plugin notices and unparseable lines', () => {
    const base = [toolResultEvent({ plugin: PLUGIN, action: 'registered', agentId: 'child-1', label: 'writer' }, 10)]
    const rows = fold([
      ...base,
      userMessageEvent({ kind: 'plugin', plugin: 'other-plugin', form: 'notice', summary: 'x' }, 'unrelated line', 30),
      userMessageEvent(
        { kind: 'plugin', plugin: PLUGIN, form: 'notice', summary: 'x' },
        'not our format',
        40,
      ),
    ])
    expect(rows[0]).toMatchObject({ lastActiveAt: 10 })
  })

  it('folds the official settled account into an inactive row with the summary', () => {
    const rows = fold([
      toolResultEvent({ plugin: PLUGIN, action: 'registered', agentId: 'child-1', label: 'writer' }, 10),
      userMessageEvent(
        { kind: 'subagent-settled', form: 'notice', summary: 'child settled with a final answer', senderSessionId: SessionId('child-1') },
        'settled notice',
        50,
      ),
    ])
    expect(rows[0]).toMatchObject({ activity: 'inactive', lastMessage: 'child settled with a final answer' })
  })

  it('does not create rows from foreign settled notices', () => {
    const rows = fold([
      userMessageEvent(
        { kind: 'subagent-settled', form: 'notice', summary: 'foreign child', senderSessionId: SessionId('foreign-1') },
        'settled notice',
        50,
      ),
    ])
    expect(rows).toEqual([])
  })

  it('folds the archived notice into an archived row', () => {
    const rows = fold([
      toolResultEvent({ plugin: PLUGIN, action: 'registered', agentId: 'child-1', label: 'writer' }, 10),
      userMessageEvent(
        { kind: 'plugin', plugin: PLUGIN, form: 'notice', summary: 'writer archived (idle timeout)' },
        noticeLine('child-1', 'archived', 'writer archived: idle for 120 minutes'),
        60,
      ),
    ])
    expect(rows[0]).toMatchObject({ activity: 'archived' })
  })

  it('re-activates an archived row when a later delivery is accepted', () => {
    const rows = fold([
      toolResultEvent({ plugin: PLUGIN, action: 'registered', agentId: 'child-1', label: 'writer' }, 10),
      userMessageEvent(
        { kind: 'plugin', plugin: PLUGIN, form: 'notice', summary: 'x' },
        noticeLine('child-1', 'archived', 'idle'),
        60,
      ),
      toolResultEvent({ plugin: PLUGIN, action: 'message', agentId: 'child-1', messageId: 'm2' }, 70),
    ])
    expect(rows[0]).toMatchObject({ activity: 'running', messageCount: 2 })
  })

  it('orders rows by registration time with the id as tiebreak', () => {
    const rows = fold([
      toolResultEvent({ plugin: PLUGIN, action: 'registered', agentId: 'later', label: 'b' }, 200),
      toolResultEvent({ plugin: PLUGIN, action: 'registered', agentId: 'earlier', label: 'a' }, 100),
      toolResultEvent({ plugin: PLUGIN, action: 'registered', agentId: 'tie', label: 'c' }, 100),
    ])
    expect(rows.map(row => row.agentId)).toEqual(['earlier', 'tie', 'later'])
  })

  it('validates its view against the wire schema', () => {
    const state = [toolResultEvent({ plugin: PLUGIN, action: 'registered', agentId: 'child-1', label: 'writer' })]
      .reduce((folded, next) => unit.apply(folded, next), unit.init())
    const rows = unit.wire.view(state).agents
    const parsed = unit.wire.viewSchema.safeParse(unit.wire.view(state))
    expect(parsed.success).toBe(true)
    expect(unit.wire.viewSchema.parse(unit.wire.view(state)).agents).toEqual(rows)
  })

  it('does not count stop facts as deliveries or change activity', () => {
    const rows = fold([
      toolResultEvent({ plugin: PLUGIN, action: 'registered', agentId: 'child-1', label: 'writer' }, 10),
      toolResultEvent({ plugin: PLUGIN, action: 'stop', agentId: 'child-1' }, 40),
    ])
    expect(rows[0]).toMatchObject({ activity: 'running', messageCount: 1, lastActiveAt: 40 })
  })

  it('ignores stop facts for unknown children', () => {
    const rows = fold([toolResultEvent({ plugin: PLUGIN, action: 'stop', agentId: 'ghost' }, 40)])
    expect(rows).toEqual([])
  })

  it('folds structured fact events into rows with the stateVersion bumped for the new semantics', () => {
    expect(unit.stateVersion).toBe(3)
    const rows = fold([
      event('background-agents/fact', { kind: 'registered', agentId: 'child-1', label: 'writer' }, 10),
    ])
    expect(rows).toEqual([{
      agentId: 'child-1',
      label: 'writer',
      activity: 'running',
      messageCount: 1,
      createdAt: rows[0]!.createdAt,
      lastActiveAt: rows[0]!.lastActiveAt,
    }])
  })

  it('folds the dual write path exactly once per fact', () => {
    // The v0.3.0 write path appends both the structured fact and the legacy
    // channel for the same fact: the fold must count each once.
    const rows = fold([
      event('background-agents/fact', { kind: 'registered', agentId: 'child-1', label: 'writer' }, 10),
      toolResultEvent({ plugin: PLUGIN, action: 'registered', agentId: 'child-1', label: 'writer' }, 11),
      event('background-agents/fact', { kind: 'message', agentId: 'child-1', messageId: 'm1' }, 20),
      toolResultEvent({ plugin: PLUGIN, action: 'message', agentId: 'child-1', messageId: 'm1' }, 21),
      event('background-agents/fact', { kind: 'progress', agentId: 'child-1', text: 'wrote line 1' }, 30),
      userMessageEvent(
        { kind: 'plugin', plugin: PLUGIN, form: 'notice', summary: 'writer progress' },
        noticeLine('child-1', 'progress', 'wrote line 1'),
        31,
      ),
    ])
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      agentId: 'child-1',
      messageCount: 2,
      activity: 'running',
      lastMessage: 'wrote line 1',
      lastActiveAt: 30,
    })
  })

  it('folds stop and archived facts with their timestamps', () => {
    const rows = fold([
      event('background-agents/fact', { kind: 'registered', agentId: 'child-1', label: 'writer' }, 10),
      event('background-agents/fact', { kind: 'stop', agentId: 'child-1' }, 40),
      event('background-agents/fact', { kind: 'archived', agentId: 'child-1' }, 60),
    ])
    expect(rows[0]).toMatchObject({
      activity: 'archived',
      stopRequestedAt: 40,
      archivedAt: 60,
      lastActiveAt: 60,
    })
  })

  it('ignores progress, stop, and archived facts for unknown children', () => {
    const rows = fold([
      event('background-agents/fact', { kind: 'progress', agentId: 'ghost', text: 'x' }, 10),
      event('background-agents/fact', { kind: 'stop', agentId: 'ghost' }, 20),
      event('background-agents/fact', { kind: 'archived', agentId: 'ghost' }, 30),
    ])
    expect(rows).toEqual([])
  })

  it('folds the official settled account even for event-provenance rows', () => {
    const rows = fold([
      event('background-agents/fact', { kind: 'registered', agentId: 'child-1', label: 'writer' }, 10),
      userMessageEvent(
        { kind: 'subagent-settled', form: 'notice', summary: 'child settled with a final answer', senderSessionId: SessionId('child-1') },
        'settled notice',
        50,
      ),
    ])
    expect(rows[0]).toMatchObject({ activity: 'inactive', lastMessage: 'child settled with a final answer' })
  })

  it('flips a legacy row to event provenance without double-counting later deliveries', () => {
    // A session upgraded mid-flight: the registration rode the legacy meta,
    // the follow-ups ride the structured events. The count continues from
    // the legacy fold instead of restarting.
    const rows = fold([
      toolResultEvent({ plugin: PLUGIN, action: 'registered', agentId: 'child-1', label: 'writer' }, 10),
      event('background-agents/fact', { kind: 'message', agentId: 'child-1', messageId: 'm1' }, 20),
      toolResultEvent({ plugin: PLUGIN, action: 'message', agentId: 'child-1', messageId: 'm1' }, 21),
    ])
    expect(rows[0]).toMatchObject({ messageCount: 2, lastActiveAt: 20 })
  })

  it('aggregates metrics facts into per-agent cost/status totals', () => {
    const rows = fold([
      event('background-agents/fact', { kind: 'registered', agentId: 'child-1', label: 'writer' }, 10),
      event('background-agents/fact', {
        kind: 'metrics', agentId: 'child-1', turn: 1, durationMs: 1200, inputTokens: 100, outputTokens: 40, error: false,
      }, 20),
      event('background-agents/fact', {
        kind: 'metrics', agentId: 'child-1', turn: 2, durationMs: 800, inputTokens: 60, outputTokens: 30, error: true,
      }, 30),
    ])
    expect(rows[0]!.metrics).toEqual({
      turnCount: 2,
      totalDurationMs: 2000,
      inputTokens: 160,
      outputTokens: 70,
      errorCount: 1,
    })
  })

  it('keeps token totals unknown (null) while any turn reports no token accounting', () => {
    const rows = fold([
      event('background-agents/fact', { kind: 'registered', agentId: 'child-1', label: 'writer' }, 10),
      event('background-agents/fact', {
        kind: 'metrics', agentId: 'child-1', turn: 1, durationMs: null, inputTokens: null, outputTokens: null, error: false,
      }, 20),
    ])
    expect(rows[0]!.metrics).toEqual({
      turnCount: 1,
      totalDurationMs: 0,
      inputTokens: null,
      outputTokens: null,
      errorCount: 0,
    })
  })

  it('a later token report starts the total from zero instead of fabricating one', () => {
    const rows = fold([
      event('background-agents/fact', { kind: 'registered', agentId: 'child-1', label: 'writer' }, 10),
      event('background-agents/fact', {
        kind: 'metrics', agentId: 'child-1', turn: 1, durationMs: 100, inputTokens: null, outputTokens: null, error: false,
      }, 20),
      event('background-agents/fact', {
        kind: 'metrics', agentId: 'child-1', turn: 2, durationMs: 200, inputTokens: 10, outputTokens: 5, error: false,
      }, 30),
    ])
    expect(rows[0]!.metrics).toMatchObject({ turnCount: 2, inputTokens: 10, outputTokens: 5 })
  })

  it('ignores metrics facts for unknown children and leaves lifecycle facts untouched', () => {
    const rows = fold([
      event('background-agents/fact', { kind: 'registered', agentId: 'child-1', label: 'writer' }, 10),
      event('background-agents/fact', {
        kind: 'metrics', agentId: 'ghost', turn: 1, durationMs: 100, inputTokens: 1, outputTokens: 1, error: false,
      }, 20),
    ])
    expect(rows).toHaveLength(1)
    expect(rows[0]).not.toHaveProperty('metrics')
  })
})
