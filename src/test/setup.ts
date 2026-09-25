import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

afterEach(() => {
  cleanup()
})

// Radix primitives (DropdownMenu, Dialog/Sheet — adopted by
// docs/features/mobile-app-shell-and-touch-ergonomics-v0.1.md §3) call a
// few browser APIs jsdom doesn't implement. Minimal no-op stand-ins so
// menus and sheets can be opened and operated with userEvent in tests.
if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false
}
if (!Element.prototype.setPointerCapture) {
  Element.prototype.setPointerCapture = () => {}
}
if (!Element.prototype.releasePointerCapture) {
  Element.prototype.releasePointerCapture = () => {}
}
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {}
}
if (!('ResizeObserver' in globalThis)) {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}

// jsdom has no PointerEvent, so Testing Library's fireEvent.pointer*()
// falls back to a bare Event without clientX/clientY — enough for
// SwipeActionRow's gesture tests (docs/features/
// mobile-gestures-reorder-and-swipe-v0.1.md §2) to need a minimal one.
if (!('PointerEvent' in globalThis)) {
  class PointerEventPolyfill extends MouseEvent {
    pointerId: number
    pointerType: string
    constructor(type: string, init: PointerEventInit = {}) {
      super(type, init)
      this.pointerId = init.pointerId ?? 1
      this.pointerType = init.pointerType ?? 'mouse'
    }
  }
  globalThis.PointerEvent = PointerEventPolyfill as unknown as typeof PointerEvent
}
