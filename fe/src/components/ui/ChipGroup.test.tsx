import { fireEvent, render, screen, within } from '@testing-library/react'
import { useState } from 'react'
import { ChipGroup } from './ChipGroup'

const options = Array.from({ length: 9 }, (_, i) => ({
  value: `d${i}`,
  label: `Phòng ${i}`,
  count: 9 - i,
}))

function Harness() {
  const [value, setValue] = useState<string | undefined>()
  return (
    <ChipGroup
      label="Phòng ban"
      allLabel="Tất cả"
      allCount={45}
      options={options}
      value={value}
      onChange={setValue}
      limit={5}
      moreLabel={(n) => `+${n} phòng ban khác`}
    />
  )
}

describe('ChipGroup', () => {
  it('shows the first options with counts and folds the rest behind “+N”', () => {
    render(<Harness />)
    const group = screen.getByRole('radiogroup', { name: 'Phòng ban' })
    expect(within(group).getAllByRole('radio')).toHaveLength(6)
    expect(within(group).getByRole('radio', { name: 'Phòng 0 9' })).toBeInTheDocument()

    fireEvent.click(within(group).getByRole('button', { name: '+4 phòng ban khác' }))
    fireEvent.click(screen.getByRole('menuitemradio', { name: 'Phòng 8 1' }))

    expect(
      within(group).getByRole('radio', { name: 'Phòng 8 1', checked: true }),
    ).toBeInTheDocument()
    expect(within(group).getAllByRole('radio')).toHaveLength(6)
    expect(within(group).getByRole('button', { name: '+4 phòng ban khác' })).toBeInTheDocument()
  })

  it('does not fold when only one option would be hidden', () => {
    render(
      <ChipGroup
        label="Ít"
        options={options.slice(0, 6)}
        value={undefined}
        onChange={() => {}}
        limit={5}
      />,
    )
    expect(screen.getAllByRole('radio')).toHaveLength(7)
    expect(screen.queryByRole('button', { name: /khác/ })).not.toBeInTheDocument()
  })
})
