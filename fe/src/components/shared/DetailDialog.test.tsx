import { act, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { DetailDialog } from './DetailDialog'

// Phase 03 file 06 (Tabs) + APG tabs — P5-D07
function Harness() {
  const [tab, setTab] = useState<'a' | 'b' | 'c'>('a')
  return (
    <DetailDialog
      open
      onClose={() => {}}
      title="Hồ sơ"
      label="Mục hồ sơ"
      tabs={[
        { id: 'a', label: 'Tổng quan' },
        { id: 'b', label: 'CV' },
        { id: 'c', label: 'Lịch sử' },
      ]}
      tab={tab}
      onTab={setTab}
    >
      <p>panel {tab}</p>
    </DetailDialog>
  )
}

beforeAll(() => {
  HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
    this.setAttribute('open', '')
  }
  HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
    this.removeAttribute('open')
  }
})

const raf = () => act(() => new Promise((r) => requestAnimationFrame(() => r(undefined))))

describe('DetailDialog tabs — APG contract', () => {
  it('wires tablist/tab/tabpanel both ways', () => {
    render(<Harness />)
    const list = screen.getByRole('tablist', { name: 'Mục hồ sơ' })
    const tabs = screen.getAllByRole('tab')
    expect(list).toContainElement(tabs[0])
    const panel = screen.getByRole('tabpanel')
    expect(tabs.map((t) => t.getAttribute('aria-selected'))).toEqual(['true', 'false', 'false'])
    expect(panel).toHaveAttribute('aria-labelledby', tabs[0].id)
    expect(tabs[0]).toHaveAttribute('aria-controls', panel.id)
    // P5-D11b · Radix roving focus: Tab vào tablist rồi chuyển tới tab đang chọn
    expect(list.tabIndex).toBe(0)
    expect(tabs.map((t) => t.tabIndex)).toEqual([-1, -1, -1])
  })

  it('arrows, Home/End move focus and activate (automatic mode), wrapping', async () => {
    render(<Harness />)
    const tab = (name: string) => screen.getByRole('tab', { name })
    tab('Tổng quan').focus()
    fireEvent.keyDown(tab('Tổng quan'), { key: 'ArrowRight' })
    await raf()
    expect(tab('CV')).toHaveFocus()
    expect(tab('CV')).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel')).toHaveTextContent('panel b')
    fireEvent.keyDown(tab('CV'), { key: 'End' })
    await raf()
    expect(tab('Lịch sử')).toHaveFocus()
    fireEvent.keyDown(tab('Lịch sử'), { key: 'ArrowRight' })
    await raf()
    expect(tab('Tổng quan')).toHaveFocus()
    fireEvent.keyDown(tab('Tổng quan'), { key: 'ArrowLeft' })
    await raf()
    expect(tab('Lịch sử')).toHaveFocus()
    fireEvent.keyDown(tab('Lịch sử'), { key: 'Home' })
    await raf()
    expect(tab('Tổng quan')).toHaveFocus()
    expect(screen.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', tab('Tổng quan').id)
  })
})
