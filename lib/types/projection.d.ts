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
import { type BackgroundAgentEntry, type BackgroundAgentsProjection } from './projection-schema.ts';
/** Mutable fold state; plain JSON so the persisted projection cache can store it. */
interface State {
    entries: BackgroundAgentEntry[];
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