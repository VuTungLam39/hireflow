import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { Popover } from './Popover'

function Harness() {
  const [open, setOpen] = useState(false)
  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      role="menu"
      label="Lọc"
      trigger={(props) => (
        <button type="button" {...props}>
          Mở
        </button>
      )}
    >
      <button type="button" role="menuitem">
        Sửa
      </button>
      <button type="button" role="menuitem" disabled>
        Khoá
      </button>
      <button type="button" role="menuitem">
        Xoá
      </button>
    </Popover>
  )
}

describe('Popover', () => {
  it('Esc closes only the popover and is not passed on to the dialog or page shortcuts behind it', () => {
    const outer = vi.fn()
    const onWindowKey = (e: KeyboardEvent) => outer(e.defaultPrevented)
    window.addEventListener('keydown', onWindowKey)
    render(<Harness />)

    fireEvent.click(screen.getByRole('button', { name: 'Mở' }))
    expect(screen.getByRole('menu', { name: 'Lọc' })).toBeInTheDocument()

    const notCancelled = fireEvent.keyDown(screen.getByRole('menuitem', { name: 'Sửa' }), {
      key: 'Escape',
    })
    expect(notCancelled).toBe(false)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Mở' })).toHaveFocus()
    expect(outer).not.toHaveBeenCalled()

    fireEvent.keyDown(screen.getByRole('button', { name: 'Mở' }), { key: 'Escape' })
    expect(outer).toHaveBeenCalledWith(false)
    window.removeEventListener('keydown', onWindowKey)
  })

  it('a menu is keyboard operable: focus starts on the first item, arrows skip disabled items and wrap', () => {
    render(<Harness />)
    fireEvent.click(screen.getByRole('button', { name: 'Mở' }))
    const edit = screen.getByRole('menuitem', { name: 'Sửa' })
    const remove = screen.getByRole('menuitem', { name: 'Xoá' })
    expect(edit).toHaveFocus()

    fireEvent.keyDown(edit, { key: 'ArrowDown' })
    expect(remove).toHaveFocus()
    fireEvent.keyDown(remove, { key: 'ArrowDown' })
    expect(edit).toHaveFocus()
    fireEvent.keyDown(edit, { key: 'ArrowUp' })
    expect(remove).toHaveFocus()
    fireEvent.keyDown(remove, { key: 'Home' })
    expect(edit).toHaveFocus()
    fireEvent.keyDown(edit, { key: 'End' })
    expect(remove).toHaveFocus()

    fireEvent.keyDown(remove, { key: 'Tab' })
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })
})
