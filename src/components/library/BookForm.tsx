import { useEffect, useRef, useState } from 'react'
import { addItem, boughtPatch, deleteItem, updateItem, type Item, type NewItem } from '../../lib/items'
import { searchBooks, type Candidate } from '../../lib/googleBooks'
import { parsePrice } from '../../lib/price'
import { normalizeUrl } from '../../lib/url'
import { todayISO, updateRead, type Read } from '../../lib/reads'
import TypePicker from '../TypePicker'

const LINK_ERR = 'Use a http or https link'
const text = (v: unknown) => (v == null ? '' : String(v))
const intOrNull = (s: string) => (s.trim() === '' ? null : /^\d+$/.test(s.trim()) ? Number(s) : undefined)

type Props = {
  initial: Partial<Item>
  collection: 'book' | 'manga'
  forms: string[]
  reads?: Read[] // the book's reads; the latest one's dates are editable
  onSaved: () => void // also called after a delete: the caller reloads
  onCancel: () => void
}

export default function BookForm({ initial, collection, forms, reads = [], onSaved, onCancel }: Props) {
  const latest = reads.length ? reads[reads.length - 1] : null
  const [v, setV] = useState({
    title: text(initial.title), author: text(initial.author), series: text(initial.series), number: text(initial.series_number),
    form: text(initial.form), genres: (initial.genres ?? []).join(', '), pages: text(initial.pages), language: text(initial.language),
    price: initial.price_cents != null ? (initial.price_cents / 100).toFixed(2).replace('.', ',') : '', store: text(initial.store),
    cover: text(initial.image_url), started: text(latest?.started_on), finished: text(latest?.finished_on),
  })
  const [rating, setRating] = useState(initial.rating ?? 0)
  const [own, setOwn] = useState(initial.bought ?? true)
  const [found, setFound] = useState<Candidate[] | null>(null)
  const [errs, setErrs] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [failure, setFailure] = useState('')
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => dialog.current?.showModal(), [])
  const set = (k: keyof typeof v) => (x: string) => setV((o) => ({ ...o, [k]: x }))

  const find = () => searchBooks(v.title).then(setFound)
  const pick = (c: Candidate) => {
    setV((o) => ({ ...o, title: c.title || o.title, author: c.authors.join(', ') || o.author,
      pages: c.pages != null ? String(c.pages) : o.pages, language: c.language ?? o.language, cover: c.cover ?? o.cover }))
    setFound(null)
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (saving) return
    const e2: Record<string, string> = {}
    if (!v.title.trim()) e2.title = 'Add a title'
    const cents = v.price.trim() ? parsePrice(v.price) : null
    if (cents === undefined) e2.price = 'Use a price like 12,99'
    const pages = intOrNull(v.pages), number = intOrNull(v.number)
    if (pages === undefined) e2.pages = 'Use a whole number'
    if (number === undefined) e2.number = 'Use a whole number'
    const cover = v.cover.trim() ? normalizeUrl(v.cover) : null
    if (v.cover.trim() && !cover) e2.cover = LINK_ERR
    setErrs(e2)
    if (Object.keys(e2).length) return
    const genres = v.genres.split(',').map((g) => g.trim()).filter(Boolean)
    const n = (s: string) => s.trim() || null
    const fields: NewItem = {
      title: v.title.trim(), author: n(v.author), series: n(v.series), series_number: number ?? null, form: n(v.form),
      genres: genres.length ? genres : null, pages: pages ?? null, language: n(v.language), price_cents: cents ?? null,
      store: n(v.store), image_url: cover, rating: rating || null,
      ...boughtPatch(own, initial.bought ? initial.bought_on ?? todayISO() : todayISO()),
    }
    run(async () => {
      if (initial.id) {
        await updateItem(initial.id, fields)
        const [s, f] = [n(v.started), n(v.finished)]
        if (own && latest && (s !== latest.started_on || f !== latest.finished_on)) await updateRead(latest.id, { started_on: s, finished_on: f })
      } else await addItem({ ...fields, collection })
    })
  }
  const run = (p: () => Promise<unknown>) => {
    setSaving(true); setFailure('')
    p().then(onSaved, (x) => { setFailure(x instanceof Error ? x.message : 'Something went wrong.'); setSaving(false) })
  }

  const field = (k: keyof typeof v, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <label>{label}<input value={v[k]} onChange={(e) => set(k)(e.target.value)} aria-invalid={!!errs[k]} {...props} /></label>
      {errs[k] && <small role="alert">{errs[k]}</small>}
    </div>
  )

  return (
    <dialog ref={dialog} className="modal bookform" aria-label={initial.id ? 'Edit book' : 'Add book'} onClose={onCancel}
      onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <form className="form" onSubmit={submit} noValidate>
        <div className="row head">
          <b>{initial.id ? 'Edit book' : 'Add book'}</b>
          <button type="button" className="close" aria-label="Close" onClick={onCancel}>✕</button>
        </div>
        {field('title', 'Title')}
        <button type="button" className="ghost" disabled={!v.title.trim()} onClick={find}>Find details</button>
        {found && (found.length === 0 ? <p>No matches. Fill in the details yourself.</p> : (
          <ul className="candidates" aria-label="Matches">
            {found.map((c, i) => (
              <li key={i}><button type="button" onClick={() => pick(c)}>
                {c.title}{c.authors.length > 0 && ` · ${c.authors.join(', ')}`}{c.year && ` · ${c.year}`}
              </button></li>
            ))}
          </ul>
        ))}
        {field('author', 'Author')}
        {field('series', 'Series')}
        {field('number', 'Number', { inputMode: 'numeric' })}
        <TypePicker label="Form" value={v.form} onChange={set('form')} types={forms} />
        {field('genres', 'Genres')}
        {field('pages', 'Pages', { inputMode: 'numeric' })}
        {field('language', 'Language')}
        {field('price', 'Price (€)')}
        {field('store', 'Store')}
        {field('cover', 'Cover URL')}
        <div role="group" aria-label="Rating" className="rating">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" aria-pressed={rating === n} aria-label={`${n} star${n === 1 ? '' : 's'}`}
              onClick={() => setRating(rating === n ? 0 : n)}>{n <= rating ? '★' : '☆'}</button>
          ))}
        </div>
        <div role="radiogroup" aria-label="Ownership" className="own">
          {[true, false].map((o) => (
            <label key={String(o)}><input type="radio" name="own" checked={own === o} onChange={() => setOwn(o)} />{o ? 'I own it' : 'I want it'}</label>
          ))}
        </div>
        {initial.id && own && latest && <>{field('started', 'Started on', { type: 'date' })}{field('finished', 'Finished on', { type: 'date' })}</>}
        {failure && <p role="alert">{failure}</p>}
        <button type="submit" disabled={saving}>Save</button>
        {initial.id && (confirming ? (
          <div className="row">
            <span>Delete this book?</span>
            <button type="button" disabled={saving} onClick={() => run(() => deleteItem(initial.id!))}>Yes</button>
            <button type="button" onClick={() => setConfirming(false)}>No</button>
          </div>
        ) : <button type="button" className="ghost" onClick={() => setConfirming(true)}>Delete</button>)}
      </form>
    </dialog>
  )
}
