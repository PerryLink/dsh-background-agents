# dsh-background-agents

> Interactive, long-session background agents for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness). Start a durable child agent that keeps working while you keep talking — watch its progress, steer it with messages, and stop it, all without leaving your session.

[English](./README.md) · [中文](./README.zh.md) · [Español](./README.es.md) · [Português](./README.pt.md) · [हिन्दी](./README.hi.md)

[![license](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](./LICENSE)
[![topic: dsh-plugin](https://img.shields.io/badge/topic-dsh--plugin-4d6bfe)](https://github.com/topics/dsh-plugin)
[![topic: dsh](https://img.shields.io/badge/topic-dsh-4d6bfe)](https://github.com/topics/dsh)

DSH's built-in background *jobs* are fire-and-forget tool executions: you can read output and kill them, but you cannot talk to them. `dsh-background-agents` upgrades that to **full background agent sessions** on the official subagent seam — a continuable child conversation you can message, steer, and interrupt at any time, while an injected progress line after each of its turns keeps you (and the model) in the loop.

## What you get

- **`background_agent`** — start a durable, continuable child agent from any session. It runs in its own context, returns a stable agent id immediately, and keeps its conversation open forever. Optional per-child scoping: `tool_filter` (removes tools from the child's view — never grants new ones), `persona` (a dedicated system-prompt persona), and `max_depth` (a delegation-depth cap); `childProvider`/`childModel` config route its model requests.
- **`bg_message`** — send it more work, corrections, or wake a settled agent. Delivered through the official FIFO inbox; the agent's answer is its next turn.
- **`bg_list`** — status of your agents: label, mode, activity (`running` / `idle` / `ready` / `settled` / `archived`), message count, last activity time. Recovers persisted children after a restart. `recursive: true` lists the whole descendant tree with `parentId`/`depth`.
- **`bg_result`** — fetch a child's latest assistant output text plus its activity, beyond the settled-notice summary.
- **`bg_stop`** — request interruption of the current turn. Fire-and-return: official teardown finishes the job; the agent stays resumable.
- **autoReport** — after every child turn, one throttled progress line is injected into your session (model-visible, plugin-sourced). Its final outcome arrives via the official settled notice. `reportDelivery: wakeup` makes each line start a parent turn when the parent is idle.
- **Idle archive** — agents quiet past `idleTimeoutMinutes` are archived with a notice and a stop request; `bg_message` wakes them back up.
- **`backgroundAgents` projection** — a session-projection unit that folds the parent log into dashboard rows (agent id, label, activity, last message summary, created time). Everything reconstructs from the durable log — no separate database.
- **Web UI panel** — a "Background agents" entry in the Web GUI sidebar with live status, one-click jump into the child session, a stop button, and a message button that queues a new turn through the official `subagent.prompt` RPC.

## Quick start

```sh
# from the harness checkout or wherever the dsh CLI lives (web or headless)
dsh plugin --profile <name> add "github:PerryLink/dsh-background-agents#v0.2.0"
```

The bundle patch carries the plugin row, so `dsh plugin add` composes it into your profile's layer stack (`dsh.profile.bundles`). Prefer the git source with a pinned ref: the repo commits its build output (`lib/`), so git installs need no build step and no `allowBuilds` entry. (Once the package is published to npm, plain `pnpm add dsh-background-agents` works too.)

The row that lands in your profile (override `config` per profile in `cordis.patch.yml`):

```yaml
- insert:
    - id: background-agents
      name: dsh-background-agents
      config:
        provider: spawn        # the ctx.subagents provider for continuable children
```

The plugin needs the subagent spine already mounted (any profile built on `@deepseek-ai/dsh-base` has it: `dsh-subagent`, `dsh-subagent-spawn-in-process`, `dsh-session-projection`).

Then, in any session, just ask the model — or call the tools directly:

```
background_agent "watch the repo for test failures and keep me posted" (label: test-watch)
bg_list
bg_message <agentId> "also check the snapshot tests now"
bg_stop <agentId>
```

## Configuration

Every tunable is a validated `Config` field — change it in `cordis.yml`, never in code.

| Field | Default | Meaning |
|---|---|---|
| `provider` | *(required)* | `ctx.subagents` provider name for continuable starts (`spawn`) |
| `autoReport` | `true` | inject one progress line into the parent after each child turn |
| `reportDelivery` | `quiet` | `quiet` appends the line to the parent's next model request; `wakeup` starts a parent turn when idle (queues when busy) |
| `reportThrottleMs` | `15000` | minimum gap between two progress injections for one child |
| `reportSummaryMaxChars` | `300` | hard cap on the injected progress-line text (ellipsized) |
| `maxBackgroundAgents` | `4` | hard cap on non-archived background agents per parent session |
| `idleTimeoutMinutes` | `120` | idle window after which a quiet child is archived and notified (`>= 1`) |
| `idleSweepIntervalMs` | `60000` | archive sweep period |
| `maxLabelChars` | `120` | display-label cap (ellipsized) |
| `childProvider` | *(inherit)* | provider route for child model requests |
| `childModel` | *(inherit)* | model id for child model requests |
| `maxChildDepth` | *(none)* | config ceiling for a start's `max_depth` argument |
| `allowedChildTools` | *(none)* | allowlist for `tool_filter` names; empty/absent = no limit |

## How it works — and why it survives restarts

Everything rides the official subagent seam: `startContinuable`, `followup`, `interrupt`, `listChildren` — the plugin performs no lifecycle routing of its own, never touches another session's `Agent`, and never kills a process tree (stop = *request interruption*, teardown belongs to the continuation manager).

The plugin also writes **only through channels the harness already persists**. The current harness has no registration surface for plugin session events, so instead of inventing log events, it stamps:

- `tool/result` **replay metadata** — the registration / message / stop facts of each tool call;
- **injected `user/message` notices** with source `{ kind: 'plugin', plugin: 'dsh-background-agents' }` — the throttled progress lines and archive notices (canonical `[background-agent <id>] …` prefix);
- the **official `subagent-settled` notice** — the child's durable "settled" fact.

The `backgroundAgents` projection unit folds exactly these three known event channels back out of the parent log, so the dashboard value and `bg_list` facts reconstruct on every reopen. When the catalog itself is unavailable (projections or session store missing), `bg_list` returns an explicit **`unrecoverable`** marker — it never fabricates an empty list.

## Not this plugin

| Project | What it does | The boundary |
|---|---|---|
| [titanwings/dsh-automation](https://github.com/titanwings/dsh-automation) | Scheduled coding tasks in fresh agent sessions | It owns **when** tasks run (scheduling). This plugin owns **interactive steering** of one long-lived conversation — no scheduler seam, no cron. |
| [vlln/dsh-task-status](https://github.com/vlln/dsh-task-status) | Status bar for background *jobs* (progress + output tail) | It **displays** tool-level jobs. This plugin creates and steers **agent sessions**; its dashboard is one panel of it, not the product. |
| [YYTbit/dsh-plugin-agent-dashboard](https://github.com/YYTbit/dsh-plugin-agent-dashboard) | Multi-agent dashboard skill | Display-oriented. This plugin's rows are **actionable**: jump into the child session, send messages, stop — through the official control plane. |

Not in scope: scheduled triggering (the schedule seam exists), cross-machine/remote agents, and any change to the official subagent activation contract.

## Development

```sh
pnpm install        # tooling only; harness packages resolve against a sibling checkout
pnpm run typecheck  # strict TS, node + client programs
pnpm test           # 60 unit + end-to-end tests (real subagent seam, scripted LLM, jsdom panel)
pnpm run build      # lib/index.js (node half) + lib/client.js (web client bundle)
pnpm run gen-aliases  # re-map harness package paths after the checkout moves
```

A keyless end-to-end demo drives a real parent session and a background child through a deterministic scripted LLM (no API key; `dev/` is gitignored — adapt the paths to your checkout):

```powershell
$env:DSH_HOME = 'D:/deepseek-harness/Project/Plugins/dsh-background-agents/dev/dsh-home'
pnpm dsh --profile headless --patch dev/cordis.yml "【父会话】驱动后台 agent 演示"
```

The test suite covers the full path — start, list, message, stop — against the **real** `SubagentRuntime` with the in-process spawn provider and a scripted adapter, plus throttle/cap/archive policy, projection folding, and crash recovery through `session-persistence-jsonl`.

## License

Apache License 2.0 — see [LICENSE](./LICENSE). Third-party notices: [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md).
