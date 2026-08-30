/**
 * Dual-ruler tool-call id brand for tests and room tools: derives the brand
 * from `dsh-tools`' `ToolExecution['callId']` instead of naming the host
 * line's brand (`CallId` on the published `0.1.1-rc.2` line, renamed
 * `ToolCallId` on host HEAD) — the same type either way, so typecheck passes
 * against both the checkout and the published rc.2 types.
 * @module dsh-background-agents/test/call-id
 */

import type { ToolExecution } from '@deepseek-ai/dsh-tools'

export type CallId = ToolExecution['callId']

/** Brand a synthetic call id; no validation is performed. */
export function CallId(id: string): CallId {
  return id as CallId
}
