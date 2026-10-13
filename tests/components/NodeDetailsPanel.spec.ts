import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import NodeDetailsPanel from '@/components/drawer/NodeDetailsPanel.vue'
import { $, byId, flush, payloadNodes } from '../helpers'

const mountPanel = (id: string, props: Record<string, unknown> = {}) =>
  mount(NodeDetailsPanel, { props: { node: byId(payloadNodes(), id), ...props }, attachTo: document.body })

const inputValue = (w: ReturnType<typeof mountPanel>, selector: string): string =>
  (w.get(selector).element as HTMLInputElement | HTMLTextAreaElement).value

describe('NodeDetailsPanel', () => {
  it('shows the node title and editable title / description', () => {
    const w = mountPanel('e879e4')
    expect(w.get('[data-testid=drawer-title]').text()).toBe('Add Comment #1')
    expect(inputValue(w, '#node-title')).toBe('Add Comment #1')
    expect(inputValue(w, '#node-comment')).toBe('User message during off hours')
    w.unmount()
  })

  it('disables save until something changes, then emits a patch', async () => {
    const w = mountPanel('e879e4')
    expect(w.get('[data-testid=save-node]').attributes()).toHaveProperty('disabled')
    await w.get('#node-title').setValue('Note for agents')
    await w.get('#node-description').setValue('Internal')
    await w.get('form').trigger('submit')
    expect(w.emitted('save')?.[0]?.[0]).toEqual({
      name: 'Note for agents',
      data: { comment: 'User message during off hours', description: 'Internal' },
    })
    w.unmount()
  })

  it('blocks saving invalid input and shows the error', async () => {
    const w = mountPanel('b6a0c1')
    await w.get('#node-title').setValue('')
    await w.get('form').trigger('submit')
    expect(w.emitted('save')).toBeUndefined()
    expect(w.text()).toContain('Title is required.')
    w.unmount()
  })

  it('resets edits', async () => {
    const w = mountPanel('b6a0c1')
    await w.get('#node-title').setValue('Changed')
    await w.get('[data-testid=reset-node]').trigger('click')
    expect(inputValue(w, '#node-title')).toBe('Away Message')
    w.unmount()
  })

  it('re-seeds the draft when the node changes (undo)', async () => {
    const w = mountPanel('b6a0c1')
    const node = byId(payloadNodes(), 'b6a0c1')
    await w.setProps({ node: { ...node, name: 'From undo' } })
    expect(inputValue(w, '#node-title')).toBe('From undo')
    w.unmount()
  })

  it('renders type specific sections', () => {
    const hours = mountPanel('d09c08')
    expect(hours.findAll('[data-testid=hours-row]')).toHaveLength(7)
    hours.unmount()
    const message = mountPanel('b0653a')
    expect(message.findAll('[data-testid=attachment-tile]')).toHaveLength(1)
    message.unmount()
    const trigger = mountPanel('1')
    expect(trigger.text()).toContain('Conversation opened')
    expect(trigger.find('[data-testid=delete-node]').exists()).toBe(false)
    trigger.unmount()
  })

  it('asks for confirmation before deleting', async () => {
    const w = mountPanel('e879e4')
    await w.get('[data-testid=delete-node]').trigger('click')
    await flush()
    const confirm = $('[data-testid=confirm-delete]')
    expect(w.emitted('delete')).toBeUndefined()
    confirm.click()
    await flush()
    expect(w.emitted('delete')).toHaveLength(1)
    w.unmount()
  })

  it('emits close', async () => {
    const w = mountPanel('e879e4')
    await w.get('[data-testid=close-drawer]').trigger('click')
    expect(w.emitted('close')).toHaveLength(1)
    w.unmount()
  })
})
