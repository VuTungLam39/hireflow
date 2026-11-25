import { render, screen } from '@testing-library/react'
import { Tabs, TabsPanel } from './Tabs'

describe('Tabs', () => {
  it('P3-05: screen readers hear the count apart from the label', () => {
    render(
      <Tabs
        tabs={[
          { id: 'cv', label: 'Hồ sơ' },
          { id: 'iv', label: 'Phỏng vấn', count: 1 },
        ]}
        value="cv"
        onChange={() => {}}
      >
        <TabsPanel value="cv">Nội dung hồ sơ</TabsPanel>
        <TabsPanel value="iv">Nội dung phỏng vấn</TabsPanel>
      </Tabs>,
    )
    expect(screen.getByRole('tab', { name: 'Phỏng vấn (1)' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Hồ sơ' })).toBeInTheDocument()
    // P5-D11b: Radix nối tab ↔ panel hai chiều
    const panel = screen.getByRole('tabpanel', { name: 'Hồ sơ' })
    expect(screen.getByRole('tab', { name: 'Hồ sơ' })).toHaveAttribute('aria-controls', panel.id)
  })
})
