import { useState } from 'react'
import { dropPercent, formatEuro, type Item } from '../lib/items'
import { typeColor } from '../lib/typeColor'

type Props = {
  item: Item
  onToggleBought: (item: Item) => void
  onEdit: (item: Item) => void
  onDelete: (item: Item) => void
}

export default function ItemRow({ item, onToggleBought, onEdit, onDelete }: Props) {
  const [brokenUrl, setBrokenUrl] = useState<string | null>(null) // remembers which URL failed, so a new URL retries
  const [confirming, setConfirming] = useState(false)
  const { price_cents: cur, previous_price_cents: prev } = item
  const dropped = cur !== null && prev !== null && prev > cur

  return (
    <div className="item">
      {item.image_url && item.image_url !== brokenUrl ? (
        <img className="thumb" src={item.image_url} alt="" onError={() => setBrokenUrl(item.image_url)} />
      ) : (
        <div className="thumb" aria-hidden="true">{item.title.charAt(0).toUpperCase()}</div>
      )}
      <div className="name">
        <a href={item.url} target="_blank" rel="noopener noreferrer">{item.title}</a>
        <div className="meta">
          {item.store && <span className="store">{item.store}</span>}
          {item.category && <span className="tag" style={{ '--c': typeColor(item.category) } as React.CSSProperties}>{item.category}</span>}
          {cur !== null && <span className="price">{formatEuro(cur)}</span>}
          {dropped && (
            <>
              <s className="was">{formatEuro(prev)}</s>
              <span className="drop">−{dropPercent(prev, cur)}%</span>
            </>
          )}
        </div>
      </div>
      <div className="actions">
        {confirming ? (
          <>
            <span>Delete?</span>
            <button onClick={() => onDelete(item)}>Yes</button>
            <button onClick={() => setConfirming(false)}>No</button>
          </>
        ) : (
          <>
            <input type="checkbox" className="box" aria-label="Bought" checked={item.bought} onChange={() => onToggleBought(item)} />
            <button aria-label="Edit" onClick={() => onEdit(item)}>✎</button>
            <button aria-label="Delete" onClick={() => setConfirming(true)}>🗑</button>
          </>
        )}
      </div>
    </div>
  )
}
