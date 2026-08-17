<div align="center">

# 👥 dsh-background-agents

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
| Harness | DeepSeek Harness `0.1.0-rc.6` (peers `>=0.1.0-rc.5 <0.2.0`) |
| Node | `^22.19.0 \|\| >=24.0.0` |
| Platforms | All (host tools; optional Web sidebar panel and team rooms via the storage-domain capability) |
| Model | Any (children inherit the parent's route; `childProvider`/`childModel` override) |

## What you get

`dsh-background-agents` upgrades DSH's fire-and-forget background *jobs* into two coordinated surfaces:

1. **Five steering tools** — `background_agent` starts a durable, continuable child on the official subagent seam (optional `tool_filter`, `persona`, `max_depth`, model route); `bg_message` delivers a later turn; `bg_list` reports status (or the descendant tree); `bg_result` reads the latest result text; `bg_stop` requests interruption.
2. **Progress and archive** — `autoReport` injects one throttled progress line after each child turn; the idle sweep archives quiet children and `bg_message` wakes them back up.
3. **Dashboard projection + Web panel** — the `backgroundAgents` session projection folds the parent log into rows; a sidebar panel shows live status, jump, message, stop, and result peek.
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

The bundle patch carries the plugin row; `provider` is required. The repo commits its build output (`lib/`), so git installs need no build step. Team rooms mount wherever the storage domain is composed (`@deepseek-ai/dsh-storage-domain`); the five `bg_*` tools work without it.

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

## Permissions & data

- **Permissions**: the workshop manifest declares `session:append`, `subagent:spawn`, and `tools:register`.
- **Data**: team rooms live in the `team_rooms` storage domain (SQLite or JSONL — zero extra services); background-agent facts ride the parent session log. No separate database, no network.
- **Session log**: `background-agents/fact` and `team-room/fact` events are appended with the envelope's `ignorable: true` marker; the model-visible progress lines and room deliveries are real `user/message` records.

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

## Topics

`dsh`, `dsh-plugin`, `deepseek-harness`, `subagent`, `background-agent`, `background-agents`, `agent-dashboard`, `conversation-steering`, `team-rooms`, `multi-agent`, `message-bus`, `task-board`, `collaboration`

## Contributors

- [@PerryLink](https://github.com/PerryLink) — creator and maintainer: the background-agent runtime on the official subagent seam, the team-room hub, the Web UI sidebar panel, the session projections, docs, CI/CD and releases.

## License

[Apache License 2.0](LICENSE) © 2026 dsh-background-agents contributors
