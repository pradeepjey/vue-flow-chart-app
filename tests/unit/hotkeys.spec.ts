import { describe, expect, it } from 'vitest'
import { hasOpenOverlay, isEditableTarget, resolveHotkey } from '@/composables/useHotkeys'

const key = (k: string, mods: Partial<KeyboardEvent> = {}) => ({ key: k, metaKey: false, ctrlKey: false, shiftKey: false, altKey: false, ...mods })

describe('hotkeys', () => {
  it('resolves undo / redo', () => {
    expect(resolveHotkey(key('z', { ctrlKey: true }))).toBe('undo')
    expect(resolveHotkey(key('Z', { metaKey: true, shiftKey: true }))).toBe('redo')
    expect(resolveHotkey(key('y', { ctrlKey: true }))).toBe('redo')
    expect(resolveHotkey(key('z'))).toBeNull()
    expect(resolveHotkey(key('z', { ctrlKey: true, altKey: true }))).toBeNull()
  })

  it('detects editable targets', () => {
    expect(isEditableTarget(document.createElement('input'))).toBe(true)
    expect(isEditableTarget(document.createElement('textarea'))).toBe(true)
    expect(isEditableTarget(document.createElement('div'))).toBe(false)
    expect(isEditableTarget(null)).toBe(false)
  })

  it('detects open overlays', () => {
    expect(hasOpenOverlay()).toBe(false)
    document.body.innerHTML = '<div role="dialog" data-state="open"></div>'
    expect(hasOpenOverlay()).toBe(true)
  })
})
