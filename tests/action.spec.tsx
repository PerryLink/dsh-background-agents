// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createRoot, type Root } from 'react-dom/client'
import type { ComponentProps, ReactNode } from 'react'
import { BackgroundAgentsAction } from '../src/client/BackgroundAgentsAction.tsx'
import type { SessionListLike } from '../src/client/presenter.ts'

// The panel binds primitives' Tooltip only as a hover affordance; the mock
// keeps this test hermetic (one React copy, no primitives runtime).
vi.mock('@deepseek-ai/dsh-client-ui-primitives', () => ({
  Tooltip: ({ children }: { readonly children?: ReactNode }) => <>{children}</>,
}))

/** One snapshot: a parent whose projection carries one tracked child. */
function list(childRunning: boolean): SessionListLike {
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
              activity: 'running',
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
}

const mounts: Harness[] = []

function mount(snapshot: SessionListLike): Harness {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const sendMessage = vi.fn().mockResolvedValue(undefined)
  const stopChild = vi.fn().mockResolvedValue(undefined)
  const props = {
    wide: true,
    t: ((key: string) => key) as never,
    useSessions: ((selector: (value: SessionListLike) => unknown) => selector(snapshot)) as never,
    openChild: vi.fn().mockResolvedValue(undefined),
    stopChild,
    sendMessage,
  } as unknown as Props
  const root = createRoot(container)
  root.render(<BackgroundAgentsAction {...props} />)
  const harness = { container, root, sendMessage, stopChild }
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

  it('disables stop for non-running rows and enables it for running rows', async () => {
    const idle = mount(list(false))
    await vi.waitFor(() => { expect(idle.container.querySelector('button')).not.toBeNull() })
    idle.container.querySelector('button')!.click()
    await vi.waitFor(() => { expect(buttons('row.stop').length).toBe(1) })
    expect(buttons('row.stop')[0]!.disabled).toBe(true)

    idle.root.unmount()
    idle.container.remove()

    const running = mount(list(true))
    await vi.waitFor(() => { expect(running.container.querySelector('button')).not.toBeNull() })
    running.container.querySelector('button')!.click()
    await vi.waitFor(() => { expect(buttons('row.stop').length).toBe(1) })
    expect(buttons('row.stop')[0]!.disabled).toBe(false)
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
})
