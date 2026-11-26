import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import Wishlist from './Wishlist'
import * as items from '../lib/items'
import type { Item } from '../lib/items'

vi.mock('../lib/supabase', () => ({ supabase: { auth: { signOut: vi.fn() } } }))
vi.mock('../lib/items', async (orig) => ({
  ...(await orig<typeof items>()),
  listItems: vi.fn(), addItem: vi.fn(), updateItem: vi.fn(), deleteItem: vi.fn(),
}))

const mk = (id: string, title: string, o: Partial<Item> = {}) =>
  ({ id, url: `https://${id}.test/p`, title, image_url: null, store: `${id}.test`, price_cents: 1000, previous_price_cents: null, bought: false, collection: null, ...o }) as Item
const A = mk('a', 'Alpha', { price_cents: 1000 }), B = mk('b', 'Beta', { price_cents: 2000 }), C = mk('c', 'Gamma', { bought: true })

const show = (list: Item[]) => {
  vi.mocked(items.listItems).mockResolvedValue(list)
  render(<Wishlist />)
}
beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(items.updateItem).mockImplementation(async (id, patch) => ({ ...[A, B, C].find((i) => i.id === id)!, ...patch }) as Item)
})

it('Add opens an empty modal', async () => {
  show([])
  fireEvent.click(await screen.findByRole('button', { name: 'Add' }))
  expect(screen.getByRole('dialog', { name: 'Add item' })).toBeInTheDocument()
  expect(screen.getByLabelText('Link')).toHaveValue('')
  expect(screen.getByLabelText('Name')).toHaveValue('')
})

it('Close dismisses the modal without saving', async () => {
  show([A])
  fireEvent.click(await screen.findByRole('button', { name: 'Edit' }))
  fireEvent.click(screen.getByRole('button', { name: 'Close' }))
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(items.updateItem).not.toHaveBeenCalled()
})

it('search filters the list by name', async () => {
  show([A, B])
  await screen.findByText('Alpha')
  fireEvent.change(screen.getByLabelText('Search'), { target: { value: 'bet' } })
  expect(screen.queryByText('Alpha')).toBeNull()
  expect(screen.getByText('Beta')).toBeInTheDocument()
  fireEvent.change(screen.getByLabelText('Search'), { target: { value: 'zzz' } })
  expect(screen.getByText('No items match.')).toBeInTheDocument()
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
  fireEvent.click(screen.getByRole('button', { name: 'Add' }))
  fireEvent.change(screen.getByLabelText('Link'), { target: { value: 'https://x.test/p' } })
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Newbie' } })
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

describe('type filter', () => {
  const book = mk('k', 'Dune', { category: 'Books' }), vinyl = mk('v', 'Kind of Blue', { category: 'Vinyls' }), alsoBook = mk('m', 'Emma', { category: 'books' })
  it('shows one chip per type (case-insensitive) and filters by it', async () => {
    show([book, vinyl, alsoBook, A])
    await screen.findByText('Dune')
    const chips = within(screen.getByRole('group', { name: 'Filter by type' })).getAllByRole('button').map((b) => b.textContent)
    expect(chips).toEqual(['All', 'Books', 'Vinyls'])
    fireEvent.click(screen.getByRole('button', { name: 'Books' }))
    expect(screen.getByText('Dune')).toBeInTheDocument()
    expect(screen.getByText('Emma')).toBeInTheDocument()
    expect(screen.queryByText('Kind of Blue')).toBeNull()
    expect(screen.queryByText('Alpha')).toBeNull()
  })
  it('hides the chips when no item has a type', async () => {
    show([A])
    await screen.findByText('Alpha')
    expect(screen.queryByRole('group', { name: 'Filter by type' })).toBeNull()
  })
  it('falls back to All when the selected type disappears', async () => {
    show([book, A])
    await screen.findByText('Dune')
    fireEvent.click(screen.getByRole('button', { name: 'Books' }))
    vi.mocked(items.updateItem).mockResolvedValueOnce({ ...book, category: null })
    fireEvent.click(screen.getAllByRole('button', { name: 'Edit' })[0])
    fireEvent.change(screen.getByLabelText('Type'), { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByText('Alpha')).toBeInTheDocument()
    expect(screen.getByText('Dune')).toBeInTheDocument()
  })
})

it('never lists library items', async () => {
  show([A, mk('k', 'Dune', { collection: 'book' }), mk('l', 'Akira', { collection: 'manga', bought: true })])
  await screen.findByText('Alpha')
  expect(screen.queryByText('Dune')).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Bought' }))
  expect(screen.queryByText('Akira')).toBeNull()
})
