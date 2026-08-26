/**
 * Protocol-level tests for the cross-ecosystem inbound bridge: the pure
 * JSON-RPC decode/map functions, the delivery mapping, and the adapter +
 * coordinator lifecycle (start/dispose). No harness services are mounted.
 */

import { describe, expect, it } from 'vitest'
import { EventEmitter } from 'node:events'
import { PassThrough } from 'node:stream'
import type { ChildProcess, SpawnOptions } from 'node:child_process'
import {
  deliveriesFor, InboundCoordinator, jsonRpcErrorResponse, mapInboundEvent,
  parseInboundLine, StdioJsonRpcInbound,
} from '../src/inbound.ts'
import type { InboundAdapter, InboundSink, InboundLogger } from '../src/inbound.ts'

/** A fake child process whose stdout I can push into and whose stdin records writes. */
interface FakeChild {
  readonly child: ChildProcess
  readonly stdout: PassThrough
  readonly written: string[]
  killed(): boolean
}

function fakeChild(): FakeChild {
  const emitter = new EventEmitter()
  const stdout = new PassThrough()
  const stderr = new PassThrough()
  const written: string[] = []
  let killed = false
  const stdin = {
    write(chunk: string): boolean {
      written.push(chunk)
      return true
    },
  }
  const child = {
    pid: 1234,
    stdout,
    stderr,
    stdin,
    exitCode: null,
    signalCode: null,
    kill: (): boolean => { killed = true; return true },
  }
  return { child: Object.assign(emitter, child) as unknown as ChildProcess, stdout, written, killed: () => killed }
}

function spawnChild(fake: FakeChild) {
  return (_command: string, _options: SpawnOptions): ChildProcess => fake.child
}

function silentLogger(): InboundLogger {
  return { info: () => {}, warn: () => {}, error: () => {}, debug: () => {} }
}

const message = { jsonrpc: '2.0', method: 'agent_message', params: { name: 'researcher', room: 'room-1', traceId: 't-1', message: 'found it' } }

describe('parseInboundLine', () => {
  it('parses a valid JSON-RPC notification', () => {
    const result = parseInboundLine(JSON.stringify(message))
    expect(result).toEqual({
      ok: true,
      request: {
        method: 'agent_message',
        params: { name: 'researcher', room: 'room-1', traceId: 't-1', message: 'found it' },
        id: null,
      },
    })
  })

  it('fails closed on malformed JSON with a parse error', () => {
    expect(parseInboundLine('{ not json')).toEqual({ ok: false, id: null, code: -32700, message: expect.stringContaining('Parse error') })
  })

  it('fails closed when jsonrpc is not "2.0"', () => {
    const result = parseInboundLine(JSON.stringify({ jsonrpc: '1.0', method: 'agent_message', params: {} }))
    expect(result).toMatchObject({ ok: false, code: -32600 })
  })

  it('fails closed when method is missing', () => {
    const result = parseInboundLine(JSON.stringify({ jsonrpc: '2.0', params: {} }))
    expect(result).toMatchObject({ ok: false, code: -32600 })
  })
})

describe('mapInboundEvent', () => {
  it('maps agent_started', () => {
    const result = mapInboundEvent({ method: 'agent_started', params: { name: 'r', room: 'room-1', traceId: 't-1' }, id: null })
    expect(result).toEqual({ ok: true, event: { method: 'agent_started', name: 'r', roomId: 'room-1', traceId: 't-1' } })
  })

  it('maps agent_finished with status and usage', () => {
    const result = mapInboundEvent({
      method: 'agent_finished',
      params: { name: 'r', room: 'room-1', traceId: 't-1', status: 'error', usage: { inputTokens: 10, outputTokens: 4 } },
      id: 7,
    })
    expect(result).toEqual({
      ok: true,
      event: { method: 'agent_finished', name: 'r', roomId: 'room-1', traceId: 't-1', status: 'error', usage: { inputTokens: 10, outputTokens: 4 } },
    })
  })

  it('fails closed on an unknown method', () => {
    const result = mapInboundEvent({ method: 'bogus', params: { name: 'r', room: 'room-1', traceId: 't-1' }, id: null })
    expect(result).toMatchObject({ ok: false, code: -32601 })
  })

  it('fails closed on missing room', () => {
    const result = mapInboundEvent({ method: 'agent_started', params: { name: 'r', traceId: 't-1' }, id: null })
    expect(result).toMatchObject({ ok: false, code: -32602 })
  })

  it('fails closed when agent_message has no message', () => {
    const result = mapInboundEvent({ method: 'agent_message', params: { name: 'r', room: 'room-1', traceId: 't-1' }, id: 3 })
    expect(result).toMatchObject({ ok: false, code: -32602 })
  })
})

describe('deliveriesFor', () => {
  it('opens a task card for agent_started', () => {
    expect(deliveriesFor({ method: 'agent_started', name: 'r', roomId: 'room-1', traceId: 't-1' })).toEqual([
      { kind: 'task-open', roomId: 'room-1', traceId: 't-1', title: 'r (t-1)' },
    ])
  })

  it('posts to the bus for agent_message', () => {
    expect(deliveriesFor({ method: 'agent_message', name: 'r', roomId: 'room-1', traceId: 't-1', message: 'hi' })).toEqual([
      { kind: 'bus-post', roomId: 'room-1', traceId: 't-1', text: '[r] hi' },
    ])
  })

  it('closes the card and posts the outcome for agent_finished', () => {
    expect(deliveriesFor({ method: 'agent_finished', name: 'r', roomId: 'room-1', traceId: 't-1', status: 'ok' })).toEqual([
      { kind: 'task-close', roomId: 'room-1', traceId: 't-1', status: 'ok' },
      { kind: 'bus-post', roomId: 'room-1', traceId: 't-1', text: '[r] finished (ok)' },
    ])
  })
})

describe('jsonRpcErrorResponse', () => {
  it('serializes an error with a null id', () => {
    expect(jsonRpcErrorResponse(null, -32601, 'nope')).toBe('{"jsonrpc":"2.0","error":{"code":-32601,"message":"nope"},"id":null}')
  })

  it('echoes a numeric id', () => {
    expect(jsonRpcErrorResponse(9, -32602, 'bad')).toContain('"id":9')
  })
})

describe('StdioJsonRpcInbound', () => {
  it('emits a mapped event for a valid notification line', () => {
    const fake = fakeChild()
    const adapter = new StdioJsonRpcInbound('node run.js', silentLogger(), spawnChild(fake))
    const events: unknown[] = []
    const stop = adapter.start(event => { events.push(event) })
    fake.stdout.write(JSON.stringify(message) + '\n')
    stop()
    expect(events).toEqual([{ method: 'agent_message', name: 'researcher', roomId: 'room-1', traceId: 't-1', message: 'found it' }])
  })

  it('drops an invalid line and writes a JSON-RPC error back (fail-closed)', () => {
    const fake = fakeChild()
    const warns: string[] = []
    const logger: InboundLogger = { info: () => {}, warn: m => warns.push(m), error: () => {}, debug: () => {} }
    const adapter = new StdioJsonRpcInbound('node run.js', logger, spawnChild(fake))
    const events: unknown[] = []
    const stop = adapter.start(event => { events.push(event) })
    fake.stdout.write('{"jsonrpc":"2.0","method":"bogus","params":{}}\n')
    stop()
    expect(events).toHaveLength(0)
    expect(fake.written).toHaveLength(1)
    expect(JSON.parse(fake.written[0]!)).toMatchObject({ error: { code: -32601 } })
    expect(warns.length).toBeGreaterThan(0)
  })

  it('kills the child and ignores further output after dispose', () => {
    const fake = fakeChild()
    const adapter = new StdioJsonRpcInbound('node run.js', silentLogger(), spawnChild(fake))
    const events: unknown[] = []
    const stop = adapter.start(event => { events.push(event) })
    fake.stdout.write(JSON.stringify(message) + '\n')
    stop()
    expect(fake.killed()).toBe(true)
    fake.stdout.write(JSON.stringify(message) + '\n')
    expect(events).toHaveLength(1)
  })

  it('degrades to a no-op disposer when the command cannot spawn', () => {
    const adapter = new StdioJsonRpcInbound('missing-runtime', silentLogger(), () => { throw new Error('ENOENT') })
    const events: unknown[] = []
    const stop = adapter.start(event => { events.push(event) })
    stop()
    expect(events).toHaveLength(0)
  })
})

describe('InboundCoordinator', () => {
  it('registerInboundAdapter returns an idempotent disposer that stops the adapter', () => {
    const coordinator = new InboundCoordinator()
    let stopped = 0
    const adapter: InboundAdapter = { start: () => () => { stopped++ } }
    const sink: InboundSink = () => {}
    const dispose = coordinator.registerInboundAdapter(adapter, sink)
    dispose()
    dispose()
    expect(stopped).toBe(1)
  })

  it('stopAll stops every registered adapter', () => {
    const coordinator = new InboundCoordinator()
    let stopped = 0
    const adapter: InboundAdapter = { start: () => () => { stopped++ } }
    coordinator.registerInboundAdapter(adapter, () => {})
    coordinator.registerInboundAdapter(adapter, () => {})
    coordinator.stopAll()
    expect(stopped).toBe(2)
  })
})
