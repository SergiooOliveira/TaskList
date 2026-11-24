import { useCallback, useEffect, useRef, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { addItem, applyPriceCheck, deleteItem, listItems, updateItem, type Item } from '../lib/items'
import { normalizeUrl, storeFromUrl } from '../lib/url'
import ItemRow from './ItemRow'
import ItemForm, { type FormValues } from './ItemForm'

export default function Wishlist({ session: _session }: { session: Session }) {
  const [items, setItems] = useState<Item[] | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)
  const [showBought, setShowBought] = useState(false)
  const [error, setError] = useState('')
  const [link, setLink] = useState('')
  const [linkErr, setLinkErr] = useState('')
  const [form, setForm] = useState<{ key: number; initial: Partial<Item>; id?: string } | null>(null)
  const opened = useRef(0) // a fresh key per opened form, so ItemForm never keeps another item's values

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

  // Stores block automated page reads, so the link just pre-fills a form you complete by hand.
  const startAdd = (e: React.FormEvent) => {
    e.preventDefault()
    const url = normalizeUrl(link)
    if (!url) return setLinkErr('Use a http or https link')
    setLinkErr('')
    setForm({ key: ++opened.current, initial: { url, store: storeFromUrl(url) } })
  }
  const save = (v: FormValues) => {
    const done = (u: Item) => {
      setItems((xs) => (form?.id ? xs && xs.map((x) => (x.id === u.id ? u : x)) : [u, ...(xs ?? [])]))
      setForm(null)
      setLink('')
      if (!form?.id) setShowBought(false)
    }
    const old = form?.id ? items?.find((x) => x.id === form.id) : undefined
    // A lower price typed by hand keeps the old one, so the row shows the drop; a higher or cleared price drops it.
    const patch = old && v.price_cents !== old.price_cents
      ? { ...v, ...(applyPriceCheck(old, v.price_cents ?? undefined) ?? { previous_price_cents: null }) }
      : v
    return (form?.id ? updateItem(form.id, patch) : addItem(v)).then(done, fail)
  }
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
      {form ? (
        <ItemForm key={form.key} initial={form.initial} onSave={save} onCancel={() => setForm(null)} />
      ) : (
        <form className="add" onSubmit={startAdd}>
          <input aria-label="Product link" placeholder="Paste a product link…" value={link} onChange={(e) => setLink(e.target.value)} />
          <button type="submit">Add</button>
          {linkErr && <small role="alert"> {linkErr}</small>}
        </form>
      )}
      {error && <p role="alert">{error}</p>}
      {loadFailed ? (
        <div>
          <p>Couldn't load your list. Try again.</p>
          <button onClick={load}>Try again</button>
        </div>
      ) : shown?.length === 0 ? (
        <p>{showBought ? 'Nothing bought yet.' : 'Nothing here yet. Paste a product link above.'}</p>
      ) : (
        shown?.map((it) => (
          <ItemRow key={it.id} item={it} onToggleBought={toggle} onEdit={(i) => setForm({ key: ++opened.current, initial: i, id: i.id })} onDelete={remove} />
        ))
      )}
    </>
  )
}
