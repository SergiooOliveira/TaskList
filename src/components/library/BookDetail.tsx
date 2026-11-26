import { useState } from 'react'
import type { Item } from '../../lib/items'
import { openRead, type Read } from '../../lib/reads'
import { href, type Route } from '../../lib/route'
import { Cover, ReadAction, readStatus } from './BookRow'
import { roman } from './SeriesPanel'

// shortcut: "long" is guessed from length (jsdom can't measure a clamp); measure scrollHeight if short texts get a needless toggle.
const LONG = 220
const num = new Intl.NumberFormat('pt-PT')

type Props = { item: Item; reads: Read[]; back: Route; onSeries: () => void; onChange: (r: Read) => void; onError: (e: unknown) => void }

// Read-only details per library-mockups/BookDetail.html. Price and store live in the edit form only.
export default function BookDetail({ item, reads, back, onSeries, onChange, onError }: Props) {
  const [more, setMore] = useState(false)
  const n = item.series_number
  const status = readStatus(reads)
  const line = !item.bought ? 'On your wishlist' : openRead(reads) ? `Reading ${status}` : status[0].toUpperCase() + status.slice(1)
  const rating = item.rating ?? 0
  const rows: [string, React.ReactNode][] = [
    ['Pages', item.pages ? num.format(item.pages) : null],
    ['Genres', item.genres?.length ? <span className="pills">{item.genres.map((g) => <a key={g} href={href({ name: 'genre', genre: g })}>{g}</a>)}</span> : null],
    ['Language', item.language],
    ['Form', item.form],
  ]
  return (
    <article className="detail">
      <div className="detail-bar">
        <a className="back" href={href(back)}>‹ Library</a>
        <a className="pill-btn" href={href({ name: 'item', id: item.id, edit: true })}>
          <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>Edit
        </a>
      </div>
      <header>
        <h1>{item.title}</h1>
        {item.author && <div className="by">{item.author}</div>}
        {item.series && (
          <button type="button" className="series-link" onClick={onSeries}>
            {item.series}{n != null && ` · ${item.collection === 'manga' ? n : roman(n)}`} <span aria-hidden="true">›</span>
          </button>
        )}
      </header>
      <div className={`hero${more ? ' open' : ''}`}>
        <Cover item={item} />
        {item.summary && (
          <div className="summary">
            <p>{item.summary}</p>
            {item.summary.length > LONG && <button type="button" aria-expanded={more} onClick={() => setMore(!more)}>{more ? 'Read less' : 'Read more'}</button>}
          </div>
        )}
      </div>
      <div className="read-card">
        <div>
          <div className="state">{line}</div>
          {item.bought && <div className="stars" role="img" aria-label={rating ? `Rated ${rating} out of 5` : 'Not rated yet'}>
            {'★'.repeat(rating)}<span className="dim">{'★'.repeat(5 - rating)}</span>
          </div>}
        </div>
        {item.bought && <ReadAction item={item} reads={reads} onChange={onChange} onError={onError} stars={false} />}
      </div>
      <dl>
        {rows.filter(([, v]) => v).map(([k, v]) => <div key={k}><dt>{k.toUpperCase()}</dt><dd>{v}</dd></div>)}
      </dl>
    </article>
  )
}
