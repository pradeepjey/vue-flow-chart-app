<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import type { ConnectorPillData } from '@/utils/canvas'

/** Display-only success / failure branch pill (not interactive). */
defineProps<{ id: string; data: ConnectorPillData }>()
</script>

<template>
  <div
    class="flex h-8 w-[110px] items-center justify-center rounded-full border text-xs font-medium shadow-xs"
    :class="
      data.branch === 'success'
        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
        : 'border-red-200 bg-red-50 text-red-700'
    "
    :data-branch="data.branch"
  >
    <Handle type="target" :position="Position.Top" :connectable="false" />
    {{ data.title }}
    <Handle type="source" :position="Position.Bottom" :connectable="false" />
  </div>
</template>
