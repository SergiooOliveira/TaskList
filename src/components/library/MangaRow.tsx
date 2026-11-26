import { formatEuro } from '../../lib/items'
import type { MangaSeries } from '../../lib/library'
import { Cover } from './BookRow'

export const sumCents = (xs: { price_cents: number | null }[]) => xs.reduce((s, i) => s + (i.price_cents ?? 0), 0)

export function MangaShelfRow({ s, onOpen }: { s: MangaSeries; onOpen: () => void }) {
  const n = s.owned.length, known = n + s.wanted.length
  const read = s.read === n ? `all ${n} read` : s.read === 0 ? 'not started' : `${s.read} of ${n} read`
  return (
    <button type="button" className={`manga open${s.wanted.length ? ' hot' : ''}`} onClick={onOpen}>
      <Cover item={s.owned[0]} />
      <div className="body">
        <div className="title">{s.name}</div>
        <div className="sub">{[s.author, read].filter(Boolean).join(' · ')}</div>
        <div className="vbar" role="img" aria-label={`${n} owned of ${known} known volumes`}>
          <span style={{ flex: n }} />{s.wanted.length > 0 && <span className="want" style={{ flex: s.wanted.length }} />}
        </div>
        <div className="small">{s.wanted.length ? `${n} / ${known} volumes · ${s.wanted.length} on your wishlist` : `${n} volume${n === 1 ? '' : 's'}`}</div>
      </div>
    </button>
  )
}

export function MangaWishCard({ s, onChoose }: { s: MangaSeries; onChoose: () => void }) {
  const n = s.wanted.length
  return (
    <div className="manga hot">
      <Cover item={s.wanted[0]} />
      <div className="body">
        <div className="title">{s.name}</div>
        <div className="sub">{[s.author, s.wanted.find((i) => i.store)?.store].filter(Boolean).join(' · ')}</div>
        <div className="sum">
          <span>{n} volume{n === 1 ? '' : 's'}{s.range && <span className="muted"> · {s.range}</span>}</span>
          <span className="price">{formatEuro(sumCents(s.wanted))}</span>
        </div>
        <button className="choose" onClick={onChoose}>Choose volumes you bought <span aria-hidden="true">›</span></button>
      </div>
    </div>
  )
}
