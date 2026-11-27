import { fireEvent, render, screen } from '@testing-library/react'
import Home from './Home'
import * as items from '../lib/items'
import { supabase } from '../lib/supabase'
import type { Item } from '../lib/items'

vi.mock('../lib/supabase', () => ({ supabase: { auth: { signOut: vi.fn() } } }))
vi.mock('../lib/items', async (orig) => ({ ...(await orig<typeof items>()), listItems: vi.fn() }))

const mk = (collection: Item['collection'], bought: boolean) => ({ collection, bought }) as Item

it('shows a card per collection with its count and link, and signs out', async () => {
  vi.mocked(items.listItems).mockResolvedValue([
    mk(null, false), mk(null, false), mk(null, true), mk('book', true), mk('book', true), mk('book', true),
    mk('book', false), mk('manga', true), mk('manga', true),
  ])
  render(<Home />)
  const card = (name: RegExp) => screen.getByRole('link', { name })
  expect(await screen.findByText('2 wanted')).toBeInTheDocument()
  expect(card(/^Wishlist/)).toHaveAttribute('href', '#/wishlist')
  expect(card(/^Books/)).toHaveAttribute('href', '#/library/book/shelf')
  expect(card(/^Books/)).toHaveTextContent('3 owned · 1 wanted')
  expect(card(/^Manga/)).toHaveAttribute('href', '#/library/manga/shelf')
  expect(card(/^Manga/)).toHaveTextContent('2 owned · 0 wanted')
  expect(card(/^Stats/)).toHaveAttribute('href', '#/library/stats')
  expect(card(/^Stats/)).toHaveTextContent('Reading & spending')
  fireEvent.click(screen.getByRole('button', { name: 'Sign out' }))
  expect(supabase.auth.signOut).toHaveBeenCalled()
})

it('shows … while loading, not zeros', () => {
  vi.mocked(items.listItems).mockReturnValue(new Promise(() => {}))
  render(<Home />)
  expect(screen.getAllByText('…')).toHaveLength(3)
  expect(screen.queryByText(/0 wanted/)).toBeNull()
})

it('shows an error with retry when loading fails', async () => {
  vi.mocked(items.listItems).mockRejectedValueOnce(new Error('x')).mockResolvedValue([])
  render(<Home />)
  expect(await screen.findByText("Couldn't load your collections.")).toBeInTheDocument()
  expect(screen.queryByText(/wanted/)).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
  expect(await screen.findByText('0 wanted')).toBeInTheDocument()
})
