<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import { useRouter } from 'vue-router'
import NodeDetailsPanel from './NodeDetailsPanel.vue'
import { useFlowStore } from '@/stores/flow'
import { useNodeMutations } from '@/composables/useNodeMutations'
import { useToast } from '@/composables/useToast'
import { isNodeInteractive } from '@/utils/flow'
import { DRAWER_WIDTH } from '@/constants/flow'
import type { NodePatch } from '@/types/flow'

/** Route component for /nodes/:nodeId — the details drawer shell. */
const props = defineProps<{ nodeId: string }>()

const router = useRouter()
const store = useFlowStore()
const toast = useToast()
const { updateNode, deleteNode, isUpdating, isDeleting } = useNodeMutations()

const node = computed(() => store.getNode(props.nodeId))
const editable = computed(() => (store.loaded && isNodeInteractive(node.value) ? node.value : undefined))

// Unknown ids and display-only connectors are not addressable.
watchEffect(() => {
  if (!store.loaded) return
  if (!node.value) {
    toast.error('Node not found', `No node with id “${props.nodeId}”.`)
    void router.replace({ name: 'flow' })
  } else if (!isNodeInteractive(node.value)) {
    toast.info('Success / failure branches are display-only.')
    void router.replace({ name: 'flow' })
  }
})

const close = () => router.push({ name: 'flow' })

async function onSave(patch: NodePatch): Promise<void> {
  await updateNode(props.nodeId, patch).catch(() => {})
}

async function onDelete(): Promise<void> {
  const id = props.nodeId
  await router.push({ name: 'flow' })
  await deleteNode(id).catch(() => {})
}
</script>

<template>
  <aside
    class="absolute inset-y-0 right-0 z-20 flex w-full flex-col border-l bg-background shadow-[-12px_0_32px_-16px_rgb(15_23_42/0.25)]"
    :style="{ maxWidth: `${DRAWER_WIDTH}px` }"
    aria-labelledby="drawer-title"
    data-testid="node-drawer"
  >
    <Transition name="fade-swap" mode="out-in">
      <NodeDetailsPanel
        v-if="editable"
        :key="editable.id"
        :node="editable"
        :saving="isUpdating"
        :deleting="isDeleting"
        @save="onSave"
        @delete="onDelete"
        @close="close"
      />
      <div v-else class="space-y-3 p-5" aria-busy="true">
        <div class="h-6 w-1/2 animate-pulse rounded bg-muted" />
        <div class="h-9 animate-pulse rounded bg-muted" />
        <div class="h-20 animate-pulse rounded bg-muted" />
      </div>
    </Transition>
  </aside>
</template>
