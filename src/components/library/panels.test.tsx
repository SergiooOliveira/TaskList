import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import SeriesPanel from './SeriesPanel'
import VolumePanel from './VolumePanel'
import * as items from '../../lib/items'
import { todayISO } from '../../lib/reads'
import type { Item } from '../../lib/items'
import type { MangaSeries, SeriesGroup } from '../../lib/library'

vi.mock('../../lib/supabase', () => ({ supabase: {} }))
vi.mock('../../lib/items', async (orig) => ({ ...(await orig<typeof items>()), updateItem: vi.fn() }))

const it_ = (id: string, title: string, o: Partial<Item> = {}): Item => ({
  id, user_id: 'u', url: null, title, image_url: null, store: null, price_cents: null, previous_price_cents: null,
  price_checked_at: null, category: null, bought: false, created_at: '', collection: 'book', author: null, series: null,
  form: null, language: null, series_number: null, pages: null, rating: null, genres: null, bought_on: null, ...o,
})
const today = todayISO()
beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(items.updateItem).mockImplementation(async (id, patch) => ({ ...it_(id, id), ...patch }))
})
afterEach(cleanup)

describe('SeriesPanel', () => {
  const books = [
    it_('i', 'Lendários', { series_number: 1, bought: true, pages: 573 }),
    it_('ii', 'Marca de Sangue', { series_number: 2, pages: 640, price_cents: 2490, store: 'Bertrand' }),
    it_('iii', 'Linhagens de Poder', { series_number: 3, pages: 736 }),
  ]
  const group: SeriesGroup = { name: 'The Legendborn Cycle', author: 'Tracy Deonn', books, owned: 1, wanted: 2, read: 0 }
  const setup = () => {
    const p = { onClose: vi.fn(), onChange: vi.fn(), onAddToSeries: vi.fn(), onBought: vi.fn(), onError: vi.fn() }
    render(<SeriesPanel group={group} reads={[]} {...p} />)
    return p
  }

  it('shows roman numerals in order, footer and add', () => {
    const p = setup()
    expect(screen.getAllByText(/^(I|II|III)$/).map((e) => e.textContent)).toEqual(['I', 'II', 'III'])
    expect(screen.getByText(`1 of 3 owned · ${new Intl.NumberFormat('pt-PT').format(1949)} pages in total`)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '+ Add a book' }))
    expect(p.onAddToSeries).toHaveBeenCalledWith('The Legendborn Cycle', 'Tracy Deonn')
  })

  it('ticking Bought on book II buys it', async () => {
    const p = setup()
    fireEvent.click(screen.getAllByRole('checkbox', { name: 'Bought' })[0])
    await waitFor(() => expect(p.onBought).toHaveBeenCalled())
    expect(items.updateItem).toHaveBeenCalledWith('ii', { bought: true, bought_on: today })
  })

  it('closes on the close button', () => {
    const p = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(p.onClose).toHaveBeenCalled()
  })
})

describe('VolumePanel', () => {
  const wanted = [14, 15, 16, 17, 18, 19, 20, 21, 22, 23].map((n) =>
    it_(`v${n}`, `Vol ${n}`, { collection: 'manga', series: 'Demon Slayer', series_number: n, price_cents: 1000 }))
  const series: MangaSeries = { name: 'Demon Slayer', author: null, owned: [], wanted, read: 0, range: '14–23' }
  const setup = () => {
    const p = { onClose: vi.fn(), onMoved: vi.fn(), onError: vi.fn() }
    render(<VolumePanel series={series} {...p} />)
    return p
  }
  const btn = (name: string) => screen.getByRole('button', { name })

  it('starts empty and disabled, totals ticked volumes, select all', () => {
    setup()
    expect(btn(`Move 0 to shelf · ${items.formatEuro(0)}`)).toBeDisabled()
    fireEvent.click(screen.getByRole('checkbox', { name: /^14/ }))
    fireEvent.click(screen.getByRole('checkbox', { name: /^15/ }))
    expect(btn(`Move 2 to shelf · ${items.formatEuro(2000)}`)).toBeEnabled()
    fireEvent.click(btn('Select all'))
    expect(btn(`Move 10 to shelf · ${items.formatEuro(10000)}`)).toBeInTheDocument()
  })

  it('moves ticked volumes then reports', async () => {
    const p = setup()
    fireEvent.click(screen.getByRole('checkbox', { name: /^14/ }))
    fireEvent.click(screen.getByRole('checkbox', { name: /^15/ }))
    fireEvent.click(btn(`Move 2 to shelf · ${items.formatEuro(2000)}`))
    await waitFor(() => expect(p.onMoved).toHaveBeenCalled())
    expect(items.updateItem).toHaveBeenCalledWith('v14', { bought: true, bought_on: today })
    expect(items.updateItem).toHaveBeenCalledWith('v15', { bought: true, bought_on: today })
    expect(items.updateItem).toHaveBeenCalledTimes(2)
  })

  it('stops at the first failure and keeps what moved', async () => {
    vi.mocked(items.updateItem).mockImplementationOnce(async (id, patch) => ({ ...it_(id, id), ...patch })).mockRejectedValueOnce(new Error('boom'))
    const p = setup()
    fireEvent.click(btn('Select all'))
    fireEvent.click(btn(`Move 10 to shelf · ${items.formatEuro(10000)}`))
    await waitFor(() => expect(p.onError).toHaveBeenCalled())
    expect(items.updateItem).toHaveBeenCalledTimes(2)
    expect(p.onMoved).toHaveBeenCalledWith([expect.objectContaining({ id: 'v14' })])
    expect(p.onClose).not.toHaveBeenCalled()
  })

  it('closes without saving', () => {
    const p = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(p.onClose).toHaveBeenCalled()
    expect(items.updateItem).not.toHaveBeenCalled()
  })
})
