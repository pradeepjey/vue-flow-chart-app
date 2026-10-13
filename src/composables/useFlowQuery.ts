import { watch } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { fetchFlow } from '@/api/flowApi'
import { FLOW_QUERY_KEY } from '@/constants/flow'
import { useFlowStore } from '@/stores/flow'
import type { FlowNode } from '@/types/flow'

/**
 * Fetch the flow document with TanStack Query and hydrate the Pinia store
 * the first time data arrives. Because `staleTime` is Infinity, the cache is
 * only ever updated by our own mutations afterwards.
 */
export function useFlowQuery() {
  const store = useFlowStore()
  const query = useQuery<FlowNode[]>({
    queryKey: FLOW_QUERY_KEY,
    queryFn: ({ signal }) => fetchFlow({ signal }),
  })

  watch(
    query.data,
    (data) => {
      if (data && !store.loaded) store.hydrate(data)
    },
    { immediate: true },
  )

  return query
}
