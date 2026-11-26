import { useCallback, useEffect, useRef, useState } from 'react'
import { addItem, applyPriceCheck, deleteItem, listItems, updateItem, type Item } from '../lib/items'
import ItemRow from './ItemRow'
import { typeColor } from '../lib/typeColor'
import ItemForm, { type FormValues } from './ItemForm'

export default function Wishlist() {
  const [items, setItems] = useState<Item[] | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)
  const [showBought, setShowBought] = useState(false)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [type, setType] = useState<string | null>(null)
  const [form, setForm] = useState<{ key: number; initial: Partial<Item>; id?: string } | null>(null)
  const opened = useRef(0) // a fresh key per opened form, so ItemForm never keeps another item's values

  const load = useCallback(() => {
    setLoadFailed(false)
    listItems().then((xs) => setItems(xs.filter((i) => i.collection === null)), () => setLoadFailed(true))
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

  const save = (v: FormValues) => {
    const done = (u: Item) => {
      setItems((xs) => (form?.id ? xs && xs.map((x) => (x.id === u.id ? u : x)) : [u, ...(xs ?? [])]))
      setForm(null)
      if (!form?.id) setShowBought(false)
    }
    const old = form?.id ? items?.find((x) => x.id === form.id) : undefined
    // A lower price typed by hand keeps the old one, so the row shows the drop; a higher or cleared price drops it.
    const patch = old && v.price_cents !== old.price_cents
      ? { ...v, ...(applyPriceCheck(old, v.price_cents ?? undefined) ?? { previous_price_cents: null }) }
      : v
    return (form?.id ? updateItem(form.id, patch) : addItem(v)).then(done, fail)
  }
  const q = query.trim().toLowerCase()
  // Types are free text, so "books" and "Books" count as one; the first spelling seen is shown.
  const byKey = new Map<string, string>()
  for (const i of items ?? []) if (i.category && !byKey.has(i.category.toLowerCase())) byKey.set(i.category.toLowerCase(), i.category)
  const types = [...byKey.values()].sort((a, b) => a.localeCompare(b))
  const active = type && types.includes(type) ? type : null // a type that no longer exists falls back to All
  const shown = items?.filter((i) => i.bought === showBought && i.title.toLowerCase().includes(q) &&
    (!active || i.category?.toLowerCase() === active.toLowerCase()))

  return (
    <>
      <div className="top">
        <b>Wishlist</b>
        <div className="seg">
          <button aria-pressed={!showBought} onClick={() => setShowBought(false)}>Not bought</button>
          <button aria-pressed={showBought} onClick={() => setShowBought(true)}>Bought</button>
        </div>
        <a href="#/">‹ Collections</a>
      </div>
      <div className="add">
        <input type="search" aria-label="Search" placeholder="Search…" value={query} onChange={(e) => setQuery(e.target.value)} />
        <button type="button" onClick={() => setForm({ key: ++opened.current, initial: {} })}>Add</button>
      </div>
      {types.length > 0 && (
        <div className="chips" role="group" aria-label="Filter by type">
          {[null, ...types].map((t) => (
            <button key={t ?? ''} aria-pressed={active === t} onClick={() => setType(t)}
              className={t ? 'tag-chip' : undefined} style={t ? ({ '--c': typeColor(t) } as React.CSSProperties) : undefined}>
              {t ?? 'All'}
            </button>
          ))}
        </div>
      )}
      {form && <ItemForm key={form.key} initial={form.initial} types={types} onSave={save} onCancel={() => setForm(null)} />}
      {error && <p role="alert">{error}</p>}
      {loadFailed ? (
        <div>
          <p>Couldn't load your list. Try again.</p>
          <button onClick={load}>Try again</button>
        </div>
      ) : shown?.length === 0 ? (
        <p>{q ? 'No items match.' : showBought ? 'Nothing bought yet.' : 'Nothing here yet. Tap Add to start.'}</p>
      ) : (
        shown?.map((it) => (
          <ItemRow key={it.id} item={it} onToggleBought={toggle} onEdit={(i) => setForm({ key: ++opened.current, initial: i, id: i.id })} onDelete={remove} />
        ))
      )}
    </>
  )
}
