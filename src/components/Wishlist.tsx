import { useCallback, useEffect, useRef, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { addItem, applyPriceCheck, deleteItem, fetchProduct, listItems, updateItem, type Item } from '../lib/items'
import { normalizeUrl, storeFromUrl } from '../../supabase/functions/_shared/url.ts'
import ItemRow from './ItemRow'
import ItemForm, { type FormValues } from './ItemForm'

export default function Wishlist({ session: _session }: { session: Session }) {
  const [items, setItems] = useState<Item[] | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)
  const [showBought, setShowBought] = useState(false)
  const [error, setError] = useState('')
  const [link, setLink] = useState('')
  const [linkErr, setLinkErr] = useState('')
  const [fetching, setFetching] = useState(false)
  const [form, setForm] = useState<{ key: number; initial: Partial<Item>; id?: string; note?: string } | null>(null)
  const opened = useRef(0) // bumps whenever a form opens; a stale fetch result must not replace a newer form
  const [progress, setProgress] = useState<{ n: number; total: number } | null>(null)
  const [unchecked, setUnchecked] = useState<Set<string>>(new Set())

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

  const startAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    const url = normalizeUrl(link)
    if (!url) return setLinkErr('Use a http or https link')
    setLinkErr('')
    setFetching(true)
    const token = ++opened.current
    const p = await fetchProduct(url)
    if (token !== opened.current) return
    setFetching(false)
    setForm({
      key: token,
      initial: { url, store: storeFromUrl(url), title: p.title ?? '', image_url: p.imageUrl ?? null, price_cents: p.priceCents ?? null },
      note: p.title || p.imageUrl || p.priceCents !== undefined ? undefined : "Couldn't read this page. Fill in the details.",
    })
  }
  const save = (v: FormValues) => {
    const done = (u: Item) => {
      setItems((xs) => (form?.id ? xs && xs.map((x) => (x.id === u.id ? u : x)) : [u, ...(xs ?? [])]))
      setForm(null)
      setLink('')
    }
    return (form?.id ? updateItem(form.id, v) : addItem(v)).then(done, fail)
  }
  const checkPrices = async () => {
    const todo = (items ?? []).filter((i) => !i.bought)
    setUnchecked(new Set())
    for (const [n, it] of todo.entries()) {
      setProgress({ n: n + 1, total: todo.length })
      try {
        const { priceCents } = await fetchProduct(it.url)
        const patch = applyPriceCheck(it, priceCents)
        if (!patch) setUnchecked((s) => new Set(s).add(it.id))
        else {
          const u = await updateItem(it.id, patch)
          setItems((xs) => xs && xs.map((x) => (x.id === u.id ? u : x)))
        }
      } catch (e) {
        fail(e)
      }
    }
    setProgress(null)
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
        {!showBought && (
          <button onClick={checkPrices} disabled={!!progress}>
            {progress ? `Checking ${progress.n} of ${progress.total}…` : 'Check prices'}
          </button>
        )}
        <button onClick={() => supabase.auth.signOut()}>Sign out</button>
      </div>
      {form ? (
        <ItemForm key={form.key} initial={form.initial} note={form.note} onSave={save} onCancel={() => setForm(null)} />
      ) : (
        <form className="add" onSubmit={startAdd}>
          <input aria-label="Product link" placeholder="Paste a product link…" value={link} onChange={(e) => setLink(e.target.value)} />
          <button type="submit" disabled={fetching}>Add</button>
          {fetching && <span> Fetching…</span>}
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
          <div key={it.id}>
            <ItemRow item={it} onToggleBought={toggle} onEdit={(i) => { setFetching(false); setForm({ key: ++opened.current, initial: i, id: i.id }) }} onDelete={remove} />
            {unchecked.has(it.id) && <span className="muted">Couldn't check</span>}
          </div>
        ))
      )}
    </>
  )
}
