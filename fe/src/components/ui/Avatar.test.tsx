import { render, screen } from '@testing-library/react'
import { Avatar } from './Avatar'

describe('Avatar', () => {
  it.each([
    ['Nguyễn Thu Hà', 'NH'],
    ['Lan', 'LA'],
    ['  Trần   Đức Long ', 'TL'],
  ])('%s → %s', (name, expected) => {
    render(<Avatar name={name} />)
    expect(screen.getByText(expected)).toBeInTheDocument()
  })
})
