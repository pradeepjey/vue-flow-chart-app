<script setup lang="ts">
import { AlertDialogContent, AlertDialogDescription, AlertDialogOverlay, AlertDialogPortal, AlertDialogTitle } from 'reka-ui'

withDefaults(defineProps<{ title: string; description?: string }>(), { description: '' })
</script>

<template>
  <AlertDialogPortal>
    <AlertDialogOverlay class="fixed inset-0 z-[60] bg-black/40 overlay-anim" />
    <AlertDialogContent
      class="fixed top-1/2 left-1/2 z-[60] grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-lg border bg-background p-6 shadow-lg sm:max-w-md dialog-anim"
    >
      <div class="flex flex-col gap-2">
        <AlertDialogTitle class="text-lg font-semibold">{{ title }}</AlertDialogTitle>
        <AlertDialogDescription v-if="description" class="text-sm text-muted-foreground">
          {{ description }}
        </AlertDialogDescription>
      </div>
      <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <slot name="footer" />
      </div>
    </AlertDialogContent>
  </AlertDialogPortal>
</template>
