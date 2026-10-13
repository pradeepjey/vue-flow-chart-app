<script setup lang="ts">
import { LayoutGrid, Maximize, Plus, Redo2, Undo2, Workflow } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'

withDefaults(defineProps<{ canUndo?: boolean; canRedo?: boolean; disabled?: boolean }>(), {
  canUndo: false,
  canRedo: false,
  disabled: false,
})
const emit = defineEmits<{ create: []; undo: []; redo: []; relayout: []; fit: [] }>()
const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)
const mod = isMac ? '⌘' : 'Ctrl'
</script>

<template>
  <header class="z-30 flex h-14 shrink-0 items-center gap-3 border-b bg-background px-4">
    <div class="flex items-center gap-2">
      <span class="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
        <Workflow class="size-4" />
      </span>
      <div class="leading-tight">
        <h1 class="text-sm font-semibold">Flow Builder</h1>
        <p class="hidden text-xs text-muted-foreground sm:block">Conversation automation</p>
      </div>
    </div>
    <div class="ml-auto flex items-center gap-1" role="toolbar" aria-label="Canvas actions">
      <Button variant="ghost" size="icon" :disabled="disabled || !canUndo" :title="`Undo (${mod}+Z)`" aria-label="Undo" data-testid="undo" @click="emit('undo')">
        <Undo2 />
      </Button>
      <Button variant="ghost" size="icon" :disabled="disabled || !canRedo" :title="`Redo (${mod}+Shift+Z)`" aria-label="Redo" data-testid="redo" @click="emit('redo')">
        <Redo2 />
      </Button>
      <Button variant="ghost" size="icon" :disabled="disabled" title="Tidy layout" aria-label="Tidy layout" @click="emit('relayout')">
        <LayoutGrid />
      </Button>
      <Button variant="ghost" size="icon" :disabled="disabled" title="Fit to screen" aria-label="Fit to screen" @click="emit('fit')">
        <Maximize />
      </Button>
      <div class="mx-2 h-6 w-px bg-border" />
      <Button :disabled="disabled" data-testid="open-create" @click="emit('create')">
        <Plus /> Create New Node
      </Button>
    </div>
  </header>
</template>
