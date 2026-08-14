# Architecture

`dsh-background-agents` turns DSH's tool-level background jobs into interactive long-session background agents. This document records the design decisions; the external contracts live in [README.md](./README.md).

## The one hard constraint: no plugin session events

The current harness has **no registration surface for plugin session events**: `KNOWN_SESSION_EVENT_TYPES` is a generated, read-only set, `Session.append` never stamps the `ignorable` envelope marker, and the persistence read path refuses logs containing unknown types. A plugin that appends its own `background-agents/*` events would make every parent session unloadable on reopen.

So the plugin writes **only through channels the harness already persists**, each carrying one class of facts:

| Fact | Channel | Event type |
|---|---|---|
| child registered (agent id, label, created) | `background_agent` tool result **replay metadata** (`output.presentationMeta`) | `tool/result` |
| message delivered (count bump) | `bg_message` tool result replay metadata | `tool/result` |
| stop requested | `bg_stop` tool result replay metadata | `tool/result` |
| per-turn progress (last message, running) | **injected notice** via `agent.inject()`, source `{ kind: 'plugin', plugin: 'dsh-background-agents', form: 'notice' }`, canonical line prefix `[background-agent <id>] progress: …` | `user/message` |
| idle-archived | injected notice, prefix `[background-agent <id>] archived: …` | `user/message` |
| settled (inactive, closing message) | the **official** `subagent-settled` notice the continuation manager delivers | `user/message` |

This satisfies model-visible ⟺ logged for every injected line (the notice is a real user message in the parent log) and makes the dashboard value reconstructable without a second database.

## Data flow

```
background_agent ──▶ ctx.subagents.startContinuable() ──▶ durable child Session
      │                        ▲
      └─ tool/result.meta ────┘ (folded by the projection)

child turn ends ──▶ session/event ──▶ lifecycle observer (throttle)
                        └─▶ parent.inject / parent.followup (progress notice) ──▶ parent log
                                                      (quiet: next-request append; wakeup: new parent
                                                       turn, FIFO-inbox queued when the parent is busy)

child settles ──▶ continuation manager ──▶ parent notice (subagent-settled)
                                             └─▶ parent log

bg_list ──▶ ctx.subagents.listChildren / listDescendants(parent)  (durable catalog, live-first)
            + ctx.sessionProjections.snapshot(parent).backgroundAgents (facts)
            + ctx.agents.get(id)                 (running/idle/ready overlay)

bg_result ──▶ ctx.sessions.get(child) → sessionPersistence.load(child) → final assistant text
```

The five tools are thin adapters over `startContinuable` / `followup` / `listChildren` /
`listDescendants` / `interrupt`. The in-memory `BackgroundAgentLifecycle` is a cache of
tracked children: throttle watermarks, idle watermarks, and archive state. Losing it
(crash, reload) costs only throttles and timers — the durable facts live in the parent
log, and `bg_list` recovers through the official catalog.

## Lifecycle policies

- **Cap** (`maxBackgroundAgents`): `background_agent` counts non-archived continuable children via `listChildren` minus the projection's archived set; a `SubagentError` from the listing falls back to the live registry count (never blocks starts on an unavailable catalog).
- **Throttle** (`reportThrottleMs`): per child, per process; the first report of a child is never throttled (`-1` watermark), so a fast first turn still reports.
- **Idle archive** (`idleTimeoutMinutes` / `idleSweepIntervalMs`): the sweep archives quiet children — inject the archived notice, request interruption of a resident activation through `ctx.subagents.interrupt` (official semantics; fire-and-return), and stop observing. A child whose live agent is mid-turn is left alone: a long tool execution emits no session events and would otherwise read as idle. `bg_message` wakes an archived child back into tracking.

## Web UI

The client half registers into the `sidebar.footer.action` slot (the one list hole the sidebar shell declares): a trigger with a live running-count badge opens a floating panel. All rows derive from the `backgroundAgents` projection values riding the session-list snapshot — zero RPC. Jump, message, and stop go through the official client APIs: `sessions.refreshSubagents` + `sessions.openSubagent` (jump), `api.subagents.prompt` with `mode: 'continuable'` (message — a queued delivery whose answer is the child's next turn), and `api.subagents.interrupt` with the durable parent/child address (stop). The presenter (`src/client/presenter.ts`) is a pure function of the snapshot — testable without a DOM.

## Boundaries

- No scheduling: the schedule seam owns "when"; this plugin owns "steering a live conversation".
- No cross-machine agents: children are process-local continuable sessions of the deployment.
- The official subagent activation contract is untouched: start/message/stop are thin adapters over `startContinuable` / `followup` / `interrupt`; stop requests interruption and never kills processes.
- One-shot children are never listed or messaged: `bg_list` keeps continuable rows only, matching `send_message`'s delivery authority.
