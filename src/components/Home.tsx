import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { listItems, type Item } from '../lib/items'

export default function Home() {
  const [items, setItems] = useState<Item[]>([])
  useEffect(() => { listItems().then(setItems, () => {}) }, [])
  const n = (f: (i: Item) => boolean) => items.filter(f).length
  const wanted = n((i) => !i.collection && !i.bought)
  const owned = n((i) => !!i.collection && i.bought)
  const libWanted = n((i) => !!i.collection && !i.bought)
  return (
    <>
      <div className="top">
        <b>Collections</b>
        <button onClick={() => supabase.auth.signOut()}>Sign out</button>
      </div>
      <a className="item card" href="#/wishlist"><span className="name">Wishlist</span><span className="muted">{wanted} wanted</span></a>
      <a className="item card" href="#/library/book/shelf"><span className="name">Library</span><span className="muted">{owned} owned · {libWanted} wanted</span></a>
    </>
  )
}
