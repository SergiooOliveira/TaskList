import type { Item } from './items'
import { readState, type Read } from './reads'

export type SeriesGroup = { name: string; author: string | null; books: Item[]; owned: number; wanted: number; read: number }
export type BookGroups = { reading: Item[]; series: SeriesGroup[]; singles: Item[] }
export type MangaSeries = { name: string; author: string | null; owned: Item[]; wanted: Item[]; read: number; range: string }

const byTitle = (a: Item, b: Item) => a.title.localeCompare(b.title)
const byNumber = (a: Item, b: Item) =>
  (a.series_number ?? Infinity) - (b.series_number ?? Infinity) || byTitle(a, b)

const stateOf = (reads: Read[]) => (i: Item) => readState(reads.filter(r => r.item_id === i.id))

function bySeries(items: Item[], key: (i: Item) => string) {
  const m = new Map<string, Item[]>()
  for (const i of items) m.set(key(i), [...(m.get(key(i)) ?? []), i])
  return m
}

export function groupBooks(items: Item[], reads: Read[]): BookGroups {
  const state = stateOf(reads)
  const grouped = bySeries(items.filter(i => i.series), i => i.series!)
  const series: SeriesGroup[] = [...grouped]
    .filter(([, books]) => books.length >= 2)
    .map(([name, books]) => {
      const sorted = [...books].sort(byNumber)
      return {
        name, author: sorted.find(b => b.author)?.author ?? null, books: sorted,
        owned: sorted.filter(b => b.bought).length, wanted: sorted.filter(b => !b.bought).length,
        read: sorted.filter(b => state(b) === 'read').length,
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name))
  const inGroup = new Set(series.flatMap(s => s.books.map(b => b.id)))
  const owned = items.filter(i => i.bought)
  const reading = owned.filter(i => state(i) === 'reading').sort(byTitle)
  const readingIds = new Set(reading.map(i => i.id))
  const singles = owned.filter(i => !inGroup.has(i.id) && !readingIds.has(i.id)).sort(byTitle)
  return { reading, series, singles }
}

export function groupManga(items: Item[], reads: Read[]): MangaSeries[] {
  const state = stateOf(reads)
  return [...bySeries(items, i => i.series ?? i.title)]
    .map(([name, all]) => {
      const sorted = [...all].sort(byNumber)
      const owned = sorted.filter(i => i.bought)
      const wanted = sorted.filter(i => !i.bought)
      const nums = wanted.map(i => i.series_number).filter((n): n is number => n !== null)
      const range = nums.length ? `${Math.min(...nums)}–${Math.max(...nums)}` : ''
      return { name, author: sorted.find(i => i.author)?.author ?? null, owned, wanted, read: owned.filter(i => state(i) === 'read').length, range }
    })
    .sort((a, b) => a.name.localeCompare(b.name))
}

export function forms(items: Item[]): string[] {
  const seen = new Map<string, string>()
  for (const i of items) if (i.form && !seen.has(i.form.toLowerCase())) seen.set(i.form.toLowerCase(), i.form)
  return [...seen.values()].sort((a, b) => a.localeCompare(b))
}
