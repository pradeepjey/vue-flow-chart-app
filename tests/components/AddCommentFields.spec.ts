import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import AddCommentFields from '@/components/drawer/AddCommentFields.vue'

describe('AddCommentFields', () => {
  it('edits and clears the comment', async () => {
    const w = mount(AddCommentFields, {
      props: { modelValue: 'Hello', 'onUpdate:modelValue': (v) => w.setProps({ modelValue: v }) },
    })
    expect((w.get('textarea').element as HTMLTextAreaElement).value).toBe('Hello')
    expect(w.text()).toContain('5/500')
    await w.get('textarea').setValue('Changed')
    expect(w.props('modelValue')).toBe('Changed')
    await w.get('[data-testid=clear-comment]').trigger('click')
    expect(w.props('modelValue')).toBe('')
    expect(w.get('[data-testid=clear-comment]').attributes()).toHaveProperty('disabled')
  })

  it('shows an error', () => {
    const w = mount(AddCommentFields, { props: { modelValue: 'x', error: 'Too long' } })
    expect(w.get('[data-testid=field-error]').text()).toBe('Too long')
    expect(w.get('textarea').attributes('aria-invalid')).toBe('true')
  })
})
