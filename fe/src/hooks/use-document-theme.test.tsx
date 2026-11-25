import { render } from '@testing-library/react'
import { useDocumentTheme } from './use-document-theme'

function Shell() {
  useDocumentTheme('v2')
  return null
}

// P5-D14c: portal (dialog, menu) nằm ngoài cây trang vẫn nhận theme
describe('useDocumentTheme', () => {
  it('sets data-theme on <html> while mounted and removes it after', () => {
    const { unmount } = render(<Shell />)
    expect(document.documentElement.dataset.theme).toBe('v2')
    unmount()
    expect(document.documentElement.dataset.theme).toBeUndefined()
  })
})
