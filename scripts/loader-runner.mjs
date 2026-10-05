// scripts/loader-runner.mjs — real Loader composition runner (community
// five-layer model, layer 4). An independent process boots a real Context,
// mounts the vendored Loader with the Include builtin, reads the given
// cordis.yml (the plugin row + config), then asserts the plugin's
// contribution through the tool registry. Config is applied by the Loader,
// so a valid mount proves module unwrap + inject resolution + config schema.
//
// The four inject services (`tools`, `subagents`, `agents`, `sessions`) are
// provided in-process as narrow fakes: the plugin registers its five bg_*
// tools through `tools`, checks the subagent provider, and reads the agent /
// session registries only inside the idle sweep, which never fires during
// this run. The real services in this repository resolve through the local
// harness checkout in vitest (not through this plain-Node runner), so the
// faithful-load test composes the plugin's own built bundle instead.
//
// Usage: node scripts/loader-runner.mjs <cordis.yml> [bare|storage,strict]
// Exit 0 prints DSH_LOADER_RESULT <json>; a load failure (invalid config,
// default export) exits non-zero with the reason on stderr. The optional
// `bare` mode skips the in-process service provides so a default-export
// wrapper's apply fails with the missing-inject reason instead of mounting.
// Otherwise a comma-separated mode list is accepted: `storage` provides a
// narrow `storageDomain` fake (what makes the room half actually mount — without
// it the room_* tools stay dormant and a room-half assertion passes vacuously),
// and `strict` makes the tool registry reject duplicate names as ToolRuntime does.

import { Context } from '@deepseek-ai/cordis'
import Include from '@deepseek-ai/cordis-plugin-include'
import Loader from '@deepseek-ai/cordis-plugin-loader'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const configArgument = process.argv[2]
const bare = process.argv[3] === 'bare'
/**
 * Comma-separated modes. `storage` fakes the storage domain so the room half can
 * mount; `strict` makes the tool registry throw on a duplicate name, which is
 * what ToolRuntime does (it is what turns a room-half collision into an error
 * rather than a silently doubled registration list).
 */
const modes = new Set((process.argv[3] ?? '').split(',').map(mode => mode.trim()).filter(Boolean))
const withStorage = modes.has('storage')
const strictTools = modes.has('strict')
if (configArgument === undefined) {
  console.error('usage: loader-runner.mjs <cordis.yml> [bare]')
  process.exit(2)
}

const configPath = resolve(configArgument)
// Resolve bare package rows from this repository's dependency tree so the
// composition works with config files written anywhere (e.g. a temp dir).
const configRequire = createRequire(resolve(import.meta.dirname, '../package.json'))

const ctx = new Context()
/** Error-severity log records, kept so a failed row's reason survives for the assertion. */
const capturedErrors = []
ctx.logger.exporter({
  levels: { default: 0 },
  export: (message) => {
    if (message.level === 'error' || message.level === 0) {
      capturedErrors.push(message.args?.[0] instanceof Error ? message.args[0] : new Error(String(message.args?.[0] ?? message.message ?? 'loader error')))
    }
  },
})
try {
  ctx.baseUrl = `${pathToFileURL(dirname(configPath)).href}/`
  const registered = []
  if (!bare) {
    const tools = {
      register(definition) {
        // Faithful to ToolRuntime: a duplicate name in one layer throws. The
        // default stub is lenient; `strict` mode is what makes a room-half
        // collision observable instead of silently listing both registrations.
        if (strictTools && registered.some(existing => existing.name === definition.name)) {
          throw new Error(`Tool "${definition.name}" is already registered in this layer`)
        }
        registered.push(definition)
        return () => undefined
      },
      schemas() {
        return registered.map(definition => ({ name: definition.name, parameters: definition.parameters, description: definition.description }))
      },
      get(name) {
        return registered.find(definition => definition.name === name)
      },
    }
    ctx.provide('tools', tools)
    ctx.provide('subagents', {
      getProvider: () => undefined,
      start: async () => { throw new Error('no subagent provider in the loader composition') },
    })
    ctx.provide('agents', { get: () => undefined })
    ctx.provide('sessions', { get: () => undefined })
    if (withStorage) {
      // Narrow `storageDomain` fake: enough for RoomHub.open() to resolve and
      // register its four tables, so the room half reaches tool registration.
      // The tables are in-memory maps covering the KV/append surface the hub
      // uses (get/put/delete/list); this run never exercises room semantics.
      const makeTable = () => {
        const rows = new Map()
        return {
          get: key => rows.get(key),
          put: (key, value) => { rows.set(key, value) },
          delete: key => { rows.delete(key) },
          list: () => [...rows.entries()].map(([key, value]) => ({ key, value })),
        }
      }
      const tables = { rooms: makeTable(), bus: makeTable(), tasks: makeTable(), timeline: makeTable() }
      ctx.provide('storageDomain', {
        open: async () => ({
          close: async () => undefined,
          table: name => {
            tables[name] ??= makeTable()
            return tables[name]
          },
        }),
      })
    }
  }
  await ctx.plugin(Loader)
  ctx.loader.internal = /** @type {any} */ ({
    version: 'v2',
    async import(specifier) {
      if (specifier.startsWith('file:')) return import(specifier)
      if (specifier.startsWith('node:')) return import(specifier)
      const absolute = /^([a-zA-Z]:)?[\\/]/u.test(specifier)
      return import(pathToFileURL(absolute ? specifier : configRequire.resolve(specifier)).href)
    },
  })
  ctx.loader.builtins.include = Include
  await ctx.loader.create({
    name: 'cordis:include',
    config: { path: pathToFileURL(configPath).href },
  })
  await ctx.loader.await()
  rethrowFirstFailedRow()

  // The authoritative tool registry carries the plugin's contribution.
  const names = registered.map(definition => definition.name)
  for (const expected of ['background_agent', 'bg_message', 'bg_list', 'bg_result', 'bg_stop']) {
    if (!names.includes(expected)) {
      throw new Error(`Loader composition: ${expected} tool is missing (registered: ${names.join(', ')})`)
    }
  }
  process.stdout.write(`DSH_LOADER_RESULT ${JSON.stringify({ tools: names.sort() })}\n`)
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
} finally {
  await ctx.fiber.dispose()
}

/**
 * Re-throw the first FAILED loader row's error.
 *
 * `cordis-plugin-loader` 1.0.6 dropped the failure surface `await()` had in
 * 1.0.4: the old body collected `entry._await()` outcomes and threw the single
 * failure (or an AggregateError), while 1.0.6's body only loops over
 * `_initTask || fiber.inertia` and returns as soon as there is no pending
 * task — so a row whose `apply` threw no longer makes `await()` reject, and a
 * negative composition regression silently passes on the downstream symptom
 * ("tool is missing") instead of failing on the real reason. Walking the
 * entries restores that reason without depending on the resurrected API.
 *
 * `DSH_LOADER_RUNNER_NO_RETHROW=1` disables it for re-measurement only.
 */
function rethrowFirstFailedRow() {
  if (process.env.DSH_LOADER_RUNNER_NO_RETHROW === '1') return
  const failed = []
  for (const entry of ctx.loader.entries()) {
    const fiber = entry?.fiber
    // FiberState.FAILED === 3 (const enum, erased at runtime). A failed row keeps no
    // `fiber.error` on this line, so the reason is recovered from the row's own log records.
    if (fiber?.state === 3) failed.push(capturedErrors.shift() ?? new Error(`loader row ${String(entry?.options?.name ?? '?')} failed`))
  }
  if (failed.length === 1) throw failed[0]
  if (failed.length > 1) throw new AggregateError(failed, 'loader fibers failed')
}
