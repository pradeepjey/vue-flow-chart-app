import { onBeforeUnmount, onMounted } from 'vue'

export type HotkeyCommand = 'undo' | 'redo'
export type HotkeyHandlers = Partial<Record<HotkeyCommand | 'escape', () => void>>

/** True when the event originates from a text-editing element. */
export function isEditableTarget(target: EventTarget | null): boolean {
  if (!target || !(target instanceof Element)) return false
  if (target.closest('[contenteditable="true"]')) return true
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
}

type KeyLike = Pick<KeyboardEvent, 'key' | 'metaKey' | 'ctrlKey' | 'shiftKey' | 'altKey'>

/**
 * Parse a keydown event into an app command, or null.
 * Supports Ctrl/Cmd+Z (undo), Ctrl/Cmd+Shift+Z and Ctrl+Y (redo).
 */
export function resolveHotkey(event: KeyLike): HotkeyCommand | null {
  const mod = event.metaKey || event.ctrlKey
  if (!mod || event.altKey) return null
  const key = event.key.toLowerCase()
  if (key === 'z') return event.shiftKey ? 'redo' : 'undo'
  if (key === 'y' && !event.shiftKey) return 'redo'
  return null
}

/** Is a modal surface (dialog, alert, popover) currently open? */
export const hasOpenOverlay = (): boolean =>
  Boolean(document.querySelector('[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"]'))

/** Register global undo / redo / escape shortcuts while the component is mounted. */
export function useHotkeys(handlers: HotkeyHandlers): void {
  const onKeydown = (event: KeyboardEvent): void => {
    if (isEditableTarget(event.target)) return
    if (event.key === 'Escape' && handlers.escape && !hasOpenOverlay()) {
      handlers.escape()
      return
    }
    const command = resolveHotkey(event)
    const handler = command ? handlers[command] : undefined
    if (handler) {
      event.preventDefault()
      handler()
    }
  }
  onMounted(() => window.addEventListener('keydown', onKeydown))
  onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
}
