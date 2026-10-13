import { reactive, readonly } from 'vue'

export type ToastVariant = 'success' | 'error' | 'info'

export interface Toast {
  id: number
  variant: ToastVariant
  title: string
  description: string
}

const state = reactive<{ items: Toast[] }>({ items: [] })
let seq = 0

function dismiss(id: number): void {
  const index = state.items.findIndex((t) => t.id === id)
  if (index !== -1) state.items.splice(index, 1)
}

function push(variant: ToastVariant, title: string, description = '', timeout = 3200): number {
  const id = ++seq
  state.items.push({ id, variant, title, description })
  if (timeout) setTimeout(() => dismiss(id), timeout)
  return id
}

/** Minimal global toast queue (rendered by <AppToaster />). */
export function useToast() {
  return {
    state: readonly(state),
    success: (title: string, description?: string) => push('success', title, description),
    error: (title: string, description?: string) => push('error', title, description, 6000),
    info: (title: string, description?: string) => push('info', title, description),
    dismiss,
  }
}
