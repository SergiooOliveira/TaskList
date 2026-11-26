import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import ItemPage from './ItemPage'
import GenreList from './GenreList'
import * as items from '../../lib/items'
import * as reads from '../../lib/reads'
import type { Item } from '../../lib/items'
import type { Read } from '../../lib/reads'

vi.mock('../../lib/supabase', () => ({ supabase: {} }))
vi.mock('../../lib/items', async (orig) => ({ ...(await orig<typeof items>()), listItems: vi.fn(), updateItem: vi.fn(), deleteItem: vi.fn() }))
vi.mock('../../lib/reads', async (orig) => ({ ...(await orig<typeof reads>()), listReads: vi.fn(), startRead: vi.fn(), finishRead: vi.fn() }))

const book = (id: string, title: string, o: Partial<Item> = {}): Item => ({
  id, user_id: 'u', url: null, title, image_url: null, store: null, price_cents: null, previous_price_cents: null,
  price_checked_at: null, category: null, bought: true, created_at: '', collection: 'book', author: null, series: null,
  form: null, language: null, series_number: null, pages: null, rating: null, genres: null, bought_on: null, summary: null, ...o,
})
const rd = (id: string, item_id: string, o: Partial<Read> = {}): Read => ({ id, item_id, started_on: null, finished_on: null, before_app: false, ...o })

const long = 'Depois da morte da mãe, Bree Matthews entra num programa para alunos dotados. '.repeat(4)
const lb = { series: 'The Legendborn Cycle', author: 'Tracy Deonn' }
const fixture = [
  book('lend', 'Lendários', { ...lb, series_number: 1, pages: 573, language: 'Portuguese', form: 'Prose', price_cents: 290, store: 'Bertrand',
    genres: ['Fantasy', 'Fiction', 'Young Adult Fiction'], summary: long }),
  book('marca', 'Marca de Sangue', { ...lb, series_number: 2, bought: false }),
  book('hp', 'Harry Potter', { genres: ['fantasy '] }),
  book('op', 'One Piece 1', { collection: 'manga', series: 'One Piece', series_number: 1, genres: ['FANTASY'] }),
  book('want', 'Wanted fantasy', { genres: ['Fantasy'], bought: false }),
  book('gad', 'Gadget', { collection: null, genres: ['Fantasy'] }),
  book('bare', 'Bare'),
]
beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(items.listItems).mockResolvedValue(fixture)
  vi.mocked(reads.listReads).mockResolvedValue([rd('r1', 'lend', { started_on: '2026-06-09' }), rd('r2', 'hp', { before_app: true })])
})
afterEach(cleanup)

describe('details', () => {
  it('shows title, author, details and genre links but no price or store', async () => {
    render(<ItemPage id="lend" edit={false} />)
    expect(await screen.findByRole('heading', { name: 'Lendários' })).toBeInTheDocument()
    expect(screen.getByText('Tracy Deonn')).toBeInTheDocument()
    expect(screen.getByText('573')).toBeInTheDocument()
    expect(screen.getByText('Portuguese')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Young Adult Fiction' })).toHaveAttribute('href', '#/genre/Young%20Adult%20Fiction')
    expect(screen.queryByText('Bertrand')).toBeNull()
    expect(screen.queryByText(/2,90/)).toBeNull()
    expect(screen.queryByText('AUTHOR')).toBeNull()
    expect(screen.getByRole('link', { name: 'Edit' })).toHaveAttribute('href', '#/item/lend/edit')
    expect(screen.getByRole('link', { name: '‹ Library' })).toHaveAttribute('href', '#/library/book/shelf')
    expect(screen.getByText('Reading since 9 Jun')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Finished' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Not rated yet' })).toBeInTheDocument()
  })

  it('shows the shop page link only when there is one', async () => {
    vi.mocked(items.listItems).mockResolvedValue([{ ...fixture[0], url: 'https://bertrand.pt/x' }, fixture[6]])
    render(<ItemPage id="lend" edit={false} />)
    const a = await screen.findByRole('link', { name: /Shop page/ })
    expect(a).toHaveAttribute('href', 'https://bertrand.pt/x')
    expect(a).toHaveAttribute('target', '_blank')
    expect(a).toHaveAttribute('rel', 'noopener noreferrer')
    cleanup()
    render(<ItemPage id="bare" edit={false} />)
    await screen.findByRole('heading', { name: 'Bare' })
    expect(screen.queryByRole('link', { name: /Shop page/ })).toBeNull()
  })

  it('without layout, a short summary with many line breaks still gets Read more; a short one does not', async () => {
    vi.mocked(items.listItems).mockResolvedValue([{ ...fixture[0], id: 'a', summary: 'a\nb\nc\nd\ne' }, { ...fixture[0], id: 'b', summary: 'Short.' }])
    render(<ItemPage id="a" edit={false} />)
    expect(await screen.findByRole('button', { name: 'Read more' })).toBeInTheDocument()
    cleanup()
    render(<ItemPage id="b" edit={false} />)
    await screen.findByText('Short.')
    expect(screen.queryByRole('button', { name: 'Read more' })).toBeNull()
  })

  it('after a delete it goes back past the edit and details screens', async () => {
    vi.mocked(items.deleteItem).mockResolvedValue()
    const go = vi.spyOn(history, 'go').mockImplementation(() => {})
    Object.defineProperty(history, 'length', { value: 3, configurable: true })
    render(<ItemPage id="lend" edit />)
    fireEvent.click(await screen.findByRole('button', { name: 'Delete this book' }))
    fireEvent.click(screen.getByRole('button', { name: 'Yes' }))
    await waitFor(() => expect(go).toHaveBeenCalledWith(-2))
  })

  it('omits missing rows and the series line', async () => {
    render(<ItemPage id="bare" edit={false} />)
    await screen.findByRole('heading', { name: 'Bare' })
    expect(document.querySelectorAll('dt')).toHaveLength(0)
    expect(screen.queryByText(/null/)).toBeNull()
    expect(screen.queryByRole('button', { name: /›/ })).toBeNull()
    expect(screen.getByRole('button', { name: 'Start' })).toBeInTheDocument()
  })

  it('Read more toggles the full summary', async () => {
    render(<ItemPage id="lend" edit={false} />)
    const btn = await screen.findByRole('button', { name: 'Read more' })
    expect(btn).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(btn)
    expect(screen.getByRole('button', { name: 'Read less' })).toHaveAttribute('aria-expanded', 'true')
    expect(document.querySelector('.hero')).toHaveClass('open')
  })

  it('the series line opens the series panel with every book in it', async () => {
    render(<ItemPage id="lend" edit={false} />)
    fireEvent.click(await screen.findByRole('button', { name: /The Legendborn Cycle · I/ }))
    const panel = screen.getByRole('dialog', { name: 'The Legendborn Cycle' })
    expect(within(panel).getByText('Marca de Sangue')).toBeInTheDocument()
    fireEvent.click(within(panel).getByRole('button', { name: '+ Add a book' }))
    expect(screen.getByLabelText('Series')).toHaveValue('The Legendborn Cycle')
    expect(screen.getByLabelText('Number')).toHaveValue('3')
  })

  it('an unknown id says so with a way back', async () => {
    render(<ItemPage id="gone" edit={false} />)
    expect(await screen.findByText("This book isn't in your library anymore.")).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '‹ Library' })).toBeInTheDocument()
  })

  it('the edit route shows the filled form; Save goes back to details', async () => {
    vi.mocked(items.updateItem).mockImplementation(async (id, p) => ({ ...fixture[0], ...p, id }))
    const back = vi.spyOn(history, 'back').mockImplementation(() => {})
    Object.defineProperty(history, 'length', { value: 3, configurable: true })
    render(<ItemPage id="lend" edit />)
    expect(await screen.findByRole('form', { name: 'Edit book' })).toBeInTheDocument()
    expect(screen.getByLabelText('Summary')).toHaveValue(long)
    expect(screen.getByLabelText('Price paid (€)')).toHaveValue('2,90')
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(back).toHaveBeenCalled())
    expect(items.updateItem).toHaveBeenCalledWith('lend', expect.objectContaining({ summary: long.trim() }))
  })
})

describe('genre list', () => {
  it('lists owned books and manga in the genre, any case, A–Z, with a manga tag', async () => {
    render(<GenreList genre="Fantasy" />)
    expect(await screen.findByRole('heading', { name: 'Fantasy' })).toBeInTheDocument()
    await screen.findByText('Harry Potter')
    const links = screen.getAllByRole('link').filter((a) => a.getAttribute('href')?.startsWith('#/item/'))
    expect(links.map((a) => a.getAttribute('href'))).toEqual(['#/item/hp', '#/item/lend', '#/item/op'])
    expect(within(links[2]).getByText('MANGA')).toBeInTheDocument()
    expect(within(links[0]).queryByText('MANGA')).toBeNull()
    expect(document.querySelector('.lede')).toHaveTextContent('3 books you own in this genre, 1 read.')
  })
})
