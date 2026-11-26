import type { Item } from './items'
import type { Read } from './reads'

export type Year = number | 'all'
export type Pairs = [string, number][]
export type ReadingStats = {
  books: number; pages: number; byKind: { book: number; manga: number }; perMonth: number[]
  finished: Item[]; topGenres: Pairs; avgRating: number | null; longest: Item | null
}
export type SpendingStats = {
  total: number; count: number; average: number
  byStore: Pairs; byKind: Pairs; byForm: Pairs; byGenre: Pairs; topAuthors: Pairs; topSeries: Pairs
}

const yearOf = (d: string | null) => (d ? Number(d.slice(0, 4)) : null)
const isBook = (i: Item) => i.collection === 'book' || i.collection === 'manga'
// Descending by value, ties A–Z.
const ranked = (m: Map<string, number>, max = Infinity): Pairs =>
  [...m].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, max)
const bump = (m: Map<string, number>, k: string | null | undefined, n: number) => { if (k) m.set(k, (m.get(k) ?? 0) + n) }

export function beforeApp(items: Item[], reads: Read[]) {
  const byId = new Map(items.map((i) => [i.id, i]))
  const its = reads.filter((r) => r.before_app).map((r) => byId.get(r.item_id)).filter((i): i is Item => !!i)
  return { books: its.length, pages: its.reduce((s, i) => s + (i.pages ?? 0), 0) }
}

export function readingStats(items: Item[], reads: Read[], year: Year): ReadingStats {
  const byId = new Map(items.map((i) => [i.id, i]))
  const rs = reads.filter((r) => (year === 'all' ? r.finished_on || r.before_app : yearOf(r.finished_on) === year))
  const its = rs.map((r) => byId.get(r.item_id)).filter((i): i is Item => !!i && isBook(i))
  const perMonth = Array<number>(12).fill(0)
  for (const r of rs) if (r.finished_on) perMonth[Number(r.finished_on.slice(5, 7)) - 1]++
  const genres = new Map<string, number>()
  its.forEach((i) => i.genres?.forEach((g) => bump(genres, g, 1)))
  const rated = its.filter((i) => i.rating !== null)
  const withPages = its.filter((i) => i.pages)
  return {
    books: its.length,
    pages: its.reduce((s, i) => s + (i.pages ?? 0), 0),
    byKind: { book: its.filter((i) => i.collection === 'book').length, manga: its.filter((i) => i.collection === 'manga').length },
    perMonth,
    finished: its,
    topGenres: ranked(genres, 5),
    avgRating: rated.length ? Math.round((rated.reduce((s, i) => s + i.rating!, 0) / rated.length) * 10) / 10 : null,
    longest: withPages.reduce<Item | null>((m, i) => (!m || i.pages! > m.pages! ? i : m), null),
  }
}

export function spendingStats(items: Item[], year: Year): SpendingStats {
  const its = items.filter((i) => i.bought && isBook(i) && (year === 'all' || yearOf(i.bought_on) === year))
  const priced = its.filter((i) => i.price_cents !== null)
  const total = its.reduce((s, i) => s + (i.price_cents ?? 0), 0)
  const [store, kind, form, genre, author, series] = Array.from({ length: 6 }, () => new Map<string, number>())
  for (const i of its) {
    const c = i.price_cents ?? 0
    bump(store, i.store, c)
    bump(kind, i.collection === 'manga' ? 'Manga' : 'Books', c)
    bump(form, i.form, c)
    i.genres?.forEach((g) => bump(genre, g, c))
    bump(author, i.author, 1)
    bump(series, i.series, 1)
  }
  return {
    total, count: its.length, average: priced.length ? Math.round(total / priced.length) : 0,
    byStore: ranked(store), byKind: ranked(kind), byForm: ranked(form), byGenre: ranked(genre),
    topAuthors: ranked(author, 5), topSeries: ranked(series, 5),
  }
}

export function years(items: Item[], reads: Read[]): number[] {
  const ys = new Set<number>()
  for (const d of [...items.filter(isBook).map((i) => i.bought_on), ...reads.map((r) => r.finished_on)]) {
    const y = yearOf(d)
    if (y) ys.add(y)
  }
  return [...ys].sort((a, b) => b - a)
}
