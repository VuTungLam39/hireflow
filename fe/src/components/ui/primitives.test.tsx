import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import axe from 'axe-core'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Button } from './Button'
import { FormField } from './FormField'
import { IconButton } from './IconButton'
import { Input } from './Input'
import { RadioGroup } from './Radio'
import { RatingScale } from './RatingScale'
import { Switch } from './Switch'

const axeClean = async (el: Element) => {
  const r = await axe.run(el, { rules: { 'color-contrast': { enabled: false } } })
  expect(r.violations.map((v) => v.id)).toEqual([])
}

describe('Button', () => {
  it('loading: spinner thay icon đầu, giữ nhãn, aria-busy, bỏ qua click', async () => {
    const onClick = vi.fn()
    render(
      <Button loading leadingIcon={<Plus data-testid="lead" />} onClick={onClick}>
        Tạo tin
      </Button>,
    )
    const btn = screen.getByRole('button', { name: /Tạo tin/ })
    expect(btn).toHaveAttribute('aria-busy', 'true')
    expect(screen.queryByTestId('lead')).toBeNull()
    await userEvent.click(btn)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('mặc định type="button"; tên cũ quiet vẫn chạy (call site vùng khoá)', () => {
    render(<Button variant="quiet">Huỷ</Button>)
    expect(screen.getByRole('button', { name: 'Huỷ' })).toHaveAttribute('type', 'button')
  })
})

describe('IconButton', () => {
  it('label bắt buộc thành tên truy cập, tooltip cùng nhãn khi focus bàn phím', async () => {
    render(<IconButton label="Xoá tiêu chí" icon={<Plus />} />)
    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'Xoá tiêu chí' })).toHaveFocus()
    expect(screen.getByRole('tooltip')).toHaveTextContent('Xoá tiêu chí')
  })
})

describe('FormField', () => {
  it('nối label, mô tả, lỗi vào control; bắt buộc ghi bằng chữ', async () => {
    const { container } = render(
      <FormField
        label="Tên tin"
        htmlFor="title"
        description="Tối đa 120 ký tự"
        required
        error="Nhập tên tin"
      >
        <Input id="title" />
      </FormField>,
    )
    const input = screen.getByRole('textbox', { name: /Tên tin/ })
    expect(screen.getByText('(bắt buộc)')).toBeInTheDocument()
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAccessibleDescription(/Nhập tên tin/)
    expect(input).toHaveAccessibleDescription(/Tối đa 120 ký tự/)
    await axeClean(container)
  })
})

describe('Switch', () => {
  it('checkbox native với role="switch", Space bật/tắt', async () => {
    const Demo = () => {
      const [on, setOn] = useState(false)
      return (
        <Switch label="Nhận thông báo" checked={on} onChange={(e) => setOn(e.target.checked)} />
      )
    }
    const { container } = render(<Demo />)
    const sw = screen.getByRole('switch', { name: 'Nhận thông báo' })
    sw.focus()
    await userEvent.keyboard(' ')
    expect(sw).toBeChecked()
    await axeClean(container)
  })
})

describe('RadioGroup', () => {
  it('fieldset/legend, radio native, chọn bằng click nhãn', async () => {
    const { container } = render(
      <RadioGroup
        legend="Hình thức"
        name="mode"
        options={[
          { value: 'onsite', label: 'Tại văn phòng' },
          { value: 'remote', label: 'Từ xa' },
        ]}
        defaultValue="onsite"
      />,
    )
    expect(screen.getByRole('group', { name: 'Hình thức' })).toBeInTheDocument()
    await userEvent.click(screen.getByText('Từ xa'))
    expect(screen.getByRole('radio', { name: 'Từ xa' })).toBeChecked()
    await axeClean(container)
  })
})

describe('RatingScale (VF-10)', () => {
  it('radio native nằm TRONG label, mũi tên chuyển lựa chọn', async () => {
    const onChange = vi.fn()
    const { container } = render(
      <RatingScale legend="Kỹ năng chuyên môn" name="tech" max={5} onChange={onChange} />,
    )
    const radios = screen.getAllByRole('radio')
    expect(radios).toHaveLength(5)
    for (const r of radios) expect(r.closest('label')).not.toBeNull()
    await userEvent.click(radios[2])
    expect(radios[2]).toBeChecked()
    await userEvent.keyboard('{ArrowRight}')
    expect(radios[3]).toBeChecked()
    expect(onChange).toHaveBeenLastCalledWith(4)
    await axeClean(container)
  })
})
