import { render, screen } from '@testing-library/react'
import { Tabs } from './Tabs'

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
      />,
    )
    expect(screen.getByRole('tab', { name: 'Phỏng vấn (1)' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Hồ sơ' })).toBeInTheDocument()
  })
})
