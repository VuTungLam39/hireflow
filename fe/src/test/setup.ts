import '@testing-library/jest-dom/vitest'
import { cleanup, configure } from '@testing-library/react'

// jsdom chưa có showModal/close cho <dialog>
HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
  this.setAttribute('open', '')
}
HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
  this.removeAttribute('open')
}

// jsdom thiếu API mà Radix Select/Popper và cmdk dùng
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
}
Element.prototype.scrollIntoView ??= function () {}
Element.prototype.hasPointerCapture ??= () => false
Element.prototype.releasePointerCapture ??= function () {}

afterEach(() => {
  cleanup()
  localStorage.clear()
})

// P8-8a
configure({ asyncUtilTimeout: 8000 })
