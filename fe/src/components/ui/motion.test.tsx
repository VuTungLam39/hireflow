import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { AlertDialog } from './AlertDialog'
import { Button } from './Button'
import { Dialog } from './Dialog'
import { DropdownMenu } from './DropdownMenu'
import { NavSheet } from './NavSheet'
import { Popover } from './Popover'
import { Sheet } from './Sheet'

const noop = () => {}
const overlay = () => document.querySelector('[class*="bg-ink/40"]')!

// M-04, M-05
describe('overlay motion', () => {
  it.each([
    [
      'Dialog',
      'dialog',
      <Dialog open onClose={noop} title="T">
        x
      </Dialog>,
    ],
    [
      'AlertDialog',
      'alertdialog',
      <AlertDialog open onClose={noop} onConfirm={noop} title="T" confirmLabel="OK" />,
    ],
  ])('%s: panel floats in, overlay fades 150 ms', (_name, role, element) => {
    render(element)
    expect(screen.getByRole(role).className).toContain('animate-float-in')
    expect(overlay().className).toContain('animate-overlay-in')
  })

  it.each([
    [
      'Sheet',
      <Sheet open onOpenChange={noop} title="T" detailHref="/x">
        x
      </Sheet>,
    ],
    [
      'NavSheet',
      <NavSheet open onOpenChange={noop} title="T">
        x
      </NavSheet>,
    ],
  ])('%s: overlay fades with the 200 ms slide', (_name, element) => {
    render(<MemoryRouter>{element}</MemoryRouter>)
    expect(overlay().className).toContain('animate-overlay-sheet')
  })
})

// M-06
describe('menu and popover grow from their trigger', () => {
  it('DropdownMenu', async () => {
    render(
      <MemoryRouter>
        <DropdownMenu trigger={<Button>Mở</Button>} items={[{ label: 'A', onSelect: noop }]} />
      </MemoryRouter>,
    )
    await userEvent.setup().click(screen.getByRole('button', { name: 'Mở' }))
    expect(screen.getByRole('menu').className).toContain(
      'origin-(--radix-dropdown-menu-content-transform-origin)',
    )
  })

  it('Popover', () => {
    render(
      <Popover open onOpenChange={noop} label="P" trigger={(p) => <Button {...p}>Mở</Button>}>
        x
      </Popover>,
    )
    expect(document.querySelector('.animate-float-in')!.className).toContain(
      'origin-(--radix-popover-content-transform-origin)',
    )
  })
})
