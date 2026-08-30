/**
 * The sidebar background-agent panel: a `sidebar.footer.action` entry whose
 * trigger shows a live agent count and opens a floating panel of dashboard
 * rows (label, status, last activity, message count) with one-click
 * jump-to-child-session and stop. All displayed facts come from the pure
 * presenter over the session-list snapshot; this component only binds
 * interactions.
 */
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import type { PropsLocale, PropsRuntime, TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import { IconBranchOutline16, Tooltip } from '@deepseek-ai/dsh-client-ui-primitives'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
import { buildAgentRows, buildCostReport, relativeTime, type AgentRow, type RowStatus, type SessionListLike } from './presenter.ts'
import { NS } from './locales.ts'
import css from './BackgroundAgentsAction.module.css'

/** Minimal structural snapshot contract (the owner package no longer re-exports the generic). */
interface ObservableSnapshot<T> {
  getSnapshot(): T
  subscribe(listener: () => void): () => void
}

/** Business actions supplied by the slot registration. */
export interface BackgroundAgentsInjected {
  /** The live session-list snapshot the dashboard rows derive from. */
  sessions: ObservableSnapshot<SessionListLike>
  /**
   * Open the child session through its durable direct-parent address.
   * @returns an error message on failure, undefined on success.
   */
  openChild(parentSessionId: string, childSessionId: string): Promise<string | undefined>
  /**
   * Request interruption of the child's current turn through the official
   * `subagent.interruptByParent` RPC.
   * @returns an error message on failure, undefined on success.
   */
  stopChild(parentSessionId: string, childSessionId: string): Promise<string | undefined>
  /**
   * Queue one message as the child's next turn through the official
   * `subagent.prompt` RPC (wakes a settled child).
   * @returns an error message on failure, undefined on success.
   */
  sendMessage(parentSessionId: string, childSessionId: string, text: string): Promise<string | undefined>
  /**
   * Read the child's final assistant text through the child session's
   * `conversation` projection (the `subagent.history` RPC no longer exists;
   * the peek never activates the child Agent).
   * @returns the extracted text plus an optional error message.
   */
  readResult(parentSessionId: string, childSessionId: string): Promise<{ text: string; error?: string }>
}

/** Full props: the footer-action owner share, standard kit, injected actions, and locale. */
export type BackgroundAgentsActionProps =
  PropsRuntime<'sidebar.footer.action'> & BackgroundAgentsInjected & PropsLocale<typeof NS>

/** Localized relative-time label for one row. */
function timeLabel(at: number, now: number, t: TranslateNS<typeof NS>): string {
  const rel = relativeTime(at, now)
  switch (rel.unit) {
    case 'now': return t('time.now')
    case 'minutes': return t('time.minutes', { n: rel.n })
    case 'hours': return t('time.hours', { n: rel.n })
    case 'days': return t('time.days', { n: rel.n })
    case 'months': return t('time.months', { n: rel.n })
    case 'years': return t('time.years', { n: rel.n })
  }
}

/** Localized status label. */
function statusLabel(status: RowStatus, t: TranslateNS<typeof NS>): string {
  switch (status) {
    case 'running': return t('status.running')
    case 'idle': return t('status.idle')
    case 'settled': return t('status.settled')
    case 'archived': return t('status.archived')
  }
}

/** One token count for display: `—` when the adapter never reported one. */
function fmtTokens(n: number | null): string {
  return n === null ? '—' : String(n)
}

/** Compact duration for a row's summed turn wall time. */
function fmtDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  const seconds = ms / 1000
  if (seconds < 60) return `${seconds.toFixed(1)}s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ${Math.round(seconds % 60)}s`
  const hours = Math.floor(minutes / 60)
  return `${hours}h ${minutes % 60}m`
}

/** One open result peek: the row it belongs to plus its load state. */
interface ResultState {
  readonly id: string
  readonly loading: boolean
  readonly text: string
  readonly error?: string
}

/** One dashboard row. */
function Row({ row, t, now, busy, showParent, composing, draft, result, onResult, onCloseResult, onDraft, onOpen, onStop, onCompose, onSend, onCancel }: {
  readonly row: AgentRow
  readonly t: TranslateNS<typeof NS>
  readonly now: number
  readonly busy: boolean
  readonly showParent: boolean
  readonly composing: boolean
  readonly draft: string
  readonly result: ResultState | undefined
  readonly onResult: () => void
  readonly onCloseResult: () => void
  readonly onDraft: (text: string) => void
  readonly onOpen: () => void
  readonly onStop: () => void
  readonly onCompose: () => void
  readonly onSend: () => void
  readonly onCancel: () => void
}) {
  const resultOpen = result !== undefined && result.id === row.agentId
  return (
    <li className={css.row}>
      <div className={css.rowHead}>
        <span className={`${css.status} ${css[`status-${row.status}`]}`}>{statusLabel(row.status, t)}</span>
        <span className={css.label} title={row.agentId}>{row.label}</span>
        <span className={css.meta}>{t('row.messages', { n: row.messageCount })} · {timeLabel(row.lastActiveAt, now, t)}</span>
      </div>
      {showParent && row.parentTitle !== undefined && <div className={css.parentTitle}>{row.parentTitle}</div>}
      {row.lastMessage !== undefined && <div className={css.lastMessage}>{row.lastMessage}</div>}
      {row.metrics !== undefined && (
        <div className={css.metrics}>
          <span>{t('metrics.turns', { n: row.metrics.turnCount })}</span>
          <span>{t('metrics.duration', { n: fmtDuration(row.metrics.totalDurationMs) })}</span>
          <span>{t('metrics.tokens', { input: fmtTokens(row.metrics.inputTokens), output: fmtTokens(row.metrics.outputTokens) })}</span>
          <span>{t('metrics.errors', { n: row.metrics.errorCount })}</span>
        </div>
      )}
      <div className={css.actions}>
        <button type="button" className={css.action} disabled={busy} onClick={onOpen}>{t('row.open')}</button>
        <button
          type="button"
          className={css.action}
          disabled={busy || row.status === 'archived'}
          onClick={onStop}
        >
          {t('row.stop')}
        </button>
        <button type="button" className={css.action} disabled={busy || composing} onClick={onCompose}>{t('row.message')}</button>
        <button type="button" className={css.action} disabled={busy} onClick={resultOpen ? onCloseResult : onResult}>
          {resultOpen ? t('result.close') : t('row.result')}
        </button>
      </div>
      {resultOpen && result !== undefined && (
        <div className={css.result}>
          {result.loading && <div className={css.resultLoading}>{t('result.loading')}</div>}
          {!result.loading && result.error !== undefined && <div className={css.resultError}>{result.error}</div>}
          {!result.loading && result.error === undefined
            && <div className={css.resultText}>{result.text === '' ? t('result.empty') : result.text}</div>}
        </div>
      )}
      {composing && (
        <div className={css.composer}>
          <input
            className={css.composerInput}
            value={draft}
            placeholder={t('message.placeholder')}
            onChange={event => { onDraft(event.target.value) }}
            onKeyDown={event => {
              if (event.key === 'Enter' && draft.trim() !== '' && !busy) onSend()
            }}
          />
          <button type="button" className={css.action} disabled={busy || draft.trim() === ''} onClick={onSend}>
            {t('message.send')}
          </button>
          <button type="button" className={css.action} disabled={busy} onClick={onCancel}>{t('message.cancel')}</button>
        </div>
      )}
    </li>
  )
}

/** The sidebar footer trigger + floating dashboard panel. */
export function BackgroundAgentsAction({
  wide, t, sessions, openChild, stopChild, sendMessage, readResult,
}: BackgroundAgentsActionProps) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)
  const [busyId, setBusyId] = useState<string | undefined>(undefined)
  const [composingId, setComposingId] = useState<string | undefined>(undefined)
  const [draft, setDraft] = useState('')
  const [result, setResult] = useState<ResultState | undefined>(undefined)
  const [now, setNow] = useState(() => Date.now())
  const [anchor, setAnchor] = useState<{ left: number; bottom: number }>()
  const wrapRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const wasOpenRef = useRef(false)

  // The client SessionProjectionMap cannot carry the plugin's key, so the
  // snapshot crosses the boundary structurally and the presenter guards the
  // projection cell at runtime.
  const rows = buildAgentRows(useSyncExternalStore(sessions.subscribe, sessions.getSnapshot) as unknown as SessionListLike)
  const runningCount = rows.filter(row => row.status === 'running').length
  // Parent-session disambiguation: only when several parents project rows.
  const showParent = new Set(rows.map(row => row.parentSessionId)).size > 1

  // Refresh the relative-time labels while the panel is open.
  useEffect(() => {
    if (!open) return
    const timer = window.setInterval(() => { setNow(Date.now()) }, 30_000)
    return () => { window.clearInterval(timer) }
  }, [open])

  // Panel placement: anchor the floating panel to the trigger's left edge,
  // opening upward from the footer (the sidebar-footer convention), and
  // re-anchor on window resize while it is open.
  useEffect(() => {
    if (!open) return
    const place = (): void => {
      const rect = wrapRef.current?.getBoundingClientRect()
      if (rect === undefined) return
      setAnchor({ left: rect.left, bottom: window.innerHeight - rect.top + 8 })
    }
    place()
    window.addEventListener('resize', place)
    return () => { window.removeEventListener('resize', place) }
  }, [open])

  // Dialog focus: move into the panel on open, hand back to the trigger on
  // close so keyboard users keep their context. The guard skips the initial
  // mount (never steal focus from the boot flow).
  useEffect(() => {
    if (open) {
      panelRef.current?.focus()
    } else if (wasOpenRef.current) {
      triggerRef.current?.focus()
    }
    wasOpenRef.current = open
  }, [open])

  // Close on outside pointer-down or Escape.
  useEffect(() => {
    if (!open) return
    const onDown = (event: PointerEvent): void => {
      const target = event.target
      if (!(target instanceof Node)) return
      if (panelRef.current?.contains(target) === true || wrapRef.current?.contains(target) === true) return
      setOpen(false)
    }
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const run = async (action: (row: AgentRow) => Promise<string | undefined>, row: AgentRow): Promise<void> => {
    setBusyId(row.agentId)
    setError(undefined)
    try {
      const failure = await action(row)
      setError(failure)
    } finally {
      setBusyId(undefined)
    }
  }

  const loadResult = async (row: AgentRow): Promise<void> => {
    setResult({ id: row.agentId, loading: true, text: '' })
    setError(undefined)
    try {
      const peek = await readResult(row.parentSessionId, row.agentId)
      setResult({
        id: row.agentId,
        loading: false,
        text: peek.text,
        ...(peek.error === undefined ? {} : { error: peek.error }),
      })
    } catch (failure) {
      setResult({
        id: row.agentId,
        loading: false,
        text: '',
        error: failure instanceof Error ? failure.message : String(failure),
      })
    }
  }

  // Cost export: raw token/duration JSON. The browser cannot verify or convert
  // currency cost — no per-model pricing table crosses the client boundary —
  // so the export is the observability totals verbatim and the host (or the
  // consuming tooling) owns any pricing. Both paths are defensive: download
  // degrades to nothing when Blob/URL is unavailable, copy surfaces the error.
  const downloadCost = (): void => {
    const report = buildCostReport(rows, Date.now())
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'background-agents-cost.json'
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
  }

  const copyCost = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(buildCostReport(rows, Date.now()), null, 2))
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : String(failure))
    }
  }

  return (
    <div className={css.triggerWrap} ref={wrapRef}>
      <Tooltip label={t('trigger.aria')} delayMs={500}>
        <button
          type="button"
          ref={triggerRef}
          className={css.trigger}
          aria-label={t('trigger.aria')}
          aria-expanded={open}
          onClick={() => {
            setOpen(value => !value)
            setError(undefined)
          }}
        >
          <span className={css.triggerIcon} aria-hidden><IconBranchOutline16 size={16} /></span>
          {wide && <span className={css.triggerLabel}>{t('trigger.label')}</span>}
          {runningCount > 0 && <span className={css.count}>{runningCount}</span>}
        </button>
      </Tooltip>
      {open && createPortal(
        <div className={css.panel} style={anchor} role="dialog" aria-label={t('panel.title')} ref={panelRef} tabIndex={-1}>
          <div className={css.panelTitle}>{t('panel.title')}</div>
          {rows.length > 0 && (
            <div className={css.exportRow}>
              <button type="button" className={css.action} onClick={downloadCost}>{t('export.download')}</button>
              <button type="button" className={css.action} onClick={() => { void copyCost() }}>{t('export.copy')}</button>
            </div>
          )}
          {error !== undefined && <div className={css.error}>{error}</div>}
          {rows.length === 0
            ? <div className={css.empty}>{t('panel.empty')}</div>
            : (
              <ul className={css.rows}>
                {rows.map(row => (
                  <Row
                    key={row.agentId}
                    row={row}
                    t={t}
                    now={now}
                    busy={busyId === row.agentId}
                    showParent={showParent}
                    composing={composingId === row.agentId}
                    draft={composingId === row.agentId ? draft : ''}
                    result={result}
                    onResult={() => { void loadResult(row) }}
                    onCloseResult={() => { setResult(undefined) }}
                    onDraft={setDraft}
                    onOpen={() => { void run(next => openChild(next.parentSessionId, next.agentId), row) }}
                    onStop={() => { void run(next => stopChild(next.parentSessionId, next.agentId), row) }}
                    onCompose={() => {
                      setComposingId(row.agentId)
                      setDraft('')
                      setError(undefined)
                    }}
                    onSend={() => {
                      const text = draft.trim()
                      if (text === '') return
                      void run(async next => {
                        const failure = await sendMessage(next.parentSessionId, next.agentId, text)
                        if (failure === undefined) setComposingId(undefined)
                        return failure
                      }, row)
                    }}
                    onCancel={() => { setComposingId(undefined) }}
                  />
                ))}
              </ul>
            )}
        </div>,
        document.body,
      )}
    </div>
  )
}
