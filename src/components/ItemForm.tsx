import { useEffect, useRef, useState } from 'react'
import { parsePrice } from '../lib/price'
import { normalizeUrl, storeFromUrl } from '../lib/url'
import type { Item } from '../lib/items'

export type FormValues = Pick<Item, 'url' | 'title' | 'image_url' | 'store' | 'price_cents' | 'category'>
const LINK_ERR = 'Use a http or https link'

export default function ItemForm({ initial, types = [], onSave, onCancel }: {
  initial: Partial<Item>
  types?: string[]
  onSave: (v: FormValues) => void | Promise<unknown>
  onCancel: () => void
}) {
  const [url, setUrl] = useState(initial.url ?? '')
  const [title, setTitle] = useState(initial.title ?? '')
  const [price, setPrice] = useState(initial.price_cents != null ? (initial.price_cents / 100).toFixed(2).replace('.', ',') : '')
  const [image, setImage] = useState(initial.image_url ?? '')
  const [category, setCategory] = useState(initial.category ?? '')
  const [saving, setSaving] = useState(false)
  const [errs, setErrs] = useState<Record<string, string>>({})
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => dialog.current?.showModal(), [])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const e2: Record<string, string> = {}
    const u = normalizeUrl(url)
    if (!u) e2.url = LINK_ERR
    if (!title.trim()) e2.title = 'Add a name'
    const cents = price.trim() ? parsePrice(price) : null
    if (cents === undefined) e2.price = 'Use a price like 12,99'
    const img = image.trim() ? normalizeUrl(image) : null
    if (image.trim() && !img) e2.image = LINK_ERR
    setErrs(e2)
    if (Object.keys(e2).length || !u || cents === undefined) return
    if (saving) return
    setSaving(true)
    Promise.resolve(onSave({ url: u, title: title.trim(), image_url: img, store: storeFromUrl(u), price_cents: cents, category: category.trim() || null }))
      .finally(() => setSaving(false)) // re-enable on failure; on success the form unmounts
  }

  const field = (key: string, label: string, value: string, set: (v: string) => void, list?: string) => (
    <div>
      <label>
        {label}
        <input value={value} onChange={(e) => set(e.target.value)} aria-invalid={!!errs[key]} list={list} />
      </label>
      {errs[key] && <small role="alert">{errs[key]}</small>}
    </div>
  )

  return (
    // Native modal dialog: traps focus, closes on Esc; a tap on the backdrop closes it too.
    <dialog ref={dialog} className="modal" aria-label={initial.id ? 'Edit item' : 'Add item'} onClose={onCancel}
      onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <form className="form" onSubmit={submit} noValidate>
        <div className="row head">
          <b>{initial.id ? 'Edit item' : 'Add item'}</b>
          <button type="button" className="close" aria-label="Close" onClick={onCancel}>✕</button>
        </div>
        {field('url', 'Link', url, setUrl)}
        {field('title', 'Name', title, setTitle)}
        {field('price', 'Price (€)', price, setPrice)}
        {field('category', 'Type', category, setCategory, 'types')}
        <datalist id="types">{types.map((t) => <option key={t} value={t} />)}</datalist>
        {field('image', 'Picture URL', image, setImage)}
        <button type="submit" disabled={saving}>Save</button>
      </form>
    </dialog>
  )
}
