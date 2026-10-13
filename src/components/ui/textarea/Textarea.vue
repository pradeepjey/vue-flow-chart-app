<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

defineOptions({ inheritAttrs: false })
const props = defineProps<{ class?: HTMLAttributes['class'] }>()
const model = defineModel<string>({ default: '' })
</script>

<template>
  <textarea
    v-model="model"
    v-bind="$attrs"
    data-slot="textarea"
    :class="
      cn(
        'flex min-h-16 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50',
        'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
        'aria-invalid:border-destructive aria-invalid:ring-destructive/20',
        props.class,
      )
    "
  />
</template>
