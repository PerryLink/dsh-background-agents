/**
 * Durable vocabulary of dsh-background-agents: the canonical notice-line
 * format carried by model-visible injections and the replay metadata the
 * four tools attach to their `tool/result` events. Both channels use ONLY
 * event types the harness already knows (`user/message`, `tool/result`), so
 * the facts survive persistence reloads and the `backgroundAgents`
 * projection folds them back out of the parent log — the same discipline as
 * model-visible ⟺ logged, applied to dashboard state.
 *
 * @module dsh-background-agents/vocabulary
 */
import type { ContextFormed, MessageSource } from '@deepseek-ai/dsh-llm';
/**
 * Producer-owned message attribution.
 *
 * The harness's `MessageSourceMap` is a merge-extensible sum type: each
 * producer declares its own `kind` in its own module, and the retired
 * catch-all `{ kind: 'plugin', plugin }` shape no longer exists. It is gone
 * from BOTH layers that used to accept it — the type layer
 * (`packages/llm/llm/src/message.ts`, whose map carries only
 * `user | model | tool | 'system-prompt'`) and the persistence layer
 * (`session-format-v3-to-v4/src/message-sources.ts` refuses a physical row
 * whose source `kind` is `'plugin'`, so `as any` cannot smuggle one past
 * admission). The host's own producers do exactly this (`tool-jobs` declares
 * `{ kind: 'tool-jobs' } & ContextFormed`), so this plugin declares its own
 * kind under its package name.
 */
declare module '@deepseek-ai/dsh-llm' {
    interface MessageSourceMap {
        /** This plugin's model-visible injections: the progress, archive, and room notices. */
        'dsh-background-agents': {
            kind: 'dsh-background-agents';
        } & ContextFormed;
    }
}
/** The producer tag stamped on every model-visible notice and replay meta this plugin writes. */
export declare const PLUGIN: "dsh-background-agents";
/** This plugin's message-source kind; the module augmentation above is what declares it. */
export declare const SOURCE_KIND: "dsh-background-agents";
/**
 * Whether one message source is a notice this plugin injected.
 *
 * The source vocabulary is versioned independently of the notice text, so a
 * parent log may hold notices written before the `kind: 'plugin'` catch-all
 * was retired. Those rows are read (never written) here: the projection is a
 * pure fold over arbitrary historical logs, and the notice-line prefix check
 * stays the authority — the source gate only narrows which messages are
 * worth parsing. A log carrying a `'plugin'`-kinded notice is therefore still
 * folded instead of silently losing its row.
 *
 * Returns a plain boolean rather than a type predicate on purpose: the fold
 * shares one `MessageSource` value with the official `subagent-settled`
 * branch below it, and narrowing here would strip that variant from the
 * union at the sibling check.
 * @param source - the source of one `user/message` event.
 * @returns true when the source is a notice from this plugin.
 */
export declare function isBackgroundAgentsNotice(source: MessageSource): boolean;
/** Prefix that opens every injected notice line, carrying the durable child agent id. */
export declare const NOTICE_PREFIX: "[background-agent ";
/**
 * Join one injected notice line from the child id, the fact kind, and the
 * human text. The projection folds the line back apart; the model reads the
 * whole line verbatim.
 * @param agentId - durable child session id.
 * @param kind - which lifecycle fact the line states.
 * @param text - human-readable account.
 * @returns the canonical notice line.
 */
export declare function noticeLine(agentId: string, kind: 'progress' | 'archived', text: string): string;
/** One parsed notice line: the durable child id and the stated fact kind. */
export interface NoticeHead {
    /** Durable child session id from the line prefix. */
    readonly agentId: string;
    /** The fact kind (`progress` or `archived`). */
    readonly kind: 'progress' | 'archived';
    /** The human text after the head. */
    readonly text: string;
}
/**
 * Parse the canonical notice head. Returns undefined for any line this
 * plugin did not produce, so foreign plugin notices never fold into the
 * projection.
 * @param text - one injected notice line.
 * @returns the head, or undefined when the line is not this plugin's format.
 */
export declare function parseNotice(text: string): NoticeHead | undefined;
/**
 * Replay metadata attached to the background_agent tool result: the durable
 * registration fact the projection folds into the new agent row.
 */
export interface RegisteredMeta {
    readonly plugin: typeof PLUGIN;
    readonly action: 'registered';
    /** Durable child session id. */
    readonly agentId: string;
    /** Creation label persisted with the child. */
    readonly label: string;
}
/**
 * Replay metadata attached to the bg_message tool result: one accepted
 * follow-up delivery.
 */
export interface MessageMeta {
    readonly plugin: typeof PLUGIN;
    readonly action: 'message';
    /** Durable child session id. */
    readonly agentId: string;
    /** Inbox message id of the accepted delivery. */
    readonly messageId: string;
}
/**
 * Replay metadata attached to the bg_stop tool result: one interrupt request.
 */
export interface StopMeta {
    readonly plugin: typeof PLUGIN;
    readonly action: 'stop';
    /** Durable child session id. */
    readonly agentId: string;
}
/** The closed replay-metadata union this plugin writes into `tool/result.meta`. */
export type BackgroundAgentsMeta = RegisteredMeta | MessageMeta | StopMeta;
/**
 * Runtime-guard one opaque `tool/result.meta` value as this plugin's metadata.
 * The meta channel is tool-private JSON, so the projection validates before
 * folding rather than trusting shape by position.
 * @param value - the opaque meta value.
 * @returns the typed meta, or undefined when another tool wrote it.
 */
export declare function isBackgroundAgentsMeta(value: unknown): BackgroundAgentsMeta | undefined;
//# sourceMappingURL=vocabulary.d.ts.map