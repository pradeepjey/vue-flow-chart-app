import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import FlowNode from '@/components/flow/nodes/FlowNode.vue'
import ConnectorNode from '@/components/flow/nodes/ConnectorNode.vue'
import type { FlowCardData } from '@/utils/canvas'

const stubs = { Handle: { template: '<i class="handle" />' } }

describe('FlowNode', () => {
  const mountNode = (data: Omit<FlowCardData, 'fullSummary'> & { fullSummary?: string }) => mount(FlowNode, { props: { id: 'n1', data: { fullSummary: data.summary, ...data } }, global: { stubs } })

  it('renders icon, title and truncated description', () => {
    const w = mountNode({ kind: 'sendMessage', title: 'Welcome', summary: 'Hello…', fullSummary: 'Hello there', active: false })
    expect(w.get('[data-testid=node-title]').text()).toBe('Welcome')
    expect(w.get('[data-testid=node-description]').text()).toBe('Hello…')
    expect(w.get('[data-testid=node-description]').attributes('title')).toBe('Hello there')
    expect(w.find('svg').exists()).toBe(true)
    expect(w.text()).toContain('Send Message')
  })

  it('omits the target handle for triggers', () => {
    const trigger = mountNode({ kind: 'trigger', title: 'Trigger', summary: 'x', active: false })
    const other = mountNode({ kind: 'addComment', title: 'C', summary: 'x', active: false })
    expect(trigger.findAll('.handle')).toHaveLength(1)
    expect(other.findAll('.handle')).toHaveLength(2)
  })

  it('reflects the active state', () => {
    const w = mountNode({ kind: 'businessHours', title: 'BH', summary: '', active: true })
    expect(w.get('.flow-node').attributes('data-active')).toBe('true')
  })
})

describe('ConnectorNode', () => {
  it('renders the branch label with branch styling', () => {
    const w = mount(ConnectorNode, { props: { id: 'c', data: { title: 'Failure', branch: 'failure' } }, global: { stubs } })
    expect(w.text()).toBe('Failure')
    expect(w.get('[data-branch]').classes()).toContain('text-red-700')
  })
})
