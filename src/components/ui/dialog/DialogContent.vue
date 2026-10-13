<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { DialogClose, DialogContent, DialogOverlay, DialogPortal } from 'reka-ui'
import { X } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

defineOptions({ inheritAttrs: false })
const props = defineProps<{ class?: HTMLAttributes['class'] }>()
</script>

<template>
  <DialogPortal>
    <DialogOverlay class="fixed inset-0 z-50 bg-black/40 overlay-anim" />
    <DialogContent
      v-bind="$attrs"
      data-slot="dialog-content"
      :class="
        cn(
          'fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-lg border bg-background p-6 shadow-lg sm:max-w-lg dialog-anim',
          props.class,
        )
      "
    >
      <slot />
      <DialogClose
        class="absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus-visible:ring-[3px] focus-visible:ring-ring/50 outline-none"
      >
        <X class="size-4" />
        <span class="sr-only">Close</span>
      </DialogClose>
    </DialogContent>
  </DialogPortal>
</template>
