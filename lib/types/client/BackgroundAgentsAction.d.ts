import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import { NS } from './locales.ts';
/** Business actions supplied by the slot registration. */
export interface BackgroundAgentsInjected {
    /**
     * Open the child session through its durable direct-parent address.
     * @returns an error message on failure, undefined on success.
     */
    openChild(parentSessionId: string, childSessionId: string): Promise<string | undefined>;
    /**
     * Request interruption of the child's current turn through the official
     * `subagent.interrupt` RPC.
     * @returns an error message on failure, undefined on success.
     */
    stopChild(parentSessionId: string, childSessionId: string): Promise<string | undefined>;
    /**
     * Queue one message as the child's next turn through the official
     * `subagent.prompt` RPC (wakes a settled child).
     * @returns an error message on failure, undefined on success.
     */
    sendMessage(parentSessionId: string, childSessionId: string, text: string): Promise<string | undefined>;
}
/** Full props: the footer-action owner share, standard kit, injected actions, and locale. */
export type BackgroundAgentsActionProps = PropsRuntime<'sidebar.footer.action'> & BackgroundAgentsInjected & PropsLocale<typeof NS>;
/** The sidebar footer trigger + floating dashboard panel. */
export declare function BackgroundAgentsAction({ wide, t, useSessions, openChild, stopChild, sendMessage, }: BackgroundAgentsActionProps): import("react").JSX.Element;
//# sourceMappingURL=BackgroundAgentsAction.d.ts.map