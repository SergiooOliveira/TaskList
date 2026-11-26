import { groupBooks, groupManga, forms } from './library'
import type { Item } from './items'
import type { Read } from './reads'

vi.mock('./supabase', () => ({ supabase: {} }))

let n = 0
const item = (p: Partial<Item>): Item => ({
  id: `i${++n}`, user_id: 'u', url: null, title: 'x', image_url: null, store: null, price_cents: null,
  previous_price_cents: null, price_checked_at: null, category: null, bought: true, created_at: '', collection: 'book',
  author: null, series: null, form: null, language: null, series_number: null, pages: null, rating: null,
  genres: null, bought_on: null, ...p,
})
const read = (item_id: string, p: Partial<Read> = {}): Read => ({ id: `r${++n}`, item_id, started_on: null, finished_on: null, before_app: false, ...p })

const legendborn = (title: string, num: number | null, bought: boolean) =>
  item({ title, series: 'The Legendborn Cycle', series_number: num, bought })

describe('groupBooks', () => {
  const lend = legendborn('Lendários', 1, true)
  const hp = [1, 2, 3, 4].map(i => item({ title: `HP ${i}`, series: 'Harry Potter', series_number: i }))
  const cherub = item({ title: 'O General', series: 'Cherub', series_number: 10 })
  const items = [lend, legendborn('Legendborn 2', 2, false), legendborn('Legendborn 3', 3, false), ...hp, cherub]
  const reads = [read(lend.id, { started_on: '2026-01-01' }), ...hp.map(b => read(b.id, { before_app: true }))]
  const g = groupBooks(items, reads)

  it('splits reading, series and singles', () => {
    expect(g.reading.map(b => b.title)).toEqual(['Lendários'])
    expect(g.series.map(s => s.name)).toEqual(['Harry Potter', 'The Legendborn Cycle'])
    expect(g.series[1]).toMatchObject({ owned: 1, wanted: 2, read: 0 })
    expect(g.series[0]).toMatchObject({ owned: 4, wanted: 0, read: 4 })
    expect(g.singles.map(b => b.title)).toEqual(['O General'])
  })

  it('sorts null series_number after numbered books', () => {
    const a = legendborn('Zeta', null, true), b = legendborn('B2', 2, true), c = legendborn('B1', 1, true)
    expect(groupBooks([a, b, c], []).series[0].books.map(x => x.title)).toEqual(['B1', 'B2', 'Zeta'])
  })
})

describe('groupBooks normalization and shelf', () => {
  it('merges series spelled with different case/whitespace', () => {
    const b = (title: string, series: string) => item({ title, series })
    const { series } = groupBooks([b('A', 'Harry Potter'), b('B', 'Harry Potter '), b('C', 'harry potter')], [])
    expect(series).toHaveLength(1)
    expect(series[0].name).toBe('Harry Potter')
    expect(series[0].books).toHaveLength(3)
  })
  it('omits wanted-only series from series and singles', () => {
    const w = (t: string) => item({ title: t, series: 'Wish', bought: false })
    const g = groupBooks([w('A'), w('B')], [])
    expect(g.series).toEqual([])
    expect(g.singles).toEqual([])
  })
})

describe('groupManga', () => {
  const wantedRange = (nums: number[]) =>
    groupManga(nums.map(n => item({ collection: 'manga', series: 'S', series_number: n, bought: false })), [])[0].range
  it('collapses consecutive volumes into runs', () => {
    expect(wantedRange([14, 15, 16, 20])).toBe('14–16, 20')
    expect(wantedRange([14, 16, 20])).toBe('14, 16, 20')
    expect(wantedRange([14])).toBe('14')
    expect(wantedRange([14, 15, 16, 17, 18, 19, 20, 21, 22, 23])).toBe('14–23')
  })
  it('ignores volumes without a number in the range', () => {
    const m = groupManga([item({ series: 'S', bought: false }), item({ series: 'S', series_number: 3, bought: false })], [])
    expect(m[0].range).toBe('3')
  })
  it('returns wanted-only series with empty owned', () => {
    const [m] = groupManga([item({ collection: 'manga', series: 'W', series_number: 1, bought: false })], [])
    expect(m.owned).toEqual([])
    expect(m.wanted).toHaveLength(1)
  })
  it('falls back to title when series is empty string', () => {
    expect(groupManga([item({ title: 'Akira', series: '' })], [])[0].name).toBe('Akira')
  })
  it('groups by series with the wanted range', () => {
    const vols = (from: number, to: number, bought: boolean) =>
      Array.from({ length: to - from + 1 }, (_, i) => item({ collection: 'manga', title: 'Demon Slayer', series: 'Demon Slayer', series_number: from + i, bought }))
    const owned = vols(1, 13, true)
    const [m] = groupManga([...owned, ...vols(14, 23, false)], [read(owned[0].id, { before_app: true })])
    expect(m).toMatchObject({ name: 'Demon Slayer', read: 1, range: '14–23' })
    expect(m.owned).toHaveLength(13)
    expect(m.wanted).toHaveLength(10)
  })
  it('falls back to title and empty range', () => {
    const [m] = groupManga([item({ collection: 'manga', title: 'Akira' })], [])
    expect(m).toMatchObject({ name: 'Akira', range: '' })
  })
})

describe('forms', () => {
  it('dedupes case-insensitively and sorts', () => {
    expect(forms([item({ form: 'Prose' }), item({ form: 'prose' }), item({ form: 'Poetry' }), item({})])).toEqual(['Poetry', 'Prose'])
  })
})
