import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import axe from 'axe-core'
import { useState } from 'react'
import { MemoryRouter } from 'react-router'
import { AlertDialog } from './AlertDialog'
import { Button } from './Button'
import { Dialog } from './Dialog'
import { DropdownMenu } from './DropdownMenu'
import { Input } from './Input'
import { Sheet } from './Sheet'

const axeClean = async () => {
  const r = await axe.run(document.body, { rules: { 'color-contrast': { enabled: false } } })
  expect(r.violations.map((v) => v.id)).toEqual([])
}

function DialogDemo() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)}>Mở</Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Thêm phòng ban">
        <Input aria-label="Tên phòng ban" />
        <Button>Lưu</Button>
      </Dialog>
    </>
  )
}

describe('Dialog (Radix bên trong)', () => {
  it('focus vào trong, bẫy Tab, Escape đóng và trả focus về nút mở, khoá cuộn trang', async () => {
    const user = userEvent.setup()
    render(<DialogDemo />)
    const trigger = screen.getByRole('button', { name: 'Mở' })
    await user.click(trigger)
    const dialog = screen.getByRole('dialog', { name: 'Thêm phòng ban' })
    expect(dialog).toContainElement(document.activeElement as HTMLElement)
    expect(document.body).toHaveStyle({ pointerEvents: 'none' })
    for (let i = 0; i < 4; i++) {
      await user.tab()
      expect(dialog).toContainElement(document.activeElement as HTMLElement)
    }
    await axeClean()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).toBeNull()
    await waitFor(() => expect(trigger).toHaveFocus())
  })
})

describe('AlertDialog', () => {
  it('focus đầu vào hành động ít phá huỷ nhất; không chọn sẵn lý do (VF-01)', async () => {
    const onConfirm = vi.fn()
    render(
      <AlertDialog
        open
        title="Từ chối hồ sơ?"
        confirmLabel="Từ chối"
        confirmVariant="danger"
        requireReason={{ label: 'Ghi chú', codes: [{ value: 'SKILL', label: 'Thiếu kỹ năng' }] }}
        onConfirm={onConfirm}
      />,
    )
    expect(screen.getByRole('alertdialog', { name: 'Từ chối hồ sơ?' })).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Huỷ' })).toHaveFocus())
    expect(screen.getByRole('button', { name: 'Thiếu kỹ năng' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    await userEvent.click(screen.getByRole('button', { name: 'Từ chối' }))
    expect(onConfirm).not.toHaveBeenCalled()
    expect(screen.getByText('Chọn một lý do để tiếp tục')).toBeInTheDocument()
    await axeClean()
  })

  it('OP-1: lỗi khi lưu giữ nội dung đã nhập và hiện nút "Thử lại"', async () => {
    const onConfirm = vi.fn().mockRejectedValueOnce(new Error('x')).mockResolvedValueOnce(undefined)
    const onClose = vi.fn()
    render(
      <AlertDialog
        open
        onClose={onClose}
        title="Tạm ngưng công ty?"
        confirmLabel="Tạm ngưng"
        requireReason={{ label: 'Lý do' }}
        onConfirm={onConfirm}
      />,
    )
    await userEvent.type(screen.getByRole('textbox', { name: 'Lý do' }), 'Vi phạm điều khoản')
    await userEvent.click(screen.getByRole('button', { name: 'Tạm ngưng' }))
    const retry = await screen.findByRole('button', { name: 'Thử lại' })
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Lý do' })).toHaveValue('Vi phạm điều khoản')
    await userEvent.click(retry)
    await waitFor(() => expect(onClose).toHaveBeenCalled())
    expect(onConfirm).toHaveBeenLastCalledWith('Vi phạm điều khoản', undefined)
  })
})

describe('Sheet (DL-16)', () => {
  it('chỉ có "Mở chi tiết" + điều hướng, không có nút đổi trạng thái; Escape đóng', async () => {
    const onOpenChange = vi.fn()
    render(
      <MemoryRouter>
        <Sheet
          open
          onOpenChange={onOpenChange}
          title="Nguyễn Minh Anh"
          detailHref="/applications/1"
          next={{ label: 'Hồ sơ sau', onSelect: () => {} }}
        >
          <p>Backend Developer</p>
        </Sheet>
      </MemoryRouter>,
    )
    const sheet = screen.getByRole('dialog', { name: 'Nguyễn Minh Anh' })
    expect(screen.getByRole('link', { name: 'Mở chi tiết' })).toHaveAttribute(
      'href',
      '/applications/1',
    )
    const names = [...sheet.querySelectorAll('button')].map((b) => b.getAttribute('aria-label'))
    expect(names.sort()).toEqual(['Hồ sơ sau', 'Đóng'].sort())
    await axeClean()
    await userEvent.keyboard('{Escape}')
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})

describe('DropdownMenu', () => {
  it('mũi tên, Home/End, gõ chữ để nhảy, Escape trả focus về nút mở', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(
      <DropdownMenu
        trigger={<Button aria-label="Thao tác khác">…</Button>}
        items={[
          { label: 'Sửa', onSelect },
          { label: 'Nhân bản', onSelect },
          { label: 'Xoá', onSelect, variant: 'danger' },
        ]}
      />,
    )
    const trigger = screen.getByRole('button', { name: 'Thao tác khác' })
    trigger.focus()
    await user.keyboard('{Enter}')
    const items = screen.getAllByRole('menuitem')
    await waitFor(() => expect(items[0]).toHaveFocus())
    await user.keyboard('{ArrowDown}')
    expect(items[1]).toHaveFocus()
    await user.keyboard('{End}')
    expect(items[2]).toHaveFocus()
    await user.keyboard('{Home}')
    expect(items[0]).toHaveFocus()
    await user.keyboard('n')
    expect(items[1]).toHaveFocus()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('menu')).toBeNull()
    await waitFor(() => expect(trigger).toHaveFocus())
  })
})
