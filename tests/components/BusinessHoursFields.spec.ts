import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import BusinessHoursFields from '@/components/drawer/BusinessHoursFields.vue'
import { draftFromNode } from '@/utils/draft'
import { asKind, byId, must, payloadNodes } from '../helpers'

function setup(props: Record<string, unknown> = {}) {
  const draft = asKind(draftFromNode(byId(payloadNodes(), 'd09c08')), 'businessHours')
  const w = mount(BusinessHoursFields, {
    props: {
      days: draft.days,
      timezone: draft.timezone,
      'onUpdate:days': (v) => w.setProps({ days: v }),
      'onUpdate:timezone': (v) => w.setProps({ timezone: v }),
      ...props,
    },
  })
  return w
}

describe('BusinessHoursFields', () => {
  it('displays existing business hours for each day', () => {
    const w = setup()
    const rows = w.findAll('[data-testid=hours-row]')
    expect(rows).toHaveLength(7)
    expect(must(rows[0]).text()).toContain('Mon')
    expect(must(rows[0]).findAll('[data-testid=time-picker-trigger]').map((b) => b.text())).toEqual(['09:00', '17:00'])
  })

  it('toggles a day closed', async () => {
    const w = setup()
    await must(w.findAll('input[type=checkbox]')[6]).setValue(false)
    expect(w.props('days')[6]?.enabled).toBe(false)
    expect(must(w.findAll('[data-testid=hours-row]')[6]).text()).toContain('Closed')
  })

  it('changes the time zone', async () => {
    const w = setup()
    await w.get('select').setValue('Asia/Kuala_Lumpur')
    expect(w.props('timezone')).toBe('Asia/Kuala_Lumpur')
  })

  it('renders day errors when enabled', () => {
    const w = setup({ errors: { tue: 'End time must be after start time.' }, showErrors: true })
    expect(must(w.findAll('[data-testid=hours-row]')[1]).text()).toContain('End time must be after start time.')
  })
})
