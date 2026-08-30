/**
 * The single append seam for every log-only plugin fact event
 * (`background-agents/fact` lifecycle facts and `team-room/fact` room
 * timeline facts).
 *
 * Two host lines gate the appender:
 * - rc lines through `0.1.1-rc.2`: `Session.append` predates the
 *   `ignorable` envelope marker, so a fact event lands unmarked and
 *   stricter harness builds refuse to resume the session. The appender
 *   detects such hosts before the first append and disables fact appends
 *   with a one-time warning.
 * - `0.1.2-alpha.1` and later: the host fails closed on the session event
 *   vocabulary — `background-agents/fact` and `team-room/fact` are not in
 *   KNOWN_SESSION_EVENT_TYPES, so writing one makes the session unreadable
 *   there. On those hosts fact events are never appended; each fact is
 *   routed to the injected fallback sink (logger/panel channel) instead.
 * `allowUnmarkedFacts: true` opts back into unmarked appends — deliberately
 * dangerous — and already-polluted logs can be repaired with
 * `scripts/repair-session-logs.mjs` from `dsh-permission-rules`.
 * @module dsh-background-agents/facts
 */

import type { Session } from '@deepseek-ai/dsh-session'
import {
  factEventPolicyForVersion, isMarkedAuditEvent, isUnmarkedHostVersion,
  peerSessionVersion, type AuditSupport, type FactEventPolicy,
} from './audit.ts'

/** The log-only fact event types this appender owns. */
export type FactEventType = 'background-agents/fact' | 'team-room/fact'

/**
 * Host-gated fact appender. One instance per plugin mount, shared by the
 * lifecycle observers, the four tools, and the room hub.
 */
export class FactAppender {
  private support: AuditSupport = 'unknown'
  private policy: FactEventPolicy = 'unknown'
  private warned = false
  private warnedForbidden = false

  constructor(
    private readonly allowUnmarked: boolean,
    private readonly warn: (message: string) => void,
    private readonly fallback?: (type: FactEventType, data: unknown) => void,
  ) {}

  /**
   * Append one log-only fact, requesting the envelope's `ignorable: true`
   * marker. On hosts whose event vocabulary forbids the fact events
   * (`0.1.2-alpha.1+`) the record is routed to the fallback sink instead
   * of the session log; on pre-marker rc hosts (and after a failed probe)
   * the append is skipped so the session log stays loadable everywhere.
   * Append failures are contained: a fact hiccup never disturbs the
   * caller's operation.
   * @param session - the session whose log carries the fact.
   * @param type - the fact event type.
   * @param data - the fact payload.
   */
  append(session: Session, type: FactEventType, data: unknown): void {
    if (!this.factEventsAllowed()) { this.fallback?.(type, data); return }
    if (!this.mayAppend()) return
    try {
      const result = (session.append as unknown as (t: string, d: unknown, o?: { ignorable?: true }) => unknown)(type, data, { ignorable: true })
      this.probe(result)
    } catch (error) {
      this.warn(`fact append failed: ${String(error)}`)
    }
  }

  /** Whether the host's event vocabulary still accepts the log-only fact events; the pre-check runs once. */
  private factEventsAllowed(): boolean {
    if (this.policy === 'unknown') {
      const version = peerSessionVersion()
      if (version !== null) this.policy = factEventPolicyForVersion(version)
    }
    if (this.policy !== 'forbidden') return true
    if (!this.warnedForbidden) {
      this.warnedForbidden = true
      this.warn(
        'this host fails closed on the session event vocabulary (0.1.2-alpha.1+), so log-only fact events cannot be written to the session log — fact records are routed to the logger/panel channel instead',
      )
    }
    return false
  }

  /** Whether the host stamps the marker (or the dangerous opt-in is set); the pre-check runs once. */
  private mayAppend(): boolean {
    if (this.allowUnmarked) return true
    if (this.support === 'unsupported') return false
    if (this.support === 'unknown') {
      const version = peerSessionVersion()
      if (version !== null && isUnmarkedHostVersion(version)) {
        this.support = 'unsupported'
        this.warnOnce()
        return false
      }
    }
    return true // unknown with no resolvable version: append once and probe the envelope
  }

  /** After the first append on an unversioned host, probe the returned envelope for the marker. */
  private probe(result: unknown): void {
    if (this.support !== 'unknown' || this.allowUnmarked) return
    if (isMarkedAuditEvent(result)) {
      this.support = 'supported'
    } else {
      this.support = 'unsupported'
      this.warnOnce()
    }
  }

  /** One-time warning that fact appends were disabled to keep session logs loadable. */
  private warnOnce(): void {
    if (this.warned) return
    this.warned = true
    this.warn(
      'this host drops the ignorable marker on log-only fact events (Session.append predates it), which would make sessions unresumable on stricter harness builds — fact appends are disabled and the projections degrade to an empty fold; set allowUnmarkedFacts: true to opt back in, and repair already-polluted logs with scripts/repair-session-logs.mjs from dsh-permission-rules',
    )
  }
}