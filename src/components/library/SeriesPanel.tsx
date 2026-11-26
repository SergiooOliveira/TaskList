import { useState } from 'react'
import { boughtPatch, updateItem, type Item } from '../../lib/items'
import { todayISO, type Read } from '../../lib/reads'
import type { SeriesGroup } from '../../lib/library'
import BookRow, { WantedBookRow } from './BookRow'
import Sheet, { SheetHead } from './Sheet'

const ROMAN: [number, string][] = [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]
// shortcut: numbers of 40+ come out as repeated X, fine for book series.
export const roman = (n: number | null) => {
  if (!n || n < 1) return '–'
  let s = ''
  for (const [v, r] of ROMAN) while (n >= v) { s += r; n -= v }
  return s
}

type Props = {
  group: SeriesGroup; reads: Read[]; onClose: () => void; onChange: (r: Read) => void
  onAddToSeries: (name: string, author: string | null) => void
  onBought?: (i: Item) => void; onError?: (e: unknown) => void
}

export default function SeriesPanel({ group, reads, onClose, onChange, onAddToSeries, onBought, onError }: Props) {
  const [busy, setBusy] = useState<string | null>(null) // a double tap must not send two updates
  const buy = (it: Item) => {
    setBusy(it.id)
    updateItem(it.id, boughtPatch(true, todayISO())).then((u) => onBought?.(u), (e) => onError?.(e)).finally(() => setBusy(null))
  }
  const pages = group.books.reduce((s, b) => s + (b.pages ?? 0), 0)
  return (
    <Sheet label={group.name} onClose={onClose}>
      <SheetHead title={group.name} sub={group.author ?? ''} onClose={onClose} />
      <div className="sheet-list">
        {group.books.map((b) => (
          <div key={b.id} className="sheet-book">
            <span className="num">{roman(b.series_number)}</span>
            {b.bought
              ? <BookRow item={b} reads={reads.filter((r) => r.item_id === b.id)} onChange={onChange} onError={(e) => onError?.(e)} />
              : <WantedBookRow item={b} busy={busy === b.id} onBought={buy} />}
          </div>
        ))}
      </div>
      <div className="sheet-foot between">
        <span className="tally">{group.owned} of {group.books.length} owned · {new Intl.NumberFormat('pt-PT').format(pages)} pages in total</span>
        <button type="button" className="ghost" onClick={() => onAddToSeries(group.name, group.author)}>+ Add a book</button>
      </div>
    </Sheet>
  )
}
