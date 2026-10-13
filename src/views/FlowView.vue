<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { CircleAlert, LoaderCircle } from 'lucide-vue-next'
import FlowToolbar from '@/components/flow/FlowToolbar.vue'
import FlowCanvas from '@/components/flow/FlowCanvas.vue'
import CreateNodeDialog from '@/components/create/CreateNodeDialog.vue'
import { Button } from '@/components/ui/button'
import { useFlowStore } from '@/stores/flow'
import { useFlowQuery } from '@/composables/useFlowQuery'
import { useNodeMutations } from '@/composables/useNodeMutations'
import { useHotkeys } from '@/composables/useHotkeys'
import type { CreateNodeInput } from '@/types/flow'

const route = useRoute()
const router = useRouter()
const store = useFlowStore()
const query = useFlowQuery()
const { createNode, isCreating, syncCache } = useNodeMutations()

const canvas = ref<InstanceType<typeof FlowCanvas> | null>(null)
const createOpen = ref(false)
const activeNodeId = computed<string | null>(() => (route.name === 'node' ? String(route.params.nodeId) : null))
const ready = computed(() => store.loaded)

function toggleNode(id: string): void {
  if (activeNodeId.value === id) void router.push({ name: 'flow' })
  else void router.push({ name: 'node', params: { nodeId: id } })
}

function closeDrawer(): void {
  if (activeNodeId.value) void router.push({ name: 'flow' })
}

async function onCreate(form: CreateNodeInput): Promise<void> {
  try {
    const record = await createNode(form)
    createOpen.value = false
    void router.push({ name: 'node', params: { nodeId: record.id } })
  } catch {
    /* toast already shown by the mutation */
  }
}

const undo = (): void => {
  if (store.undo()) syncCache()
}
const redo = (): void => {
  if (store.redo()) syncCache()
}
useHotkeys({ undo, redo, escape: closeDrawer })
</script>

<template>
  <div class="flex h-full flex-col">
    <FlowToolbar
      :can-undo="store.canUndo"
      :can-redo="store.canRedo"
      :disabled="!ready"
      @create="createOpen = true"
      @undo="undo"
      @redo="redo"
      @relayout="store.relayout()"
      @fit="canvas?.fitView()"
    />
    <main class="relative flex-1 overflow-hidden">
      <FlowCanvas
        v-if="ready"
        ref="canvas"
        :active-node-id="activeNodeId"
        @toggle-node="toggleNode"
        @close="closeDrawer"
      />
      <div v-else-if="query.isError.value" class="grid h-full place-items-center p-6" role="alert">
        <div class="max-w-sm space-y-3 text-center">
          <CircleAlert class="mx-auto size-8 text-destructive" />
          <p class="font-medium">Couldn’t load the flow</p>
          <p class="text-sm text-muted-foreground">{{ query.error.value?.message }}</p>
          <Button variant="outline" @click="query.refetch()">Try again</Button>
        </div>
      </div>
      <div v-else class="grid h-full place-items-center bg-canvas" aria-busy="true">
        <div class="flex items-center gap-2 text-sm text-muted-foreground">
          <LoaderCircle class="size-4 animate-spin" /> Loading flow…
        </div>
      </div>

      <RouterView v-slot="{ Component }">
        <Transition name="drawer">
          <component :is="Component" v-if="Component && ready" />
        </Transition>
      </RouterView>
    </main>
    <CreateNodeDialog
      v-model:open="createOpen"
      :pending="isCreating"
      :default-parent-id="activeNodeId"
      @submit="onCreate"
    />
  </div>
</template>
