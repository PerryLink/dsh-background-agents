/**
 * The five model-facing tools: `background_agent` starts a durable continuable
 * child through the official seam (with optional per-child tool scoping,
 * persona, depth cap, and model route), `bg_message` delivers one later turn,
 * `bg_list` merges the official child catalog with this plugin's projection
 * facts (optionally as the descendant tree), `bg_result` reads a child's
 * latest result text, and `bg_stop` requests interruption. Every execution
 * path is a thin adapter over `ctx.subagents` — the plugin performs no
 * lifecycle routing of its own, and every durable fact rides official
 * `tool/result` replay metadata or injected `user/message` notices (see
 * `vocabulary.ts`).
 *
 * @module dsh-background-agents/tools
 */

import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'
import type { Agent } from '@deepseek-ai/dsh-agent'
import type { ContentBlock } from '@deepseek-ai/dsh-llm'
import { SessionId, type SessionEvent } from '@deepseek-ai/dsh-session'
import { SubagentError, type SubagentDescendantListEntry, type SubagentListEntry } from '@deepseek-ai/dsh-subagent'
import { countBackgroundAgents, sessionLastText, type BackgroundAgentLifecycle } from './lifecycle.ts'
import { FACT_EVENT } from './events.ts'
import type { FactAppender } from './facts.ts'
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
  /** Hard cap on the bg_result text; longer answers ellipsize with a truncated flag. */
  readonly resultMaxChars: number
  /** Provider route for child model requests; undefined inherits the parent's. */
  readonly childProvider: string | undefined
  /** Model id for child model requests; undefined inherits the parent's. */
  readonly childModel: string | undefined
  /** Config ceiling for a start's optional `max_depth` argument. */
  readonly maxChildDepth: number | undefined
  /** Allowlist for `tool_filter` names; empty/absent = no limit. */
  readonly allowedChildTools: string[] | undefined
}

/** One bg_list row's activity vocabulary. */
export type BgListActivity = 'running' | 'idle' | 'ready' | 'settled' | 'archived'

/** One row returned by bg_list (schema-validated canonical value). */
export interface BgListAgent {
  agentId: string
  label: string
  mode: 'continuable'
  activity: BgListActivity
  /** Durable direct parent (present only in recursive listings). */
  parentId?: string
  /** Edge distance from the listed root (present only in recursive listings). */
  depth?: number
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

/** One validated per-child tool filter, or undefined when none was requested. */
export interface ValidatedToolFilter {
  readonly allow?: string[]
  readonly deny?: string[]
}

/**
 * Validate one `tool_filter` argument against the deployment allowlist. The
 * official descriptor rejects a filter without at least one of `allow`/`deny`,
 * so the tool fails fast with the same rule plus the allowlist check.
 * @param raw - the raw argument (already JSON-validated by defineTool).
 * @param config - the deployment policy carrying `allowedChildTools`.
 * @returns the trimmed filter, or undefined when the caller passed none.
 */
export function validateToolFilter(
  raw: { allow?: string[]; deny?: string[] } | undefined,
  config: ToolConfig,
): ValidatedToolFilter | undefined {
  if (raw === undefined) return undefined
  const allow = raw.allow?.filter(name => name.trim() !== '')
  const deny = raw.deny?.filter(name => name.trim() !== '')
  if ((allow === undefined || allow.length === 0) && (deny === undefined || deny.length === 0)) {
    throw new Error('tool_filter must declare allow and/or deny with at least one tool name')
  }
  const limit = config.allowedChildTools
  if (limit !== undefined && limit.length > 0) {
    for (const name of [...(allow ?? []), ...(deny ?? [])]) {
      if (!limit.includes(name)) {
        throw new Error(`tool_filter names "${name}", outside allowedChildTools: ${limit.join(', ')}`)
      }
    }
  }
  return {
    ...(allow !== undefined && allow.length > 0 ? { allow } : {}),
    ...(deny !== undefined && deny.length > 0 ? { deny } : {}),
  }
}

/**
 * Validate one `max_depth` argument against the deployment ceiling. The seam
 * enforces the same non-negative-safe-integer rule at start; the tool fails
 * fast first and adds the configured ceiling.
 */
export function validateMaxDepth(raw: number | undefined, config: ToolConfig): number | undefined {
  if (raw === undefined) return undefined
  if (!Number.isSafeInteger(raw) || raw < 0) {
    throw new Error(`max_depth must be a non-negative safe integer, got ${String(raw)}`)
  }
  if (config.maxChildDepth !== undefined && raw > config.maxChildDepth) {
    throw new Error(`max_depth ${raw} exceeds the configured maxChildDepth=${config.maxChildDepth}`)
  }
  return raw
}

/** One projection fact row, as served by the parent's snapshot. */
type FactEntry = NonNullable<ReturnType<typeof isBackgroundAgentsProjection>>['agents'][number]

/** Read one parent's projection facts, guarded against an unmounted registry. */
function factsFor(ctx: Context, parent: Agent): Map<string, FactEntry> {
  const registry = ctx.get('sessionProjections')
  if (registry === undefined) return new Map()
  const value = registry.snapshot(parent.session).values.backgroundAgents
  const projection = isBackgroundAgentsProjection(value)
  return new Map((projection?.agents ?? []).map(entry => [entry.agentId, entry]))
}

/**
 * Build one bg_list row from a catalog entry's identity, overlaying the
 * parent's projection facts and the live agent registry. Kept separate from
 * the listing loops because `SubagentDescendantListEntry` is a strict
 * superset of `SubagentListEntry`: forming their union would let TypeScript
 * reduce the descendant members away, erasing `parentId`/`depth`.
 */
function buildRow(ctx: Context, facts: Map<string, FactEntry>, id: SessionId, label: string): BgListAgent {
  const fact = facts.get(id)
  const row: BgListAgent = {
    agentId: id,
    label,
    mode: 'continuable',
    activity: fact === undefined ? activityOf(ctx, id, fallbackFact(id)) : activityOf(ctx, id, fact),
  }
  if (fact !== undefined) {
    if (fact.messageCount !== undefined) row.messageCount = fact.messageCount
    if (fact.lastMessage !== undefined) row.lastMessage = fact.lastMessage
    if (fact.createdAt !== undefined) row.createdAt = fact.createdAt
    if (fact.lastActiveAt !== undefined) row.lastActiveAt = fact.lastActiveAt
  }
  return row
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
  facts: FactAppender,
): void {
  // Per-parent start gates: concurrent background_agent calls serialize their
  // count + cap-check + start critical section, so two racing starts cannot
  // both pass a cap of one. Keys are parent session ids; the map grows at
  // most with the number of parents this fiber ever serves and is disposed
  // with it (no manual cleanup).
  const startGates = new Map<string, Promise<unknown>>()
  ctx.tools.register(defineTool({
    name: 'background_agent',
    description:
      'Start a background agent: a durable child agent session that keeps working while this conversation '
      + 'continues. It receives the task as its first message, runs it in its own context, and returns a stable '
      + 'agent id immediately. Track it with bg_list, watch its progress lines appear in this conversation '
      + '(autoReport), send it more work any time with bg_message, read its settled result text with bg_result, '
      + 'and request a stop with bg_stop. Progress summaries are injected into this conversation after each of '
      + 'its turns and its final outcome arrives as a notice when it settles. Use this for long-running or '
      + 'parallel objectives you want to steer over time. Optionally scope the child: tool_filter removes tools '
      + 'from its view (never grants new ones), persona gives it a dedicated system-prompt persona, and '
      + 'max_depth caps its further delegation.',
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
      tool_filter: {
        type: 'object',
        additionalProperties: false,
        description:
          'Optional tool scoping for the child: keep only the listed tools (allow) or remove them (deny). At '
          + 'least one of allow/deny with a tool name is required. Names must come from the deployment '
          + 'allowlist when one is configured (allowedChildTools). This can only restrict — never grant.',
        properties: {
          allow: {
            type: 'array',
            items: { type: 'string' },
            description: 'Global tool names that stay visible to the child; everything else is removed.',
          },
          deny: {
            type: 'array',
            items: { type: 'string' },
            description: 'Global tool names removed from the child\'s visibility.',
          },
        },
      },
      persona: {
        type: 'string',
        description:
          'Optional per-child persona: a dedicated system-prompt section shadowing the deployment persona for '
          + 'this child alone.',
      },
      max_depth: {
        type: 'number',
        description:
          'Optional absolute cap on this child\'s further delegation depth (non-negative integer). Bounded by '
          + 'the configured maxChildDepth ceiling.',
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
      // Enter the per-parent critical section: wait for the previous start's
      // count+start to finish, then hold the gate until this one completes
      // (success or failure), so the next caller counts this attempt.
      const previous = startGates.get(parent.id) ?? Promise.resolve()
      let releaseGate: () => void = () => {}
      const gate = new Promise<void>(resolve => { releaseGate = resolve })
      startGates.set(parent.id, gate)
      try {
        await previous
        const count = await countBackgroundAgents(ctx, parent, lifecycle, exec.signal)
        if (count >= config.maxBackgroundAgents) {
          throw new Error(
            `background agent limit reached: maxBackgroundAgents=${config.maxBackgroundAgents} non-archived agents; `
            + 'bg_stop one or wait for one to settle before starting more',
          )
        }
        const task = args.task.trim()
        if (task === '') {
          throw new Error('background_agent requires a non-empty task')
        }
        const label = labelOf(args, config)
        const toolFilter = validateToolFilter(args.tool_filter, config)
        const maxDepth = validateMaxDepth(args.max_depth, config)
        const persona = args.persona === undefined || args.persona.trim() === ''
          ? undefined
          : args.persona.trim()
        const agentOptions = config.childProvider !== undefined || config.childModel !== undefined
          ? {
            ...(config.childProvider !== undefined ? { provider: config.childProvider } : {}),
            ...(config.childModel !== undefined ? { model: config.childModel } : {}),
          }
          : undefined
        const started = await ctx.subagents.startContinuable({
          provider: config.provider,
          label,
          request: {
            prompt: [{ type: 'text', text: task }] as ContentBlock[],
            parent,
            ...(toolFilter !== undefined ? { toolFilter } : {}),
            ...(persona !== undefined ? { persona } : {}),
            ...(maxDepth !== undefined ? { maxDepth } : {}),
            ...(agentOptions !== undefined ? { agentOptions } : {}),
          },
          signal: exec.signal,
        })
        lifecycle.register(started.childId, parent.id, label, Date.now())
        // The structured fact rides the parent log next to the replay meta;
        // the projection folds it (the legacy meta fold then skips the row).
        facts.append(parent.session, FACT_EVENT, { kind: 'registered', agentId: started.childId, label })
        return { agentId: started.childId, messageId: started.messageId }
      } finally {
        releaseGate()
        // Reclaim the map slot once this gate is the tail: keys are parent
        // ids, and a resolved tail with no successor would otherwise live
        // for the fiber's lifetime.
        if (startGates.get(parent.id) === gate) startGates.delete(parent.id)
      }
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
      const message = args.message.trim()
      if (message === '') {
        throw new Error('bg_message requires a non-empty message')
      }
      const childId = SessionId(args.agent_id)
      const messageId = await ctx.subagents.followup(
        parent,
        childId,
        [{ type: 'text', text: message }] as ContentBlock[],
        {
          source: { kind: 'coordinator', form: 'relay', senderSessionId: parent.id },
          signal: exec.signal,
        },
      )
      // A cold child resumed through bg_message re-enters the live tracking
      // set; the durable label stays with the projection.
      lifecycle.register(childId, parent.id, '', Date.now())
      facts.append(parent.session, FACT_EVENT, { kind: 'message', agentId: childId, messageId })
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
      + 'of being dropped. With recursive: true the listing is the descendant tree (every row gains parentId and '
      + 'depth), where only direct children carry the dashboard facts. When the catalog itself is unavailable the '
      + 'result is an explicit unrecoverable marker, never a fabricated empty list.',
    parameters: {
      recursive: {
        type: 'boolean',
        description:
          'List the whole descendant tree of this conversation (rows gain parentId and depth) instead of direct '
          + 'children only. Defaults to false.',
      },
    },
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
                    parentId: { type: 'string' },
                    depth: { type: 'number' },
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
    async execute(args, exec) {
      const parent = exec.agent
      if (!parent) {
        // Non-agent callers have no session whose children could be listed.
        throw new Error('bg_list requires a calling agent (exec.agent was undefined)')
      }
      const facts = factsFor(ctx, parent)
      const agents: BgListAgent[] = []
      const diagnostics: BgListDiagnostic[] = []
      if (args.recursive === true) {
        let entries: SubagentDescendantListEntry[]
        try {
          entries = await ctx.subagents.listDescendants(parent.id, exec.signal)
        } catch (error) {
          if (error instanceof SubagentError) {
            return { kind: 'unrecoverable' as const, code: error.code, message: error.message }
          }
          throw error
        }
        for (const entry of entries) {
          if (entry.kind === 'diagnostic') {
            diagnostics.push({ agentId: entry.id, reason: entry.reason })
            continue
          }
          // One-shot children cannot be continued by bg_message; the tree
          // keeps only the resumable conversation this tool set manages.
          if (entry.mode !== 'continuable') continue
          const row = buildRow(ctx, facts, entry.id, entry.label)
          row.parentId = entry.parentId
          row.depth = entry.depth
          agents.push(row)
        }
      } else {
        let entries: SubagentListEntry[]
        try {
          entries = await ctx.subagents.listChildren(parent.id, exec.signal)
        } catch (error) {
          if (error instanceof SubagentError) {
            return { kind: 'unrecoverable' as const, code: error.code, message: error.message }
          }
          throw error
        }
        for (const entry of entries) {
          if (entry.kind === 'diagnostic') {
            diagnostics.push({ agentId: entry.id, reason: entry.reason })
            continue
          }
          if (entry.mode !== 'continuable') continue
          agents.push(buildRow(ctx, facts, entry.id, entry.label))
        }
      }
      return { kind: 'listing' as const, agents, diagnostics }
    },
  }))

  ctx.tools.register(defineTool({
    name: 'bg_result',
    description:
      'Read the latest result of a background agent by its agent id: the final assistant output text of its '
      + 'child session (reasoning blocks when the final message carried no text, flagged with textSource), plus '
      + 'its label and current activity. The official settled notice only carries a summary, so use '
      + 'this to fetch the full closing text of a settled agent, or the latest output of one that is still '
      + 'working. An agent id that is not one of this conversation\'s tracked children is an error.',
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
          agentId: { type: 'string', required: true },
          label: { type: 'string' },
          activity: {
            type: 'string',
            required: true,
            enum: ['running', 'idle', 'ready', 'settled', 'archived'],
          },
          text: { type: 'string' },
          truncated: {
            type: 'boolean',
            description: 'True when the text was ellipsized by resultMaxChars.',
          },
          textSource: {
            type: 'string',
            enum: ['reasoning'],
            description:
              'Present only when the selected output carried no text block and the text is the reasoning fallback.',
          },
        },
      },
      render: (_args, value) => [{
        type: 'text',
        text: value.text === undefined
          ? `background agent ${value.agentId} has produced no assistant output yet`
          : value.textSource === 'reasoning'
            ? `background agent ${value.agentId} reasoning (no final text): ${value.text}`
            : value.text,
      }],
    },
    isConcurrencySafe: () => true,
    async execute(args, exec) {
      const parent = exec.agent
      if (!parent) {
        // Fact lookup requires the calling session's own projection.
        throw new Error('bg_result requires a calling agent (exec.agent was undefined)')
      }
      const childId = SessionId(args.agent_id)
      // The official catalog is the authority for "is one of this parent's
      // children"; the projection fact (when present) supplies the activity.
      // A catalog outage must not disable a fact-backed read, so discovery is
      // best-effort and the fact map is the fallback authority.
      let known = factsFor(ctx, parent).has(childId)
      if (!known) {
        try {
          const entries = await ctx.subagents.listChildren(parent.id, exec.signal)
          known = entries.some(entry => entry.kind === 'child' && entry.mode === 'continuable' && entry.id === childId)
        } catch (error) {
          if (!(error instanceof SubagentError)) throw error
        }
      }
      if (!known) {
        throw new Error(`background agent ${childId} is not one of this conversation's tracked children`)
      }
      const fact = factsFor(ctx, parent).get(childId) ?? fallbackFact(childId)
      // Settled children leave the live session store, so the durable log is
      // the text source of record; a persistence read failure is loud.
      let session: { events: readonly SessionEvent[] } | undefined = ctx.sessions.get(childId)
      if (session === undefined) {
        const persistence = ctx.get('sessionPersistence')
        if (persistence !== undefined) session = await persistence.load(childId)
      }
      // A thinking model's last message may carry reasoning blocks only; the
      // fallback keeps bg_result honest instead of reporting "no output".
      const reasoning = { used: false }
      const text = session === undefined
        ? ''
        : sessionLastText(session, { allowReasoning: true, reasoning })
      const truncated = text.length > config.resultMaxChars
      const capped = truncated ? `${text.slice(0, config.resultMaxChars - 1)}…` : text
      return {
        agentId: childId,
        ...(fact.label === '' ? {} : { label: fact.label }),
        activity: activityOf(ctx, childId, fact),
        ...(capped === '' ? {} : { text: capped }),
        ...(truncated ? { truncated: true } : {}),
        ...(reasoning.used ? { textSource: 'reasoning' as const } : {}),
      }
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
      facts.append(parent.session, FACT_EVENT, { kind: 'stop', agentId: childId })
      return { outcome: 'interrupt-requested' as const, agentId: childId }
    },
  }))
}

/** A fact-shaped fallback so rows without projection facts still resolve an activity. */
function fallbackFact(agentId: string): { activity: 'running'; agentId: string; label: string; messageCount: number; createdAt: number; lastActiveAt: number } {
  const at = 0
  return { activity: 'running', agentId, label: '', messageCount: 0, createdAt: at, lastActiveAt: at }
}
