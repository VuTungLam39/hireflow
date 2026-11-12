import { act, cleanup, render } from '@testing-library/react'
import { createMemoryRouter, Outlet, RouterProvider } from 'react-router'
import { useFocusMainOnNavigate } from './use-focus-main'

function Layout() {
  useFocusMainOnNavigate()
  return (
    <main id="main" tabIndex={-1}>
      <Outlet />
    </main>
  )
}

afterEach(cleanup)

describe('useFocusMainOnNavigate', () => {
  it('moves focus to main after a page change, not on first load or a query change', async () => {
    const router = createMemoryRouter(
      [
        {
          element: <Layout />,
          children: [
            { path: '/a', element: <button>A</button> },
            { path: '/b', element: <p>B</p> },
          ],
        },
      ],
      { initialEntries: ['/a'] },
    )
    const { getByRole } = render(<RouterProvider router={router} />)
    const button = getByRole('button')
    button.focus()

    await act(() => router.navigate('/a?xem=1'))
    expect(document.activeElement).toBe(button)

    await act(() => router.navigate('/b'))
    expect(document.activeElement).toBe(document.getElementById('main'))
  })
})
