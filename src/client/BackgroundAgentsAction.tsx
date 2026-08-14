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

/** One dashboard row. */
function Row({ row, t, now, busy, onOpen, onStop }: {
  readonly row: AgentRow
  readonly t: TranslateNS<typeof NS>
  readonly now: number
  readonly busy: boolean
  readonly onOpen: () => void
  readonly onStop: () => void
}) {
  return (
    <li className={css.row}>
      <div className={css.rowHead}>
        <span className={`${css.status} ${css[`status-${row.status}`]}`}>{statusLabel(row.status, t)}</span>
        <span className={css.label} title={row.agentId}>{row.label}</span>
        <span className={css.meta}>{t('row.messages', { n: row.messageCount })} · {timeLabel(row.lastActiveAt, now, t)}</span>
      </div>
      {row.lastMessage !== undefined && <div className={css.lastMessage}>{row.lastMessage}</div>}
      <div className={css.actions}>
        <button type="button" className={css.action} disabled={busy} onClick={onOpen}>{t('row.open')}</button>
        <button
          type="button"
          className={css.action}
          disabled={busy || row.status !== 'running'}
          onClick={onStop}
        >
          {t('row.stop')}
        </button>
      </div>
    </li>
  )
}

/** The sidebar footer trigger + floating dashboard panel. */
export function BackgroundAgentsAction({
  wide, t, useSessions, openChild, stopChild,
}: BackgroundAgentsActionProps) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)
  const [busyId, setBusyId] = useState<string | undefined>(undefined)
  const [now, setNow] = useState(() => Date.now())
  const wrapRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  // The client SessionProjectionMap cannot carry the plugin's key, so the
  // snapshot crosses the boundary structurally and the presenter guards the
  // projection cell at runtime.
  const rows = useSessions(snapshot => buildAgentRows(snapshot as unknown as SessionListLike))
  const runningCount = rows.filter(row => row.status === 'running').length

  // Refresh the relative-time labels while the panel is open.
  useEffect(() => {
    if (!open) return
    const timer = window.setInterval(() => { setNow(Date.now()) }, 30_000)
    return () => { window.clearInterval(timer) }
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

  return (
    <div className={css.triggerWrap} ref={wrapRef}>
      <Tooltip label={t('trigger.aria')} delayMs={500}>
        <button
          type="button"
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
        <div className={css.panel} role="dialog" aria-label={t('panel.title')} ref={panelRef}>
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
                    onOpen={() => { void run(next => openChild(next.parentSessionId, next.agentId), row) }}
                    onStop={() => { void run(next => stopChild(next.parentSessionId, next.agentId), row) }}
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
