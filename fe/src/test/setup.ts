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

// Test flow render cả trang qua MSW; khi chạy song song cả bộ có thể vượt 5 s mặc định
if (/[\\/]src[\\/]test[\\/]flows[\\/]/.test(expect.getState().testPath ?? '')) {
  vi.setConfig({ testTimeout: 15_000 })
}
