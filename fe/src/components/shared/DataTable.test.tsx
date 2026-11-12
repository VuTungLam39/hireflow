import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { DataTable, type Column } from './DataTable'

type Row = { id: string; name: string }
const columns: Column<Row>[] = [{ key: 'name', header: 'Tên', cell: (r) => r.name }]
const table = (props: { data: Row[] | undefined; isError: boolean }) =>
  render(
    <MemoryRouter>
      <DataTable
        columns={columns}
        rowKey={(r) => r.id}
        isPending={false}
        error={new Error('x')}
        {...props}
      />
    </MemoryRouter>,
  )

afterEach(cleanup)

describe('DataTable', () => {
  it('keeps the rows it already has when a background refetch fails', () => {
    table({ data: [{ id: '1', name: 'Nguyễn An' }], isError: true })
    expect(screen.getAllByText('Nguyễn An').length).toBeGreaterThan(0)
    expect(screen.queryByRole('button', { name: 'Thử lại' })).not.toBeInTheDocument()
  })

  it('shows the error state when there is nothing to show yet', () => {
    table({ data: undefined, isError: true })
    expect(screen.getByText('Chưa tải được dữ liệu')).toBeInTheDocument()
  })
})
