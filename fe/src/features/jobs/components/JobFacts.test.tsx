import { render, screen } from '@testing-library/react'
import { JobFacts, type JobFactsData } from './JobFacts'

describe('JobFacts', () => {
  it('renders the facts candidates need, with the hidden salary left out', () => {
    render(
      <JobFacts
        job={{
          salary: null,
          level: 'SENIOR',
          employmentType: 'FULL_TIME',
          workMode: 'REMOTE',
          headcount: 3,
          deadline: null,
        }}
      />,
    )
    expect(screen.queryByText('Mức lương')).not.toBeInTheDocument()
    expect(screen.getByText('Senior')).toBeInTheDocument()
    expect(screen.getByText('Từ xa')).toBeInTheDocument()
    expect(screen.getByText('3 người')).toBeInTheDocument()
  })

  it('does not crash on a payload from an API that predates these fields (FE deployed before BE)', () => {
    const { container } = render(<JobFacts job={{} as JobFactsData} />)
    expect(container.textContent).not.toMatch(/undefined|NaN/)
  })
})
