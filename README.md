# dsh-background-agents

> Interactive, long-session background agents for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness). Start a durable child agent that keeps working while you keep talking —watch its progress, steer it with messages, and stop it, all without leaving your session.

[English](./README.md) 路 [涓枃](./README.zh.md) 路 [Espa帽ol](./README.es.md) 路 [Portugu锚s](./README.pt.md) 路 [啶灌た啶ㄠ啶︵](./README.hi.md)

[![license](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](./LICENSE)
[![topic: dsh-plugin](https://img.shields.io/badge/topic-dsh--plugin-4d6bfe)](https://github.com/topics/dsh-plugin)
[![topic: dsh](https://img.shields.io/badge/topic-dsh-4d6bfe)](https://github.com/topics/dsh)
[![npm version](https://img.shields.io/npm/v/dsh-background-agents)](https://www.npmjs.com/package/dsh-background-agents)
[![npm downloads](https://img.shields.io/npm/dm/dsh-background-agents)](https://www.npmjs.com/package/dsh-background-agents)
[![CI](https://img.shields.io/github/actions/workflow/status/PerryLink/dsh-background-agents/ci.yml?branch=main&label=CI)](https://github.com/PerryLink/dsh-background-agents/actions)

DSH's built-in background *jobs* are fire-and-forget tool executions: you can read output and kill them, but you cannot talk to them. `dsh-background-agents` upgrades that to **full background agent sessions** on the official subagent seam —a continuable child conversation you can message, steer, and interrupt at any time, while an injected progress line after each of its turns keeps you (and the model) in the loop.

## What you get

- **`background_agent`** —start a durable, continuable child agent from any session. It runs in its own context, returns a stable agent id immediately, and keeps its conversation open forever. Optional per-child scoping: `tool_filter` (removes tools from the child's view —never grants new ones), `persona` (a dedicated system-prompt persona), and `max_depth` (a delegation-depth cap); `childProvider`/`childModel` config route its model requests.
- **`bg_message`** —send it more work, corrections, or wake a settled agent. Delivered through the official FIFO inbox; the agent's answer is its next turn.
- **`bg_list`** —status of your agents: label, mode, activity (`running` / `idle` / `ready` / `settled` / `archived`), message count, last activity time. Recovers persisted children after a restart. `recursive: true` lists the whole descendant tree with `parentId`/`depth`.
- **`bg_result`** —fetch a child's latest assistant output text plus its label and activity, beyond the settled-notice summary. A thinking model's text-less final message falls back to its reasoning blocks, flagged `textSource: 'reasoning'`.
- **`bg_stop`** —request interruption of the current turn. Fire-and-return: official teardown finishes the job; the agent stays resumable.
- **autoReport** —after every child turn, one throttled progress line is injected into your session (model-visible, plugin-sourced). Its final outcome arrives via the official settled notice. `reportDelivery: wakeup` makes each line start a parent turn when the parent is idle.
- **Idle archive** —agents quiet past `idleTimeoutMinutes` are archived with a notice and a stop request; `bg_message` wakes them back up. Set `autoArchive: false` to park quiet watcher agents instead of archiving them.
- **`backgroundAgents` projection** —a session-projection unit that folds the parent log into dashboard rows (agent id, label, activity, last message summary, created time). Everything reconstructs from the durable log —no separate database.
- **Web UI panel** —a "Background agents" entry in the Web GUI sidebar with live status, one-click jump into the child session, a stop button, a message button that queues a new turn through the official `subagent.prompt` RPC, and a result button that peeks the child's final assistant text through the read-only `subagent.history` RPC. Parent-session titles disambiguate rows when several parents project agents.

## Quick start

```sh
# from the harness checkout or wherever the dsh CLI lives (web or headless)
dsh plugin --profile <name> add "github:PerryLink/dsh-background-agents#v0.4.0"
```

The bundle patch carries the plugin row, so `dsh plugin add` composes it into your profile's layer stack (`dsh.profile.bundles`). Prefer the git source with a pinned ref: the repo commits its build output (`lib/`), so git installs need no build step and no `allowBuilds` entry. The package is also published to npm — plain `pnpm add dsh-background-agents` works (CI publishes every tag push).

The row that lands in your profile (override `config` per profile in `cordis.patch.yml`):

```yaml
- insert:
    - id: background-agents
      name: dsh-background-agents
      config:
        provider: spawn        # the ctx.subagents provider for continuable children
```

The plugin needs the subagent spine already mounted (any profile built on `@deepseek-ai/dsh-base` has it: `dsh-subagent`, `dsh-subagent-spawn-in-process`, `dsh-session-projection`).

Then, in any session, just ask the model —or call the tools directly:

```
background_agent "watch the repo for test failures and keep me posted" (label: test-watch)
bg_list
bg_message <agentId> "also check the snapshot tests now"
bg_stop <agentId>
```

## Configuration

Every tunable is a validated `Config` field —change it in `cordis.yml`, never in code.

| Field | Default | Meaning |
|---|---|---|
| `provider` | *(required)* | `ctx.subagents` provider name for continuable starts (`spawn`) |
| `autoReport` | `true` | inject one progress line into the parent after each child turn |
| `reportDelivery` | `quiet` | `quiet` appends the line to the parent's next model request; `wakeup` starts a parent turn when idle (queues when busy) |
| `reportThrottleMs` | `15000` | minimum gap between two progress injections for one child |
| `reportSummaryMaxChars` | `300` | hard cap on the injected progress-line text (ellipsized) |
| `resultMaxChars` | `4000` | hard cap on the `bg_result` text (ellipsized, flagged `truncated`) |
| `maxBackgroundAgents` | `4` | hard cap on non-archived background agents per parent session; the budget is shared by **every** continuable direct child of the session (including ones the built-in `subagent` tool started) |
| `autoArchive` | `true` | idle-archive toggle: when false, the sweep never archives quiet children (the idle window then only feeds the reclamation of stale cache entries) |
| `idleTimeoutMinutes` | `120` | idle window after which a quiet child is archived and notified (`>= 1`) |
| `idleSweepIntervalMs` | `60000` | archive sweep period |
| `maxLabelChars` | `120` | display-label cap (ellipsized) |
| `childProvider` | *(inherit)* | provider route for child model requests |
| `childModel` | *(inherit)* | model id for child model requests |
| `maxChildDepth` | *(none)* | config ceiling for a start's `max_depth` argument |
| `allowedChildTools` | *(none)* | allowlist for `tool_filter` names; empty/absent = no limit |

## How it works —and why it survives restarts

Everything rides the official subagent seam: `startContinuable`, `followup`, `interrupt`, `listChildren` —the plugin performs no lifecycle routing of its own, never touches another session's `Agent`, and never kills a process tree (stop = *request interruption*, teardown belongs to the continuation manager).

The plugin writes every fact through **one structured channel and one model-visible channel**:

- **`background-agents/fact` structured fact events** (v0.3.0+) —the registered / message / stop / progress / archived facts, appended to the parent log as log-only records with the envelope's `ignorable: true` marker; readers that do not know the type skip the records instead of refusing the log, so older harness builds and older plugin versions still open parents written by this one;
- `tool/result` **replay metadata** —the same facts in logs written before v0.3.0 (folded only while a row has no structured provenance);
- **injected `user/message` notices** (model-visible), source `{ kind: 'plugin', plugin: 'dsh-background-agents' }` —the throttled progress lines and archive notices (canonical `[background-agent <id>] 鈥 prefix);
- the **official `subagent-settled` notice** —the child's durable "settled" fact.

The `backgroundAgents` projection unit folds the structured channel and keeps the legacy folds for pre-v0.3.0 logs (a row switches to structured provenance on its first fact, so a dual-channel log never double-counts). The dashboard value and `bg_list` facts reconstruct on every reopen without parsing human-readable notice text. When the catalog itself is unavailable (projections or session store missing), `bg_list` returns an explicit **`unrecoverable`** marker —it never fabricates an empty list.

## Not this plugin

| Project | What it does | The boundary |
|---|---|---|
| [titanwings/dsh-automation](https://github.com/titanwings/dsh-automation) | Scheduled coding tasks in fresh agent sessions | It owns **when** tasks run (scheduling). This plugin owns **interactive steering** of one long-lived conversation —no scheduler seam, no cron. |
| [vlln/dsh-task-status](https://github.com/vlln/dsh-task-status) | Status bar for background *jobs* (progress + output tail) | It **displays** tool-level jobs. This plugin creates and steers **agent sessions**; its dashboard is one panel of it, not the product. |
| [YYTbit/dsh-plugin-agent-dashboard](https://github.com/YYTbit/dsh-plugin-agent-dashboard) | Multi-agent dashboard skill | Display-oriented. This plugin's rows are **actionable**: jump into the child session, send messages, stop —through the official control plane. |

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

## Development

```sh
pnpm install        # tooling only; harness packages resolve against a sibling checkout
pnpm run typecheck  # strict TS, node + client programs
pnpm test           # 83 unit + end-to-end tests (real subagent seam, scripted LLM, jsdom panel)
pnpm run build      # lib/index.js (node half) + lib/client.js (web client bundle)
pnpm run gen-aliases  # re-map harness package paths after the checkout moves
```

A keyless end-to-end demo drives a real parent session and a background child through a deterministic scripted LLM (no API key; `dev/` is gitignored —adapt the paths to your checkout):

```powershell
$env:DSH_HOME = 'D:/deepseek-harness/Project/Plugins/dsh-background-agents/dev/dsh-home'
pnpm dsh --profile headless --patch dev/cordis.yml "銆愮埗浼氳瘽銆戦┍鍔ㄥ悗鍙?agent 婕旂ず"
```

The test suite covers the full path —start, list, message, stop —against the **real** `SubagentRuntime` with the in-process spawn provider and a scripted adapter, plus throttle/cap/archive policy, projection folding, and crash recovery through `session-persistence-jsonl`.

## 👥 Contributors

Thanks to everyone who has contributed to `dsh-background-agents`:

- [PerryLink](https://github.com/PerryLink) — author and maintainer: the background-agent runtime on the official subagent seam, the Web UI sidebar panel, session projection, docs, CI/CD and releases.

Want to help? Check the [issue templates](.github/ISSUE_TEMPLATE/) and the [security policy](SECURITY.md) — PRs are welcome in English or Chinese.

## License

Apache License 2.0 —see [LICENSE](./LICENSE). Third-party notices: [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md).

## PerryLink DSH Plugin Family

This project is one of the [15 DeepSeek Harness plugins](https://github.com/PerryLink) maintained by [PerryLink](https://github.com/PerryLink). If this one helps you, the others likely will too:

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
