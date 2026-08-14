/**
 * Live lifecycle bookkeeping for background agents: the in-memory registry
 * of tracked children plus the two observers it serves — the throttled
 * auto-report of per-turn progress into the parent and the idle-archive
 * sweep. The durable facts live in the parent session log (folded by the
 * `backgroundAgents` projection); this module is a cache, never a second
 * source of truth, so losing it only costs throttles and timers.
 *
 * @module dsh-background-agents/lifecycle
 */
import type { Context } from '@deepseek-ai/cordis';
import type { Agent } from '@deepseek-ai/dsh-agent';
import type { Session, SessionEvent, SessionId } from '@deepseek-ai/dsh-session';
import type { AgentRegistry } from '@deepseek-ai/dsh-agent';
/** Tunables the lifecycle honors; every threshold is a validated Config field. */
export interface LifecycleConfig {
    readonly autoReport: boolean;
    /** Minimum ms between two progress injections for one child. */
    readonly reportThrottleMs: number;
    /** Hard cap on the progress-line text injected per report. */
    readonly reportSummaryMaxChars: number;
    /**
     * Idle archive toggle: when false, the sweep leaves quiet children alone
     * (only stale cache entries are reclaimed).
     */
    readonly autoArchive: boolean;
    /** Idle window after which the sweep archives a quiet child. */
    readonly idleTimeoutMinutes: number;
    /** Sweep period. */
    readonly idleSweepIntervalMs: number;
    /**
     * Progress delivery: `quiet` appends the notice to the parent's next model
     * request; `wakeup` starts a parent turn when idle (queues when busy).
     */
    readonly reportDelivery: 'quiet' | 'wakeup';
}
/** One tracked child: live bookkeeping only. */
export interface TrackedChild {
    /** Durable child session id. */
    readonly childId: SessionId;
    /** Durable direct parent session id. */
    readonly parentSessionId: SessionId;
    /** Creation label (display only; the projection holds the durable copy). */
    readonly label: string;
    /** Epoch ms the child was accepted. */
    readonly createdAt: number;
    /** Last observed activity epoch ms (any child session event). */
    lastActivityAt: number;
    /** Last auto-report injection epoch ms (the throttle watermark). */
    lastReportAt: number;
    /** Set by the sweep; archived children stop being observed. */
    archived: boolean;
}
/** Read face of the live agent registry the lifecycle needs. */
export interface LiveAgents {
    get(id: SessionId): Agent | undefined;
}
/** Read face of the live session store the lifecycle needs. */
export interface LiveSessions {
    get(id: SessionId): Session | undefined;
}
/**
 * The in-memory tracked-children registry.
 */
export declare class BackgroundAgentLifecycle {
    private readonly children;
    /** Track one accepted child, replacing any stale record under the same id. */
    register(childId: SessionId, parentSessionId: SessionId, label: string, now: number): void;
    /** Record one observed child-session event. */
    touch(childId: SessionId, at: number): void;
    /** Record one emitted progress report (throttle watermark). */
    noteReport(childId: SessionId, at: number): void;
    /** Mark archived; archived children leave the live observation set. */
    archive(childId: SessionId): void;
    /** Drop a stale cache entry (the parent log keeps the durable facts). */
    delete(childId: SessionId): void;
    get(childId: SessionId): TrackedChild | undefined;
    has(childId: SessionId): boolean;
    /** Live non-archived children of one parent, in registration order. */
    activeFor(parentSessionId: SessionId): TrackedChild[];
    /** Every tracked child, archived included (the sweep iterates this). */
    all(): TrackedChild[];
    /** Live non-archived count for one parent (the fallback cap when listing fails). */
    activeCountFor(parentSessionId: SessionId): number;
}
/**
 * One line of a session's last assistant text, empty when it produced none.
 * Accepts any event-log carrier so both live sessions and persistence
 * inspections can serve the same fold.
 * @param session - the event-log carrier.
 * @param options.allowReasoning - when true and the selected output carries no
 *   text block, fall back to the reasoning blocks (a thinking model's last
 *   message may be reasoning-only). Off by default: progress lines never
 *   inject reasoning into the parent.
 * @param options.reasoning - set by the caller to observe which source the
 *   fold used (text when the fallback was not needed).
 */
export declare function sessionLastText(session: {
    events: readonly SessionEvent[];
}, options?: {
    allowReasoning?: boolean;
    reasoning?: {
        used: boolean;
    };
}): string;
/** One line of the child's last assistant text, empty when it produced none. */
export declare function childLastText(sessions: LiveSessions, childId: SessionId): string;
/**
 * Report one completed child turn into the parent: a model-visible injected
 * notice (source `{ kind: 'plugin', plugin: 'dsh-background-agents' }`) whose
 * canonical prefix lets the projection fold the durable fact back out of the
 * parent log. Honours the per-child throttle and the parent's presence.
 * `wakeup` delivery starts a parent turn through `Agent.followup` (queued
 * when the parent is busy); `quiet` delivery appends to the parent's next
 * request through `Agent.inject`.
 * @returns true when a report was emitted.
 */
export declare function reportProgress(agents: LiveAgents, sessions: LiveSessions, config: LifecycleConfig, lifecycle: BackgroundAgentLifecycle, child: TrackedChild, now: number): boolean;
/**
 * Archive one idle child: inject the archived notice into the live parent and
 * request interruption of a resident activation. The stop request is exactly
 * the official `interrupt` semantics — fire and return; teardown belongs to
 * the continuation manager. A child whose live agent is mid-turn is left
 * alone (a long tool execution emits no session events and would otherwise
 * read as idle).
 */
export declare function archiveChild(ctx: Context, agents: LiveAgents, config: LifecycleConfig, lifecycle: BackgroundAgentLifecycle, child: TrackedChild): void;
/**
 * One sweep pass: archive quiet children past the idle window and drop cache
 * entries whose parent and child agents are both gone (the parent log keeps
 * the durable facts). Throwing archive notices are contained per child so one
 * failure never skips a sibling.
 */
export declare function sweepIdle(ctx: Context, agents: LiveAgents, config: LifecycleConfig, lifecycle: BackgroundAgentLifecycle, now: number): void;
/** Read the parent's projection value and return the archived agent ids, guarded. */
export declare function archivedIdsFor(ctx: Context, parent: Agent): string[];
/**
 * Count one parent's non-archived background agents for the cap. The durable
 * listing is authoritative; when it is unavailable (projections or session
 * store missing), the live registry is the honest fallback and the next
 * start proceeds against it.
 * @returns the current count, or undefined when the durable listing threw.
 */
export declare function countBackgroundAgents(ctx: Context, parent: Agent, lifecycle: BackgroundAgentLifecycle, signal: AbortSignal): Promise<number>;
/** The idle sweep timer, owned by the caller's effect. */
export declare function startIdleSweep(ctx: Context, agents: AgentRegistry, config: LifecycleConfig, lifecycle: BackgroundAgentLifecycle): () => void;
//# sourceMappingURL=lifecycle.d.ts.map