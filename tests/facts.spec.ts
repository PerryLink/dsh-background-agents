/**
 * Fact-appender gating and the room-store open-timeout tests: on hosts
 * whose `Session.append` drops the `ignorable` marker (the rc.1–rc.6
 * lines), fact events must NEVER land unmarked, and a stuck storage
 * provider must fail `/room` operations loud instead of hanging.
 * @module dsh-background-agents/tests/facts.spec
 */

import { describe, expect, it, vi } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import { FactAppender } from '../src/facts.ts'
import type { FactAppender as FactAppenderType } from '../src/facts.ts'
import { RoomHub, RoomError } from '../src/room/hub.ts'
import type { RoomConfig } from '../src/room/hub.ts'

vi.mock('../src/audit.ts', async importOriginal => {
  const original = await importOriginal() as typeof import('../src/audit.ts')
  return { ...original, peerSessionVersion: vi.fn(() => '0.1.0-rc.6') }
})

function fakeSession() {
  return { append: vi.fn(() => ({ ignorable: true })) }
}

function roomConfig(over: Partial<RoomConfig> = {}): RoomConfig {
  return {
    maxRooms: 16,
    maxMembersPerRoom: 8,
    maxRoomsPerMember: 4,
    busRetention: 200,
    timelineRetention: 500,
    taskRetention: 50,
    maxMessageChars: 4_000,
    injectRoomBrief: true,
    roomOpenTimeoutMs: 15_000,
    ...over,
  }
}

describe('FactAppender host gating', () => {
  it('skips appends on the known-unmarked rc.6 host with a one-time warning', () => {
    const warn = vi.fn()
    const facts = new FactAppender(false, warn)
    const session = fakeSession()
    facts.append(session as never, 'background-agents/fact', { kind: 'stop', agentId: 'child-1' })
    facts.append(session as never, 'team-room/fact', { kind: 'room-created', roomId: 'r1' })
    expect(session.append).not.toHaveBeenCalled()
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0]![0]).toContain('ignorable marker')
  })

  it('appends with the ignorable request when the opt-in is set', () => {
    const facts = new FactAppender(true, () => {})
    const session = fakeSession()
    facts.append(session as never, 'background-agents/fact', { kind: 'stop', agentId: 'child-1' })
    expect(session.append).toHaveBeenCalledExactlyOnceWith(
      'background-agents/fact',
      { kind: 'stop', agentId: 'child-1' },
      { ignorable: true },
    )
  })

  it('probes the first appended envelope on unversioned hosts and degrades when the marker is dropped', async () => {
    const { peerSessionVersion } = await import('../src/audit.ts')
    vi.mocked(peerSessionVersion).mockReturnValue(null)
    const warn = vi.fn()
    const facts: FactAppenderType = new FactAppender(false, warn)
    const session = { append: vi.fn(() => ({})) } // the host returns an UNMARKED envelope
    facts.append(session as never, 'background-agents/fact', { kind: 'stop', agentId: 'child-1' })
    expect(session.append).toHaveBeenCalledTimes(1) // the probe append
    facts.append(session as never, 'background-agents/fact', { kind: 'stop', agentId: 'child-2' })
    expect(session.append).toHaveBeenCalledTimes(1) // degraded: no further appends
    expect(warn).toHaveBeenCalledTimes(1)
    vi.mocked(peerSessionVersion).mockReset()
  })
})

describe('RoomHub write chain', () => {
  it('createRoom settles with the created room (the enqueue deadlock regression)', async () => {
    const tables = {
      rooms: new Map<string, unknown>(),
      bus: new Map<string, unknown>(),
      tasks: new Map<string, unknown>(),
      timeline: new Map<string, unknown>(),
    }
    const kv = (store: Map<string, unknown>) => ({
      get: (key: string) => store.get(key),
      put: async (key: string, value: unknown) => { store.set(key, value) },
      update: async (key: string, fn: (value: never) => unknown) => {
        const next = fn(store.get(key) as never)
        store.set(key, next)
        return next
      },
      delete: async (key: string) => { store.delete(key) },
      entries: () => store.entries(),
    })
    const ctx = new Context()
    ctx.provide('storageDomain', {
      open: async () => ({
        close: async () => {},
        table: (name: 'rooms' | 'bus' | 'tasks' | 'timeline') => kv(tables[name]),
      }),
    })
    const hub = new RoomHub(ctx, roomConfig(), { get: () => undefined }, { get: () => undefined }, new FactAppender(true, () => {}))
    await hub.open()
    const room = await hub.createRoom('session-1' as never, 'ops room')
    expect(room).toMatchObject({ name: 'ops room', members: [{ sessionId: 'session-1', role: 'owner' }] })
    await expect(hub.allRooms()).resolves.toHaveLength(1)
  }, 30_000)
})

describe('RoomHub open timeout', () => {
  it('fails every room operation loud instead of hanging on a stuck storage provider', async () => {
    const ctx = new Context()
    ctx.provide('storageDomain', { open: () => new Promise(() => {}) })
    const hub = new RoomHub(ctx, roomConfig({ roomOpenTimeoutMs: 50 }), { get: () => undefined }, { get: () => undefined }, new FactAppender(true, () => {}))
    await expect(hub.open()).rejects.toThrow('did not open within 50 ms')
    await expect(hub.allRooms()).rejects.toThrow(/did not open within 50 ms/u)
    await expect(hub.createRoom('session-1' as never, 'test')).rejects.toThrow(/did not open within 50 ms/u)
  }, 30_000)

  it('surfaces the store-unavailable code for the command surface', async () => {
    const ctx = new Context()
    ctx.provide('storageDomain', { open: () => new Promise(() => {}) })
    const hub = new RoomHub(ctx, roomConfig({ roomOpenTimeoutMs: 50 }), { get: () => undefined }, { get: () => undefined }, new FactAppender(true, () => {}))
    await expect(hub.open()).rejects.toSatisfy((error: unknown) => error instanceof RoomError && error.code === 'store-unavailable')
  })
})
