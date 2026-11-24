import { fireEvent, render, screen } from '@testing-library/react'
import ItemRow from './ItemRow'
import type { Item } from '../lib/items'

vi.mock('../lib/supabase', () => ({ supabase: {} }))

const item = { id: '1', url: 'https://x.test/a', title: 'Camera', image_url: 'https://x.test/a.jpg', store: 'x.test',
  price_cents: 29999, previous_price_cents: 37999, bought: false } as Item
const show = (i: Partial<Item> = {}, onToggleBought = vi.fn()) =>
  render(<ItemRow item={{ ...item, ...i }} onToggleBought={onToggleBought} onEdit={vi.fn()} onDelete={vi.fn()} />)

it('shows the drop badge and old price', () => {
  const { container } = show()
  expect(screen.getByText('−21%')).toBeInTheDocument()
  expect(container.querySelector('s')).toHaveTextContent(/379,99/)
})
it('shows no badge without a previous price', () => {
  show({ previous_price_cents: null })
  expect(screen.queryByText(/−/)).toBeNull()
})
it('uses a placeholder without an image', () => {
  const { container } = show({ image_url: null })
  expect(container.querySelector('img')).toBeNull()
  expect(screen.getByText('C')).toBeInTheDocument()
})
it('swaps a broken image for the placeholder', () => {
  const { container } = show()
  fireEvent.error(container.querySelector('img')!)
  expect(container.querySelector('img')).toBeNull()
  expect(screen.getByText('C')).toBeInTheDocument()
})
it('toggles bought', () => {
  const fn = vi.fn()
  show({}, fn)
  fireEvent.click(screen.getByRole('checkbox', { name: 'Bought' }))
  expect(fn).toHaveBeenCalledWith(expect.objectContaining({ id: '1' }))
})
it('confirms delete inline', () => {
  const onDelete = vi.fn()
  render(<ItemRow item={item} onToggleBought={vi.fn()} onEdit={vi.fn()} onDelete={onDelete} />)
  fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
  expect(onDelete).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: 'Yes' }))
  expect(onDelete).toHaveBeenCalledWith(item)
})
it('retries the image after image_url changes', () => {
  const { container, rerender } = show()
  fireEvent.error(container.querySelector('img')!)
  rerender(<ItemRow item={{ ...item, image_url: 'https://x.test/b.jpg' }} onToggleBought={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />)
  expect(container.querySelector('img')).toHaveAttribute('src', 'https://x.test/b.jpg')
})
