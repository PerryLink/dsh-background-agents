/**
 * The Team Rooms settings page panel: member status, the shared task board,
 * and the timeline of every room this session belongs to. Reads arrive
 * through the `teamRoom` session projection (the same durable fold the host
 * reconstructs on restart); writes go back through the HOST `/room` command
 * (`remote.commands.execute`), so every button keeps the durable command
 * lifecycle (`command/run` / `command/done`) and the host-side ordering
 * guarantees.
 *
 * Return types are inferred (no explicit `ReactNode` annotations): the shell
 * resolves `ReactNode` against its own @types/react, and an explicit
 * annotation would pin the plugin bundle to a mismatched copy.
 */
import { useState } from 'react'
import type { PropsLocale, PropsRuntime, InjectFace, TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
/** Minimal structural snapshot contract (the owner package no longer re-exports the generic). */
interface ObservableSnapshot<T> {
  getSnapshot(): T
  subscribe(listener: () => void): () => void
}
import type { RoomPanel, RoomTaskRow, TeamRoomsState } from './room-presenter.ts'
import { ROOM_NS } from './room-locales.ts'
import css from './TeamRoomsSection.module.css'

/** Business actions supplied by the slot registration (all via /room command execution). */
export interface TeamRoomsInjected {
  hooks: {
    /** The live controller state: current session id + derived room panels. */
    teamRooms: ObservableSnapshot<TeamRoomsState>
  }
  /** The current session id (commands execute against it), or undefined. */
  getSessionId(): string | undefined
  create(name: string): Promise<string | undefined>
  join(roomId: string): Promise<string | undefined>
  leave(roomId: string): Promise<string | undefined>
  post(roomId: string, text: string): Promise<string | undefined>
  addTask(roomId: string, title: string): Promise<string | undefined>
  claimTask(roomId: string, taskId: string): Promise<string | undefined>
  completeTask(roomId: string, taskId: string): Promise<string | undefined>
  assignTask(roomId: string, taskId: string, member: string): Promise<string | undefined>
}

/** The action share one room card needs (everything except the bound hooks). */
export type RoomActions = Omit<TeamRoomsInjected, 'hooks'>

/** Full component props: the settings-section owner share, locale, and the bound inject face. */
export type TeamRoomsSectionProps =
  PropsRuntime<'settings.section'> & PropsLocale<typeof ROOM_NS> & InjectFace<TeamRoomsInjected>

/** Localized one-line account of a timeline entry. */
function timelineLabel(
  row: { readonly seq: number; readonly kind: string; readonly data: Record<string, unknown> },
  t: TranslateNS<typeof ROOM_NS>,
): string {
  const str = (value: unknown): string => (typeof value === 'string' ? value : '')
  switch (row.kind) {
    case 'room-created': return t('timelineRoomCreated', { member: str(row.data.sessionId) })
    case 'member-joined': return t('timelineMemberJoined', { member: str(row.data.sessionId) })
    case 'member-left': return t('timelineMemberLeft', { member: str(row.data.sessionId) })
    case 'message-posted': return t('timelineMessage', { sender: str(row.data.senderSessionId), text: str(row.data.text) })
    case 'message-directed': return t('timelineDirected', { sender: str(row.data.senderSessionId), to: str(row.data.toSessionId), text: str(row.data.text) })
    case 'task-created': return t('timelineTaskCreated', { title: str(row.data.title) })
    case 'task-claimed': return t('timelineTaskClaimed', { member: str(row.data.assigneeSessionId) })
    case 'task-assigned': return t('timelineTaskAssigned', { member: str(row.data.assigneeSessionId) })
    case 'task-completed': return t('timelineTaskCompleted', {})
    default: return t('timelineUnknown', { seq: row.seq })
  }
}

/** One task row with its local actions. */
function TaskRowView({ roomId, task, t, busy, actions }: {
  readonly roomId: string
  readonly task: RoomTaskRow
  readonly t: TranslateNS<typeof ROOM_NS>
  readonly busy: boolean
  readonly actions: Pick<RoomActions, 'claimTask' | 'completeTask' | 'assignTask'>
}) {
  const [assignee, setAssignee] = useState('')
  const statusLabel = task.status === 'todo'
    ? t('statusTodo')
    : task.status === 'in-progress' ? t('statusInProgress') : t('statusDone')
  return (
    <li className={`${css.task} ${css[`task-${task.status}`]}`}>
      <div className={css.taskHead}>
        <span className={css.taskStatus}>{statusLabel}</span>
        <span className={css.taskTitle}>{task.title}</span>
        <span className={css.taskAssignee}>
          {task.assigneeSessionId === null ? t('unassigned') : task.assigneeSessionId}
        </span>
      </div>
      {task.description !== '' && <div className={css.taskDesc}>{task.description}</div>}
      <div className={css.taskActions}>
        {task.status === 'todo' && (
          <button type="button" className={css.action} disabled={busy}
            onClick={() => { void actions.claimTask(roomId, task.taskId) }}>
            {t('claim')}
          </button>
        )}
        {task.status !== 'done' && (
          <>
            <input
              className={css.assignInput}
              value={assignee}
              placeholder={t('assignTo')}
              onChange={event => { setAssignee(event.target.value) }}
            />
            <button
              type="button"
              className={css.action}
              disabled={busy || assignee.trim() === ''}
              onClick={() => {
                void actions.assignTask(roomId, task.taskId, assignee.trim())
                setAssignee('')
              }}
            >
              {t('assignAction')}
            </button>
          </>
        )}
        {task.status !== 'done' && (
          <button type="button" className={css.action} disabled={busy}
            onClick={() => { void actions.completeTask(roomId, task.taskId) }}>
            {t('done')}
          </button>
        )}
      </div>
    </li>
  )
}

/** One room card: members, task board, message composer, and timeline. */
function RoomCard({ panel, t, busy, actions }: {
  readonly panel: RoomPanel
  readonly t: TranslateNS<typeof ROOM_NS>
  readonly busy: boolean
  readonly actions: RoomActions
}) {
  const [taskTitle, setTaskTitle] = useState('')
  const [message, setMessage] = useState('')
  const [copied, setCopied] = useState(false)
  return (
    <section className={css.room}>
      <header className={css.roomHead}>
        <h3 className={css.roomName}>{panel.name}</h3>
        <span className={css.roomId}>
          {t('roomId')}: {panel.roomId}
        </span>
        <button
          type="button"
          className={css.action}
          disabled={busy}
          onClick={() => {
            void navigator.clipboard.writeText(panel.roomId)
            setCopied(true)
            window.setTimeout(() => { setCopied(false) }, 1500)
          }}
        >
          {copied ? t('copied') : t('copy')}
        </button>
        <button
          type="button"
          className={css.action}
          disabled={busy}
          onClick={() => { void actions.leave(panel.roomId) }}
        >
          {t('leave')}
        </button>
      </header>

      <div className={css.members}>
        <h4 className={css.blockTitle}>{t('members')}</h4>
        <ul className={css.memberList}>
          {panel.members.map(member => (
            <li key={member.sessionId} className={css.member}>
              <span className={`${css.memberDot} ${member.live ? css.memberLive : css.memberOffline}`} aria-hidden />
              <span className={css.memberId} title={member.title ?? member.sessionId}>
                {member.title ?? member.sessionId}
              </span>
              <span className={css.memberMeta}>
                {member.role === 'owner' ? t('owner') : t('member')} · {member.live ? t('live') : t('offline')}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className={css.board}>
        <h4 className={css.blockTitle}>{t('tasks')}</h4>
        <div className={css.taskAdd}>
          <input
            className={css.input}
            value={taskTitle}
            placeholder={t('taskAddPlaceholder')}
            onChange={event => { setTaskTitle(event.target.value) }}
            onKeyDown={event => {
              if (event.key === 'Enter' && taskTitle.trim() !== '' && !busy) {
                void actions.addTask(panel.roomId, taskTitle.trim())
                setTaskTitle('')
              }
            }}
          />
          <button
            type="button"
            className={css.action}
            disabled={busy || taskTitle.trim() === ''}
            onClick={() => {
              void actions.addTask(panel.roomId, taskTitle.trim())
              setTaskTitle('')
            }}
          >
            {t('taskAdd')}
          </button>
        </div>
        {panel.tasks.length === 0
          ? <div className={css.empty}>{t('tasksEmpty')}</div>
          : (
            <ul className={css.taskList}>
              {panel.tasks.map(task => (
                <TaskRowView
                  key={task.taskId}
                  roomId={panel.roomId}
                  task={task}
                  t={t}
                  busy={busy}
                  actions={actions}
                />
              ))}
            </ul>
          )}
      </div>

      <div className={css.composer}>
        <h4 className={css.blockTitle}>{t('message')}</h4>
        <div className={css.composerRow}>
          <input
            className={css.input}
            value={message}
            placeholder={t('messagePlaceholder')}
            onChange={event => { setMessage(event.target.value) }}
            onKeyDown={event => {
              if (event.key === 'Enter' && message.trim() !== '' && !busy) {
                void actions.post(panel.roomId, message.trim())
                setMessage('')
              }
            }}
          />
          <button
            type="button"
            className={css.action}
            disabled={busy || message.trim() === ''}
            onClick={() => {
              void actions.post(panel.roomId, message.trim())
              setMessage('')
            }}
          >
            {t('send')}
          </button>
        </div>
      </div>

      <div className={css.timeline}>
        <h4 className={css.blockTitle}>{t('timeline')}</h4>
        {panel.timeline.length === 0
          ? <div className={css.empty}>{t('timelineEmpty')}</div>
          : (
            <ul className={css.timelineList}>
              {panel.timeline.map(event => (
                <li key={event.seq} className={css.timelineRow}>
                  <span className={css.timelineKind}>{event.kind}</span>
                  <span className={css.timelineText}>{timelineLabel(event, t)}</span>
                </li>
              ))}
            </ul>
          )}
      </div>
      {busy && <div className={css.busy}>{t('busy')}</div>}
    </section>
  )
}

/** The settings section: room management over the live session's projection. */
export function TeamRoomsSection(props: TeamRoomsSectionProps) {
  const { useTeamRooms, t } = props
  const state = useTeamRooms(snapshot => snapshot) as TeamRoomsState
  const [createName, setCreateName] = useState('')
  const [joinId, setJoinId] = useState('')
  const [error, setError] = useState<string | undefined>(undefined)
  const [busyId, setBusyId] = useState<string | undefined>(undefined)

  const run = async (action: () => Promise<string | undefined>, mark?: string): Promise<void> => {
    setBusyId(mark)
    setError(undefined)
    try {
      const failure = await action()
      setError(failure)
    } finally {
      setBusyId(undefined)
    }
  }

  return (
    <div className={css.section}>
      <h2 className={css.title}>{t('title')}</h2>
      <p className={css.intro}>{t('intro')}</p>

      {state.sessionId === undefined && <p className={css.noSession}>{t('noSession')}</p>}

      <div className={css.forms}>
        <div className={css.formRow}>
          <input
            className={css.input}
            value={createName}
            placeholder={t('createPlaceholder')}
            disabled={state.sessionId === undefined || busyId !== undefined}
            onChange={event => { setCreateName(event.target.value) }}
            onKeyDown={event => {
              if (event.key === 'Enter' && createName.trim() !== '' && busyId === undefined) {
                void run(() => props.create(createName.trim()), 'create').then(() => { setCreateName('') })
              }
            }}
          />
          <button
            type="button"
            className={css.action}
            disabled={state.sessionId === undefined || busyId !== undefined || createName.trim() === ''}
            onClick={() => {
              void run(() => props.create(createName.trim()), 'create').then(() => { setCreateName('') })
            }}
          >
            {t('createAction')}
          </button>
        </div>
        <div className={css.formRow}>
          <input
            className={css.input}
            value={joinId}
            placeholder={t('joinPlaceholder')}
            disabled={state.sessionId === undefined || busyId !== undefined}
            onChange={event => { setJoinId(event.target.value) }}
            onKeyDown={event => {
              if (event.key === 'Enter' && joinId.trim() !== '' && busyId === undefined) {
                void run(() => props.join(joinId.trim()), 'join').then(() => { setJoinId('') })
              }
            }}
          />
          <button
            type="button"
            className={css.action}
            disabled={state.sessionId === undefined || busyId !== undefined || joinId.trim() === ''}
            onClick={() => {
              void run(() => props.join(joinId.trim()), 'join').then(() => { setJoinId('') })
            }}
          >
            {t('joinAction')}
          </button>
        </div>
      </div>

      {error !== undefined && <div className={css.error} role="alert">{t('error')}: {error}</div>}

      {state.rooms.length === 0
        ? <div className={css.empty}>{t('empty')}</div>
        : state.rooms.map(room => (
          <RoomCard key={room.roomId} panel={room} t={t} busy={busyId !== undefined} actions={props} />
        ))}
    </div>
  )
}
