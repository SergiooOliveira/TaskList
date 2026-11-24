import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import Wishlist from './Wishlist'
import * as items from '../lib/items'
import type { Item } from '../lib/items'

vi.mock('../lib/supabase', () => ({ supabase: { auth: { signOut: vi.fn() } } }))
vi.mock('../lib/items', async (orig) => ({
  ...(await orig<typeof items>()),
  listItems: vi.fn(), addItem: vi.fn(), updateItem: vi.fn(), deleteItem: vi.fn(),
}))

const mk = (id: string, title: string, o: Partial<Item> = {}) =>
  ({ id, url: `https://${id}.test/p`, title, image_url: null, store: `${id}.test`, price_cents: 1000, previous_price_cents: null, bought: false, ...o }) as Item
const A = mk('a', 'Alpha', { price_cents: 1000 }), B = mk('b', 'Beta', { price_cents: 2000 }), C = mk('c', 'Gamma', { bought: true })

const show = (list: Item[]) => {
  vi.mocked(items.listItems).mockResolvedValue(list)
  render(<Wishlist session={{} as never} />)
}
beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(items.updateItem).mockImplementation(async (id, patch) => ({ ...[A, B, C].find((i) => i.id === id)!, ...patch }) as Item)
})

it('Add opens the form with the link filled in and the other fields empty', async () => {
  show([])
  fireEvent.change(screen.getByLabelText('Product link'), { target: { value: 'worten.pt/p/1' } })
  fireEvent.click(screen.getByRole('button', { name: 'Add' }))
  expect(await screen.findByLabelText('Link')).toHaveValue('https://worten.pt/p/1')
  expect(screen.getByLabelText('Name')).toHaveValue('')
})

it('editing item B after item A saves B with B\'s values', async () => {
  show([A, B])
  await screen.findByText('Alpha')
  const edits = screen.getAllByRole('button', { name: 'Edit' })
  fireEvent.click(edits[0])
  fireEvent.click(screen.getAllByRole('button', { name: 'Edit' })[1])
  expect(screen.getByLabelText('Name')).toHaveValue('Beta')
  fireEvent.click(screen.getByRole('button', { name: 'Save' }))
  await waitFor(() => expect(items.updateItem).toHaveBeenCalledWith('b', expect.objectContaining({ title: 'Beta', price_cents: 2000 })))
})

it('has no Check prices button', async () => {
  show([A])
  await screen.findByText('Alpha')
  expect(screen.queryByRole('button', { name: 'Check prices' })).toBeNull()
})

it('after adding, switches to Not bought so the new item shows', async () => {
  show([C])
  fireEvent.click(await screen.findByRole('button', { name: 'Bought' }))
  vi.mocked(items.addItem).mockResolvedValue(mk('n', 'Newbie'))
  fireEvent.change(screen.getByLabelText('Product link'), { target: { value: 'https://x.test/p' } })
  fireEvent.click(screen.getByRole('button', { name: 'Add' }))
  fireEvent.change(await screen.findByLabelText('Name'), { target: { value: 'Newbie' } })
  fireEvent.click(await screen.findByRole('button', { name: 'Save' }))
  expect(await screen.findByText('Newbie')).toBeInTheDocument()
})

it('a lower price typed by hand keeps the old one as the drop; a higher one clears it; other edits leave it', async () => {
  show([A])
  await screen.findByText('Alpha')
  fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
  fireEvent.click(screen.getByRole('button', { name: 'Save' }))
  await waitFor(() => expect(items.updateItem).toHaveBeenCalledTimes(1))
  expect(vi.mocked(items.updateItem).mock.calls[0][1]).not.toHaveProperty('previous_price_cents')

  fireEvent.click(await screen.findByRole('button', { name: 'Edit' }))
  fireEvent.change(screen.getByLabelText(/price/i), { target: { value: '9,99' } })
  fireEvent.click(screen.getByRole('button', { name: 'Save' }))
  await waitFor(() => expect(items.updateItem).toHaveBeenLastCalledWith('a', expect.objectContaining({ price_cents: 999, previous_price_cents: 1000 })))

  fireEvent.click(await screen.findByRole('button', { name: 'Edit' }))
  fireEvent.change(screen.getByLabelText(/price/i), { target: { value: '12,00' } })
  fireEvent.click(screen.getByRole('button', { name: 'Save' }))
  await waitFor(() => expect(items.updateItem).toHaveBeenLastCalledWith('a', expect.objectContaining({ price_cents: 1200, previous_price_cents: null })))
})
