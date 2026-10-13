<script setup lang="ts">
import { computed } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import { getKindMeta } from '@/constants/nodeKinds'
import type { FlowCardData } from '@/utils/canvas'

/**
 * Canvas card for trigger / message / comment / business-hours nodes.
 * Receives pre-computed, primitive `data` from FlowCanvas so it only
 * re-renders when its own title / summary / active flag change.
 */
const props = withDefaults(
  defineProps<{
    id: string
    data: FlowCardData
    selected?: boolean
    dragging?: boolean
  }>(),
  { selected: false, dragging: false },
)

const meta = computed(() => getKindMeta(props.data.kind))
const isTrigger = computed(() => props.data.kind === 'trigger')
</script>

<template>
  <div
    class="flow-node group w-[260px] cursor-pointer overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm transition-[box-shadow,border-color,transform] duration-200 hover:shadow-md"
    :class="data.active ? 'border-transparent' : 'border-border'"
    :style="data.active ? { boxShadow: `0 0 0 2px ${meta.color}, 0 8px 24px -10px ${meta.color}` } : undefined"
    :data-kind="data.kind"
    :data-active="data.active || undefined"
  >
    <Handle v-if="!isTrigger" type="target" :position="Position.Top" :connectable="false" />
    <header class="flex items-center gap-2 border-b px-3 py-2.5">
      <span
        class="grid size-7 shrink-0 place-items-center rounded-md"
        :style="{ color: meta.color, backgroundColor: `color-mix(in oklab, ${meta.color} 12%, transparent)` }"
        aria-hidden="true"
      >
        <component :is="meta.icon" class="size-4" />
      </span>
      <div class="min-w-0">
        <p class="truncate text-sm font-semibold" data-testid="node-title">{{ data.title }}</p>
        <p class="text-[11px] leading-none text-muted-foreground">{{ meta.label }}</p>
      </div>
    </header>
    <p
      class="line-clamp-2 min-h-[2.5rem] px-3 py-2.5 text-xs leading-5 text-muted-foreground break-words"
      :class="{ italic: data.kind === 'sendMessage' }"
      :title="data.fullSummary"
      data-testid="node-description"
    >
      {{ data.summary }}
    </p>
    <Handle type="source" :position="Position.Bottom" :connectable="false" />
  </div>
</template>
