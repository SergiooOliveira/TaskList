import { fireEvent, render, screen } from '@testing-library/react'
import Home from './Home'
import * as items from '../lib/items'
import { supabase } from '../lib/supabase'
import type { Item } from '../lib/items'

vi.mock('../lib/supabase', () => ({ supabase: { auth: { signOut: vi.fn() } } }))
vi.mock('../lib/items', async (orig) => ({ ...(await orig<typeof items>()), listItems: vi.fn() }))

const mk = (collection: Item['collection'], bought: boolean) => ({ collection, bought }) as Item

it('shows counts as links and signs out', async () => {
  vi.mocked(items.listItems).mockResolvedValue([
    mk(null, false), mk(null, false), mk('book', true), mk('book', true), mk('book', true),
    mk('book', false), mk('manga', true), mk('manga', true),
  ])
  render(<Home />)
  expect(await screen.findByText('2 wanted')).toBeInTheDocument()
  expect(screen.getByText('5 owned · 1 wanted')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /Wishlist/ })).toHaveAttribute('href', '#/wishlist')
  expect(screen.getByRole('link', { name: /Library/ })).toHaveAttribute('href', '#/library/book/shelf')
  fireEvent.click(screen.getByRole('button', { name: 'Sign out' }))
  expect(supabase.auth.signOut).toHaveBeenCalled()
})
