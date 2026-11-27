import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CommandPalette, type CommandGroup } from './CommandPalette'

const item = (id: string, onSelect = vi.fn()) => ({ id, label: id, onSelect })
const group = (...items: ReturnType<typeof item>[]): CommandGroup[] => [{ label: 'Kết quả', items }]

const palette = (groups: CommandGroup[], query = '') => (
  <CommandPalette open onClose={vi.fn()} query={query} onQueryChange={vi.fn()} groups={groups} />
)
const input = () => screen.getByRole('combobox')
const selected = () =>
  within(screen.getByRole('listbox'))
    .getAllByRole('option')
    .filter((o) => o.getAttribute('aria-selected') === 'true')
    .map((o) => o.textContent)

describe('CommandPalette', () => {
  // UI-23
  it('moves with the dialog layer when the dialog under it is replaced', async () => {
    const mount = (id: string) => {
      const dialog = document.body.appendChild(document.createElement('dialog'))
      dialog.setAttribute('open', '')
      const layer = dialog.appendChild(document.createElement('div'))
      layer.id = id
      layer.setAttribute('data-layer', '')
      return dialog
    }
    const loading = mount('loading')
    onTestFinished(() => document.querySelectorAll('dialog').forEach((d) => d.remove()))
    render(palette(group(item('a'))))
    expect(input().closest('[data-layer]')?.id).toBe('loading')

    loading.remove()
    mount('ready')
    await waitFor(() => expect(input().closest('[data-layer]')?.id).toBe('ready'))
  })

  it('selects the first result that arrives after typing, so Enter opens it', () => {
    const first = vi.fn()
    const view = render(palette(group(item('Trang'))))
    view.rerender(palette(group(), 'Thắng'))
    view.rerender(palette(group(item('Thắng', first), item('Thắng 2')), 'Thắng'))

    expect(selected()).toEqual(['Thắng'])
    fireEvent.keyDown(input(), { key: 'Enter' })
    expect(first).toHaveBeenCalledTimes(1)
  })

  it('moves the highlight to a result that arrives above the current one', () => {
    const view = render(palette(group(item('Trang'))))
    view.rerender(palette(group(item('Người'), item('Trang'))))

    expect(selected()).toEqual(['Người'])
  })

  it('keeps the arrow-key choice when more results arrive', () => {
    const view = render(palette(group(item('a'), item('b'))))
    fireEvent.keyDown(input(), { key: 'ArrowDown' })
    view.rerender(palette(group(item('mới'), item('a'), item('b'))))

    expect(selected()).toEqual(['b'])
  })
})
