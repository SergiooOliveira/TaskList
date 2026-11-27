import { useState } from 'react'
import { formatEuro, type Item } from '../../lib/items'
import { canStart, finishRead, openRead, readState, startRead, todayISO, type Read } from '../../lib/reads'
import type { SeriesGroup } from '../../lib/library'
import { href } from '../../lib/route'

// A missing or broken cover shows a thin book outline and the title (drawn by CSS from data-title, so the title text isn't
// duplicated next to the row's own), so it reads as "no cover", not a broken image.
export function Cover({ item, className = 'cover', alt = '' }: { item?: Item; className?: string; alt?: string }) {
  const [broken, setBroken] = useState<string | null>(null) // the url that failed; a new url gets a fresh try
  const url = item?.image_url
  if (url && url !== broken) return <img className={className} src={url} alt={alt} onError={() => setBroken(url)} />
  return (
    <span className={`${className} nocover`} data-title={item?.title} {...(alt ? { role: 'img', 'aria-label': alt } : { 'aria-hidden': true })}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5zM5 19.5A1.5 1.5 0 0 0 6.5 21H19v-3M9 7h6" />
      </svg>
    </span>
  )
}

// The title is the row's link to the details screen; CSS stretches it over the row, action buttons sit above it.
export const Title = ({ item }: { item: Item }) => (
  <div className="title"><a className="open" href={href({ name: 'item', id: item.id, edit: false })}>{item.title}</a></div>
)

export const seriesLabel = (i: Item) => i.series ? `${i.series}${i.series_number !== null ? ` #${i.series_number}` : ''}` : null
const day = (iso: string) => new Date(`${iso}T00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

type ReadProps = { item: Item; reads: Read[]; onChange: (r: Read) => void; onError: (e: unknown) => void }

export const readStatus = (reads: Read[]) => {
  const open = openRead(reads)
  return open ? `since ${open.started_on ? day(open.started_on) : '…'}`
    : readState(reads) === 'unread' ? 'not started'
    : reads.every((r) => r.before_app) ? 'Read before the app' : 'read'
}

// The one reading action: Finished / Start / Read again; a rated read book shows its stars instead unless stars={false}.
export function ReadAction({ item, reads, onChange, onError, stars = true }: ReadProps & { stars?: boolean }) {
  const [busy, setBusy] = useState(false) // a double tap must not start two reads
  const state = readState(reads)
  const open = openRead(reads)
  const run = (p: () => Promise<Read>) => {
    setBusy(true)
    p().then(onChange, onError).finally(() => setBusy(false))
  }
  const start = () => canStart(reads) && run(() => startRead(item.id, todayISO()))
  return open ? (
    <button className="act on" disabled={busy} onClick={() => run(() => finishRead(open.id, todayISO()))}>Finished</button>
  ) : state === 'unread' ? (
    <button className="act" disabled={busy} onClick={start}>Start</button>
  ) : stars && item.rating ? (
    <span className="stars" role="img" aria-label={`Rated ${item.rating} out of 5`}>{'★'.repeat(item.rating)}{'☆'.repeat(Math.max(0, 5 - item.rating))}</span>
  ) : (
    <button className="act" disabled={busy} onClick={start}>Read again</button>
  )
}

// One owned book with its state line and one action.
export default function BookRow({ item, reads, onChange, onError }: ReadProps) {
  const status = readStatus(reads)
  return (
    <div className="book">
      <Cover item={item} />
      <div className="body">
        <Title item={item} />
        <div className="sub">{(openRead(reads) ? [seriesLabel(item) ?? item.author, status] : [item.author, seriesLabel(item), status]).filter(Boolean).join(' · ')}</div>
      </div>
      <ReadAction item={item} reads={reads} onChange={onChange} onError={onError} />
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
        {books.slice(1, 3).map((b, i) => <Cover key={b.id} item={b} className={`cover layer l${i + 1}`} />).reverse()}
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
