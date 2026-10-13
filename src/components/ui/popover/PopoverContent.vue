<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { PopoverContent, PopoverPortal } from 'reka-ui'
import { cn } from '@/lib/utils'

defineOptions({ inheritAttrs: false })
const props = withDefaults(
  defineProps<{ align?: 'start' | 'center' | 'end'; sideOffset?: number; class?: HTMLAttributes['class'] }>(),
  { align: 'center', sideOffset: 4 },
)
</script>

<template>
  <PopoverPortal>
    <PopoverContent
      v-bind="$attrs"
      :align="align"
      :side-offset="sideOffset"
      data-slot="popover-content"
      :class="cn('z-50 rounded-md border bg-popover p-3 text-popover-foreground shadow-md outline-none popover-anim', props.class)"
    >
      <slot />
    </PopoverContent>
  </PopoverPortal>
</template>
