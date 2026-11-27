import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { listItems, type Item } from '../lib/items'
import './Home.css'

// Thin-line icons: stroke only, so they stay plain black & white.
const Icon = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
)
const HEART = 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z'
const BOOK = 'M3 5.5c3-1.3 6-1.3 9 .5 3-1.8 6-1.8 9-.5V19c-3-1.3-6-1.3-9 .5-3-1.8-6-1.8-9-.5zM12 6v13.5'
const VOLUMES = 'M4 4h3v16H4zM8.5 4h3v16h-3zM13.5 5.2l2.9-.8 4 15.4-2.9.8zM4 7.5h3M8.5 7.5h3M4 16.5h3M8.5 16.5h3'
const BARS = 'M4 20h16M6.5 20v-6M11 20V8M15.5 20v-9M20 20V5'

const Card = ({ href, icon, label, line }: { href: string; icon: string; label: string; line: ReactNode }) => (
  <a className="home-card" href={href}><Icon d={icon} /><span className="home-label">{label}</span><span className="home-line">{line}</span></a>
)

export default function Home() {
  const [items, setItems] = useState<Item[] | null>(null)
  const [failed, setFailed] = useState(false)
  const load = useCallback(() => {
    setFailed(false)
    listItems().then(setItems, () => setFailed(true))
  }, [])
  useEffect(load, [load])
  const n = (f: (i: Item) => boolean) => items?.filter(f).length
  const lib = (c: Item['collection']) => items ? `${n((i) => i.collection === c && i.bought)} owned · ${n((i) => i.collection === c && !i.bought)} wanted` : '…'
  return (
    <div className="home">
      <div className="top">
        <b>Collections</b>
        <button onClick={() => supabase.auth.signOut()}>Sign out</button>
      </div>
      {failed ? (
        <div>
          <p>Couldn't load your collections.</p>
          <button onClick={load}>Try again</button>
        </div>
      ) : (
        <nav className="home-grid">
          <Card href="#/wishlist" icon={HEART} label="Wishlist" line={items ? `${n((i) => !i.collection && !i.bought)} wanted` : '…'} />
          <Card href="#/library/book/shelf" icon={BOOK} label="Books" line={lib('book')} />
          <Card href="#/library/manga/shelf" icon={VOLUMES} label="Manga" line={lib('manga')} />
          <Card href="#/library/stats" icon={BARS} label="Stats" line="Reading & spending" />
        </nav>
      )}
    </div>
  )
}
