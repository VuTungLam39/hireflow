import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import axe from 'axe-core'
import { useState } from 'react'
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

// Slice 6 — P5-D08
type Person = { id: string; name: string; phone: string; dept: string }
const people: Person[] = [
  { id: '1', name: 'Nguyễn An', phone: '0901', dept: 'Kỹ thuật' },
  { id: '2', name: 'Trần Bình', phone: '0902', dept: 'Kinh doanh' },
  { id: '3', name: 'Lê Chi', phone: '0903', dept: 'Marketing' },
]
const personCols: Column<Person>[] = [
  { key: 'name', header: 'Tên', cell: (r) => r.name, priority: 1, sticky: 'start' },
  { key: 'dept', header: 'Phòng ban', cell: (r) => r.dept, priority: 2 },
  { key: 'phone', header: 'Điện thoại', cell: (r) => r.phone, priority: 4 },
]

function Selectable({
  layout,
  onRowClick = () => {},
  onRowOpen,
}: {
  layout?: 'container'
  onRowClick?: (r: Person) => void
  onRowOpen?: (r: Person) => void
}) {
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set())
  return (
    <DataTable
      columns={personCols}
      data={people}
      rowKey={(r) => r.id}
      rowLabel={(r) => r.name}
      isPending={false}
      isError={false}
      layout={layout}
      onRowClick={onRowClick}
      onRowOpen={onRowOpen}
      selection={{ selected, onChange: setSelected }}
    />
  )
}

const rows = () => screen.getAllByRole('row').slice(1)

describe('DataTable — slice 6', () => {
  it('moves row focus with J/K and the arrow keys, Enter opens', () => {
    const open = vi.fn()
    render(<Selectable layout="container" onRowOpen={open} />)
    const [a, b, c] = rows()
    a.focus()
    fireEvent.keyDown(a, { key: 'j' })
    expect(b).toHaveFocus()
    fireEvent.keyDown(b, { key: 'ArrowDown' })
    expect(c).toHaveFocus()
    fireEvent.keyDown(c, { key: 'k' })
    expect(b).toHaveFocus()
    fireEvent.keyDown(b, { key: 'ArrowUp' })
    expect(a).toHaveFocus()
    fireEvent.keyDown(a, { key: 'Enter' })
    expect(open).toHaveBeenCalledWith(people[0])
  })

  it('Space selects the row in container layout', () => {
    const click = vi.fn()
    render(<Selectable layout="container" onRowClick={click} />)
    fireEvent.keyDown(rows()[1], { key: ' ' })
    expect(rows()[1]).toHaveAttribute('aria-selected', 'true')
    expect(click).not.toHaveBeenCalled()
  })

  it('keeps the old Space behaviour without the opt-in (locked call sites)', () => {
    const click = vi.fn()
    render(<Selectable onRowClick={click} />)
    fireEvent.keyDown(rows()[1], { key: ' ' })
    expect(click).toHaveBeenCalledWith(people[1])
    expect(rows()[1]).toHaveAttribute('aria-selected', 'false')
  })

  it('tags columns by priority, makes the identity sticky and repeats priority-2 cells in its secondary line', () => {
    render(<Selectable layout="container" />)
    const header = (name: string) => screen.getByRole('columnheader', { name })
    expect(header('Điện thoại').className).toContain('@max-[1023.98px]:hidden')
    expect(header('Phòng ban').className).toContain('@max-[719.98px]:hidden')
    expect(header('Tên').className).not.toMatch(/@max-\[[\d.]+px\]:hidden/)
    const identity = within(rows()[0]).getAllByRole('cell')[1]
    expect(identity.className).toContain('sticky')
    expect(identity).toHaveTextContent('Nguyễn An')
    expect(identity).toHaveTextContent('Phòng ban: Kỹ thuật')
  })

  // VF-05
  it('card mode puts the checkbox in a 44 px corner box apart from the name', () => {
    const click = vi.fn()
    render(<Selectable layout="container" onRowClick={click} />)
    const card = screen.getAllByRole('listitem')[0]
    const box = within(card).getByRole('checkbox', { name: 'Chọn Nguyễn An' }).closest('label')!
    expect(box.className).toContain('size-11')
    expect(box.className).toContain('right-0')
    fireEvent.click(within(card).getByText('Nguyễn An'))
    expect(click).toHaveBeenCalledWith(people[0])
    expect(within(card).getByRole('checkbox')).not.toBeChecked()
  })

  it('shows a StaleNotice with Tải lại when a refetch fails over shown data', () => {
    const retry = vi.fn()
    render(
      <DataTable
        columns={personCols}
        data={people}
        rowKey={(r) => r.id}
        isPending={false}
        isError
        onRetry={retry}
        dataUpdatedAt={Date.UTC(2026, 10, 25, 3, 5)}
      />,
    )
    expect(screen.getByRole('status')).toHaveTextContent(/Dữ liệu lúc/)
    fireEvent.click(screen.getByRole('button', { name: 'Tải lại' }))
    expect(retry).toHaveBeenCalled()
  })

  it('has no axe violations', async () => {
    render(<Selectable layout="container" />)
    const r = await axe.run(document.body, {
      rules: { 'color-contrast': { enabled: false }, region: { enabled: false } },
    })
    expect(r.violations.map((v) => v.id)).toEqual([])
  })
})

// Header sticky đè dòng đầu (production 25/11): khung có overflow thì top phải về 0
describe('DataTable sticky header inside a scroll box', () => {
  it.each([undefined, 'container'] as const)(
    'layout=%s: every breakpoint that scrolls the table box resets --sticky-top',
    (layout) => {
      const { container } = render(
        <MemoryRouter>
          <DataTable
            columns={columns}
            data={[{ id: '1', name: 'Nguyễn An' }]}
            rowKey={(r) => r.id}
            isPending={false}
            isError={false}
            layout={layout}
          />
        </MemoryRouter>,
      )
      const box = container.querySelector('table')!.parentElement!
      const classes = [...box.classList]
      const scrolling = classes.filter((c) => c.endsWith('overflow-x-auto'))
      expect(scrolling.length).toBeGreaterThan(0)
      for (const c of scrolling) {
        const prefix = c.slice(0, -'overflow-x-auto'.length)
        expect(classes).toContain(`${prefix}[--sticky-top:0px]`)
      }
    },
  )
})
