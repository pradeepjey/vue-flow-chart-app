import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { flowApi } from '@/api/flowApi'
import { FLOW_QUERY_KEY } from '@/constants/flow'
import { useFlowStore, type FlowSnapshot } from '@/stores/flow'
import { useToast } from '@/composables/useToast'
import type { CreateNodeInput, FlowNode, NodePatch } from '@/types/flow'
import { clone, createNodeRecords } from '@/utils/flow'

interface MutationContext {
  before: FlowSnapshot
}

interface UpdateVariables {
  id: string
  patch: NodePatch
}

/**
 * Create / update / delete mutations.
 *
 * Pattern: optimistic update of the Pinia store in `onMutate` (instant UI),
 * simulated API call in `mutationFn`, rollback on error, and the Query cache
 * is written from the store on success so cache and store never diverge.
 */
export function useNodeMutations() {
  const store = useFlowStore()
  const queryClient = useQueryClient()
  const toast = useToast()

  const syncCache = (): void => {
    queryClient.setQueryData<FlowNode[]>(FLOW_QUERY_KEY, clone(store.nodes))
  }

  const optimistic =
    <V>(apply: (variables: V) => unknown) =>
    (variables: V): MutationContext => {
      const before = store.snapshot()
      apply(variables)
      return { before }
    }

  const onError =
    (label: string) =>
    (error: Error, _variables: unknown, context: MutationContext | undefined): void => {
      if (context?.before) store.rollback(context.before)
      toast.error(`${label} failed`, error?.message)
    }

  const create = useMutation<FlowNode[], Error, FlowNode[], MutationContext>({
    mutationFn: (records) => flowApi.createNodes(records),
    onMutate: optimistic((records: FlowNode[]) => store.addNodes(records)),
    onError: onError('Creating node'),
    onSuccess: (records) => {
      syncCache()
      toast.success('Node created', records[0]?.name)
    },
  })

  const update = useMutation<FlowNode, Error, UpdateVariables, MutationContext>({
    mutationFn: ({ id }) => flowApi.updateNode(store.getNode(id)),
    onMutate: optimistic(({ id, patch }: UpdateVariables) => store.updateNode(id, patch)),
    onError: onError('Saving changes'),
    onSuccess: (record) => {
      syncCache()
      toast.success('Changes saved', record?.name)
    },
  })

  const remove = useMutation<{ id: string }, Error, string, MutationContext>({
    mutationFn: (id) => flowApi.deleteNode(id),
    onMutate: optimistic((id: string) => store.removeNode(id)),
    onError: onError('Deleting node'),
    onSuccess: () => {
      syncCache()
      toast.success('Node deleted')
    },
  })

  /** Build records from the dialog form and create them. Returns the main record. */
  async function createNode(form: CreateNodeInput): Promise<FlowNode> {
    const records = createNodeRecords(form, store.nodeIds())
    await create.mutateAsync(records)
    return records[0]!
  }

  return {
    createNode,
    updateNode: (id: string, patch: NodePatch) => update.mutateAsync({ id, patch }),
    deleteNode: (id: string) => remove.mutateAsync(id),
    syncCache,
    isCreating: create.isPending,
    isUpdating: update.isPending,
    isDeleting: remove.isPending,
  }
}
