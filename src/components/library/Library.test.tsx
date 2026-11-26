import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import Library from './Library'
import * as items from '../../lib/items'
import * as reads from '../../lib/reads'
import type { Item } from '../../lib/items'
import type { Read } from '../../lib/reads'

vi.mock('../../lib/supabase', () => ({ supabase: {} }))
vi.mock('../../lib/items', async (orig) => ({ ...(await orig<typeof items>()), listItems: vi.fn(), updateItem: vi.fn(), addItem: vi.fn() }))
vi.mock('../../lib/reads', async (orig) => ({ ...(await orig<typeof reads>()), listReads: vi.fn(), startRead: vi.fn(), finishRead: vi.fn() }))

const book = (id: string, title: string, o: Partial<Item> = {}): Item => ({
  id, user_id: 'u', url: null, title, image_url: null, store: null, price_cents: null, previous_price_cents: null,
  price_checked_at: null, category: null, bought: true, created_at: '', collection: 'book', author: null, series: null,
  form: 'Prose', language: null, series_number: null, pages: null, rating: null, genres: null, bought_on: null, summary: null, ...o,
})
const rd = (id: string, item_id: string, o: Partial<Read> = {}): Read => ({ id, item_id, started_on: null, finished_on: null, before_app: false, ...o })

// Notion-shaped: 12 owned books (2 being read), 2 wanted.
const lb = { series: 'The Legendborn Cycle', author: 'Tracy Deonn' }
const fixture: Item[] = [
  book('lend', 'Lendários', { ...lb, series_number: 1 }),
  book('marca', 'Marca de Sangue', { ...lb, series_number: 2, bought: false, price_cents: 2490, store: 'Bertrand' }),
  book('linh', 'Linhagens de Poder', { ...lb, series_number: 3, bought: false, price_cents: 2590, store: 'Bertrand' }),
  book('temp', 'A templária', { author: 'Maria João Fialho Gouveia' }),
  ...[1, 2, 3, 4].map((n) => book(`hp${n}`, `HP ${n}`, { series: 'Harry Potter', series_number: n })),
  book('c1', 'Conspiração 1', { series: 'Conspiração 365', series_number: 1 }),
  book('c2', 'Conspiração 2', { series: 'Conspiração 365', series_number: 2 }),
  book('f1', 'As feras 1', { series: 'As feras futebol clube', series_number: 1 }),
  book('f2', 'As feras 2', { series: 'As feras futebol clube', series_number: 2 }),
  book('forj', 'Forjados pelo Destino', { series: 'Steelborn', series_number: 1 }),
  book('gen', 'O General', { series: 'Cherub', series_number: 10, rating: 5, form: 'Poetry' }),
  book('ds1', 'Demon Slayer 1', { collection: 'manga', series: 'Demon Slayer', series_number: 1, form: 'Shōnen' }),
  book('ds2', 'Demon Slayer 2', { collection: 'manga', series: 'Demon Slayer', series_number: 2, bought: false, form: 'Shōnen' }),
  book('gen-item', 'Headphones', { collection: null }),
]
const fixtureReads: Read[] = [
  rd('r-lend', 'lend', { started_on: '2026-06-09' }),
  rd('r-temp', 'temp', { started_on: '2026-06-10' }),
  ...['hp1', 'hp2', 'hp3', 'hp4', 'c1', 'c2', 'f1', 'f2'].map((i) => rd(`r-${i}`, i, { before_app: true })),
  rd('r-gen', 'gen', { started_on: '2026-01-01', finished_on: '2026-02-01' }),
]
const today = reads.todayISO()

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(items.listItems).mockResolvedValue(fixture)
  vi.mocked(reads.listReads).mockResolvedValue(fixtureReads)
  vi.mocked(items.updateItem).mockImplementation(async (id, patch) => ({ ...fixture.find((i) => i.id === id)!, ...patch }))
})

const row = (title: string) => screen.getByText(title).closest('.book') as HTMLElement

it('books shelf shows the sections and the switch counts', async () => {
  render(<Library kind="book" view="shelf" />)
  expect(await screen.findByRole('heading', { name: 'READING NOW' })).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'SERIES' })).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'SINGLE BOOKS' })).toBeInTheDocument()
  const show = screen.getByRole('group', { name: 'Show' })
  expect(within(show).getByRole('link', { name: 'Shelf · 12' })).toHaveAttribute('href', '#/library/book/shelf')
  expect(within(show).getByRole('link', { name: 'Wishlist · 2' })).toHaveAttribute('href', '#/library/book/wishlist')
  expect(screen.getByRole('link', { name: '‹ Collections' })).toHaveAttribute('href', '#/')
  expect(screen.getByRole('link', { name: 'Reading and spending' })).toHaveAttribute('href', '#/library/stats')
})

it('Start starts a read; a book being read has no Start', async () => {
  vi.mocked(reads.startRead).mockResolvedValue(rd('r-new', 'forj', { started_on: today }))
  render(<Library kind="book" view="shelf" />)
  await screen.findByText('Forjados pelo Destino')
  expect(within(row('Lendários')).queryByRole('button', { name: 'Start' })).toBeNull()
  fireEvent.click(within(row('Forjados pelo Destino')).getByRole('button', { name: 'Start' }))
  expect(reads.startRead).toHaveBeenCalledWith('forj', today)
  // it moves to READING NOW with Finished
  await waitFor(() => expect(within(row('Forjados pelo Destino')).getByRole('button', { name: 'Finished' })).toBeInTheDocument())
})

it('Finished finishes the open read', async () => {
  vi.mocked(reads.finishRead).mockResolvedValue(rd('r-lend', 'lend', { started_on: '2026-06-09', finished_on: today }))
  render(<Library kind="book" view="shelf" />)
  await screen.findByText('Lendários')
  fireEvent.click(within(row('Lendários')).getByRole('button', { name: 'Finished' }))
  expect(reads.finishRead).toHaveBeenCalledWith('r-lend', today)
})

it('a read book shows its rating stars', async () => {
  render(<Library kind="book" view="shelf" />)
  await screen.findByText('O General')
  expect(within(row('O General')).getByRole('img', { name: 'Rated 5 out of 5' })).toBeInTheDocument()
})

it('books wishlist: ticking Bought marks it bought today and it leaves the list', async () => {
  render(<Library kind="book" view="wishlist" />)
  fireEvent.click(within(await screen.findByText('Marca de Sangue').then((e) => e.closest('.book') as HTMLElement)).getByLabelText('Bought'))
  expect(items.updateItem).toHaveBeenCalledWith('marca', { bought: true, bought_on: today })
  await waitFor(() => expect(screen.queryByText('Marca de Sangue')).toBeNull())
  expect(screen.getByText('Linhagens de Poder')).toBeInTheDocument()
})

it('switching Books to Manga keeps the header, tabs and switch layout', async () => {
  const shape = (el: Element) => [el, ...el.querySelectorAll('*')].map((e) => `${e.tagName}.${e.className}`)
  const snap = () => ({
    header: shape(document.querySelector('header')!),
    tabs: shape(screen.getByRole('tablist')),
    show: shape(screen.getByRole('group', { name: 'Show' })),
  })
  const { container } = render(<Library kind="book" view="shelf" />)
  await screen.findByText('Lendários')
  const books = snap()
  expect(container.firstElementChild).toHaveClass('theme-nightshade')
  cleanup()
  const m = render(<Library kind="manga" view="shelf" />)
  await screen.findByText('Demon Slayer')
  expect(m.container.firstElementChild).toHaveClass('theme-higanbana')
  expect(snap()).toEqual(books)
})

it('form chips filter the shelf', async () => {
  render(<Library kind="book" view="shelf" />)
  await screen.findByText('Forjados pelo Destino')
  fireEvent.click(within(screen.getByRole('group', { name: 'Form' })).getByRole('button', { name: 'Poetry' }))
  expect(screen.getByText('O General')).toBeInTheDocument()
  expect(screen.queryByText('Forjados pelo Destino')).toBeNull()
  expect(screen.queryByText('Lendários')).toBeNull()
})

it('manga wishlist shows one card per series with its volumes', async () => {
  render(<Library kind="manga" view="wishlist" />)
  expect(await screen.findByText('Demon Slayer')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /Choose volumes you bought/ })).toBeInTheDocument()
})

it('+ opens the book form and saving reloads the list', async () => {
  vi.mocked(items.addItem).mockResolvedValue(book('new', 'Novo'))
  render(<Library kind="book" view="shelf" />)
  await screen.findByText('Forjados pelo Destino')
  fireEvent.click(screen.getByRole('button', { name: 'Add a book' }))
  fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Novo' } })
  fireEvent.click(screen.getByRole('button', { name: 'Save' }))
  await waitFor(() => expect(items.addItem).toHaveBeenCalledWith(expect.objectContaining({ title: 'Novo', collection: 'book' })))
  await waitFor(() => expect(reads.listReads).toHaveBeenCalledTimes(2))
  await waitFor(() => expect(screen.queryByRole('form', { name: 'Add book' })).toBeNull())
  expect(screen.getByRole('heading', { name: 'READING NOW' })).toBeInTheDocument()
})

it('series + Add a book prefills series, author and next number as wanted', async () => {
  render(<Library kind="book" view="shelf" />)
  fireEvent.click(await screen.findByRole('button', { name: /The Legendborn Cycle/ }))
  fireEvent.click(screen.getByRole('button', { name: '+ Add a book' }))
  expect(screen.getByLabelText('Series')).toHaveValue('The Legendborn Cycle')
  expect(screen.getByLabelText('Author')).toHaveValue('Tracy Deonn')
  expect(screen.getByLabelText('Number')).toHaveValue('4')
  expect(screen.getByRole('button', { name: 'I want it' })).toHaveAttribute('aria-pressed', 'true')
})

it('a row opens its details through its title link; Start and Bought do not navigate', async () => {
  window.location.hash = '#/library/book/shelf'
  vi.mocked(reads.startRead).mockResolvedValue(rd('r-new', 'forj', { started_on: today }))
  render(<Library kind="book" view="shelf" />)
  const r = row(await screen.findByText('Forjados pelo Destino').then((e) => e.textContent!))
  expect(within(r).getByRole('link', { name: 'Forjados pelo Destino' })).toHaveAttribute('href', '#/item/forj')
  expect(within(r).queryByRole('button', { name: /Edit/ })).toBeNull()
  fireEvent.click(within(r).getByRole('button', { name: 'Start' }))
  expect(reads.startRead).toHaveBeenCalled()
  expect(window.location.hash).toBe('#/library/book/shelf')
  cleanup()
  render(<Library kind="book" view="wishlist" />)
  const w = await screen.findByText('Marca de Sangue').then((e) => e.closest('.book') as HTMLElement)
  expect(within(w).getByRole('link', { name: 'Marca de Sangue' })).toHaveAttribute('href', '#/item/marca')
  fireEvent.click(within(w).getByLabelText('Bought'))
  expect(window.location.hash).toBe('#/library/book/shelf')
})

it('rows inside a series panel link to their details', async () => {
  render(<Library kind="book" view="shelf" />)
  fireEvent.click(await screen.findByRole('button', { name: /The Legendborn Cycle/ }))
  const panel = screen.getByRole('dialog', { name: 'The Legendborn Cycle' })
  expect(within(panel).getByRole('link', { name: 'Marca de Sangue' })).toHaveAttribute('href', '#/item/marca')
  expect(within(panel).getByRole('link', { name: 'Lendários' })).toHaveAttribute('href', '#/item/lend')
})

it('tapping a manga shelf row opens its volumes, each linking to details', async () => {
  render(<Library kind="manga" view="shelf" />)
  fireEvent.click(await screen.findByRole('button', { name: /Demon Slayer/ }))
  expect(screen.getByRole('link', { name: 'Demon Slayer 2' })).toHaveAttribute('href', '#/item/ds2')
})
