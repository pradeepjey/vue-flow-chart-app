import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import SendMessageFields from '@/components/drawer/SendMessageFields.vue'
import type { DraftPayloadItem } from '@/utils/draft'
import { must } from '../helpers'

const payload = (): DraftPayloadItem[] => [
  { key: 'a', type: 'text', text: 'Hello' },
  { key: 'b', type: 'attachment', attachment: 'https://x.io/photo.jpg' },
  { key: 'c', type: 'attachment', attachment: 'https://x.io/doc.pdf' },
]

function setup(props: Record<string, unknown> = {}) {
  const w = mount(SendMessageFields, {
    props: { modelValue: payload(), 'onUpdate:modelValue': (v) => w.setProps({ modelValue: v }), ...props },
  })
  return w
}

describe('SendMessageFields', () => {
  it('renders texts and attachment tiles (image + file)', () => {
    const w = setup()
    expect(w.findAll('[data-testid=text-item]')).toHaveLength(1)
    const tiles = w.findAll('[data-testid=attachment-tile]')
    expect(tiles).toHaveLength(2)
    expect(must(tiles[0]).find('img').attributes('src')).toBe('https://x.io/photo.jpg')
    expect(must(tiles[1]).text()).toContain('doc.pdf')
  })

  it('adds, edits and removes texts', async () => {
    const w = setup()
    await w.get('[data-testid=add-text]').trigger('click')
    expect(w.findAll('[data-testid=text-item]')).toHaveLength(2)
    await must(w.findAll('textarea')[1]).setValue('Second')
    expect(w.props('modelValue').filter((p) => p.type === 'text').map((p) => p.text)).toEqual(['Hello', 'Second'])
    await must(w.findAll('[data-testid=remove-text]')[0]).trigger('click')
    expect(w.props('modelValue').filter((p) => p.type === 'text').map((p) => p.text)).toEqual(['Second'])
  })

  it('removes attachments', async () => {
    const w = setup()
    await w.get('[aria-label="Remove attachment photo.jpg"]').trigger('click')
    expect(w.findAll('[data-testid=attachment-tile]')).toHaveLength(1)
  })

  it('falls back to a file tile when an image fails to load', async () => {
    const w = setup()
    await w.get('img').trigger('error')
    expect(w.find('img').exists()).toBe(false)
  })

  it('rejects invalid uploads and accepts valid images', async () => {
    const w = setup()
    const input = w.get('[data-testid=file-input]')
    const setFiles = (files: File[]) => Object.defineProperty(input.element, 'files', { value: files, configurable: true })

    setFiles([new File(['x'], 'notes.txt', { type: 'text/plain' })])
    await input.trigger('change')
    expect(w.get('[data-testid=field-error]').text()).toMatch(/Only images/)

    setFiles([new File(['png'], 'pic.png', { type: 'image/png' })])
    await input.trigger('change')
    // FileReader is async; wait until the new tile has been emitted.
    await vi.waitFor(() => expect(w.props('modelValue').filter((p) => p.type === 'attachment')).toHaveLength(3))
    const attachments = w.props('modelValue').filter((p) => p.type === 'attachment')
    expect(attachments[2]?.type === 'attachment' && attachments[2].attachment).toMatch(/^data:image\/png/)
    expect(attachments[2]).toMatchObject({ fileName: 'pic.png' })
  })

  it('shows validation errors only when asked to', async () => {
    const errors = { a: 'Message text cannot be empty', payload: 'Add at least one' }
    const hidden = setup({ errors, showErrors: false })
    expect(hidden.find('[data-testid=field-error]').exists()).toBe(false)
    const shown = setup({ errors, showErrors: true })
    expect(shown.findAll('[data-testid=field-error]').map((e) => e.text())).toEqual([
      'Message text cannot be empty',
      'Add at least one',
    ])
  })
})
