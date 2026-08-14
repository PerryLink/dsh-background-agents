/**
 * The `backgroundAgents` session-projection vocabulary: one foldable row per
 * background agent, in whole-value shape. The zod schema validates the wire
 * payload on the host and guards the same value inside the client bundle, so
 * the two halves share one runtime shape.
 *
 * @module dsh-background-agents/projection-schema
 */

import { z } from 'zod'

/** Durable lifecycle state of one background agent, folded from the parent log. */
export const backgroundAgentEntrySchema = z.object({
  /** Durable child session id (the `agentId` every tool returns). */
  agentId: z.string().min(1),
  /** Creation label persisted with the child. */
  label: z.string(),
  /**
   * Last folded lifecycle fact: `running` while registrations/messages/progress
   * keep landing, `inactive` after the child's activation settled (folded from
   * the official `subagent-settled` notice), `archived` after the idle sweep.
   */
  activity: z.enum(['running', 'inactive', 'archived']),
  /** Accepted deliveries to the child: the initial task plus every follow-up. */
  messageCount: z.number().int().nonnegative(),
  /** Last progress or settle summary, when one was recorded. */
  lastMessage: z.string().optional(),
  /** Epoch ms of the registration fact. */
  createdAt: z.number().int().nonnegative(),
  /** Epoch ms of the last folded fact for this agent. */
  lastActiveAt: z.number().int().nonnegative(),
}).strict()

/** The whole wire value of the `backgroundAgents` projection unit. */
export const backgroundAgentsSchema = z.object({
  agents: z.array(backgroundAgentEntrySchema),
}).strict()

/** One background-agent row of the projection. */
export type BackgroundAgentEntry = z.infer<typeof backgroundAgentEntrySchema>

/** The whole `backgroundAgents` projection value. */
export type BackgroundAgentsProjection = z.infer<typeof backgroundAgentsSchema>

/**
 * Guard an opaque projection value (the client reads projection cells as
 * unknown because it cannot merge the host's `SessionProjectionMap`).
 * @param value - the opaque cell value.
 * @returns the typed projection, or undefined when the cell is absent or invalid.
 */
export function isBackgroundAgentsProjection(value: unknown): BackgroundAgentsProjection | undefined {
  const parsed = backgroundAgentsSchema.safeParse(value)
  return parsed.success ? parsed.data : undefined
}
