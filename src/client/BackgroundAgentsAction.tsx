/**
 * The sidebar background-agent panel: a `sidebar.footer.action` entry whose
 * trigger shows a live agent count and opens a floating panel of dashboard
 * rows (label, status, last activity, message count) with one-click
 * jump-to-child-session and stop. All displayed facts come from the pure
 * presenter over the session-list snapshot; this component only binds
 * interactions.
 */
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { PropsLocale, PropsRuntime, TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import { Tooltip } from '@deepseek-ai/dsh-client-ui-primitives'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
import { buildAgentRows, relativeTime, type AgentRow, type RowStatus, type SessionListLike } from './presenter.ts'
import { NS } from './locales.ts'
import css from './BackgroundAgentsAction.module.css'

/** Business actions supplied by the slot registration. */
export interface BackgroundAgentsInjected {
  /**
   * Open the child session through its durable direct-parent address.
   * @returns an error message on failure, undefined on success.
   */
  openChild(parentSessionId: string, childSessionId: string): Promise<string | undefined>
  /**
   * Request interruption of the child's current turn through the official
   * `subagent.interrupt` RPC.
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
   * Read the child's final assistant text through the official
   * `subagent.history` RPC (a read-only transcript peek that never activates
   * the child Agent).
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
  wide, t, useSessions, openChild, stopChild, sendMessage, readResult,
}: BackgroundAgentsActionProps) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)
  const [busyId, setBusyId] = useState<string | undefined>(undefined)
  const [composingId, setComposingId] = useState<string | undefined>(undefined)
  const [draft, setDraft] = useState('')
  const [result, setResult] = useState<ResultState | undefined>(undefined)
  const [now, setNow] = useState(() => Date.now())
  const wrapRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const wasOpenRef = useRef(false)

  // The client SessionProjectionMap cannot carry the plugin's key, so the
  // snapshot crosses the boundary structurally and the presenter guards the
  // projection cell at runtime.
  const rows = useSessions(snapshot => buildAgentRows(snapshot as unknown as SessionListLike))
  const runningCount = rows.filter(row => row.status === 'running').length
  // Parent-session disambiguation: only when several parents project rows.
  const showParent = new Set(rows.map(row => row.parentSessionId)).size > 1

  // Refresh the relative-time labels while the panel is open.
  useEffect(() => {
    if (!open) return
    const timer = window.setInterval(() => { setNow(Date.now()) }, 30_000)
    return () => { window.clearInterval(timer) }
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
          <span className={css.triggerIcon} aria-hidden>◉</span>
          {wide && <span className={css.triggerLabel}>{t('trigger.label')}</span>}
          {runningCount > 0 && <span className={css.count}>{runningCount}</span>}
        </button>
      </Tooltip>
      {open && createPortal(
        <div className={css.panel} role="dialog" aria-label={t('panel.title')} ref={panelRef} tabIndex={-1}>
          <div className={css.panelTitle}>{t('panel.title')}</div>
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
