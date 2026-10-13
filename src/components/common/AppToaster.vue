<script setup lang="ts">
import type { Component } from 'vue'
import { CircleAlert, CircleCheck, Info, X } from 'lucide-vue-next'
import { useToast, type ToastVariant } from '@/composables/useToast'

const { state, dismiss } = useToast()
const icons: Record<ToastVariant, Component> = { success: CircleCheck, error: CircleAlert, info: Info }
</script>

<template>
  <div class="pointer-events-none fixed bottom-4 left-1/2 z-[100] flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4" aria-live="polite">
    <TransitionGroup name="toast">
      <div
        v-for="t in state.items"
        :key="t.id"
        role="status"
        class="pointer-events-auto flex items-start gap-3 rounded-lg border bg-background p-3 text-sm shadow-lg"
      >
        <component
          :is="icons[t.variant]"
          class="mt-0.5 size-4 shrink-0"
          :class="{ 'text-emerald-600': t.variant === 'success', 'text-destructive': t.variant === 'error' }"
        />
        <div class="min-w-0 flex-1">
          <p class="font-medium">{{ t.title }}</p>
          <p v-if="t.description" class="truncate text-muted-foreground">{{ t.description }}</p>
        </div>
        <button type="button" class="opacity-60 hover:opacity-100" aria-label="Dismiss notification" @click="dismiss(t.id)">
          <X class="size-4" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>
