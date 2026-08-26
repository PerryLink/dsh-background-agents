import { describe, expect, it } from 'vitest'
import type { SessionEvent } from '@deepseek-ai/dsh-session'
import { emptyTurnMetricState, foldTurnMetrics, type TurnMetricState } from '../src/metrics.ts'

let seq = 0
/** One synthetic child session event (payloads are structural: the fold reads only type-narrowed leaves). */
function event(type: SessionEvent['type'], data: unknown, time = ++seq): SessionEvent {
  return { type, seq, time, data } as SessionEvent
}

/** Fold a sequence, returning the observation emitted at each turn/end. */
function observations(events: SessionEvent[]): ReturnType<typeof foldTurnMetrics>['observation'][] {
  let state: TurnMetricState = emptyTurnMetricState
  const out: ReturnType<typeof foldTurnMetrics>['observation'][] = []
  for (const next of events) {
    const folded = foldTurnMetrics(state, next)
    state = folded.state
    if (folded.observation !== undefined) out.push(folded.observation)
  }
  return out
}

describe('foldTurnMetrics', () => {
  it('emits nothing for unrelated events', () => {
    expect(observations([event('turn/start', { turn: 1 }), event('step/start', { turn: 1, step: 1 })])).toEqual([])
  })

  it('captures duration, tokens, and the error flag at turn/end', () => {
    const obs = observations([
      event('turn/start', { turn: 1 }, 100),
      event('assistant/message', { turn: 1, step: 1, usage: { inputTokens: 10, outputTokens: 5 } }, 300),
      event('turn/end', { turn: 1, reason: { kind: 'completed' } }, 1300),
    ])
    expect(obs).toEqual([{
      turn: 1,
      durationMs: 1200,
      inputTokens: 10,
      outputTokens: 5,
      error: false,
    }])
  })

  it('flags a failed turn and nulls the duration when no start was observed', () => {
    const obs = observations([
      event('assistant/message', { turn: 1, step: 1, usage: { inputTokens: 2, outputTokens: 1 } }, 50),
      event('turn/end', { turn: 1, reason: { kind: 'error', error: { code: 'UNKNOWN', message: 'boom' } } }, 80),
    ])
    expect(obs).toEqual([{
      turn: 1,
      durationMs: null,
      inputTokens: 2,
      outputTokens: 1,
      error: true,
    }])
  })

  it('sums token usage across steps with last-wins per step (retry never double-counts)', () => {
    const obs = observations([
      event('turn/start', { turn: 1 }, 0),
      event('assistant/message', { turn: 1, step: 1, usage: { inputTokens: 100, outputTokens: 50 } }, 10),
      // A retry within step 1 replaces the earlier sample.
      event('assistant/message', { turn: 1, step: 1, usage: { inputTokens: 120, outputTokens: 60 } }, 20),
      event('assistant/message', { turn: 1, step: 2, usage: { inputTokens: 30, outputTokens: 10 } }, 30),
      event('turn/end', { turn: 1, reason: { kind: 'completed' } }, 40),
    ])
    expect(obs[0]).toMatchObject({ inputTokens: 150, outputTokens: 70 })
  })

  it('nulls tokens when no step reported usage', () => {
    const obs = observations([
      event('turn/start', { turn: 1 }, 10),
      event('assistant/message', { turn: 1, step: 1 }, 20),
      event('turn/end', { turn: 1, reason: { kind: 'max-tokens' } }, 30),
    ])
    expect(obs[0]).toMatchObject({ inputTokens: null, outputTokens: null, error: false })
  })

  it('resets the accumulator after each turn/end', () => {
    let state = emptyTurnMetricState
    state = foldTurnMetrics(state, event('turn/start', { turn: 1 }, 10)).state
    state = foldTurnMetrics(state, event('turn/end', { turn: 1, reason: { kind: 'completed' } }, 20)).state
    expect(state).toEqual(emptyTurnMetricState)
  })
})
