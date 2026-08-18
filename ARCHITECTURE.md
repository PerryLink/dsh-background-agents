# Architecture

`dsh-background-agents` turns DSH's tool-level background jobs into interactive long-session background agents. This document records the design decisions; the external contracts live in [README.md](./README.md).

## Durable facts: one structured channel, one model-visible channel

The plugin writes every fact through **two channels with one discipline each**:

| Fact | Channel | Event type |
|---|---|---|
| registered / message / stop / progress / archived | **structured fact event** `background-agents/fact`, appended log-only with the envelope's `ignorable: true` marker | `background-agents/fact` |
| the same facts in logs written before v0.3.0 | `tool/result` **replay metadata** (`output.presentationMeta`), folded only while a row has no structured provenance | `tool/result` |
| per-turn progress and idle-archive lines the model sees | **injected notice** via `agent.inject()` / `agent.followup()`, source `{ kind: 'plugin', plugin: 'dsh-background-agents', form: 'notice' }`, canonical line prefix `[background-agent <id>] progress: …` | `user/message` |
| settled (inactive, closing message) | the **official** `subagent-settled` notice the continuation manager delivers | `user/message` |

The structured channel rides the harness's ignorable-append surface (`Session.append(type, data, { ignorable: true })`, open at the plugin's pinned baseline): readers that do not know the type skip the record instead of refusing the log, so older harness builds and older plugin versions still load parents written by this one. Hosts whose `Session.append` PREDATES the surface (the rc.1–rc.6 lines silently drop the options bag, and the unmarked event breaks resume on stricter builds) are detected before the first append by the `FactAppender` (installed-peer version pre-check, then a probe of the first appended envelope's return value): on such hosts fact appends are skipped with a one-time warning, the durable store + notices + tools keep working, and the projections degrade to an empty fact fold (`allowUnmarkedFacts: true` opts back in — deliberately dangerous). The `backgroundAgents` projection folds the structured channel, keeps the legacy folds for pre-v0.3.0 logs, and switches a row to structured provenance on its first fact — so a log that carries both channels (the v0.3.0 write path keeps writing both) never double-counts. The official `subagent-settled` account folds regardless of provenance: it has no structured counterpart.

This satisfies model-visible ⟺ logged for every injected line (the notice is a real user message in the parent log) and makes the dashboard value reconstructable without a second database — and it decouples the dashboard facts from the human-readable notice wording, which is now free to evolve.

## Data flow

```
background_agent ──▶ ctx.subagents.startContinuable() ──▶ durable child Session
      │                        ▲
      ├─ background-agents/fact (ignorable) ─┘ (structured fact, folded by the projection)
      └─ tool/result.meta ────────────────────┘ (legacy channel, folded only without a fact row)

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
                                                    (text blocks; reasoning fallback flagged `textSource`)
```

The five tools are thin adapters over `startContinuable` / `followup` / `listChildren` /
`listDescendants` / `interrupt`. The in-memory `BackgroundAgentLifecycle` is a cache of
tracked children: throttle watermarks, idle watermarks, and archive state. Losing it
(crash, reload) costs only throttles and timers — the durable facts live in the parent
log, and `bg_list` recovers through the official catalog.

## Lifecycle policies

- **Cap** (`maxBackgroundAgents`): `background_agent` counts non-archived continuable children via `listChildren` minus the projection's archived set; a `SubagentError` from the listing falls back to the live registry count (never blocks starts on an unavailable catalog). Concurrent starts of one parent serialize through a per-parent gate (count + cap-check + start in one chain), and a resolved tail gate reclaims its map slot.
- **Throttle** (`reportThrottleMs`): per child, per process; the first report of a child is never throttled (`-1` watermark), so a fast first turn still reports.
- **Idle archive** (`autoArchive` / `idleTimeoutMinutes` / `idleSweepIntervalMs`): when `autoArchive` is on, the sweep archives quiet children — inject the archived notice, request interruption of a resident activation through `ctx.subagents.interrupt` (official semantics; fire-and-return), and stop observing. A child whose live agent is mid-turn is left alone: a long tool execution emits no session events and would otherwise read as idle. `bg_message` wakes an archived child back into tracking. With `autoArchive: false` the sweep never archives (long-lived watcher agents stay parked) and only reclaims cache entries whose parent and child agents are both gone.

## Web UI

The client half registers into the `sidebar.footer.action` slot (the one list hole the sidebar shell declares): a trigger with a live running-count badge opens a floating panel. All rows derive from the `backgroundAgents` projection values riding the session-list snapshot — zero RPC for the rows themselves. Jump, message, stop, and the result peek go through the official client APIs: `sessions.refreshSubagents` + `sessions.openSubagent` (jump), `api.subagents.prompt` with `mode: 'continuable'` (message — a queued delivery whose answer is the child's next turn), `api.subagents.interrupt` with the durable parent/child address (stop), and the read-only `api.subagents.history` tail page (result — the last assistant text, extracted by a pure presenter function, never activating the child Agent). Rows carry the parent session title for disambiguation when several parents project agents; panel open/close moves focus into the dialog and back to the trigger. The presenter (`src/client/presenter.ts`) is a pure function of the snapshot — testable without a DOM.

## Boundaries

- No scheduling: the schedule seam owns "when"; this plugin owns "steering a live conversation".
- No cross-machine agents: children are process-local continuable sessions of the deployment.
- The official subagent activation contract is untouched: start/message/stop are thin adapters over `startContinuable` / `followup` / `interrupt`; stop requests interruption and never kills processes.
- One-shot children are never listed or messaged: `bg_list` keeps continuable rows only, matching `send_message`'s delivery authority.
