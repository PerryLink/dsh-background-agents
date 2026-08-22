<div align="center">

# 👥 dsh-background-agents
[![Gitee](https://img.shields.io/badge/Gitee-mirror-c71d23?logo=gitee)](https://gitee.com/perrylink/dsh-background-agents)

**Interactive long-session background agents plus persistent multi-agent team rooms for DeepSeek Harness — start a durable child agent that keeps working while you keep talking.**

*Steer live conversations and coordinate a team across sessions; everything survives restarts through the harness's own storage.*

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![DSH plugin](https://img.shields.io/badge/dsh-plugin-✅-green)](https://github.com/topics/dsh-plugin)
[![Node](https://img.shields.io/badge/node-%5E22.19%20%7C%7C%20%3E%3D24-brightgreen.svg)](#)
[![CI](https://img.shields.io/github/actions/workflow/status/PerryLink/dsh-background-agents/ci.yml?branch=main&label=CI)](https://github.com/PerryLink/dsh-background-agents/actions)
[![Version](https://img.shields.io/github/v/tag/PerryLink/dsh-background-agents?label=version)](https://github.com/PerryLink/dsh-background-agents/releases)
[![npm version](https://img.shields.io/npm/v/dsh-background-agents)](https://www.npmjs.com/package/dsh-background-agents)
[![npm downloads](https://img.shields.io/npm/dm/dsh-background-agents)](https://www.npmjs.com/package/dsh-background-agents)

[English](README.md) · [简体中文](README.zh.md) · [Español](README.es.md) · [Português](README.pt.md) · [हिन्दी](README.hi.md)

</div>

---

## Compatibility

| Surface | Status |
|---|---|
| Harness | DeepSeek Harness `0.1.1-rc.2` (peers `>=0.1.0-rc.8 <0.2.0`) |
| Node | `^22.19.0 \|\| >=24.0.0` |
| Platforms | All (host tools; optional Web sidebar panel and team rooms via the storage-domain capability) |
| Model | Any (children inherit the parent's route; `childProvider`/`childModel` override) |

## What you get

`dsh-background-agents` upgrades DSH's fire-and-forget background *jobs* into two coordinated surfaces:

1. **Five steering tools** — `background_agent` starts a durable, continuable child on the official subagent seam (optional `tool_filter` — removes tools, never grants new ones; `persona`; `max_depth`; `childProvider`/`childModel` route). `bg_message` delivers a later turn; `bg_list` reports status (or the descendant tree with `parentId`/`depth`); `bg_result` reads the latest result text (reasoning fallback flagged `textSource: 'reasoning'`); `bg_stop` requests interruption.
2. **Progress and archive** — `autoReport` injects one throttled progress line after each child turn; `reportDelivery: wakeup` starts a parent turn when idle. The idle sweep archives quiet children and `bg_message` wakes them back up (`autoArchive: false` parks quiet watchers instead).
3. **Dashboard projection + Web panel** — the `backgroundAgents` session projection folds the parent log into rows; a sidebar panel shows live status, jump, message, stop, and result peek. Everything reconstructs from the durable log — no separate database.
4. **Team rooms (v0.5.0+)** — the `/room` command family plus eight `room_*` tools build persistent multi-agent rooms: members (each an independent session), a message bus (directed/broadcast), a shared task board, and a shared timeline — stored in the `team_rooms` storage domain (SQLite or JSONL) and recovered across DSH restarts. Cross-member task handoffs route through the official approval seam.

## Quick start

```sh
# 1. install the bundle into your profile
dsh plugin --profile web add "github:PerryLink/dsh-background-agents#main"

# or from npm (published releases)
dsh plugin --profile web add dsh-background-agents

# 2. restart and verify the row
dsh --profile web --dump-config | grep -A4 'id: background-agents'
```

The bundle patch carries the plugin row; `provider` is required. The repo commits its build output (`lib/`), so git installs need no build step. The plugin needs the subagent spine already mounted (any profile built on `@deepseek-ai/dsh-base` has it). Team rooms mount wherever the storage domain is composed (`@deepseek-ai/dsh-storage-domain`); the five `bg_*` tools work without it.

Then, in any session, just ask the model — or call the tools directly:

```
background_agent "watch the repo for test failures and keep me posted" (label: test-watch)
bg_list
bg_message <agentId> "also check the snapshot tests now"
bg_stop <agentId>
```

## Install & uninstall

- **git channel** (latest `main`): `dsh plugin --profile web add "github:PerryLink/dsh-background-agents#main"` — committed `lib/`, no `prepare` or `allowBuilds` step.
- **npm channel** (published releases): `dsh plugin --profile web add dsh-background-agents`.
- **tarball channel**: `pnpm pack` in this repo, then `dsh plugin --profile web add ./dsh-background-agents-<version>.tgz`.
- **uninstall**: `dsh plugin --profile web remove dsh-background-agents` (or remove the row from the profile patch).

## Configuration

Every tunable is a validated Schemastery `Config` field — change it in cordis.yml, never in code. Only `provider` is required.

| Key | Default | Meaning |
|---|---|---|
| `provider` | *(required)* | `ctx.subagents` provider name for continuable starts (`spawn`) |
| `autoReport` | `true` | Inject one progress line into the parent after each child turn |
| `reportDelivery` | `quiet` | `quiet` appends the line to the next model request; `wakeup` starts a parent turn when idle |
| `reportThrottleMs` | `15000` | Minimum gap between two progress injections for one child |
| `reportSummaryMaxChars` | `300` | Hard cap on the injected progress-line text (ellipsized) |
| `resultMaxChars` | `4000` | Hard cap on the `bg_result` text (ellipsized, flagged `truncated`) |
| `maxBackgroundAgents` | `4` | Hard cap on non-archived background agents per parent session |
| `autoArchive` | `true` | Idle-archive toggle; when `false`, the sweep never archives quiet children |
| `idleTimeoutMinutes` | `120` | Idle window after which a quiet child is archived (`>= 1`) |
| `idleSweepIntervalMs` | `60000` | Archive sweep period |
| `maxLabelChars` | `120` | Display-label cap (ellipsized) |
| `childProvider` | *(inherit)* | Provider route for child model requests |
| `childModel` | *(inherit)* | Model id for child model requests |
| `maxChildDepth` | *(none)* | Config ceiling for a start's `max_depth` argument |
| `allowedChildTools` | *(none)* | Allowlist for `tool_filter` names; empty/absent = no limit |
| `maxRooms` | `16` | Hard cap on team rooms across the profile |
| `maxMembersPerRoom` | `8` | Hard cap on members per room |
| `maxRoomsPerMember` | `4` | Hard cap on rooms one member session may join |
| `busRetention` | `200` | Bus messages kept per room |
| `timelineRetention` | `500` | Timeline events kept per room |
| `taskRetention` | `50` | Completed tasks kept per room |
| `maxMessageChars` | `4000` | Hard cap on one room message's text (rejected above, never truncated) |
| `injectRoomBrief` | `true` | Inject the short room brief into member sessions (join + resume) |
| `roomOpenTimeoutMs` | `15000` | How long the `team_rooms` storage-domain open may take before every room operation fails loud (`store-unavailable`) instead of hanging |
| `allowUnmarkedFacts` | `false` | Force log-only fact events on hosts that drop the `ignorable` marker (dangerous: unmarked facts make sessions unresumable elsewhere); default is detect-and-skip |

## Tools & surfaces

| Surface | Kind | Notes |
|---|---|---|
| `background_agent` | tool | Start a durable, continuable child (label, `tool_filter`, `persona`, `max_depth`) |
| `bg_message` | tool | Deliver a later turn to a child by agent id |
| `bg_list` | tool | Status of your agents (or the descendant tree with `recursive: true`) |
| `bg_result` | tool | Fetch a child's latest assistant output text |
| `bg_stop` | tool | Request interruption of the current turn |
| `/room` | command | `create\|join\|leave\|list\|send\|tasks\|task add\|assign\|claim\|done\|delete` |
| `room_list_rooms` / `room_post` / `room_read` | tools | Message bus: roster, post (broadcast/directed), read history |
| `room_list_tasks` / `room_create_task` / `room_claim_task` | tools | Shared task board |
| `room_transfer_task` / `room_complete_task` | tools | Handoff (approval-gated) and completion |
| `backgroundAgents` projection | session projection | Dashboard rows folded from the parent log |
| `teamRoom` projection | session projection | Shared timeline folded from `team-room/fact` events |
| Web sidebar panel | client | Live status, jump, message, stop, result peek |

## How it works — and why it survives restarts

Everything rides the official subagent seam: `startContinuable`, `followup`, `interrupt`, `listChildren` — the plugin performs no lifecycle routing of its own, never touches another session's `Agent`, and never kills a process tree (stop = *request interruption*, teardown belongs to the continuation manager).

The plugin writes every fact through **one structured channel and one model-visible channel**:

- **`background-agents/fact` structured fact events** — the registered / message / stop / progress / archived facts, appended to the parent log as log-only records with the envelope's `ignorable: true` marker; readers that do not know the type skip the records instead of refusing the log. Hosts whose `Session.append` predates the marker (every released rc line through `0.1.0-rc.8` drops it silently — the stamping fix exists on harness master only — making unmarked sessions unresumable on stricter builds) are detected before the first append (peer-version pre-check, then a probe of the returned envelope) and fact appends are skipped with a one-time warning — the durable store, the notices, and the tools keep working, and the projections degrade to an empty fact fold.
- **`tool/result` replay metadata** — the same facts in logs written before the structured channel (folded only while a row has no structured provenance).
- **injected `user/message` notices** (model-visible), source `{ kind: 'plugin', plugin: 'dsh-background-agents' }` — the throttled progress lines and archive notices (canonical `[background-agent <id>] …` prefix).
- the **official `subagent-settled` notice** — the child's durable "settled" fact.
- Team rooms mirror the same discipline: every delivered room message is a durable `user/message` in the member's own log, and the shared timeline mirrors as log-only `team-room/fact` events in the `team_rooms` storage domain.

The `backgroundAgents` projection folds the structured channel and keeps the legacy folds; the dashboard value and `bg_list` facts reconstruct on every reopen without parsing human-readable notice text. When the catalog itself is unavailable, `bg_list` returns an explicit **`unrecoverable`** marker — it never fabricates an empty list.

## How this relates to the built-in subagent tools

The harness core ships its own subagent tools (`subagent`, `send_message`, `interrupt_agent`, and the child-side `report` tool). This plugin's `bg_*` tools are their **session-scoped companions**; both can be mounted together:

| Built-in tool | This plugin | Difference |
|---|---|---|
| `subagent` (`backgroundMode: 'continuable'`) | `background_agent` | Same `startContinuable` seam; this plugin adds per-child tool_filter/persona/max_depth validation and the per-session cap |
| `send_message` | `bg_message` | Same delivery semantics; `bg_message` addresses this conversation's background agents and maintains the projection facts |
| `interrupt_agent` | `bg_stop` | Same interrupt semantics; `bg_stop` also records a structured stop fact |
| child-side `report` tool | autoReport | The built-in is called by the child model itself; this plugin injects throttled progress after **every child turn automatically** |

What the core tools lack: `bg_list`, `bg_result`, idle archiving, and the per-parent folded panel projection.

Not in scope: scheduled triggering (the schedule seam exists), cross-machine/remote agents, and any change to the official subagent activation contract.

## Not this plugin

| Project | What it does | The boundary |
|---|---|---|
| [titanwings/dsh-automation](https://github.com/titanwings/dsh-automation) | Scheduled coding tasks in fresh agent sessions | It owns **when** tasks run (scheduling). This plugin owns **interactive steering** of one long-lived conversation — no scheduler seam, no cron. |
| [vlln/dsh-task-status](https://github.com/vlln/dsh-task-status) | Status bar for background *jobs* (progress + output tail) | It **displays** tool-level jobs. This plugin creates and steers **agent sessions**; its dashboard is one panel of it, not the product. |
| [YYTbit/dsh-plugin-agent-dashboard](https://github.com/YYTbit/dsh-plugin-agent-dashboard) | Multi-agent dashboard skill | Display-oriented. This plugin's rows are **actionable**: jump into the child session, send messages, stop — through the official control plane. |

## Permissions & data

- **Permissions**: the workshop manifest declares `session:append`, `subagent:spawn`, and `tools:register`.
- **Data**: team rooms live in the `team_rooms` storage domain (SQLite or JSONL — zero extra services); background-agent facts ride the parent session log. No separate database, no network.
- **Session log**: `background-agents/fact` and `team-room/fact` events are appended with the envelope's `ignorable: true` marker on hosts that honor it (pre-marker hosts are detected and fact appends are skipped — see `allowUnmarkedFacts`); the model-visible progress lines and room deliveries are real `user/message` records.

## Security boundaries

- **Official seam only.** Start, message, and stop are thin adapters over `startContinuable` / `followup` / `interrupt`; stop requests interruption and never kills processes.
- **`tool_filter` only restricts.** It removes tools from the child's view — never grants new ones; names are validated against `allowedChildTools`.
- **Approval-gated handoffs.** `room_transfer_task` routes through the official approval seam and fails closed when no answerer grants it.
- **Model-visible ⟺ logged.** Every delivered room message is a durable `user/message` in the member's own log; the shared timeline mirrors as log-only `team-room/fact` events.
- **No scheduling, no cross-machine agents.** Children are process-local continuable sessions of the deployment.

## Known limitations

- Team rooms require the storage domain to be composed; without `@deepseek-ai/dsh-storage-domain`, the `/room` command and `room_*` tools are disabled (the five `bg_*` tools still load).
- `provider` must name a continuable-capable provider (`prepareContinuable`); a missing provider makes `background_agent` fail until it appears.
- `maxBackgroundAgents` is a shared budget across **every** continuable direct child of the session, including ones the built-in `subagent` tool started.
- One-shot children are never listed or messaged — `bg_list` keeps continuable rows only.
- Children are process-local: the schedule seam owns "when", this plugin owns steering a live conversation.

## Development

```sh
pnpm install        # tooling only; harness packages resolve against a sibling checkout
pnpm run typecheck  # strict TS, node + client programs
pnpm test           # vitest: unit + end-to-end tests (real subagent seam, scripted LLM, jsdom panel)
pnpm run build      # lib/index.js (node half) + lib/client.js (web client bundle)
pnpm run gen-aliases  # re-map harness package paths after the checkout moves
```

A keyless end-to-end demo drives a real parent session and a background child through a deterministic scripted LLM (no API key; `dev/` is gitignored — adapt the paths to your checkout):

```powershell
$env:DSH_HOME = 'D:/deepseek-harness/Project/Plugins/dsh-background-agents/dev/dsh-home'
pnpm dsh --profile headless --patch dev/cordis.yml "【父会话】驱动后台 agent 演示"
```

## Topics

`dsh`, `dsh-plugin`, `deepseek-harness`, `subagent`, `background-agent`, `background-agents`, `agent-dashboard`, `conversation-steering`, `team-rooms`, `multi-agent`, `message-bus`, `task-board`, `collaboration`

## Contributors

- [@PerryLink](https://github.com/PerryLink) — creator and maintainer: the background-agent runtime on the official subagent seam, the team-room hub, the Web UI sidebar panel, the session projections, docs, CI/CD and releases.

## PerryLink DSH Plugin Family

This project is one of the DeepSeek Harness plugins maintained by [PerryLink](https://github.com/PerryLink). If this one helps you, the others likely will too:

| Plugin | One-liner |
|---|---|
| [dsh-mcp-panel](https://github.com/PerryLink/dsh-mcp-panel) | Read-only MCP runtime panel: /mcp command + Settings tab with status, tools and errors |
| [dsh-doublecheck](https://github.com/PerryLink/dsh-doublecheck) | Engineering-discipline guard: requirements grill, test gates, adversary review |
| **[dsh-background-agents](https://github.com/PerryLink/dsh-background-agents)** | Durable background child agents with a Web UI sidebar, messaging and interrupt |
| [dsh-lsp-actions](https://github.com/PerryLink/dsh-lsp-actions) | LSP diagnostics, formatting, completion, code actions and rename over language servers |
| [dsh-output-styles](https://github.com/PerryLink/dsh-output-styles) | Claude Code outputStyles-equivalent runtime style switching |
| [dsh-checkpoint-rewind](https://github.com/PerryLink/dsh-checkpoint-rewind) | Claude Code /rewind-equivalent: snapshots, session forks, one-shot restore |
| [dsh-permission-rules](https://github.com/PerryLink/dsh-permission-rules) | Claude Code-style declarative allow/deny/ask permission rules with audit |
| [dsh-auto-review](https://github.com/PerryLink/dsh-auto-review) | Second-model auto-review on the approval chain, fail-closed by default |
| [dsh-memento](https://github.com/PerryLink/dsh-memento) | Approval-gated cross-session memory: ctx.memory seam + SQLite + memory tool |
| [dsh-skill-pack-security](https://github.com/PerryLink/dsh-skill-pack-security) | Security-audit skill pack: secret scan, dependency and supply-chain review |
| [dsh-session-pin](https://github.com/PerryLink/dsh-session-pin) | Pin sessions in the Web sidebar with durable ordering |
| [dsh-composer-history](https://github.com/PerryLink/dsh-composer-history) | Terminal-style input history for the web composer: arrows, Ctrl+R search |
| [dsh-github](https://github.com/PerryLink/dsh-github) | GitHub PR/issues integration for DSH, every write gated by approval |
| [dsh-plugin-guide](https://github.com/PerryLink/dsh-plugin-guide) | Plugin-development knowledge base as an on-demand agent skill |
| [dsh-claude-move](https://github.com/PerryLink/dsh-claude-move) | Migrate Claude Code sessions, memory, skills and CLAUDE.md into DSH |

## License

[Apache License 2.0](LICENSE) © 2026 dsh-background-agents contributors
