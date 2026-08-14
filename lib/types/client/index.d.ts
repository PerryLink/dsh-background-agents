/**
 * dsh-background-agents, browser half: the sidebar `sidebar.footer.action`
 * entry whose floating panel shows every background agent across sessions —
 * label, status, last activity, message count — with one-click jump into the
 * child session and a stop button. Rows derive from the `backgroundAgents`
 * projection values riding the session-list snapshot (zero RPC); jump and
 * stop go through the official `subagents` client API (the same authority as
 * the shipped subagent catalog).
 */
import type { Context } from '@deepseek-ai/cordis';
import { type BackgroundAgentsKey } from './locales.ts';
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        /** Background-agent panel copy. */
        'background-agents': BackgroundAgentsKey;
    }
}
export type { BackgroundAgentsActionProps, BackgroundAgentsInjected, } from './BackgroundAgentsAction.tsx';
/** Required services: sessions (list + subagent navigation), slots, locale, and the wire client. */
export declare const inject: string[];
/**
 * Register the background-agent panel into the sidebar footer.
 * @param ctx - client root context.
 */
export declare function apply(ctx: Context): void;
//# sourceMappingURL=index.d.ts.map