<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { Label } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<{ for?: string; class?: HTMLAttributes['class'] }>()
</script>

<template>
  <Label
    data-slot="label"
    :for="props.for"
    :class="cn('flex items-center gap-2 text-sm leading-none font-medium select-none', props.class)"
  >
    <slot />
  </Label>
</template>
