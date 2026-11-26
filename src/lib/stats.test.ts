import { beforeApp, readingStats, spendingStats, years } from './stats'
import type { Item } from './items'
import type { Read } from './reads'

const mk = (id: string, o: Partial<Item> = {}): Item => ({
  id, user_id: 'u', url: null, title: id, image_url: null, store: null, price_cents: null, previous_price_cents: null,
  price_checked_at: null, category: null, bought: true, created_at: '', collection: 'book', author: null, series: null,
  form: null, language: null, series_number: null, pages: null, rating: null, genres: null, bought_on: null, summary: null, ...o,
})
const rd = (item_id: string, o: Partial<Read> = {}): Read => ({ id: `r-${item_id}-${o.finished_on}`, item_id, started_on: null, finished_on: null, before_app: false, ...o })

describe('beforeApp', () => {
  it('counts books and sums pages, null pages as 0', () => {
    const items = [mk('a', { pages: 181 }), mk('b', { pages: 189 }), mk('c')]
    expect(beforeApp(items, items.map((i) => rd(i.id, { before_app: true })))).toEqual({ books: 3, pages: 370 })
  })
})

describe('readingStats', () => {
  const items = [
    mk('a', { pages: 384, rating: 4, genres: ['Fantasy', 'Fiction'] }),
    mk('b', { pages: null, rating: 5, genres: ['Fantasy'] }),
    mk('m', { collection: 'manga', pages: 200 }),
    mk('old', { pages: 100 }),
  ]
  const reads = [rd('a', { finished_on: '2026-11-02' }), rd('b', { finished_on: '2026-01-05' }), rd('m', { finished_on: '2025-03-01' }), rd('old', { before_app: true }), rd('a', { finished_on: '2025-12-31' })]

  it('filters by finished year', () => {
    const s = readingStats(items, reads, 2026)
    expect(s.books).toBe(2)
    expect(s.pages).toBe(384)
    expect(s.perMonth[10]).toBe(1)
    expect(s.perMonth[0]).toBe(1)
    expect(s.avgRating).toBe(4.5)
    expect(s.longest?.id).toBe('a')
    expect(s.topGenres[0]).toEqual(['Fantasy', 2])
  })
  it("'all' includes before_app and re-reads, perMonth only dated", () => {
    const s = readingStats(items, reads, 'all')
    expect(s.books).toBe(5)
    expect(s.byKind).toEqual({ book: 4, manga: 1 })
    expect(s.perMonth.reduce((a, b) => a + b, 0)).toBe(4)
  })
  it('no ratings gives null', () => {
    expect(readingStats([mk('x')], [rd('x', { finished_on: '2026-02-01' })], 2026).avgRating).toBeNull()
  })
})

describe('spendingStats', () => {
  const items = [
    mk('a', { price_cents: 1000, store: 'Bertrand', genres: ['Fantasy', 'Fiction'], bought_on: '2026-02-01', author: 'X', series: 'S' }),
    mk('b', { price_cents: 2000, store: 'Bertrand', form: 'Prose', bought_on: '2025-02-01', author: 'X' }),
    mk('c', { price_cents: 0, store: 'Gift', collection: 'manga', form: 'Shōnen' }),
    mk('d', { price_cents: null, store: 'Fnac' }),
    mk('w', { bought: false, price_cents: 9999 }),
    mk('g', { collection: null, price_cents: 5000 }),
  ]
  it("'all' sums owned, excludes null price from the average", () => {
    const s = spendingStats(items, 'all')
    expect(s.total).toBe(3000)
    expect(s.count).toBe(4)
    expect(s.average).toBe(1000)
    expect(s.byStore[0]).toEqual(['Bertrand', 3000])
    expect(s.byKind).toEqual([['Books', 3000], ['Manga', 0]])
    expect(s.byForm).toEqual([['Prose', 2000], ['Shōnen', 0]])
    expect(s.byGenre).toEqual([['Fantasy', 1000], ['Fiction', 1000]])
    expect(s.topAuthors).toEqual([['X', 2]])
  })
  it('a year filters by bought_on', () => {
    const s = spendingStats(items, 2026)
    expect(s.total).toBe(1000)
    expect(s.count).toBe(1)
  })
})

it('years are distinct and descending', () => {
  expect(years([mk('a', { bought_on: '2025-01-01' }), mk('b', { bought_on: '2024-05-05' })], [rd('a', { finished_on: '2026-01-01' }), rd('a', { finished_on: '2025-03-03' })])).toEqual([2026, 2025, 2024])
})
