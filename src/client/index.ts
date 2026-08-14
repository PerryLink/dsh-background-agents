/**
 * dsh-background-agents, browser half: the sidebar `sidebar.footer.action`
 * entry whose floating panel shows every background agent across sessions —
 * label, status, last activity, message count — with one-click jump into the
 * child session and a stop button. Rows derive from the `backgroundAgents`
 * projection values riding the session-list snapshot (zero RPC); jump and
 * stop go through the official `subagents` client API (the same authority as
 * the shipped subagent catalog).
 */
import type { Context } from '@deepseek-ai/cordis'
import type { ConnectionHandle } from '@deepseek-ai/dsh-api-remotes/client'
import type { ISessions, SessionId } from '@deepseek-ai/dsh-client-runtime/client'
import { BackgroundAgentsAction, type BackgroundAgentsInjected } from './BackgroundAgentsAction.tsx'
import { extractResultText } from './presenter.ts'
import { en, NS, zh, type BackgroundAgentsKey } from './locales.ts'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Background-agent panel copy. */
    'background-agents': BackgroundAgentsKey
  }
}

export type {
  BackgroundAgentsActionProps, BackgroundAgentsInjected,
} from './BackgroundAgentsAction.tsx'

/** Required services: sessions (list + subagent navigation), slots, locale, and the wire client. */
export const inject = ['sessions', 'slots', 'locale', 'connection']

/**
 * Register the background-agent panel into the sidebar footer.
 * @param ctx - client root context.
 */
export function apply(ctx: Context): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-background-agents: dictionaries')
  // The client sessions face is the runtime's ISessions; the host merge can
  // shadow it in mixed programs, so the cast reads the runtime contract.
  const sessions = ctx.get('sessions') as ISessions
  const { api } = ctx.get('connection') as ConnectionHandle
  ctx.slots.inject('sidebar.footer.action', () => ctx.slots.register({
    name: 'sidebar.footer.action',
    id: 'background-agents',
    order: 0,
    locale: NS,
    inject: (): BackgroundAgentsInjected => ({
      async openChild(parentSessionId: string, childSessionId: string): Promise<string | undefined> {
        try {
          await sessions.refreshSubagents(parentSessionId as SessionId)
          sessions.openSubagent({
            parentSessionId: parentSessionId as SessionId,
            childSessionId: childSessionId as SessionId,
            mode: 'continuable',
          })
          return undefined
        } catch (error) {
          return error instanceof Error ? error.message : String(error)
        }
      },
      async stopChild(parentSessionId: string, childSessionId: string): Promise<string | undefined> {
        try {
          const result = await api.subagents.interrupt({
            parentSessionId: parentSessionId as SessionId,
            childSessionId: childSessionId as SessionId,
            mode: 'continuable',
          })
          if (result.result.ok) return undefined
          return `${result.result.error.code}: ${result.result.error.message}`
        } catch (error) {
          return error instanceof Error ? error.message : String(error)
        }
      },
      async sendMessage(parentSessionId: string, childSessionId: string, text: string): Promise<string | undefined> {
        try {
          // The same wire RPC the shipped subagent catalog uses: a queued
          // delivery that wakes the child (its next turn answers).
          const result = await api.subagents.prompt({
            parentSessionId: parentSessionId as SessionId,
            childSessionId: childSessionId as SessionId,
            mode: 'continuable',
            content: [{ type: 'text', text }],
            clientTimeZone: new Intl.DateTimeFormat().resolvedOptions().timeZone,
          })
          if (result.result.ok) return undefined
          return `${result.result.error.code}: ${result.result.error.message}`
        } catch (error) {
          return error instanceof Error ? error.message : String(error)
        }
      },
      async readResult(parentSessionId: string, childSessionId: string): Promise<{ text: string; error?: string }> {
        try {
          // A read-only transcript peek through the official history RPC: the
          // last few messages suffice for the final assistant text, and the
          // child Agent is never activated.
          const result = await api.subagents.history({
            parentSessionId: parentSessionId as SessionId,
            childSessionId: childSessionId as SessionId,
            mode: 'continuable',
            maxMessages: 4,
          })
          if (!result.result.ok) {
            return { text: '', error: `${result.result.error.code}: ${result.result.error.message}` }
          }
          return { text: extractResultText(result.result.value.events) }
        } catch (error) {
          return { text: '', error: error instanceof Error ? error.message : String(error) }
        }
      },
    }),
  }, BackgroundAgentsAction))
}
