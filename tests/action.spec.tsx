// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createRoot, type Root } from 'react-dom/client'
import type { ComponentProps, ReactNode } from 'react'
import { BackgroundAgentsAction } from '../src/client/BackgroundAgentsAction.tsx'
import type { SessionListLike } from '../src/client/presenter.ts'

// The panel binds primitives' Tooltip only as a hover affordance and the
// branch icon as the trigger glyph; the mock keeps this test hermetic (one
// React copy, no primitives runtime).
vi.mock('@deepseek-ai/dsh-client-ui-primitives', () => ({
  Tooltip: ({ children }: { readonly children?: ReactNode }) => <>{children}</>,
  IconBranchOutline16: () => <svg />,
}))

/** One snapshot: a parent whose projection carries one tracked child. */
function list(
  childRunning: boolean,
  activity: 'running' | 'inactive' | 'archived' = 'running',
): SessionListLike {
  return {
    byId: {
      parent: {
        id: 'parent',
        running: false,
        displayTitle: 'parent session',
        projectionValues: {
          backgroundAgents: {
            agents: [{
              agentId: 'child-1',
              label: 'writer',
              activity,
              messageCount: 3,
              createdAt: 100,
              lastActiveAt: 200,
            }],
          },
        },
      },
      'child-1': { id: 'child-1', running: childRunning, displayTitle: 'child title' },
    },
  }
}

type Props = ComponentProps<typeof BackgroundAgentsAction>

interface Harness {
  readonly container: HTMLDivElement
  readonly root: Root
  readonly sendMessage: ReturnType<typeof vi.fn>
  readonly stopChild: ReturnType<typeof vi.fn>
  readonly readResult: ReturnType<typeof vi.fn>
}

const mounts: Harness[] = []

function mount(snapshot: SessionListLike): Harness {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const sendMessage = vi.fn().mockResolvedValue(undefined)
  const stopChild = vi.fn().mockResolvedValue(undefined)
  const readResult = vi.fn().mockResolvedValue({ text: 'final result text' })
  const props = {
    wide: true,
    t: ((key: string) => key) as never,
    sessions: {
      getSnapshot: () => snapshot,
      subscribe: () => () => {},
    } as never,
    openChild: vi.fn().mockResolvedValue(undefined),
    stopChild,
    sendMessage,
    readResult,
  } as unknown as Props
  const root = createRoot(container)
  root.render(<BackgroundAgentsAction {...props} />)
  const harness = { container, root, sendMessage, stopChild, readResult }
  mounts.push(harness)
  return harness
}

afterEach(() => {
  for (const { container, root } of mounts.splice(0)) {
    root.unmount()
    container.remove()
  }
  document.body.innerHTML = ''
})

/** All visible panel buttons, by text content (the t-fake renders keys). */
function buttons(label: string): HTMLButtonElement[] {
  return [...document.body.querySelectorAll('button')].filter(button => button.textContent === label)
}

/** The composer input, addressed by its localized placeholder (the t-fake renders the key). */
function composerInput(): HTMLInputElement | null {
  return document.body.querySelector('input[placeholder="message.placeholder"]')
}

function setInputValue(input: HTMLInputElement, text: string): void {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!
  setter.call(input, text)
  input.dispatchEvent(new window.Event('input', { bubbles: true }))
}

describe('BackgroundAgentsAction', () => {
  it('renders an SVG icon in the trigger instead of a text glyph', async () => {
    const { container } = mount(list(false))
    await vi.waitFor(() => { expect(container.querySelector('button')).not.toBeNull() })
    const trigger = container.querySelector('button')!
    expect(trigger.querySelector('svg')).not.toBeNull()
    expect(trigger.textContent).not.toContain('◉')
  })

  it('anchors the open panel to the trigger with inline left/bottom placement', async () => {
    const { container } = mount(list(false))
    await vi.waitFor(() => { expect(container.querySelector('button')).not.toBeNull() })
    container.querySelector('button')!.click()
    await vi.waitFor(() => { expect(document.body.querySelector('[role="dialog"]')).not.toBeNull() })
    const panel = document.body.querySelector('[role="dialog"]') as HTMLDivElement
    expect(panel.style.left).toBe('0px')
    expect(panel.style.bottom).toMatch(/px$/)
  })

  it('opens the panel from the trigger and closes on Escape', async () => {
    const { container } = mount(list(false))
    await vi.waitFor(() => { expect(container.querySelector('button')).not.toBeNull() })
    expect(document.body.querySelector('[role="dialog"]')).toBeNull()

    container.querySelector('button')!.click()
    await vi.waitFor(() => { expect(document.body.querySelector('[role="dialog"]')).not.toBeNull() })
    expect(document.body.querySelector('li')).not.toBeNull()

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await vi.waitFor(() => { expect(document.body.querySelector('[role="dialog"]')).toBeNull() })
  })

  it('closes the panel on an outside pointerdown', async () => {
    const { container } = mount(list(false))
    await vi.waitFor(() => { expect(container.querySelector('button')).not.toBeNull() })
    container.querySelector('button')!.click()
    await vi.waitFor(() => { expect(document.body.querySelector('[role="dialog"]')).not.toBeNull() })

    document.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    await vi.waitFor(() => { expect(document.body.querySelector('[role="dialog"]')).toBeNull() })
  })

  it('enables stop for live, idle, and settled rows and disables it for archived rows', async () => {
    for (const [childRunning, activity] of [[true, 'running'], [false, 'running'], [false, 'inactive']] as const) {
      const mounted = mount(list(childRunning, activity))
      await vi.waitFor(() => { expect(mounted.container.querySelector('button')).not.toBeNull() })
      mounted.container.querySelector('button')!.click()
      await vi.waitFor(() => { expect(buttons('row.stop').length).toBe(1) })
      expect(buttons('row.stop')[0]!.disabled).toBe(false)
      mounted.root.unmount()
      mounted.container.remove()
    }

    const archived = mount(list(false, 'archived'))
    await vi.waitFor(() => { expect(archived.container.querySelector('button')).not.toBeNull() })
    archived.container.querySelector('button')!.click()
    await vi.waitFor(() => { expect(buttons('row.stop').length).toBe(1) })
    expect(buttons('row.stop')[0]!.disabled).toBe(true)
  })

  it('sends a message through the injected action and closes the composer', async () => {
    const { container, sendMessage } = mount(list(false))
    await vi.waitFor(() => { expect(container.querySelector('button')).not.toBeNull() })
    container.querySelector('button')!.click()
    await vi.waitFor(() => { expect(buttons('row.message').length).toBe(1) })

    buttons('row.message')[0]!.click()
    await vi.waitFor(() => { expect(composerInput()).not.toBeNull() })
    const input = composerInput()!
    setInputValue(input, 'check the snapshot now')
    buttons('message.send')[0]!.click()

    await vi.waitFor(() => { expect(sendMessage).toHaveBeenCalledTimes(1) })
    expect(sendMessage).toHaveBeenCalledWith('parent', 'child-1', 'check the snapshot now')
    await vi.waitFor(() => { expect(composerInput()).toBeNull() })
  })

  it('surfaces a failed send as the panel error', async () => {
    const { container, sendMessage } = mount(list(false))
    sendMessage.mockResolvedValue('SUBAGENT_X: delivery failed')
    await vi.waitFor(() => { expect(container.querySelector('button')).not.toBeNull() })
    container.querySelector('button')!.click()
    await vi.waitFor(() => { expect(buttons('row.message').length).toBe(1) })

    buttons('row.message')[0]!.click()
    await vi.waitFor(() => { expect(composerInput()).not.toBeNull() })
    setInputValue(composerInput()!, 'nope')
    buttons('message.send')[0]!.click()

    await vi.waitFor(() => {
      const error = document.body.querySelector('[class*="error"]')
      expect(error?.textContent).toContain('SUBAGENT_X: delivery failed')
    })
  })

  it('peeks the child result through the injected history action', async () => {
    const { container, readResult } = mount(list(false))
    await vi.waitFor(() => { expect(container.querySelector('button')).not.toBeNull() })
    container.querySelector('button')!.click()
    await vi.waitFor(() => { expect(buttons('row.result').length).toBe(1) })

    buttons('row.result')[0]!.click()
    await vi.waitFor(() => { expect(readResult).toHaveBeenCalledExactlyOnceWith('parent', 'child-1') })
    await vi.waitFor(() => {
      const result = document.body.querySelector('[class*="resultText"]')
      expect(result?.textContent).toBe('final result text')
    })
    // The button flips to the close affordance while the peek is open.
    expect(buttons('result.close').length).toBe(1)
    buttons('result.close')[0]!.click()
    await vi.waitFor(() => { expect(document.body.querySelector('[class*="resultText"]')).toBeNull() })
  })

  it('surfaces a failed result peek inline', async () => {
    const { container, readResult } = mount(list(false))
    readResult.mockResolvedValue({ text: '', error: 'SUBAGENT_X: no transcript' })
    await vi.waitFor(() => { expect(container.querySelector('button')).not.toBeNull() })
    container.querySelector('button')!.click()
    await vi.waitFor(() => { expect(buttons('row.result').length).toBe(1) })

    buttons('row.result')[0]!.click()
    await vi.waitFor(() => {
      const error = document.body.querySelector('[class*="resultError"]')
      expect(error?.textContent).toContain('SUBAGENT_X: no transcript')
    })
  })

  it('moves focus into the panel on open and back to the trigger on close', async () => {
    const { container } = mount(list(false))
    await vi.waitFor(() => { expect(container.querySelector('button')).not.toBeNull() })
    const trigger = container.querySelector('button')!
    trigger.click()
    await vi.waitFor(() => { expect(document.body.querySelector('[role="dialog"]')).not.toBeNull() })
    expect(document.activeElement).toBe(document.body.querySelector('[role="dialog"]'))

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await vi.waitFor(() => { expect(document.body.querySelector('[role="dialog"]')).toBeNull() })
    expect(document.activeElement).toBe(trigger)
  })
})
