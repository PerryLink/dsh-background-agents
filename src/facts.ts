/**
 * The single append seam for every log-only plugin fact event
 * (`background-agents/fact` lifecycle facts and `team-room/fact` room
 * timeline facts).
 *
 * Hosts whose `Session.append` predates the `ignorable` envelope marker
 * (the rc.1–rc.6 lines) silently drop the options bag, so a fact event
 * lands UNMARKED and stricter harness builds refuse to resume the session.
 * The appender detects such hosts BEFORE the first append (installed-peer
 * version pre-check, then a probe of the first appended envelope's return
 * value), disables fact appends with a one-time warning, and the durable
 * store + model-visible notices keep working (the projections degrade to
 * an empty fact fold). `allowUnmarkedFacts: true` opts back into unmarked
 * appends — deliberately dangerous — and already-polluted logs can be
 * repaired with `scripts/repair-session-logs.mjs` from
 * `dsh-permission-rules` (`--types` for `background-agents/fact` and
 * `team-room/fact`).
 * @module dsh-background-agents/facts
 */

import type { Session } from '@deepseek-ai/dsh-session'
import { isMarkedAuditEvent, isUnmarkedHostVersion, peerSessionVersion, type AuditSupport } from './audit.ts'

/** The log-only fact event types this appender owns. */
export type FactEventType = 'background-agents/fact' | 'team-room/fact'

/**
 * Host-gated fact appender. One instance per plugin mount, shared by the
 * lifecycle observers, the four tools, and the room hub.
 */
export class FactAppender {
  private support: AuditSupport = 'unknown'
  private warned = false

  constructor(
    private readonly allowUnmarked: boolean,
    private readonly warn: (message: string) => void,
  ) {}

  /**
   * Append one log-only fact, requesting the envelope's `ignorable: true`
   * marker. On pre-marker hosts (and after a failed probe) the append is
   * skipped so the session log stays loadable everywhere. Append failures
   * are contained: a fact hiccup never disturbs the caller's operation.
   * @param session - the session whose log carries the fact.
   * @param type - the fact event type.
   * @param data - the fact payload.
   */
  append(session: Session, type: FactEventType, data: unknown): void {
    if (!this.mayAppend()) return
    try {
      const result = (session.append as unknown as (t: string, d: unknown, o?: { ignorable?: true }) => unknown)(type, data, { ignorable: true })
      this.probe(result)
    } catch (error) {
      this.warn(`fact append failed: ${String(error)}`)
    }
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
