import { afterEach, vi } from 'vitest'

// jsdom lacks these browser APIs used by reka-ui / Vue Flow.
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverMock
Element.prototype.scrollIntoView ??= function scrollIntoView() {}
Element.prototype.hasPointerCapture ??= () => false
Element.prototype.releasePointerCapture ??= () => {}

afterEach(() => {
  vi.useRealTimers()
  document.body.innerHTML = ''
})
