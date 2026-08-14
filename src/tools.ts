/**
 * The four model-facing tools: `background_agent` starts a durable continuable
 * child through the official seam, `bg_message` delivers one later turn,
 * `bg_list` merges the official child catalog with this plugin's projection
 * facts, and `bg_stop` requests interruption. Every execution path is a thin
 * adapter over `ctx.subagents` — the plugin performs no lifecycle routing of
 * its own, and every durable fact rides official `tool/result` replay
 * metadata or injected `user/message` notices (see `vocabulary.ts`).
 *
 * @module dsh-background-agents/tools
 */

import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'
import type { Agent } from '@deepseek-ai/dsh-agent'
import type { ContentBlock } from '@deepseek-ai/dsh-llm'
import { SessionId } from '@deepseek-ai/dsh-session'
import { SubagentError } from '@deepseek-ai/dsh-subagent'
import { countBackgroundAgents, type BackgroundAgentLifecycle } from './lifecycle.ts'
import { isBackgroundAgentsProjection } from './projection-schema.ts'
import { PLUGIN } from './vocabulary.ts'

/** Lifecycle thresholds the tools enforce. */
export interface ToolConfig {
  /** Name of the `ctx.subagents` provider that starts continuable children. */
  readonly provider: string
  /** Hard cap on non-archived background agents per parent session. */
  readonly maxBackgroundAgents: number
  /** Display-label cap; longer labels ellipsize. */
  readonly maxLabelChars: number
}

/** One bg_list row's activity vocabulary. */
export type BgListActivity = 'running' | 'idle' | 'ready' | 'settled' | 'archived'

/** One row returned by bg_list (schema-validated canonical value). */
export interface BgListAgent {
  agentId: string
  label: string
  mode: 'continuable'
  activity: BgListActivity
  messageCount?: number
  lastMessage?: string
  createdAt?: number
  lastActiveAt?: number
}

/** One candidate the durable catalog could not serve. */
export interface BgListDiagnostic {
  readonly agentId: string
  readonly reason: 'corrupt' | 'unsupported' | 'unavailable'
}

/** The bg_list canonical value: a listing, or an explicit unrecoverable marker. */
export type BgListResult =
  | { readonly kind: 'listing'; readonly agents: BgListAgent[]; readonly diagnostics: BgListDiagnostic[] }
  | { readonly kind: 'unrecoverable'; readonly code: string; readonly message: string }

/** The bg_stop canonical value. */
export interface BgStopResult {
  readonly outcome: 'interrupt-requested' | 'not-found'
  readonly agentId: string
}

/** First line of a task description, used as the default creation label. */
function firstLine(text: string): string {
  const cut = text.indexOf('\n')
  return (cut === -1 ? text : text.slice(0, cut)).trim()
}

/** Bound one display label with an explicit ellipsis. */
function boundLabel(text: string, max: number): string {
  const trimmed = text.trim()
  return trimmed.length <= max ? trimmed : `${trimmed.slice(0, max - 1)}…`
}

/** Resolve the creation label: the optional argument, else the task's first line. */
function labelOf(args: { task: string; label?: string }, config: ToolConfig): string {
  const explicit = args.label?.trim()
  return boundLabel(explicit === undefined || explicit === '' ? firstLine(args.task) : explicit, config.maxLabelChars)
}

/** Read one parent's projection facts, guarded against an unmounted registry. */
function factsFor(ctx: Context, parent: Agent): Map<string, NonNullable<ReturnType<typeof isBackgroundAgentsProjection>>['agents'][number]> {
  const registry = ctx.get('sessionProjections')
  if (registry === undefined) return new Map()
  const value = registry.snapshot(parent.session).values.backgroundAgents
  const projection = isBackgroundAgentsProjection(value)
  return new Map((projection?.agents ?? []).map(entry => [entry.agentId, entry]))
}

/** Derive one row's activity from the durable fact and the live agent registry. */
function activityOf(
  ctx: Context,
  agentId: string,
  fact: ReturnType<typeof factsFor> extends Map<string, infer E> ? E : never,
): BgListActivity {
  const live = ctx.agents.get(SessionId(agentId))
  if (fact.activity === 'archived') return 'archived'
  if (live?.status === 'running') return 'running'
  if (live !== undefined) return 'idle'
  if (fact.activity === 'inactive') return 'settled'
  return 'ready'
}

/**
 * Register the four background-agent tools.
 * @param ctx - context carrying tools, subagents, and the agent registry.
 * @param config - provider, cap, and label bound.
 * @param lifecycle - the live tracked-children registry.
 */
export function registerBackgroundAgentTools(
  ctx: Context,
  config: ToolConfig,
  lifecycle: BackgroundAgentLifecycle,
): void {
  ctx.tools.register(defineTool({
    name: 'background_agent',
    description:
      'Start a background agent: a durable child agent session that keeps working while this conversation '
      + 'continues. It receives the task as its first message, runs it in its own context, and returns a stable '
      + 'agent id immediately. Track it with bg_list, watch its progress lines appear in this conversation '
      + '(autoReport), send it more work any time with bg_message, and request a stop with bg_stop. Progress '
      + 'summaries are injected into this conversation after each of its turns and its final outcome arrives as '
      + 'a notice when it settles. Use this for long-running or parallel objectives you want to steer over time.',
    parameters: {
      task: {
        type: 'string',
        required: true,
        description:
          'The complete task for the background agent, delivered as its first message. It does not share this '
          + 'conversation\'s context, so include everything it needs.',
      },
      label: {
        type: 'string',
        description:
          'Optional short display label (defaults to the task\'s first line, bounded by maxLabelChars).',
      },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          agentId: { type: 'string', required: true },
          messageId: { type: 'string', required: true },
        },
      },
      render: (_args, value) => [{
        type: 'text',
        text: `started background agent ${value.agentId}`,
      }],
      presentationMeta: (args, value) => ({
        plugin: PLUGIN,
        action: 'registered',
        agentId: value.agentId,
        label: labelOf(args, config),
      }),
    },
    isConcurrencySafe: () => true,
    async execute(args, exec) {
      const parent = exec.agent
      if (!parent) {
        // Non-agent callers provide no parent for delegation ownership.
        throw new Error('background_agent requires a calling agent (exec.agent was undefined)')
      }
      const provider = ctx.subagents.getProvider(config.provider)
      if (provider === undefined) {
        throw new Error(`no subagent provider registered for "${config.provider}" — load a continuable-capable provider`)
      }
      if (provider.prepareContinuable === undefined) {
        throw new Error(`subagent provider "${config.provider}" does not support continuable children`)
      }
      const count = await countBackgroundAgents(ctx, parent, lifecycle, exec.signal)
      if (count >= config.maxBackgroundAgents) {
        throw new Error(
          `background agent limit reached: maxBackgroundAgents=${config.maxBackgroundAgents} non-archived agents; `
          + 'bg_stop one or wait for one to settle before starting more',
        )
      }
      const label = labelOf(args, config)
      const started = await ctx.subagents.startContinuable({
        provider: config.provider,
        label,
        request: { prompt: [{ type: 'text', text: args.task }] as ContentBlock[], parent },
        signal: exec.signal,
      })
      lifecycle.register(started.childId, parent.id, label, Date.now())
      return { agentId: started.childId, messageId: started.messageId }
    },
  }))

  ctx.tools.register(defineTool({
    name: 'bg_message',
    description:
      'Send a message to a background agent by its agent id, continuing the same conversation. It becomes the '
      + 'agent\'s next turn: if it is still working, the message waits until its current turn finishes. This call '
      + 'returns no answer from the agent — only confirmation that the message was delivered — so use it to give '
      + 'it more work, correct its direction, or wake a settled agent. A failure means the message was NOT '
      + 'delivered.',
    parameters: {
      agent_id: {
        type: 'string',
        required: true,
        description: 'The agent id returned when the background agent was started.',
      },
      message: {
        type: 'string',
        required: true,
        description: 'The message to deliver to the background agent.',
      },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          messageId: { type: 'string', required: true },
        },
      },
      render: (args, _value) => [{
        type: 'text',
        text: `message queued as the next turn for background agent ${args.agent_id}`,
      }],
      presentationMeta: (args, value) => ({
        plugin: PLUGIN,
        action: 'message',
        agentId: args.agent_id,
        messageId: value.messageId,
      }),
    },
    isConcurrencySafe: () => true,
    async execute(args, exec) {
      const parent = exec.agent
      if (!parent) {
        // Parent authority requires an exact live calling agent.
        throw new Error('bg_message requires a calling agent (exec.agent was undefined)')
      }
      const childId = SessionId(args.agent_id)
      const messageId = await ctx.subagents.followup(
        parent,
        childId,
        [{ type: 'text', text: args.message }] as ContentBlock[],
        {
          source: { kind: 'coordinator', form: 'relay', senderSessionId: parent.id },
          signal: exec.signal,
        },
      )
      // A cold child resumed through bg_message re-enters the live tracking
      // set; the durable label stays with the projection.
      lifecycle.register(childId, parent.id, '', Date.now())
      return { messageId }
    },
  }))

  ctx.tools.register(defineTool({
    name: 'bg_list',
    description:
      'List the background agents of this conversation with their durable ids, labels, activity, message '
      + 'counts, and last activity time. The listing merges the official child catalog (which recovers persisted '
      + 'children after a restart) with this plugin\'s dashboard facts. Activity comes from the live registry: '
      + 'running means the agent is working right now, idle means it is loaded but between turns, ready means it '
      + 'exists only in storage (resumable via bg_message), settled means its activation ended, and archived '
      + 'means the idle sweep parked it. Children the catalog could not read are reported as diagnostics instead '
      + 'of being dropped. When the catalog itself is unavailable the result is an explicit unrecoverable marker, '
      + 'never a fabricated empty list.',
    parameters: {},
    output: {
      schema: {
        oneOf: [
          {
            type: 'object',
            additionalProperties: false,
            properties: {
              kind: { type: 'string', required: true, const: 'listing' },
              agents: {
                type: 'array',
                required: true,
                items: {
                  type: 'object',
                  additionalProperties: false,
                  properties: {
                    agentId: { type: 'string', required: true },
                    label: { type: 'string', required: true },
                    mode: { type: 'string', required: true, const: 'continuable' },
                    activity: {
                      type: 'string',
                      required: true,
                      enum: ['running', 'idle', 'ready', 'settled', 'archived'],
                    },
                    messageCount: { type: 'number' },
                    lastMessage: { type: 'string' },
                    createdAt: { type: 'number' },
                    lastActiveAt: { type: 'number' },
                  },
                },
              },
              diagnostics: {
                type: 'array',
                required: true,
                items: {
                  type: 'object',
                  additionalProperties: false,
                  properties: {
                    agentId: { type: 'string', required: true },
                    reason: {
                      type: 'string',
                      required: true,
                      enum: ['corrupt', 'unsupported', 'unavailable'],
                    },
                  },
                },
              },
            },
          },
          {
            type: 'object',
            additionalProperties: false,
            properties: {
              kind: { type: 'string', required: true, const: 'unrecoverable' },
              code: { type: 'string', required: true },
              message: { type: 'string', required: true },
            },
          },
        ],
      },
      render: (_args, value) => {
        if (value.kind === 'unrecoverable') {
          return [{
            type: 'text',
            text: `background agent listing unrecoverable: ${value.code}: ${value.message}`,
          }]
        }
        const lines = value.agents.map((agent: BgListAgent) =>
          `${agent.agentId} [${agent.activity}]${agent.messageCount === undefined ? '' : ` messages=${agent.messageCount}`} — ${agent.label}`)
        const diagnostics = value.diagnostics.map((entry: BgListDiagnostic) =>
          `${entry.agentId} [diagnostic: ${entry.reason}]`)
        const text = [...lines, ...diagnostics].join('\n')
        return [{ type: 'text', text: text === '' ? '(no background agents)' : text }]
      },
    },
    isConcurrencySafe: () => true,
    async execute(_args, exec) {
      const parent = exec.agent
      if (!parent) {
        // Non-agent callers have no session whose children could be listed.
        throw new Error('bg_list requires a calling agent (exec.agent was undefined)')
      }
      let entries
      try {
        entries = await ctx.subagents.listChildren(parent.id, exec.signal)
      } catch (error) {
        // An unavailable catalog is reported as an explicit marker — never a
        // fabricated empty listing that would read as "no agents".
        if (error instanceof SubagentError) {
          return { kind: 'unrecoverable' as const, code: error.code, message: error.message }
        }
        throw error
      }
      const facts = factsFor(ctx, parent)
      const agents: BgListAgent[] = []
      const diagnostics: BgListDiagnostic[] = []
      for (const entry of entries) {
        if (entry.kind === 'diagnostic') {
          diagnostics.push({ agentId: entry.id, reason: entry.reason })
          continue
        }
        // One-shot children cannot be continued by bg_message; the listing
        // keeps only the resumable conversation this tool set manages.
        if (entry.mode !== 'continuable') continue
        const fact = facts.get(entry.id)
        const row: BgListAgent = {
          agentId: entry.id,
          label: entry.label,
          mode: 'continuable',
          activity: fact === undefined ? activityOf(ctx, entry.id, fallbackFact(entry.id)) : activityOf(ctx, entry.id, fact),
        }
        if (fact !== undefined) {
          if (fact.messageCount !== undefined) row.messageCount = fact.messageCount
          if (fact.lastMessage !== undefined) row.lastMessage = fact.lastMessage
          if (fact.createdAt !== undefined) row.createdAt = fact.createdAt
          if (fact.lastActiveAt !== undefined) row.lastActiveAt = fact.lastActiveAt
        }
        agents.push(row)
      }
      return { kind: 'listing' as const, agents, diagnostics }
    },
  }))

  ctx.tools.register(defineTool({
    name: 'bg_stop',
    description:
      'Request a stop of a background agent\'s current turn by its agent id. Only the current turn stops: '
      + 'messages already queued for the agent stay parked until a later bg_message, and the agent itself stays '
      + 'available for follow-ups. This is a request, not a kill — the official control plane finishes the '
      + 'teardown, so the agent may keep running briefly. Stopping an already-settled agent is accepted. An agent '
      + 'id that is not one of this conversation\'s children reports not-found without touching anything.',
    parameters: {
      agent_id: {
        type: 'string',
        required: true,
        description: 'The agent id returned when the background agent was started.',
      },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          outcome: {
            type: 'string',
            required: true,
            enum: ['interrupt-requested', 'not-found'],
          },
          agentId: { type: 'string', required: true },
        },
      },
      render: (_args, value) => [{
        type: 'text',
        text: value.outcome === 'not-found'
          ? `background agent ${value.agentId} is not one of this conversation's children — nothing stopped`
          : `stop requested for background agent ${value.agentId}`,
      }],
      presentationMeta: (args) => ({
        plugin: PLUGIN,
        action: 'stop',
        agentId: args.agent_id,
      }),
    },
    isConcurrencySafe: () => true,
    async execute(args, exec) {
      const parent = exec.agent
      if (!parent) {
        // Ancestor authority requires an exact live calling agent.
        throw new Error('bg_stop requires a calling agent (exec.agent was undefined)')
      }
      const childId = SessionId(args.agent_id)
      let known = true
      try {
        const entries = await ctx.subagents.listChildren(parent.id, exec.signal)
        known = entries.some(entry => entry.kind === 'child' && entry.mode === 'continuable' && entry.id === childId)
      } catch (error) {
        // The listing is discovery, not authority: the interrupt itself is the
        // authoritative operation, so a catalog outage must not disable stop.
        if (!(error instanceof SubagentError)) throw error
      }
      if (!known) return { outcome: 'not-found' as const, agentId: childId }
      // The service authorizes the exact live caller against the target's
      // recorded lineage; the tool adds no authority of its own.
      ctx.subagents.interrupt(childId, { kind: 'ancestor', agent: parent })
      return { outcome: 'interrupt-requested' as const, agentId: childId }
    },
  }))
}

/** A fact-shaped fallback so rows without projection facts still resolve an activity. */
function fallbackFact(agentId: string): { activity: 'running'; agentId: string; label: string; messageCount: number; createdAt: number; lastActiveAt: number } {
  const at = 0
  return { activity: 'running', agentId, label: '', messageCount: 0, createdAt: at, lastActiveAt: at }
}
