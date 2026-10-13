import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia, type Pinia } from 'pinia'
import { VueQueryPlugin } from '@tanstack/vue-query'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'
import NodeDetailsDrawer from '@/components/drawer/NodeDetailsDrawer.vue'
import { useFlowStore, type FlowStore } from '@/stores/flow'
import { createQueryClient } from '@/lib/queryClient'
import { flush, payloadNodes } from '../helpers'

describe('NodeDetailsDrawer (route component)', () => {
  let pinia: Pinia
  let router: Router
  let store: FlowStore
  beforeEach(async () => {
    pinia = createPinia()
    setActivePinia(pinia)
    store = useFlowStore()
    store.hydrate(payloadNodes())
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', name: 'flow', component: { template: '<div />' } },
        { path: '/nodes/:nodeId', name: 'node', component: NodeDetailsDrawer, props: true },
      ],
    })
  })

  const mountAt = async (id: string) => {
    await router.push(`/nodes/${id}`)
    const w = mount(NodeDetailsDrawer, {
      props: { nodeId: id },
      global: { plugins: [pinia, router, [VueQueryPlugin, { queryClient: createQueryClient() }]] },
      attachTo: document.body,
    })
    await flush()
    return w
  }

  it('renders the details for a node id from the URL', async () => {
    const w = await mountAt('b6a0c1')
    expect(w.get('[data-testid=drawer-title]').text()).toBe('Away Message')
    w.unmount()
  })

  it('redirects away from display-only connector nodes', async () => {
    const w = await mountAt('161f52')
    await flush()
    expect(router.currentRoute.value.name).toBe('flow')
    w.unmount()
  })

  it('redirects away from unknown ids', async () => {
    const w = await mountAt('doesnotexist')
    await flush()
    expect(router.currentRoute.value.name).toBe('flow')
    w.unmount()
  })

  it('saves edits through the mutation into the store', async () => {
    const w = await mountAt('e879e4')
    await w.get('#node-comment').setValue('Updated comment')
    await w.get('form').trigger('submit')
    await flush()
    expect(store.getNode('e879e4')?.data).toMatchObject({ comment: 'Updated comment' })
    expect(store.canUndo).toBe(true)
    w.unmount()
  })
})
