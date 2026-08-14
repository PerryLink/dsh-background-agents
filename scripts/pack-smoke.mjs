/**
 * Pack-and-install smoke for dsh-background-agents: build and pack the
 * plugin, gate the tarball's promised contents, then — when DSH_HARNESS_ROOT
 * names a harness checkout with installed dependencies — install the tarball
 * into a fresh profile through the official `dsh plugin` forwarder and assert
 * the composed `--dump-config` carries the plugin row. The live phase needs
 * network for the fresh profile's default dsh-base bundle; CI runs it on
 * every push.
 * @module pack-smoke
 */

import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const pluginRoot = resolve(here, '..')
// pnpm resolves through its .cmd shim on Windows, which requires a shell;
// node itself must NOT go through the shell there (spaces in the exe path).
const shell = process.platform === 'win32'

/** Run one command inheriting stdio; a non-zero exit aborts the smoke. */
function run(command, args, options = {}) {
  execFileSync(command, args, { stdio: 'inherit', shell, ...options })
}

/** Run the harness CLI through this node, never through a shell. */
function runCli(harness, cliArgs, options = {}) {
  return execFileSync(process.execPath, ['--import', 'tsx/esm', 'apps/cli/src/bin.ts', ...cliArgs], {
    cwd: harness,
    shell: false,
    ...options,
  })
}

const packDir = mkdtempSync(join(tmpdir(), 'dsh-background-agents-pack-'))
try {
  // 1. Build from the working tree and pack into a fresh directory.
  run('pnpm', ['run', 'build'], { cwd: pluginRoot })
  const packOutput = execFileSync('pnpm', ['pack', '--pack-destination', packDir], {
    cwd: pluginRoot,
    encoding: 'utf8',
    shell,
  })
  const printed = packOutput.trim().split(/\r?\n/).at(-1)
  // pnpm prints the tarball as a bare name or an absolute path depending on
  // the pack destination; basename normalizes both.
  const tarballName = printed === undefined ? undefined : basename(printed)
  if (tarballName === undefined || !tarballName.endsWith('.tgz')) {
    throw new Error(`pnpm pack produced no tarball:\n${packOutput}`)
  }
  const tgz = join(packDir, tarballName)

  // 2. Offline contents gate: every artifact the git/tarball install channel
  // promises must exist next to the committed manifest.
  for (const file of ['lib/index.js', 'lib/client.js', 'cordis.patch.yml', 'package.json']) {
    if (!existsSync(join(pluginRoot, file))) {
      throw new Error(`package.json "files" promises ${file} but it does not exist`)
    }
  }
  const manifest = JSON.parse(readFileSync(join(pluginRoot, 'package.json'), 'utf8'))
  if (manifest.dsh?.bundle?.patch !== './cordis.patch.yml') {
    throw new Error('package.json dsh.bundle.patch must point at ./cordis.patch.yml')
  }

  // 3. Live phase: a fresh DSH_HOME, a fresh profile, the tarball install
  // through the official forwarder, and the patch-level dump assertion.
  const harness = process.env.DSH_HARNESS_ROOT
  if (harness === undefined || harness === '') {
    console.log('pack-smoke: DSH_HARNESS_ROOT unset — contents gate passed, live install skipped')
    process.exit(0)
  }
  const home = mkdtempSync(join(tmpdir(), 'dsh-background-agents-home-'))
  try {
    runCli(harness, ['plugin', '--profile', 'smoke', 'add', tgz], {
      env: { ...process.env, DSH_HOME: home },
    })
    const dump = runCli(harness, ['--profile', 'smoke', '--dump-config'], {
      encoding: 'utf8',
      env: { ...process.env, DSH_HOME: home },
    })
    if (!dump.includes('background-agents')) {
      throw new Error(`--dump-config does not contain the background-agents row:\n${dump}`)
    }
    if (dump.includes('FAILED')) throw new Error('--dump-config reports FAILED')
    console.log('pack-smoke: live profile install + dump-config assertion passed')
  } finally {
    rmSync(home, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 })
  }
} finally {
  rmSync(packDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 })
}
