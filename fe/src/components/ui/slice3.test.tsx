import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import axe from 'axe-core'
import { useState } from 'react'
import { Button } from './Button'
import { Popover } from './Popover'
import { RichSelect } from './RichSelect'
import { FilterTabs, Tabs } from './Tabs'
import { Tooltip } from './Tooltip'

const axeClean = async () => {
  const r = await axe.run(document.body, {
    rules: { 'color-contrast': { enabled: false }, region: { enabled: false } },
  })
  expect(r.violations.map((v) => v.id)).toEqual([])
}

describe('Tabs (F-18)', () => {
  it('mũi tên vòng quanh, Home/End nhảy về đầu/cuối và chuyển focus', async () => {
    const user = userEvent.setup()
    function Demo() {
      const [v, setV] = useState('all')
      return (
        <Tabs
          label="Lọc tin"
          value={v}
          onChange={setV}
          tabs={[
            { id: 'all', label: 'Tất cả' },
            { id: 'open', label: 'Đang tuyển' },
            { id: 'closed', label: 'Đã đóng' },
          ]}
        />
      )
    }
    render(<Demo />)
    screen.getByRole('tab', { name: 'Tất cả' }).focus()
    await user.keyboard('{End}')
    await waitFor(() => expect(screen.getByRole('tab', { name: 'Đã đóng' })).toHaveFocus())
    expect(screen.getByRole('tab', { name: 'Đã đóng' })).toHaveAttribute('aria-selected', 'true')
    await user.keyboard('{ArrowRight}')
    await waitFor(() => expect(screen.getByRole('tab', { name: 'Tất cả' })).toHaveFocus())
    await user.keyboard('{End}{Home}')
    await waitFor(() => expect(screen.getByRole('tab', { name: 'Tất cả' })).toHaveFocus())
    await axeClean()
  })
})

describe('FilterTabs (thanh lọc không có panel)', () => {
  it('radiogroup/radio + aria-checked, không có role tab; mũi tên/End chọn và chuyển focus', async () => {
    const user = userEvent.setup()
    function Demo() {
      const [v, setV] = useState('all')
      return (
        <FilterTabs
          label="Lọc theo trạng thái tin"
          value={v}
          onChange={setV}
          tabs={[
            { id: 'all', label: 'Tất cả' },
            { id: 'open', label: 'Đang tuyển', count: 3 },
          ]}
        />
      )
    }
    render(<Demo />)
    expect(screen.queryByRole('tablist')).toBeNull()
    expect(screen.queryByRole('tab')).toBeNull()
    expect(screen.getByRole('radiogroup', { name: 'Lọc theo trạng thái tin' })).toBeInTheDocument()
    const all = screen.getByRole('radio', { name: 'Tất cả' })
    expect(all).toHaveAttribute('aria-checked', 'true')
    all.focus()
    await user.keyboard('{End}')
    const open = screen.getByRole('radio', { name: /Đang tuyển/ })
    await waitFor(() => expect(open).toHaveFocus())
    expect(open).toHaveAttribute('aria-checked', 'true')
    await axeClean()
  })
})

describe('Popover listbox (F-13)', () => {
  it('mở thì focus vào lựa chọn đang chọn; mũi tên/Home/End; Escape đóng và trả focus', async () => {
    const user = userEvent.setup()
    function Demo() {
      const [open, setOpen] = useState(false)
      return (
        <Popover
          open={open}
          onOpenChange={setOpen}
          role="listbox"
          label="Trạng thái"
          trigger={(props) => <Button {...props}>Trạng thái</Button>}
        >
          {['Tất cả', 'Mới', 'Sàng lọc', 'Phỏng vấn'].map((o) => (
            <button key={o} type="button" role="option" aria-selected={o === 'Mới'}>
              {o}
            </button>
          ))}
        </Popover>
      )
    }
    render(<Demo />)
    const trigger = screen.getByRole('button', { name: 'Trạng thái' })
    await user.click(trigger)
    const opt = (n: string) => screen.getByRole('option', { name: n })
    await waitFor(() => expect(opt('Mới')).toHaveFocus())
    await user.keyboard('{ArrowDown}')
    expect(opt('Sàng lọc')).toHaveFocus()
    await user.keyboard('{End}')
    expect(opt('Phỏng vấn')).toHaveFocus()
    await user.keyboard('{ArrowDown}')
    expect(opt('Tất cả')).toHaveFocus()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('listbox')).toBeNull()
    await waitFor(() => expect(trigger).toHaveFocus())
  })

  it('bấm lại nút mở thì đóng (không đóng rồi mở lại)', async () => {
    const user = userEvent.setup()
    function Demo() {
      const [open, setOpen] = useState(false)
      return (
        <Popover
          open={open}
          onOpenChange={setOpen}
          label="Bộ lọc ngày"
          trigger={(props) => <Button {...props}>Ngày</Button>}
        >
          <p>Nội dung</p>
        </Popover>
      )
    }
    render(<Demo />)
    const trigger = screen.getByRole('button', { name: 'Ngày' })
    await user.click(trigger)
    expect(screen.getByRole('dialog', { name: 'Bộ lọc ngày' })).toBeInTheDocument()
    await user.click(trigger)
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})

describe('Tooltip', () => {
  it('focus bàn phím mở ngay, Escape đóng', async () => {
    const user = userEvent.setup()
    render(
      <Tooltip label="Xuất CSV">
        <button type="button" aria-label="Xuất CSV">
          ↓
        </button>
      </Tooltip>,
    )
    await user.tab()
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Xuất CSV')
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('tooltip')).toBeNull())
  })
})

describe('RichSelect (F-13)', () => {
  it('mở bằng bàn phím, mũi tên chọn, Enter xác nhận', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(
      <RichSelect
        aria-label="Vai trò"
        placeholder="Chọn vai trò"
        onValueChange={onValueChange}
        options={[
          { value: 'HR', label: 'HR', description: 'Quản lý tin và hồ sơ' },
          { value: 'HM', label: 'Hiring Manager', description: 'Duyệt Offer' },
        ]}
      />,
    )
    const trigger = screen.getByRole('combobox', { name: 'Vai trò' })
    trigger.focus()
    await user.keyboard('{Enter}')
    await screen.findByRole('listbox')
    await user.keyboard('{ArrowDown}{Enter}')
    expect(onValueChange).toHaveBeenCalledWith('HM')
  })
})
