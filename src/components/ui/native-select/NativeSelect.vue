<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { ChevronDown } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

defineOptions({ inheritAttrs: false })
const props = defineProps<{ class?: HTMLAttributes['class'] }>()
const model = defineModel<string | number | null>({ default: '' })
</script>

<template>
  <div :class="cn('relative w-full', props.class)">
    <select
      v-model="model"
      v-bind="$attrs"
      data-slot="native-select"
      class="h-9 w-full appearance-none rounded-md border border-input bg-background py-1 pr-9 pl-3 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive"
    >
      <slot />
    </select>
    <ChevronDown class="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 opacity-50" aria-hidden="true" />
  </div>
</template>
