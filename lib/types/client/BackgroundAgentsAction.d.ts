import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import { type SessionListLike } from './presenter.js';
import { NS } from './locales.js';
/** Minimal structural snapshot contract (the owner package no longer re-exports the generic). */
interface ObservableSnapshot<T> {
    getSnapshot(): T;
    subscribe(listener: () => void): () => void;
}
/** Business actions supplied by the slot registration. */
export interface BackgroundAgentsInjected {
    /** The live session-list snapshot the dashboard rows derive from. */
    sessions: ObservableSnapshot<SessionListLike>;
    /**
     * Open the child session through its durable direct-parent address.
     * @returns an error message on failure, undefined on success.
     */
    openChild(parentSessionId: string, childSessionId: string): Promise<string | undefined>;
    /**
     * Request interruption of the child's current turn through the official
     * `subagent.interruptByParent` RPC.
     * @returns an error message on failure, undefined on success.
     */
    stopChild(parentSessionId: string, childSessionId: string): Promise<string | undefined>;
    /**
     * Queue one message as the child's next turn through the official
     * `subagent.prompt` RPC (wakes a settled child).
     * @returns an error message on failure, undefined on success.
     */
    sendMessage(parentSessionId: string, childSessionId: string, text: string): Promise<string | undefined>;
    /**
     * Read the child's final assistant text through the child session's
     * `conversation` projection (the `subagent.history` RPC no longer exists;
     * the peek never activates the child Agent).
     * @returns the extracted text plus an optional error message.
     */
    readResult(parentSessionId: string, childSessionId: string): Promise<{
        text: string;
        error?: string;
    }>;
}
/** Full props: the footer-action owner share, standard kit, injected actions, and locale. */
export type BackgroundAgentsActionProps = PropsRuntime<'sidebar.footer.action'> & BackgroundAgentsInjected & PropsLocale<typeof NS>;
/** The sidebar footer trigger + floating dashboard panel. */
export declare function BackgroundAgentsAction({ wide, t, sessions, openChild, stopChild, sendMessage, readResult, }: BackgroundAgentsActionProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=BackgroundAgentsAction.d.ts.map