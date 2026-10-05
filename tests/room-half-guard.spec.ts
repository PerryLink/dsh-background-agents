/**
 * Room-half coexistence guard (composition level).
 *
 * The room half was extracted into the standalone `dsh-team-rooms` package,
 * which registers the SAME `roomHub` service, the same eight `room_*` tools, the
 * same `team-rooms` settings-slot id and the same `team_rooms` storage domain.
 * Cordis allows exactly ONE provider per service key per isolate scope: a second
 * `super(ctx, 'roomHub')` is contained by the fiber and only reaches the logger
 * (`service "roomHub" has been registered at <fiber>`), and a second `room_*`
 * registration collides in ToolRuntime's layer. Either way one half silently
 * loses — so whichever half is not the owner must stand down.
 *
 * This suite drives the REAL built plugin bundle against a real Cordis Context
 * with narrow service fakes, which is where the guard's contract is observable:
 * the tool registry records exactly what the plugin registered. It is deliberately
 * not expressed through the Loader harness: there the entry start order and the
 * `ctx.inject` flush interleave such that a rival's provider may not be visible
 * yet, which makes the same assertion flaky rather than wrong.
 * @module dsh-background-agents/tests/room-half-guard.spec
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const builtEntry = join(repositoryRoot, 'lib', 'index.js')
// The probe must live inside the repository so `@deepseek-ai/cordis` resolves
// through the repo's own dependency tree; a %TEMP% location cannot.
const temporaryRoot = mkdtempSync(join(repositoryRoot, '.room-half-guard-'))

/** The probe runs in its own process so the built bundle is imported fresh. */
const PROBE = 'room-half-guard-probe.mjs'

function writeProbe(): string {
  const source = `
import { Context, Service } from '@deepseek-ai/cordis'
import { pathToFileURL } from 'node:url'

const built = ${JSON.stringify(pathToFileURL(builtEntry).href)}
const registered = []
const logs = []
const collisions = []

const ctx = new Context()
ctx.logger.exporter({
  levels: { default: 0 },
  export: (message) => {
    const text = (message.args ?? []).map((a) => (a instanceof Error ? a.message : String(a))).join(' ')
    logs.push(text)
    if (/has been registered at/.test(text)) collisions.push(text)
  },
})

// Faithful tool registry: a duplicate name in one layer throws, exactly as
// ToolRuntime does. A lenient stub would hide the very collision under test.
const tools = {
  register(definition) {
    if (registered.some((d) => d.name === definition.name)) {
      throw new Error(\`Tool "\${definition.name}" is already registered in this layer\`)
    }
    registered.push(definition)
    return () => undefined
  },
  schemas: () => registered.map((d) => ({ name: d.name })),
  get: (name) => registered.find((d) => d.name === name),
}
ctx.provide('tools', tools)
ctx.provide('subagents', { getProvider: () => undefined, start: async () => { throw new Error('none') } })
ctx.provide('agents', { get: () => undefined })
ctx.provide('sessions', { get: () => undefined })
ctx.provide('storageDomain', {
  open: async () => ({
    close: async () => undefined,
    table: () => ({ get: () => undefined, put: () => {}, delete: () => {}, list: () => [] }),
  }),
})

const plugin = await import(built)

// A rival that owns the SAME service key, mounted first. It mirrors the shape
// dsh-team-rooms uses: a Service subclass mounted from an inject-gated apply.
class RivalHub extends Service {
  constructor(c) { super(c, 'roomHub') }
}
if (process.env.ROOM_HALF_RIVAL === '1') {
  await ctx.plugin({ name: 'rival', inject: ['storageDomain'], apply: (c) => { c.plugin(RivalHub) } })
}

await ctx.plugin({ apply: plugin.apply, inject: plugin.inject, Config: plugin.Config }, plugin.Config({ provider: 'spawn' }))
await new Promise((resolve) => setTimeout(resolve, 250))

process.stdout.write('ROOM_GUARD_RESULT ' + JSON.stringify({
  tools: registered.map((d) => d.name).sort(),
  collisions,
  roomHubOwner: ctx.get('roomHub') === undefined ? null : 'provided',
}) + '\\n')
process.exit(0)
`
  const file = join(temporaryRoot, PROBE)
  writeFileSync(file, source)
  return file
}

function runProbe(file: string, rival: boolean) {
  const result = spawnSync(process.execPath, [file], {
    cwd: repositoryRoot,
    encoding: 'utf8',
    env: { ...process.env, ROOM_HALF_RIVAL: rival ? '1' : '0' },
    timeout: 120_000,
  })
  if (result.error !== undefined) throw result.error
  const marker = result.stdout.match(/ROOM_GUARD_RESULT (.+)$/mu)
  if (marker === null) {
    throw new Error(`probe produced no result\nstatus=${String(result.status)}\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`)
  }
  return JSON.parse(marker[1]!) as { tools: string[]; collisions: string[]; roomHubOwner: string | null }
}

let file = ''
beforeAll(() => { file = writeProbe() }, 180_000)
afterAll(() => { rmSync(temporaryRoot, { recursive: true, force: true }) })

describe('room-half coexistence guard', () => {
  it('mounts the room half and collides with nothing when it is the only provider', () => {
    const result = runProbe(file, false)
    expect(result.collisions).toEqual([])
    expect(result.tools.filter((name) => name.startsWith('room_'))).toHaveLength(8)
    for (const core of ['background_agent', 'bg_message', 'bg_list', 'bg_result', 'bg_stop']) {
      expect(result.tools).toContain(core)
    }
  })

  it('stands down on the room half when a sibling already owns roomHub', () => {
    const result = runProbe(file, true)
    // The whole point: no service-key collision, no duplicate room_* registration.
    expect(result.collisions).toEqual([])
    expect(result.tools.filter((name) => name.startsWith('room_'))).toEqual([])
    // ... and the background-agent core survives, which is what the guard buys.
    for (const core of ['background_agent', 'bg_message', 'bg_list', 'bg_result', 'bg_stop']) {
      expect(result.tools).toContain(core)
    }
  })
})
