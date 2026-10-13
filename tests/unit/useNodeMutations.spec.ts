import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { VueQueryPlugin } from '@tanstack/vue-query'
import { useNodeMutations } from '@/composables/useNodeMutations'
import { useFlowStore } from '@/stores/flow'
import { createQueryClient } from '@/lib/queryClient'
import { flowApi } from '@/api/flowApi'
import { FLOW_QUERY_KEY } from '@/constants/flow'
import type { FlowNode } from '@/types/flow'
import { must, payloadNodes } from '../helpers'

function setup() {
  const pinia = createPinia()
  setActivePinia(pinia)
  const store = useFlowStore()
  store.hydrate(payloadNodes())
  const queryClient = createQueryClient()
  queryClient.setQueryData(FLOW_QUERY_KEY, payloadNodes())
  let api: ReturnType<typeof useNodeMutations> | undefined
  mount(
    defineComponent({
      setup() {
        api = useNodeMutations()
        return () => h('div')
      },
    }),
    { global: { plugins: [pinia, [VueQueryPlugin, { queryClient }]] } },
  )
  const cached = (): FlowNode[] => queryClient.getQueryData<FlowNode[]>(FLOW_QUERY_KEY) ?? []
  return { api: must(api, 'mutations'), store, queryClient, cached }
}

describe('useNodeMutations', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('creates nodes optimistically and syncs the query cache', async () => {
    vi.spyOn(flowApi, 'createNodes').mockImplementation(async (r) => r)
    const { api, store, cached } = setup()
    const record = await api.createNode({ title: 'New', description: '', type: 'addComment', parentId: 'e879e4' })
    expect(store.getNode(record.id)).toBeTruthy()
    expect(cached().some((n) => n.id === record.id)).toBe(true)
  })

  it('updates nodes and syncs the cache', async () => {
    vi.spyOn(flowApi, 'updateNode').mockImplementation(async (r) => must(r))
    const { api, store, cached } = setup()
    await api.updateNode('e879e4', { name: 'Edited' })
    expect(store.getNode('e879e4')?.name).toBe('Edited')
    expect(cached().find((n) => n.id === 'e879e4')?.name).toBe('Edited')
  })

  it('rolls back the store when the API fails', async () => {
    vi.spyOn(flowApi, 'deleteNode').mockRejectedValue(new Error('boom'))
    const { api, store, cached } = setup()
    await expect(api.deleteNode('b6a0c1')).rejects.toThrow('boom')
    expect(store.getNode('b6a0c1')).toBeTruthy()
    expect(store.canUndo).toBe(false)
    expect(cached()).toHaveLength(7)
  })
})
