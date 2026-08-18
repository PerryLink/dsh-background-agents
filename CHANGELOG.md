# Changelog

All notable changes to `dsh-background-agents` are documented here. The repo is pre-release; versions follow the DeepSeek Harness `0.1.0-rc.x` target runtime and bump on every behavior change.

## [0.5.2] — 2026-08-17

### Fixed

- **`/room create` deadlock (issue #2).** The room-hub write chain read `this.tail` only AFTER the `ready` gate resolved — by then `tail` was the just-assigned promise that settles with the very result being chained, so the first queued mutation (and every room write: create/join/leave/post/task) never settled and no `command/done` was ever emitted. `enqueue` now captures the previous tail synchronously; a regression test drives a full `createRoom` through a working in-memory domain.
- **Stuck storage-provider hang.** A storage domain whose `open()` never settles used to leave every room operation pending forever. `roomOpenTimeoutMs` (default 15000) now cuts the open off and every room operation fails loud with `RoomError('store-unavailable', …)` instead of hanging; a late open after a timeout is closed (no orphaned domain).
- **rc.6 session-corruption fix (the #918 class).** On hosts whose `Session.append` predates the `ignorable` envelope-marker surface (the rc.1–rc.6 lines drop the options bag silently), `background-agents/fact` and `team-room/fact` events used to land UNMARKED, making sessions unresumable on stricter builds. A new `FactAppender` gates every fact append: installed-peer version pre-check, then a probe of the first appended envelope's return value; on pre-marker hosts fact appends are skipped with a one-time warning (durable store, notices, and tools unaffected; projections degrade to an empty fact fold). `allowUnmarkedFacts: true` opts back in — deliberately dangerous. Already-polluted logs can be repaired with `scripts/repair-session-logs.mjs` from `dsh-permission-rules` (`--types background-agents/fact,team-room/fact`).
- **Client inject gap (issue #2).** The browser half called `remote.commands.execute(...)` without declaring `remote.commands` in its inject array — the client runtime rejected every Settings > Team Rooms action with `cannot get property "remote.commands" without inject`. The declaration is now `['sessions', 'slots', 'locale', 'connection', 'remote', 'remote.commands']`.

### Added

- `src/audit.ts` (host `ignorable`-marker capability detection) and `src/facts.ts` (`FactAppender`, the single append seam for every log-only fact), unit-tested in `tests/facts.spec.ts` alongside the open-timeout and write-chain regression tests.
- New config fields: `roomOpenTimeoutMs` (15000) and `allowUnmarkedFacts` (false).

## [0.5.1] — 2026-08-16

- Declare `@deepseek-ai/dsh-storage-json` so the storage-json patch row resolves; lockfile refresh; dshbase-style `compat.yml` CI (bare import smoke, real-profile mount, keyless headless smoke with hang detection).

## [0.5.0] — 2026-08-15

- Team rooms: persistent multi-agent collaboration (`team_rooms` storage domain — rooms, message bus, task board, shared timeline), the `/room` command family, eight `room_*` tools, member briefs, offline catch-up, and the `teamRoom` session projection feeding the Settings panel.
