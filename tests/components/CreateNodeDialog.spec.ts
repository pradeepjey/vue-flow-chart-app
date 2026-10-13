import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia, type Pinia } from 'pinia'
import CreateNodeDialog from '@/components/create/CreateNodeDialog.vue'
import { useFlowStore } from '@/stores/flow'
import { $, flush, payloadNodes } from '../helpers'

const setValue = async (sel: string, value: string): Promise<void> => {
  const el = $<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(sel)
  el.value = value
  el.dispatchEvent(new Event(el.tagName === 'SELECT' ? 'change' : 'input'))
  await flush()
}

describe('CreateNodeDialog', () => {
  let pinia: Pinia
  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    useFlowStore().hydrate(payloadNodes())
  })

  const mountDialog = async (props: Record<string, unknown> = {}) => {
    const w = mount(CreateNodeDialog, { props: { open: false, ...props }, global: { plugins: [pinia] }, attachTo: document.body })
    await w.setProps({ open: true })
    await flush()
    return w
  }

  it('renders the required fields and type options', async () => {
    const w = await mountDialog()
    expect($('#create-title')).toBeTruthy()
    expect($('#create-description')).toBeTruthy()
    const types = [...$<HTMLSelectElement>('#create-type').options].map((o) => o.value).filter(Boolean)
    expect(types).toEqual(['sendMessage', 'addComment', 'businessHours'])
    const parents = [...$<HTMLSelectElement>('#create-parent').options].map((o) => o.value)
    expect(parents).not.toContain('d09c08')
    expect([...$<HTMLSelectElement>('#create-parent').options].map((o) => o.text)).toContain('Business Hours → Success')
    w.unmount()
  })

  it('validates before submitting', async () => {
    const w = await mountDialog()
    $('#create-node-form').dispatchEvent(new Event('submit'))
    await flush()
    expect(w.emitted('submit')).toBeUndefined()
    expect(document.body.textContent).toContain('Title is required.')
    expect(document.body.textContent).toContain('Please choose a node type.')
    w.unmount()
  })

  it('emits a trimmed payload when valid', async () => {
    const w = await mountDialog()
    await setValue('#create-title', '  Greeting ')
    await setValue('#create-description', ' Says hi ')
    await setValue('#create-type', 'sendMessage')
    await setValue('#create-parent', '161f52')
    $('#create-node-form').dispatchEvent(new Event('submit'))
    await flush()
    expect(w.emitted('submit')?.[0]?.[0]).toEqual({
      title: 'Greeting',
      description: 'Says hi',
      type: 'sendMessage',
      parentId: '161f52',
    })
    w.unmount()
  })

  it('pre-selects the default parent and resets on reopen', async () => {
    const w = await mountDialog({ defaultParentId: 'e879e4' })
    expect($<HTMLSelectElement>('#create-parent').value).toBe('e879e4')
    await setValue('#create-title', 'Draft')
    await w.setProps({ open: false })
    await w.setProps({ open: true })
    await flush()
    expect($<HTMLInputElement>('#create-title').value).toBe('')
    w.unmount()
  })
})
