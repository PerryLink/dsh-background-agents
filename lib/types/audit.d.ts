/**
 * Host-capability detection for the `ignorable` envelope-marker surface
 * that every log-only plugin fact event depends on.
 *
 * `Session.append(type, data, { ignorable: true })` stamps the envelope
 * marker on host builds that expose the surface (harness master
 * `@deepseek-ai/dsh-session`); every released rc line through `0.1.0-rc.8`
 * silently drops the options bag, so fact events land unmarked and stricter
 * hosts refuse to resume those sessions (`SessionFormatUnsupportedError`).
 * The fact appender detects the host before polluting a log: the installed
 * peer version is checked against the known-unmarked lines first, and an
 * unknown (unresolvable) version is verified by probing the FIRST
 * appended event's returned envelope. The same discipline lives in
 * `dsh-permission-rules` and `dsh-auto-review`.
 * @module dsh-background-agents/audit
 */
/** Host envelope capability: unknown until the first append (or the peer-version pre-check). */
export type AuditSupport = 'unknown' | 'supported' | 'unsupported';
/**
 * Whether an `append` call actually honored the `ignorable` marker: the
 * logged event returned by the host carries `ignorable === true` on
 * marker-aware builds and nothing on pre-marker builds. `false` (or any
 * non-event return) means the host dropped the marker and the event landed
 * unmarked — the appender then degrades instead of polluting further logs.
 * @param result - the return value of the fact append.
 * @returns true only when the marker is present on the returned envelope.
 */
export declare function isMarkedAuditEvent(result: unknown): boolean;
/**
 * Whether a `@deepseek-ai/dsh-session` version line predates the
 * `ignorable` envelope-marker surface: every released rc line through
 * `0.1.0-rc.8` silently drops the marker from `Session.append` options
 * (the stamping fix exists on harness master only — no release carries it
 * yet), so fact events written by those builds land unmarked and break
 * resume on stricter hosts. Extend the bound when a new rc line ships that
 * still drops the marker. Non-matching (later rc, stable, or unresolvable)
 * versions are treated as possibly-marker-aware and verified by the
 * append probe.
 * @param version - the installed peer version string.
 * @returns true for the known-unmarked rc.1–rc.8 lines.
 */
export declare function isUnmarkedHostVersion(version: string): boolean;
/**
 * The installed `@deepseek-ai/dsh-session` version, or `null` when
 * unresolvable (falls back to the append probe).
 * @returns the version string, or null when the peer cannot be resolved.
 */
export declare function peerSessionVersion(): string | null;
//# sourceMappingURL=audit.d.ts.map