/**
 * Pure presentation of background-agent dashboard rows. The presenter reads
 * only the session-list snapshot (each parent summary carries its
 * `backgroundAgents` projection value) and derives every displayed fact —
 * no I/O, clock, or randomness — so the rows are testable and the component
 * stays a thin binder.
 *
 * @module dsh-background-agents/presenter
 */
import { type BackgroundAgentEntry } from '../projection-schema.ts';
/** Display status of one row: the durable fact overlaid with the live running bit. */
export type RowStatus = 'running' | 'idle' | 'settled' | 'archived';
/** One rendered dashboard row. */
export interface AgentRow {
    /** Durable direct parent session id (the jump and stop authority). */
    readonly parentSessionId: string;
    /** Durable child session id (the agentId the tools return). */
    readonly agentId: string;
    /** Display label: the projection label, else the child's session title. */
    readonly label: string;
    readonly status: RowStatus;
    /** Accepted deliveries: the initial task plus every follow-up. */
    readonly messageCount: number;
    /** Last progress or settle summary, when recorded. */
    readonly lastMessage?: string;
    /** Epoch ms of the registration fact. */
    readonly createdAt: number;
    /** Epoch ms of the last folded fact. */
    readonly lastActiveAt: number;
}
/** The session-list face the presenter reads (host-sampled `running` per session). */
export interface SessionListLike {
    byId: Record<string, {
        id: string;
        running?: boolean;
        displayTitle?: string;
        projectionValues?: unknown;
    }>;
}
/**
 * Overlay the durable lifecycle fact with the live running bit. The client
 * list cannot distinguish a live-but-idle child from a cold one, so both read
 * `idle`; `bg_list` refines with the host agent registry.
 * @param entry - the folded projection entry.
 * @param liveRunning - whether the child session's driver is running now.
 * @returns the display status.
 */
export declare function rowStatus(entry: BackgroundAgentEntry, liveRunning: boolean): RowStatus;
/**
 * Build every dashboard row from one session-list snapshot, ordered by
 * registration time (oldest first) with the id as tiebreak.
 * @param list - the session-list snapshot.
 * @returns the dashboard rows; empty when no session projects agents.
 */
export declare function buildAgentRows(list: SessionListLike): AgentRow[];
/** Relative-time bucket of a row's last activity, for the caller to localize. */
export type RelativeTimeUnit = 'now' | 'minutes' | 'hours' | 'days' | 'months' | 'years';
/** Structured relative time: the bucket plus its magnitude (0 for `now`). */
export interface RelativeTime {
    readonly unit: RelativeTimeUnit;
    readonly n: number;
}
/**
 * Compact relative time for a row's `lastActiveAt`.
 * @param at - epoch ms of the last activity.
 * @param now - epoch ms now (injected for purity).
 * @returns the bucket and magnitude.
 */
export declare function relativeTime(at: number, now: number): RelativeTime;
//# sourceMappingURL=presenter.d.ts.map