import { render, screen } from '@testing-library/react'
import { Pagination } from './Pagination'

const meta = (page: number, totalItems: number, limit = 20) => {
  const totalPages = Math.ceil(totalItems / limit)
  return {
    page,
    limit,
    totalItems,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  }
}

// App Screens 7.8
describe('Pagination', () => {
  it('stays hidden when everything fits on one page', () => {
    render(<Pagination meta={meta(1, 10)} onPageChange={() => {}} />)
    expect(screen.queryByRole('navigation', { name: 'Phân trang' })).not.toBeInTheDocument()
  })

  it('shows the range and page buttons when there is another page', () => {
    render(<Pagination meta={meta(1, 32)} onPageChange={() => {}} />)
    const nav = screen.getByRole('navigation', { name: 'Phân trang' })
    expect(nav).toHaveTextContent('1–20 trong 32')
    expect(screen.getByRole('button', { name: 'Trang sau' })).toBeEnabled()
  })
})
