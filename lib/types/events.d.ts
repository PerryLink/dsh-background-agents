/**
 * The plugin-owned durable fact event: `background-agents/fact`, appended to
 * the PARENT session log as a log-only record stamped with the envelope's
 * `ignorable: true` marker. The harness opened this surface in the plugin's
 * baseline (`Session.append(type, data, { ignorable: true })`, see
 * ARCHITECTURE.md): readers that do not know the type skip the record
 * instead of refusing the log, so older harness builds and older plugin
 * versions keep loading parents written by this one.
 *
 * The fact channel carries the structured lifecycle facts (registered /
 * message / stop / progress / archived) that the `backgroundAgents`
 * projection folds into dashboard rows. It is deliberately separate from
 * the model-visible channels — injected `user/message` notices and official
 * `subagent-settled` accounts — so dashboard facts never depend on parsing
 * human-readable text back apart. Legacy logs (v0.2.0 and earlier) carry the
 * facts only through `tool/result` replay metadata and notice text; the
 * projection folds both channels (see `projection.ts`).
 *
 * @module dsh-background-agents/events
 */
/** The log-only fact event type this plugin appends to parent sessions. */
export declare const FACT_EVENT: "background-agents/fact";
/** One structured lifecycle fact, discriminated on `kind`. */
export type BackgroundAgentsFact = {
    /** A child accepted through `background_agent`; the fold opens its row. */
    readonly kind: 'registered';
    readonly agentId: string;
    /** The bounded creation label persisted with the child. */
    readonly label: string;
} | {
    /** One accepted follow-up delivery; the fold bumps the message count. */
    readonly kind: 'message';
    readonly agentId: string;
    /** The inbox message id of the accepted delivery (provenance only). */
    readonly messageId: string;
} | {
    /** One interrupt request; records the request time, changes no activity. */
    readonly kind: 'stop';
    readonly agentId: string;
} | {
    /** One throttled per-turn progress report; the fold sets the last message. */
    readonly kind: 'progress';
    readonly agentId: string;
    /** The bounded progress text (the same value the model-visible notice carries). */
    readonly text: string;
} | {
    /** One idle-sweep archive; the fold parks the row. */
    readonly kind: 'archived';
    readonly agentId: string;
};
declare module '@deepseek-ai/dsh-session/types' {
    interface SessionEventMap {
        [FACT_EVENT]: BackgroundAgentsFact;
    }
}
//# sourceMappingURL=events.d.ts.map