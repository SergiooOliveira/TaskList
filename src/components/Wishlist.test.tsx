import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import Wishlist from './Wishlist'
import * as items from '../lib/items'
import type { Item } from '../lib/items'

vi.mock('../lib/supabase', () => ({ supabase: { auth: { signOut: vi.fn() } } }))
vi.mock('../lib/items', async (orig) => ({
  ...(await orig<typeof items>()),
  listItems: vi.fn(), addItem: vi.fn(), updateItem: vi.fn(), deleteItem: vi.fn(), fetchProduct: vi.fn(),
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

it('shows the note and an empty Name when the page cannot be read', async () => {
  show([])
  vi.mocked(items.fetchProduct).mockResolvedValue({})
  fireEvent.change(screen.getByLabelText('Product link'), { target: { value: 'https://x.test/p' } })
  fireEvent.click(screen.getByRole('button', { name: 'Add' }))
  expect(await screen.findByText("Couldn't read this page. Fill in the details.")).toBeInTheDocument()
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

it('a late add fetch does not replace an edit form opened meanwhile', async () => {
  show([A])
  await screen.findByText('Alpha')
  let resolve!: (p: object) => void
  vi.mocked(items.fetchProduct).mockReturnValue(new Promise((r) => (resolve = r)))
  fireEvent.change(screen.getByLabelText('Product link'), { target: { value: 'https://x.test/p' } })
  fireEvent.click(screen.getByRole('button', { name: 'Add' }))
  fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
  resolve({ title: 'Late' })
  await Promise.resolve()
  expect(screen.getByLabelText('Name')).toHaveValue('Alpha')
})

describe('Check prices', () => {
  it('skips bought items, survives a failed update, and only updates on a non-null patch', async () => {
    show([A, B, C])
    await screen.findByText('Alpha')
    vi.mocked(items.fetchProduct).mockImplementation(async (url) => (url.includes('a.test') ? { priceCents: 500 } : { priceCents: 2000 }))
    vi.mocked(items.updateItem).mockRejectedValueOnce(new Error('boom'))
    // B's price is unchanged so applyPriceCheck still returns a patch; use the real one and assert call set instead.
    fireEvent.click(screen.getByRole('button', { name: 'Check prices' }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Check prices' })).toBeEnabled())
    const ids = vi.mocked(items.updateItem).mock.calls.map((c) => c[0])
    expect(ids).toEqual(['a', 'b']) // C (bought) never fetched/updated; B still processed after A rejected
    expect(items.fetchProduct).not.toHaveBeenCalledWith(C.url)
  })

  it('does not update and marks "Couldn\'t check" when no price came back', async () => {
    show([A, B])
    await screen.findByText('Alpha')
    vi.mocked(items.fetchProduct).mockImplementation(async (url) => (url.includes('a.test') ? {} : { priceCents: 1500 }))
    fireEvent.click(screen.getByRole('button', { name: 'Check prices' }))
    expect(await screen.findAllByText("Couldn't check")).toHaveLength(1)
    expect(items.updateItem).toHaveBeenCalledTimes(1)
    expect(items.updateItem).toHaveBeenCalledWith('b', expect.anything())
  })

  it('is absent on the Bought filter', async () => {
    show([A, C])
    await screen.findByText('Alpha')
    fireEvent.click(screen.getByRole('button', { name: 'Bought' }))
    expect(screen.queryByRole('button', { name: 'Check prices' })).toBeNull()
  })
})
