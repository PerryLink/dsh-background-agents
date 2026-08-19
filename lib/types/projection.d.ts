/**
 * The `backgroundAgents` session-projection unit: folds the parent session's
 * log into the dashboard value the Web UI and `bg_list` consume. The fold
 * reads ONLY event types the harness already knows —
 * `tool/result` replay metadata (registration / message / stop facts written
 * by this plugin's tools) and `user/message` (this plugin's injected notices
 * plus the official `subagent-settled` account) — so the value reconstructs
 * from the durable log on every reopen without any custom session event.
 *
 * @module dsh-background-agents/projection
 */
import type { ProjectionDefinition } from '@deepseek-ai/dsh-session-projection';
import { type BackgroundAgentEntry, type BackgroundAgentsProjection } from './projection-schema.js';
/**
 * Mutable fold state; plain JSON so the persisted projection cache can store
 * it. `source` is fold-internal only (never in the wire value): `legacy`
 * entries were built from the pre-event channels (`tool/result` replay
 * metadata and notice text), `event` entries from the structured
 * `background-agents/fact` records. Once the structured channel owns a row
 * the legacy folds stop for it, so a log that carries both channels (the
 * v0.3.0 write path keeps writing both) never double-counts.
 */
interface State {
    entries: StateEntry[];
}
/** One fold row plus its channel provenance. */
interface StateEntry extends BackgroundAgentEntry {
    readonly source: 'legacy' | 'event';
}
/**
 * The registered projection unit. `stateVersion` bumps whenever the fold
 * semantics or the serialized state fields change, so persisted checkpoint
 * rows from an older unit refold instead of replaying into garbage.
 */
export declare const backgroundAgentsProjectionDefinition: ProjectionDefinition<'backgroundAgents', State>;
declare module '@deepseek-ai/dsh-session-projection/types' {
    interface SessionProjectionMap {
        /** Background-agent dashboard rows folded from the parent session log. */
        backgroundAgents: BackgroundAgentsProjection;
    }
}
export {};
//# sourceMappingURL=projection.d.ts.map