/**
 * Per-turn observability capture: a pure fold over one child session's events
 * that produces the `metrics` fact payload at each `turn/end`. The lifecycle
 * observer owns the accumulator state (on the tracked child); this module is
 * the cache-free reducer, so it is unit-testable without a runtime.
 *
 * Token accounting is the adapter's `assistant/message` `usage`, deduplicated
 * per step by last-wins (a retry within a step replaces its earlier sample, so
 * a turn never double-counts). A turn that reported no usage folds `null`
 * tokens — the projection then keeps its totals as "unknown" instead of
 * fabricating a zero.
 *
 * @module dsh-background-agents/metrics
 */

import type { SessionEvent } from '@deepseek-ai/dsh-session'

/** One child turn's observability sample (the `metrics` fact payload minus kind/agentId). */
export interface MetricObservation {
  /** The child turn this sample belongs to (provenance only). */
  readonly turn: number
  /** Turn wall time ms (`turn/start` → `turn/end`), null when the start was not observed. */
  readonly durationMs: number | null
  /** Turn uncached input tokens, null when the adapter reported none. */
  readonly inputTokens: number | null
  /** Turn output tokens, null when the adapter reported none. */
  readonly outputTokens: number | null
  /** Whether the turn ended with `reason.kind === 'error'`. */
  readonly error: boolean
}

/** One step's final token pair (last-wins within the turn). */
interface StepUsage {
  readonly inputTokens: number
  readonly outputTokens: number
}

/** In-flight accumulator for one child's current turn. */
export interface TurnMetricState {
  /** Epoch ms of the turn's `turn/start`, null when not yet observed. */
  readonly startAt: number | null
  /** Final usage per step, keyed by step number (retries replace, never double-count). */
  readonly usageByStep: Readonly<Record<number, StepUsage>>
}

/** Empty accumulator: no open turn, no token samples. */
export const emptyTurnMetricState: TurnMetricState = { startAt: null, usageByStep: {} }

/**
 * Fold one child session event into the accumulator. Returns the next state
 * plus, at `turn/end`, the completed turn's observation (with the state reset
 * to empty for the next turn).
 * @param state - the prior accumulator state.
 * @param event - one child session event (already owned by the lifecycle observer).
 * @returns the next state and, at `turn/end`, the observation.
 */
export function foldTurnMetrics(
  state: TurnMetricState,
  event: SessionEvent,
): { readonly state: TurnMetricState; readonly observation?: MetricObservation } {
  switch (event.type) {
    case 'turn/start':
      return { state: { startAt: event.time, usageByStep: {} } }
    case 'assistant/message': {
      const usage = event.data.usage
      if (usage === undefined) return { state }
      return {
        state: {
          ...state,
          usageByStep: {
            ...state.usageByStep,
            [event.data.step]: { inputTokens: usage.inputTokens, outputTokens: usage.outputTokens },
          },
        },
      }
    }
    case 'turn/end': {
      const usages = Object.values(state.usageByStep)
      const observation: MetricObservation = {
        turn: event.data.turn,
        durationMs: state.startAt === null ? null : Math.max(0, event.time - state.startAt),
        inputTokens: usages.length === 0 ? null : usages.reduce((sum, usage) => sum + usage.inputTokens, 0),
        outputTokens: usages.length === 0 ? null : usages.reduce((sum, usage) => sum + usage.outputTokens, 0),
        error: event.data.reason.kind === 'error',
      }
      return { state: emptyTurnMetricState, observation }
    }
    default:
      return { state }
  }
}
