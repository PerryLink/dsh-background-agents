import { describe, expect, it } from 'vitest'
import { buildAgentRows, buildCostReport, extractResultText, relativeTime, rowStatus } from '../src/client/presenter.ts'
import type { BackgroundAgentEntry } from '../src/projection-schema.ts'
import { noticeLine, parseNotice, PLUGIN, isBackgroundAgentsMeta } from '../src/vocabulary.ts'

function entry(over: Partial<BackgroundAgentEntry> = {}): BackgroundAgentEntry {
  return {
    agentId: 'child-1',
    label: 'writer',
    activity: 'running',
    messageCount: 3,
    createdAt: 100,
    lastActiveAt: 200,
    ...over,
  }
}

function list(projection: unknown, over: Record<string, unknown> = {}) {
  return {
    byId: {
      parent: {
        id: 'parent',
        running: false,
        displayTitle: 'parent session',
        projectionValues: { backgroundAgents: projection },
      },
      'child-1': { id: 'child-1', running: false, displayTitle: 'child title' },
      'child-2': { id: 'child-2', running: false, displayTitle: 'child two title' },
      ...over,
    },
  }
}

describe('client presenter', () => {
  it('builds rows from every parent that projects agents', () => {
    const rows = buildAgentRows(list({
      agents: [entry(), entry({ agentId: 'child-2', label: '', createdAt: 50 })],
    }))
    expect(rows).toEqual([
      expect.objectContaining({ agentId: 'child-2', label: 'child two title', status: 'idle' }),
      expect.objectContaining({ agentId: 'child-1', label: 'writer', status: 'idle' }),
    ])
  })

  it('overlays the live running bit on the durable fact', () => {
    const rows = buildAgentRows(list({ agents: [entry()] }, {
      'child-1': { id: 'child-1', running: true, displayTitle: 'child title' },
    }))
    expect(rows[0]!.status).toBe('running')
  })

  it('ignores sessions without a valid projection value', () => {
    expect(buildAgentRows(list(undefined))).toEqual([])
    expect(buildAgentRows(list('garbage'))).toEqual([])
    expect(buildAgentRows(list({ agents: [{ agentId: 'x' }] }))).toEqual([])
  })

  it('derives each display status from the durable activity', () => {
    const base = entry()
    expect(rowStatus({ ...base, activity: 'archived' }, true)).toBe('archived')
    expect(rowStatus(base, true)).toBe('running')
    expect(rowStatus({ ...base, activity: 'inactive' }, false)).toBe('settled')
    expect(rowStatus(base, false)).toBe('idle')
  })

  it('buckets relative time', () => {
    const at = 1_000_000
    expect(relativeTime(at, at + 500)).toEqual({ unit: 'now', n: 0 })
    expect(relativeTime(at, at + 5 * 60_000)).toEqual({ unit: 'minutes', n: 5 })
    expect(relativeTime(at, at + 3 * 3_600_000)).toEqual({ unit: 'hours', n: 3 })
    expect(relativeTime(at, at + 2 * 86_400_000)).toEqual({ unit: 'days', n: 2 })
    expect(relativeTime(at, at + 45 * 86_400_000)).toEqual({ unit: 'months', n: 1 })
    expect(relativeTime(at, at + 400 * 86_400_000)).toEqual({ unit: 'years', n: 1 })
  })

  it('carries the parent title on every row for disambiguation', () => {
    const rows = buildAgentRows(list({ agents: [entry()] }))
    expect(rows[0]!.parentTitle).toBe('parent session')
    const bare = buildAgentRows(list({ agents: [entry()] }, {
      parent: { id: 'parent', running: false, projectionValues: { backgroundAgents: { agents: [entry()] } } },
    }))
    expect(bare[0]!.parentTitle).toBeUndefined()
  })

  it('extracts the last assistant text from a history page', () => {
    const assistant = (blocks: unknown[]) => ({
      event: {
        type: 'assistant/message',
        data: { message: { content: blocks } },
      },
    })
    expect(extractResultText([
      { event: { type: 'user/message', data: {} } },
      assistant([{ type: 'text', text: 'first' }]),
      assistant([{ type: 'text', text: '  second  ' }]),
    ])).toBe('second')
  })

  it('skips reasoning-only messages and empty pages', () => {
    const reasoningOnly = {
      event: {
        type: 'assistant/message',
        data: { message: { content: [{ type: 'reasoning', text: 'thinking' }] } },
      },
    }
    expect(extractResultText([reasoningOnly])).toBe('')
    expect(extractResultText([])).toBe('')
    expect(extractResultText([{ event: { type: 'tool/result', data: {} } }])).toBe('')
  })

  it('carries aggregated metrics onto the row when the entry reports them', () => {
    const rows = buildAgentRows(list({
      agents: [entry({
        metrics: { turnCount: 2, totalDurationMs: 1500, inputTokens: 30, outputTokens: 20, errorCount: 1 },
      })],
    }))
    expect(rows[0]!.metrics).toEqual({ turnCount: 2, totalDurationMs: 1500, inputTokens: 30, outputTokens: 20, errorCount: 1 })
    // A row without metrics leaves the field absent (unknown, not zero).
    expect(buildAgentRows(list({ agents: [entry()] }))[0]!.metrics).toBeUndefined()
  })

  it('builds a JSON cost report with error rate and null-preserving unknowns', () => {
    const rows = buildAgentRows(list({
      agents: [
        entry({
          metrics: { turnCount: 4, totalDurationMs: 4000, inputTokens: 100, outputTokens: 40, errorCount: 1 },
        }),
        entry({ agentId: 'child-2', metrics: { turnCount: 2, totalDurationMs: 0, inputTokens: null, outputTokens: null, errorCount: 0 } }),
        entry({ agentId: 'child-3' }),
      ],
    }))
    const report = buildCostReport(rows, 999)
    expect(report.generatedAt).toBe(999)
    const byId = new Map(report.agents.map(agent => [agent.agentId, agent]))
    expect(byId.get('child-1')).toMatchObject({ turnCount: 4, inputTokens: 100, outputTokens: 40, errorCount: 1, errorRate: 0.25 })
    expect(byId.get('child-2')).toMatchObject({ turnCount: 2, durationMs: 0, inputTokens: null, outputTokens: null, errorRate: 0 })
    expect(byId.get('child-3')).toMatchObject({ turnCount: 0, durationMs: null, inputTokens: null, outputTokens: null, errorCount: 0, errorRate: null })
  })
})

describe('notice vocabulary', () => {
  it('round-trips the canonical head', () => {
    const line = noticeLine('child-9', 'progress', 'writer completed a turn: line')
    expect(line).toBe('[background-agent child-9] progress: writer completed a turn: line')
    expect(parseNotice(line)).toEqual({ agentId: 'child-9', kind: 'progress', text: 'writer completed a turn: line' })
  })

  it('rejects foreign and malformed lines', () => {
    expect(parseNotice('ordinary notice')).toBeUndefined()
    expect(parseNotice('[background-agent ] progress: x')).toBeUndefined()
    expect(parseNotice('[background-agent c1] mystery: x')).toBeUndefined()
  })

  it('guards replay metadata by producer and action', () => {
    expect(isBackgroundAgentsMeta({ plugin: PLUGIN, action: 'registered', agentId: 'c1', label: 'l' }))
      .toEqual({ plugin: PLUGIN, action: 'registered', agentId: 'c1', label: 'l' })
    expect(isBackgroundAgentsMeta({ plugin: PLUGIN, action: 'message', agentId: 'c1', messageId: 'm1' }))
      .toEqual({ plugin: PLUGIN, action: 'message', agentId: 'c1', messageId: 'm1' })
    expect(isBackgroundAgentsMeta({ plugin: PLUGIN, action: 'stop', agentId: 'c1' }))
      .toEqual({ plugin: PLUGIN, action: 'stop', agentId: 'c1' })
    expect(isBackgroundAgentsMeta({ plugin: 'other', action: 'registered', agentId: 'c1' })).toBeUndefined()
    expect(isBackgroundAgentsMeta({ plugin: PLUGIN, action: 'registered', agentId: 'c1' })).toBeUndefined()
    expect(isBackgroundAgentsMeta({ plugin: PLUGIN, action: 'explode', agentId: 'c1' })).toBeUndefined()
    expect(isBackgroundAgentsMeta('meta')).toBeUndefined()
  })
})
