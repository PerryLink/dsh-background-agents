/**
 * Real Loader composition + built-artifact suite (community five-layer model,
 * layer 4). An independent process mounts the vendored Loader over a
 * cordis.yml with the plugin row + config, proving module unwrapping, inject
 * resolution, and config schema application — paths a hand-built
 * `ctx.plugin` assembly never exercises. It also carries the two negative
 * regressions (invalid config fails loud, a default export fails with the
 * missing-inject reason) against the built `lib/index.js`.
 * @module dsh-background-agents/tests/composition.spec
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const runner = join(repositoryRoot, 'scripts', 'loader-runner.mjs')
const builtEntry = join(repositoryRoot, 'lib', 'index.js')

/** One cordis.yml with the plugin row plus config lines. */
function configFor(pluginRow: string, configLines: string[] = []): string {
  return [
    `- name: ${JSON.stringify(pluginRow)}`,
    ...(configLines.length > 0 ? ['  config:', ...configLines.map(line => `    ${line}`)] : []),
    '',
  ].join('\n')
}

function run(command: string, args: string[], cwd: string, shell = false, timeout = 120_000) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    env: { ...process.env },
    timeout,
    shell,
  })
  if (result.error !== undefined) throw result.error
  return { status: result.status, stdout: result.stdout, stderr: result.stderr }
}

const temporaryRoot = mkdtempSync(join(tmpdir(), 'dsh-background-agents-loader-'))

beforeAll(() => {
  const build = run('pnpm', ['run', 'build'], repositoryRoot, process.platform === 'win32')
  if (build.status !== 0) {
    throw new Error(`pnpm run build failed (${String(build.status)})\nstdout:\n${build.stdout}\nstderr:\n${build.stderr}`)
  }
}, 180_000)

afterAll(() => {
  rmSync(temporaryRoot, { recursive: true, force: true })
})

describe('real Loader composition', () => {
  it('mounts the plugin and registers the five bg_* tools through the Loader', () => {
    const configPath = join(temporaryRoot, 'valid.yml')
    writeFileSync(configPath, configFor(pathToFileURL(builtEntry).href, ['provider: spawn']))
    const evidence = run(process.execPath, [runner, configPath], repositoryRoot)
    expect(evidence.status, `stdout:\n${evidence.stdout}\nstderr:\n${evidence.stderr}`).toBe(0)
    expect(evidence.stdout).toMatch(/DSH_LOADER_RESULT/u)
    const marker = evidence.stdout.match(/DSH_LOADER_RESULT (.+)$/mu)
    const summary = JSON.parse(marker![1]!) as { tools: string[] }
    for (const expected of ['background_agent', 'bg_message', 'bg_list', 'bg_result', 'bg_stop']) {
      expect(summary.tools).toContain(expected)
    }
  })

  it('fails loud on a blank provider through the Loader', () => {
    const configPath = join(temporaryRoot, 'invalid-provider.yml')
    writeFileSync(configPath, configFor(pathToFileURL(builtEntry).href, ["provider: ''"]))
    const evidence = run(process.execPath, [runner, configPath], repositoryRoot)
    expect(evidence.status, `invalid config unexpectedly mounted:\n${evidence.stderr}`).not.toBe(0)
    expect(evidence.stderr).toMatch(/provider/u)
  })

  it('rejects an out-of-range maxRooms through the Loader schema', () => {
    const configPath = join(temporaryRoot, 'invalid-max-rooms.yml')
    writeFileSync(configPath, configFor(pathToFileURL(builtEntry).href, ['provider: spawn', 'maxRooms: -1']))
    const evidence = run(process.execPath, [runner, configPath], repositoryRoot)
    expect(evidence.status, `invalid config unexpectedly mounted:\n${evidence.stderr}`).not.toBe(0)
  })

  it('a default export fails through the Loader with the missing-inject reason', () => {
    const wrapper = join(temporaryRoot, 'default-export.mjs')
    const builtUrl = pathToFileURL(builtEntry).href
    writeFileSync(wrapper, [
      `export { name, inject, Config, apply } from ${JSON.stringify(builtUrl)}`,
      `export { apply as default } from ${JSON.stringify(builtUrl)}`,
      '',
    ].join('\n'))
    const configPath = join(temporaryRoot, 'invalid-default.yml')
    writeFileSync(configPath, configFor(pathToFileURL(wrapper).href, ['provider: spawn']))
    // `bare` skips the in-process service provides: the default export's bare
    // apply then reaches `ctx.subagents` and fails with the missing-inject
    // reason instead of mounting.
    const evidence = run(process.execPath, [runner, configPath, 'bare'], repositoryRoot)
    expect(evidence.status, 'default-export wrapper unexpectedly mounted').not.toBe(0)
    expect(evidence.stderr).toMatch(/without inject/u)
  })
})
