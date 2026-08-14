/**
 * Build faces for dsh-background-agents. The node half (`src/index.ts`) is
 * the host Loader entry; the browser half (`src/client/index.ts`) is the
 * client bundle served under /plugins/dsh-background-agents/client.js.
 *
 * The browser half follows the shell's client-bundle handshake exactly: a CJS
 * bundle wrapped in `window.__ModuleLoader__.load({ id, factory })`, with the
 * shell's platform modules left external (the factory's `require` answers
 * them from the frozen module table) and every other dependency inlined.
 * `zod` is an ordinary library and is inlined into both halves.
 */

import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, relative, resolve as resolvePath, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'tsdown'
import { transform } from 'lightningcss'

/** Plugin id: the cordis.yml bare row name, the graph row id, and the stamped bundle id must all match. */
const PLUGIN_ID = 'dsh-background-agents'

/** Virtual-id wrapper keeping module CSS away from tsdown's own css pipeline. */
const CSS_VIRTUAL_PREFIX = '\0dsh-bg-css:'
const CSS_VIRTUAL_SUFFIX = '.mjs'

/**
 * Module specifiers the shell shares into the frozen browser module table,
 * plus the runtime store exemption (`@deepseek-ai/dsh-client-runtime/client`).
 * Any value import outside this list must be inlined.
 */
const PLATFORM_EXTERNALS: readonly string[] = [
  'react',
  'react/jsx-runtime',
  'react-dom',
  'react-dom/client',
  '@deepseek-ai/cordis',
  '@deepseek-ai/dsh-client-ui-slots',
  '@deepseek-ai/dsh-client-web-react',
  '@deepseek-ai/dsh-client-ui-primitives',
  '@deepseek-ai/dsh-client-runtime/client',
  '@deepseek-ai/dsh-client-ui-sidebar/client',
  '@deepseek-ai/dsh-client-locale/client',
]

/** Resolve an emitted JS asset import against its source-tree counterpart. */
function sourceAssetPath(source: string, importer: string): string {
  const emitted = resolvePath(dirname(importer), source)
  if (existsSync(emitted)) return emitted
  const marker = `${sep}lib${sep}types${sep}`
  const boundary = emitted.indexOf(marker)
  if (boundary < 0) return emitted
  return resolvePath(emitted.slice(0, boundary), 'src', emitted.slice(boundary + marker.length))
}

export default defineConfig([
  {
    name: PLUGIN_ID,
    entry: ['src/index.ts'],
    outDir: 'lib',
    format: ['esm'],
    platform: 'node',
    target: 'es2024',
    dts: false,
    clean: false,
    // ESM output under a "type": "module" package must land on .js, not .mjs.
    fixedExtension: false,
    external: [/^node:/, /^@deepseek-ai\//],
    noExternal: ['zod'],
  },
  {
    name: `${PLUGIN_ID}/client`,
    entry: { client: 'src/client/index.ts' },
    outDir: 'lib',
    format: ['cjs'],
    platform: 'browser',
    dts: false,
    sourcemap: true,
    clean: false,
    external: [...PLATFORM_EXTERNALS],
    noExternal: (id: string) => (PLATFORM_EXTERNALS.includes(id) ? undefined : true),
    plugins: [{
      // CSS Modules are compiled inside the bundle: importing `x.module.css`
      // yields the hashed class map, and the css text auto-injects one
      // <style data-plugin="dsh-background-agents"> tag at factory execution.
      name: 'dsh-background-agents-css-modules-inline',
      resolveId(source: string, importer: string | undefined) {
        if (!source.endsWith('.module.css')) return null
        const abs = importer !== undefined ? sourceAssetPath(source, importer) : source
        return CSS_VIRTUAL_PREFIX + abs + CSS_VIRTUAL_SUFFIX
      },
      async load(virtualId: string) {
        if (!virtualId.startsWith(CSS_VIRTUAL_PREFIX)) return null
        const fileId = virtualId.slice(CSS_VIRTUAL_PREFIX.length, -CSS_VIRTUAL_SUFFIX.length)
        this.addWatchFile(fileId)
        const source = await readFile(fileId)
        // lightningcss derives CSS-module hashes from the filename it is
        // given, so the transform must see a platform-stable name (the
        // source-relative posix path) — a Windows and a Linux build of the
        // same tree would otherwise emit different class maps and fail the
        // committed-lib drift gate.
        const stableName = relative(dirname(fileURLToPath(import.meta.url)), fileId).split(sep).join('/')
        const { code, exports: cssExports } = transform({
          filename: stableName,
          code: source,
          cssModules: { pattern: '[hash]_[local]' },
          minify: true,
        })
        const classMap: Record<string, string> = {}
        for (const [local, exp] of Object.entries(cssExports ?? {})) classMap[local] = exp.name
        // lightningcss may emit its exports map in environment-dependent
        // order; the emitted literal sorts its keys so the bundle is
        // byte-reproducible across platforms.
        const sortedMap: Record<string, string> = {}
        for (const key of Object.keys(classMap).sort()) sortedMap[key] = classMap[key]!
        return [
          `const css = ${JSON.stringify(code.toString())};`,
          `const tagId = ${JSON.stringify(`${PLUGIN_ID}/${fileId.split(/[\\/]/).pop()}`)};`,
          'if (typeof document !== \'undefined\' && document.querySelector(\'style[data-plugin-css=\' + JSON.stringify(tagId) + \']\') === null) {',
          '  const tag = document.createElement(\'style\');',
          `  tag.dataset.plugin = ${JSON.stringify(PLUGIN_ID)};`,
          '  tag.dataset.pluginCss = tagId;',
          '  tag.textContent = css;',
          '  document.head.appendChild(tag);',
          '}',
          `export default ${JSON.stringify(sortedMap)};`,
        ].join('\n')
      },
    }],
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'production'),
      'import.meta.env.MODE': JSON.stringify(process.env.NODE_ENV ?? 'production'),
      'import.meta.env': JSON.stringify({ MODE: process.env.NODE_ENV ?? 'production' }),
    },
    outputOptions: {
      entryFileNames: 'client.js',
      banner: `window.__ModuleLoader__.load({ id: ${JSON.stringify(PLUGIN_ID)}, factory: (require) => {`,
      footer: 'return module.exports; } });',
      intro: 'var module = { exports: {} }; var exports = module.exports;',
    },
  },
])
