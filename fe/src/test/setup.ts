import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'

// jsdom chưa có showModal/close cho <dialog>
HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
  this.setAttribute('open', '')
}
HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
  this.removeAttribute('open')
}

afterEach(() => {
  cleanup()
  localStorage.clear()
})
