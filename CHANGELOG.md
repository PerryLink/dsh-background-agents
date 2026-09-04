# Changelog

All notable changes to `dsh-background-agents` are documented here. The repo is pre-release; versions follow the DeepSeek Harness `0.1.x-rc.x` target runtime and bump on every behavior change.

## [0.9.0] - 2026-09-04

### Fixed

- `bg_result` now cold-reads a settled child through both persistence surfaces: the master/checkout handle seam (`open` → `read` → `close`) and, when `open` is absent, the published-rc `load()` fallback (`load(child).events`). Previously the published line (no `open`) made the cold read throw a TypeError.
- `isUnmarkedHostVersion` now classifies every `0.1.2-rc` build as marker-unaware (that line ships the alpha.5 surface: the third `Session.append` parameter is `SurfaceIntent` for surface event types only, never an options bag). Previously `0.1.2-rc.1` fell through the rc bound and read as marker-aware; the fact gate still forbids appends there via `factEventPolicyForVersion`, and the classifier now agrees with it.

### Changed

- Align the devDependency pins to the published dsh `0.1.2-rc.1` line (source-identical to `0.1.2-alpha.5`), repin `HARNESS_COMMIT` to the rc.1 release commit, raise the compat probes to `0.1.2-rc.1`, and sync the five-language READMEs and ARCHITECTURE.md to the rc.1 facts.

## [0.8.1] - 2026-09-02

### Docs

- Sync the five-language READMEs to the 0.1.2-alpha.5 facts; no behavior change.

## [0.8.0] - 2026-09-02

### Changed

- Align the devDependency pins to the published dsh 0.1.2-alpha.5 line and re-verify the adaptation claims; no behavior change.

## [0.7.1] - 2026-09-01

### Changed

- Align the devDependency pins to the published dsh `0.1.2-alpha.3` line (`dsh-util-values`, `dsh-attachment`), align the `cordis`/`schemastery` peers to `^4.0.2`/`>=3.18.2`, pin `HARNESS_COMMIT` to `dd6322d604` (alpha.3), and raise the compat probe pins to `0.1.2-alpha.3`. The fact-event gate behavior is unchanged on `0.1.2-alpha.3`; the five-language READMEs record the alpha.3 fact.

## [0.7.0] - 2026-08-30

### Fixed

- Stop writing log-only fact events on hosts at 0.1.2-alpha.1+ (fail-closed session event vocabulary); route each record to the fallback sink instead of the session log. Older rc lines keep the ignorable-marker behavior.
- Migrate the client half to the current client packages after `dsh-client-runtime` and `dsh-client-web-react` were removed from the host.
- Update the subagent panel RPCs: `interruptByParent` with positional address arguments, `prompt` with a client-minted `requestId`, and a projection-based result peek replacing the removed `history` RPC.
- Align the `/room` command remote with the current `execute(agent, line, images, signal)` contract.
- Switch `CallId` to the renamed `ToolCallId` via the derived-brand pattern in sources and tests.

## [0.6.0] — 2026-08-26

### Added

- **Cross-ecosystem stdio JSON-RPC inbound bridge** (`inbound.enabled`, `inbound.command`). `InboundCoordinator` is a reversible seam (`registerInboundAdapter` returns a disposer) and `StdioJsonRpcInbound` maps OpenAI Agents SDK / CrewAI notifications (`agent_started` / `agent_message` / `agent_finished`) onto the team room's task board and message bus over newline-delimited JSON-RPC 2.0. Invalid messages fail closed with a JSON-RPC error; start/stop ride the fiber disposer, and an unspawnable command degrades to a logged warning (default off).
- **Per-agent cost/status observability projection.** The dashboard projection now records per-agent cost/status metrics and the client presenter surfaces them, making each background agent's progress, steering, and cost observable per agent.

### Fixed

- The committed client sourcemap is rebuilt from LF-normalized sources and `lib/` matches `tsc` 5.9 declaration-emit ordering again, keeping the build-drift gate clean.

## [0.5.7] — 2026-08-25

### Fixed

- `isUnmarkedHostVersion` only matched the `0.1.0-rc` line, so hosts on the `0.1.1-rc` line passed the pre-check and wrote the first `background-agents/fact` event unmarked — that polluted event makes the session unresumable on stricter harness builds. The gate now covers `0.1.1-rc.1`–`rc.8` as known-unmarked (verified on `0.1.1-rc.2`, where the harness still drops the `ignorable` marker); over-refusal is opt-out via `allowUnmarkedFacts: true`. Reported by [@Nicholas023](https://github.com/PerryLink/dsh-background-agents/issues/5).

## [0.5.6] — 2026-08-22

### Changed

- **Upgrade to the `0.1.1-rc.2` harness line.** `HARNESS_COMMIT` repins to the rc.2 release commit, the compat profile installs the rc.2 CLI / `dsh-base` / `dsh-headless` lines, `dshWorkshop.dshVersions` lists `0.1.1-rc.2`, and the compatibility table (all five README languages) reports the rc.2 line.
- **Projection units migrate to the rc.2 session-projection contract.** `backgroundAgents` and `teamRoom` now declare `stateSchema` and a `wire: { viewSchema, view }` client view (the rc.2 `ProjectionDefinition` field split), and merge their host fold state into `SessionProjectionStateMap` alongside the client-visible `SessionProjectionMap` key. `stateVersion` values are unchanged, so existing projection checkpoints keep replaying and only refold on a genuine semantic change.

### Fixed

- **Sidebar footer action aligned with the DSH design system (issue #4).** The trigger now renders the official `IconBranchOutline16` SVG instead of the `◉` text glyph, follows the footer-action pill style with the `--dsw-alias-label-tertiary`/`--dsw-alias-label-secondary` tokens, and the floating panel no longer sits at a fixed screen corner — it anchors to the trigger's left edge and opens upward from the sidebar footer (re-anchoring on window resize, the sidebar-footer convention). Panel chrome switches to the `--dsw-alias-border-l2` / `--dsw-specific-menu` / `--dsw-shadow-lv3` tokens with the previous values kept as fallbacks. Regression: the action spec pins the SVG trigger and the panel's inline left/bottom placement.

## [0.5.5] — 2026-08-21

### Changed

- **Upgrade to the `0.1.0-rc.8` harness line.** The eight `@deepseek-ai/dsh-*` peer ranges move to `>=0.1.0-rc.8 <0.2.0`, `HARNESS_COMMIT` repins to the rc.8 release commit, the compat profile installs the rc.8 CLI / `dsh-base` / `dsh-headless` lines, `dshWorkshop.dshVersions` lists `0.1.0-rc.8`, and the compatibility table (all five README languages) reports the rc.8 line.
- **`commands.execute` now receives the rc.8 `images` argument.** The rc.8 command service (and its client wire Remote) gained a leading base64 image-attachment array; this plugin's host test calls and the client's pinned `CommandsRemote` shape pass the new empty `images` array for every plain `/room` line.

### Fixed

- **The rc.8 host is treated as marker-unaware BEFORE the first fact append.** The released `0.1.0-rc.8` still drops the `ignorable` envelope marker on log-only appends (the stamping fix exists on harness master only), so the `FactAppender` version pre-check bound extends to rc.8: fact appends are skipped pre-emptively with a one-time warning instead of probing with a first append that would land unmarked and make the session unresumable on rc.8 readers (`SessionFormatUnsupportedError`). The legacy `tool/result` replay meta and the official `subagent-settled` account keep the dashboard projection and `bg_list`/`bg_result` reconstructing on rc.8; the reopen regression now proves the default gate keeps logs loadable end to end, and the fact pipeline stays covered by the unit appender suite plus the in-memory opt-in specs.

## [0.5.4] — 2026-08-19

### Fixed

- **Mid-open unload no longer leaks the room store.** A plugin fiber disposed while the `team_rooms` storage domain was still opening could no longer register the close effect (`ctx.effect` throws on an inactive fiber), so the late-arriving domain handle leaked; the hub now closes the domain directly on that path. Regression: a deferred-domain suite disposes the fiber mid-open and asserts the late domain is closed.

## [0.5.3] — 2026-08-19

### Fixed

- **Room write-chain self-deadlock (second site).** `createTask` and `mutateTask` (claim/assign/complete) ran their fact broadcast, cursor advance, and assign delivery INSIDE their own write-chain job; those side effects enqueue new links and captured the still-pending `this.tail`, so `room_create_task`/`room_claim_task`/`room_complete_task`/`room_transfer_task` hung forever. They now run after the job settles (the `createRoom`/`postMessage` pattern). Regression: an eight-way concurrent task-creation suite and a full claim/complete walk.

### Added

- Room tool three-interface suites, real-Loader composition, self-contained/artifacts gates, coverage/lint/README CI, and the declaration-specifier rewrite for NodeNext consumers.

## [0.5.2] — 2026-08-17

### Fixed

- **`/room create` deadlock (issue #2).** The room-hub write chain read `this.tail` only AFTER the `ready` gate resolved — by then `tail` was the just-assigned promise that settles with the very result being chained, so the first queued mutation (and every room write: create/join/leave/post/task) never settled and no `command/done` was ever emitted. `enqueue` now captures the previous tail synchronously; a regression test drives a full `createRoom` through a working in-memory domain.
- **Stuck storage-provider hang.** A storage domain whose `open()` never settles used to leave every room operation pending forever. `roomOpenTimeoutMs` (default 15000) now cuts the open off and every room operation fails loud with `RoomError('store-unavailable', …)` instead of hanging; a late open after a timeout is closed (no orphaned domain).
- **rc session-corruption fix (the #918 class).** On hosts whose `Session.append` predates the `ignorable` envelope-marker surface (every released rc line through `0.1.0-rc.7` drops the options bag silently — the stamping fix exists on harness master only), `background-agents/fact` and `team-room/fact` events used to land UNMARKED, making sessions unresumable on stricter builds. A new `FactAppender` gates every fact append: installed-peer version pre-check, then a probe of the first appended envelope's return value; on pre-marker hosts fact appends are skipped with a one-time warning (durable store, notices, and tools unaffected; projections degrade to an empty fact fold). `allowUnmarkedFacts: true` opts back in — deliberately dangerous. Already-polluted logs can be repaired with `scripts/repair-session-logs.mjs` from `dsh-permission-rules` (`--types background-agents/fact,team-room/fact`).
- **Client inject gap (issue #2).** The browser half called `remote.commands.execute(...)` without declaring `remote.commands` in its inject array — the client runtime rejected every Settings > Team Rooms action with `cannot get property "remote.commands" without inject`. The declaration is now `['sessions', 'slots', 'locale', 'connection', 'remote', 'remote.commands']`; the commands Remote shape is also pinned structurally (the ambient namespace merge is fragile across strict package-manager copies).
- `dshWorkshop.dshVersions` now lists `0.1.0-rc.7` alongside `0.1.0-rc.6` (the peers are range-pinned `>=0.1.0-rc.5 <0.2.0`, so both host lines install).

### Added

- `src/audit.ts` (host `ignorable`-marker capability detection) and `src/facts.ts` (`FactAppender`, the single append seam for every log-only fact), unit-tested in `tests/facts.spec.ts` alongside the open-timeout and write-chain regression tests.
- New config fields: `roomOpenTimeoutMs` (15000) and `allowUnmarkedFacts` (false).

## [0.5.1] — 2026-08-16

- Declare `@deepseek-ai/dsh-storage-json` so the storage-json patch row resolves; lockfile refresh; dshbase-style `compat.yml` CI (bare import smoke, real-profile mount, keyless headless smoke with hang detection).

## [0.5.0] — 2026-08-15

- Team rooms: persistent multi-agent collaboration (`team_rooms` storage domain — rooms, message bus, task board, shared timeline), the `/room` command family, eight `room_*` tools, member briefs, offline catch-up, and the `teamRoom` session projection feeding the Settings panel.
