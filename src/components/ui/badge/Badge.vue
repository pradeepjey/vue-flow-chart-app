<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'secondary' | 'success' | 'danger' | 'outline'

const props = withDefaults(defineProps<{ variant?: BadgeVariant; class?: HTMLAttributes['class'] }>(), {
  variant: 'secondary',
})
const variants: Record<BadgeVariant, string> = {
  default: 'bg-primary text-primary-foreground',
  secondary: 'bg-secondary text-secondary-foreground',
  success: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  danger: 'bg-red-50 text-red-700 ring-1 ring-red-200',
  outline: 'border text-foreground',
}
</script>

<template>
  <span
    data-slot="badge"
    :class="cn('inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap', variants[variant], props.class)"
  >
    <slot />
  </span>
</template>
