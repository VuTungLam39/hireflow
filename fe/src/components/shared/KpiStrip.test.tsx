import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { KpiStrip } from './KpiStrip'

// RR-13 · F-21
describe('KpiStrip zero state', () => {
  it('explains a zero and mutes the figure; keeps compare for other values', () => {
    render(
      <MemoryRouter>
        <KpiStrip
          items={[
            {
              label: 'Hồ sơ tuần này',
              value: 0,
              compare: 'bằng tuần trước',
              zero: 'Chưa có hồ sơ',
            },
            { label: 'Đang phỏng vấn', value: 3, compare: '1 buổi hôm nay', zero: 'Không có' },
          ]}
        />
      </MemoryRouter>,
    )
    expect(screen.getByText('Chưa có hồ sơ')).toBeInTheDocument()
    expect(screen.queryByText('bằng tuần trước')).toBeNull()
    expect(screen.getByText('0')).toHaveClass('text-ink-muted')
    expect(screen.getByText('1 buổi hôm nay')).toBeInTheDocument()
    expect(screen.queryByText('Không có')).toBeNull()
  })
})
