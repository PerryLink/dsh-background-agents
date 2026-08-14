import { describe, expect, it } from 'vitest'
import { createUserMessage } from '@deepseek-ai/dsh-llm'
import { CallId } from '@deepseek-ai/dsh-llm'
import { SessionId } from '@deepseek-ai/dsh-session'
import type { JsonValue, SessionEvent, SessionEventMap, SessionEventType, UserMessage } from '@deepseek-ai/dsh-session'
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
  return unit.view(events.reduce((state, next) => unit.apply(state, next), unit.init())).agents
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
    const rows = unit.view(state).agents
    const parsed = unit.schema.safeParse(unit.view(state))
    expect(parsed.success).toBe(true)
    expect(unit.schema.parse(unit.view(state)).agents).toEqual(rows)
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
})
