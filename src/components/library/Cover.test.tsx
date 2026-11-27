import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { Cover } from './BookRow'
import type { Item } from '../../lib/items'

vi.mock('../../lib/supabase', () => ({ supabase: {} }))

const item = (image_url: string | null) => ({ id: 'a', title: 'Lendários', image_url }) as Item
afterEach(cleanup)

it('shows a no-cover placeholder with the title when there is no image', () => {
  const { container } = render(<Cover item={item(null)} />)
  expect(container.querySelector('img')).toBeNull()
  expect(container.querySelector('.cover.nocover svg')).toBeInTheDocument()
  expect(container.querySelector('.nocover')).toHaveAttribute('data-title', 'Lendários') // CSS draws it
})

it('falls back to the placeholder when the image fails to load', () => {
  const { container } = render(<Cover item={item('https://x.test/c.jpg')} />)
  fireEvent.error(container.querySelector('img')!)
  expect(container.querySelector('img')).toBeNull()
  expect(container.querySelector('.nocover')).toHaveAttribute('data-title', 'Lendários')
})

it('names the cover for screen readers only when given alt', () => {
  render(<Cover item={item(null)} alt="Lendários" />)
  expect(screen.getByRole('img', { name: 'Lendários' })).toBeInTheDocument()
})
