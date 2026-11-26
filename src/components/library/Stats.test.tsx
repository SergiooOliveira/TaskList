import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import Stats from './Stats'
import * as items from '../../lib/items'
import * as reads from '../../lib/reads'
import type { Item } from '../../lib/items'

vi.mock('../../lib/supabase', () => ({ supabase: {} }))
vi.mock('../../lib/items', async (orig) => ({ ...(await orig<typeof items>()), listItems: vi.fn() }))
vi.mock('../../lib/reads', async (orig) => ({ ...(await orig<typeof reads>()), listReads: vi.fn() }))

const book = (id: string, o: Partial<Item> = {}): Item => ({
  id, user_id: 'u', url: null, title: id, image_url: null, store: 'Bertrand', price_cents: 1000, previous_price_cents: null,
  price_checked_at: null, category: null, bought: true, created_at: '', collection: 'book', author: null, series: null,
  form: null, language: null, series_number: null, pages: 100, rating: null, genres: null, bought_on: '2026-03-01', ...o,
})

beforeEach(() => {
  vi.mocked(items.listItems).mockResolvedValue([book('a'), book('b', { bought_on: '2025-03-01', price_cents: 2000 }), book('old', { bought_on: null, pages: 181 })])
  vi.mocked(reads.listReads).mockResolvedValue([
    { id: '1', item_id: 'a', started_on: null, finished_on: '2026-02-01', before_app: false },
    { id: '2', item_id: 'old', started_on: null, finished_on: null, before_app: true },
    { id: '3', item_id: 'old', started_on: null, finished_on: '2024-05-01', before_app: false },
  ])
})
afterEach(cleanup)

it('month chart exposes month names and counts as text', async () => {
  render(<Stats />)
  fireEvent.change(await screen.findByLabelText('Year'), { target: { value: '2026' } })
  const list = screen.getByRole('list', { name: 'Books finished per month' })
  expect(list.textContent).toContain('February: 1')
  expect(list.textContent).toContain('November: 0')
})

it('year picker re-renders totals; All time shows Before the app', async () => {
  render(<Stats />)
  await screen.findByRole('region', { name: 'Reading' })
  expect(screen.getByLabelText('Before the app')).toBeTruthy()
  fireEvent.change(screen.getByLabelText('Year'), { target: { value: '2025' } })
  await waitFor(() => expect(screen.getByText('No books finished in 2025 yet.')).toBeTruthy())
  expect(screen.queryByLabelText('Before the app')).toBeNull()
  expect(screen.getAllByText(/20,00|20\.00/).length).toBeGreaterThan(0)
  fireEvent.change(screen.getByLabelText('Year'), { target: { value: '2024' } })
  expect(screen.getByText('Nothing bought in 2024 yet.')).toBeTruthy()
})

it('back link returns to the library kind the user came from', async () => {
  sessionStorage.setItem('libKind', 'manga')
  render(<Stats />)
  expect(screen.getByRole('link', { name: '‹ Library' })).toHaveAttribute('href', '#/library/manga/shelf')
  await screen.findByLabelText('Year')
  sessionStorage.clear()
})
