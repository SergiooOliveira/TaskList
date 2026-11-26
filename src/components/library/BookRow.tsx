import { useState } from 'react'
import { formatEuro, type Item } from '../../lib/items'
import { canStart, finishRead, openRead, readState, startRead, todayISO, type Read } from '../../lib/reads'
import type { SeriesGroup } from '../../lib/library'

export function Cover({ item, className = 'cover' }: { item?: Item; className?: string }) {
  return item?.image_url
    ? <img className={className} src={item.image_url} alt="" />
    : <span className={className} aria-hidden="true" />
}

// Title links to the product page only when there is one (no <a> without href).
export const Title = ({ item }: { item: Item }) => (
  <div className="title">{item.url ? <a href={item.url} target="_blank" rel="noopener noreferrer">{item.title}</a> : item.title}</div>
)

export const seriesLabel = (i: Item) => i.series ? `${i.series}${i.series_number !== null ? ` #${i.series_number}` : ''}` : null
const day = (iso: string) => new Date(`${iso}T00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

type Props = { item: Item; reads: Read[]; onChange: (r: Read) => void; onError: (e: unknown) => void }

// One owned book with its state line and one action: Finished / Start / stars or Read again.
export default function BookRow({ item, reads, onChange, onError }: Props) {
  const [busy, setBusy] = useState(false) // a double tap must not start two reads
  const state = readState(reads)
  const open = openRead(reads)
  const run = (p: () => Promise<Read>) => {
    setBusy(true)
    p().then(onChange, onError).finally(() => setBusy(false))
  }
  const start = () => canStart(reads) && run(() => startRead(item.id, todayISO()))
  const status = open ? `since ${open.started_on ? day(open.started_on) : '…'}`
    : state === 'unread' ? 'not started'
    : reads.every((r) => r.before_app) ? 'Read before the app' : 'read'

  return (
    <div className="book">
      <Cover item={item} />
      <div className="body">
        <Title item={item} />
        <div className="sub">{(open ? [seriesLabel(item) ?? item.author, status] : [item.author, seriesLabel(item), status]).filter(Boolean).join(' · ')}</div>
      </div>
      {open ? (
        <button className="act on" disabled={busy} onClick={() => run(() => finishRead(open.id, todayISO()))}>Finished</button>
      ) : state === 'unread' ? (
        <button className="act" disabled={busy} onClick={start}>Start</button>
      ) : item.rating ? (
        <span className="stars" role="img" aria-label={`Rated ${item.rating} out of 5`}>{'★'.repeat(item.rating)}{'☆'.repeat(Math.max(0, 5 - item.rating))}</span>
      ) : (
        <button className="act" disabled={busy} onClick={start}>Read again</button>
      )}
    </div>
  )
}

export function WantedBookRow({ item, onBought, busy = false }: { item: Item; onBought: (i: Item) => void; busy?: boolean }) {
  return (
    <div className="book wanted">
      <Cover item={item} />
      <div className="body">
        <Title item={item} />
        <div className="sub">{[item.author, seriesLabel(item)].filter(Boolean).join(' · ')}</div>
        <div className="meta">
          {item.price_cents !== null && <span className="price">{formatEuro(item.price_cents)}</span>}
          {item.store && <span className="store">{item.store}</span>}
        </div>
      </div>
      <label className="bought"><input type="checkbox" checked={item.bought} disabled={busy} onChange={() => onBought(item)} />Bought</label>
    </div>
  )
}

export function SeriesRow({ group, reads, onOpen }: { group: SeriesGroup; reads: Read[]; onOpen: () => void }) {
  const stateOf = (b: Item) => readState(reads.filter((r) => r.item_id === b.id))
  const { books, owned, wanted, read } = group
  const line = wanted > 0 ? `${owned} on shelf · ${wanted} wanted`
    : `${books.length} books · ${read === books.length ? 'all read' : `${read} read`}`
  return (
    <button className="book series" onClick={onOpen}>
      <span className="stack">
        {books.slice(1, 3).map((b, i) => <span key={b.id} className={`layer l${i + 1}`} />).reverse()}
        <Cover item={books[0]} />
      </span>
      <span className="body">
        <span className="title">{group.name}</span>
        <span className="sub">{[group.author, line].filter(Boolean).join(' · ')}</span>
        <span className="bars" aria-hidden="true">
          {books.map((b) => <span key={b.id} className={!b.bought ? 'want' : stateOf(b) === 'read' ? 'read' : 'own'} />)}
        </span>
      </span>
      <span className="chev" aria-hidden="true">›</span>
    </button>
  )
}
