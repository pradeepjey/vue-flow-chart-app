import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import TimePicker from '@/components/common/TimePicker.vue'
import { $, $$, flush, must } from '../helpers'

describe('TimePicker', () => {
  it('shows the value and emits a new time when hour then minute are picked', async () => {
    const w = mount(TimePicker, { props: { modelValue: '09:00', label: 'Opening' }, attachTo: document.body })
    const trigger = w.get('[data-testid=time-picker-trigger]')
    expect(trigger.text()).toBe('09:00')
    expect(trigger.attributes('aria-label')).toBe('Opening: 09:00')

    await trigger.trigger('click')
    await flush()
    const options = () => $$('[role=option]')
    expect(options().length).toBe(24 + 12)
    must(options().find((o) => o.textContent?.trim() === '13')).click()
    await flush()
    expect(w.emitted('update:modelValue')?.at(-1)).toEqual(['13:00'])

    await w.setProps({ modelValue: '13:00' })
    const minuteList = $('[aria-label="Opening minute"]')
    must($$('[role=option]', minuteList).find((o) => o.textContent?.trim() === '45')).click()
    await flush()
    expect(w.emitted('update:modelValue')?.at(-1)).toEqual(['13:45'])
    w.unmount()
  })

  it('includes off-step minutes so existing values stay selectable', async () => {
    const w = mount(TimePicker, { props: { modelValue: '09:07' }, attachTo: document.body })
    await w.get('button').trigger('click')
    await flush()
    const selected = $$('[role=option][aria-selected=true]').map((o) => o.textContent?.trim())
    expect(selected).toEqual(['09', '07'])
    w.unmount()
  })

  it('can be disabled', () => {
    const w = mount(TimePicker, { props: { modelValue: '09:00', disabled: true } })
    expect(w.get('button').attributes()).toHaveProperty('disabled')
  })
})
