import { useCallback, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { deleteItem, listItems, updateItem, type Item } from '../lib/items'
import ItemRow from './ItemRow'

export default function Wishlist({ session: _session }: { session: Session }) {
  const [items, setItems] = useState<Item[] | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)
  const [showBought, setShowBought] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    setLoadFailed(false)
    listItems().then(setItems, () => setLoadFailed(true))
  }, [])
  useEffect(load, [load])

  const fail = (e: unknown) => {
    setError(e instanceof Error ? e.message : 'Something went wrong.')
    setTimeout(() => setError(''), 4000)
  }
  const toggle = (it: Item) =>
    updateItem(it.id, { bought: !it.bought }).then(
      (u) => setItems((xs) => xs && xs.map((x) => (x.id === u.id ? u : x))),
      fail,
    )
  const remove = (it: Item) =>
    deleteItem(it.id).then(() => setItems((xs) => xs && xs.filter((x) => x.id !== it.id)), fail)

  const shown = items?.filter((i) => i.bought === showBought)

  return (
    <>
      <div className="top">
        <b>Wishlist</b>
        <div className="seg">
          <button aria-pressed={!showBought} onClick={() => setShowBought(false)}>Not bought</button>
          <button aria-pressed={showBought} onClick={() => setShowBought(true)}>Bought</button>
        </div>
        <button onClick={() => supabase.auth.signOut()}>Sign out</button>
      </div>
      {/* Task 6: the add bar goes here. */}
      {error && <p role="alert">{error}</p>}
      {loadFailed ? (
        <div>
          <p>Couldn't load your list. Try again.</p>
          <button onClick={load}>Try again</button>
        </div>
      ) : shown?.length === 0 ? (
        <p>{showBought ? 'Nothing bought yet.' : 'Nothing here yet. Paste a product link above.'}</p>
      ) : (
        shown?.map((it) => <ItemRow key={it.id} item={it} onToggleBought={toggle} onEdit={() => {}} onDelete={remove} />)
      )}
    </>
  )
}
