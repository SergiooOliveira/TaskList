import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { listItems, type Item } from '../lib/items'

export default function Home() {
  const [items, setItems] = useState<Item[] | null>(null)
  const [failed, setFailed] = useState(false)
  const load = useCallback(() => {
    setFailed(false)
    listItems().then(setItems, () => setFailed(true))
  }, [])
  useEffect(load, [load])
  const n = (f: (i: Item) => boolean) => items?.filter(f).length
  const wanted = n((i) => !i.collection && !i.bought)
  const owned = n((i) => !!i.collection && i.bought)
  const libWanted = n((i) => !!i.collection && !i.bought)
  return (
    <>
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
        <>
          <a className="item card" href="#/wishlist"><span className="name">Wishlist</span><span className="muted">{items ? `${wanted} wanted` : '…'}</span></a>
          <a className="item card" href="#/library/book/shelf"><span className="name">Library</span><span className="muted">{items ? `${owned} owned · ${libWanted} wanted` : '…'}</span></a>
        </>
      )}
    </>
  )
}
