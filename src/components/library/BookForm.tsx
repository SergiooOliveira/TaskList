import { useState } from 'react'
import { addItem, deleteItem, updateItem, type Item, type NewItem } from '../../lib/items'
import { searchBooks, type Candidate, type LookupError } from '../../lib/googleBooks'
import BookMatches from './BookMatches'
import { parsePrice } from '../../lib/price'
import { normalizeUrl } from '../../lib/url'
import { todayISO, updateRead, type Read } from '../../lib/reads'
import TypePicker from '../TypePicker'

const LINK_ERR = 'Use a http or https link'
const text = (v: unknown) => (v == null ? '' : String(v))
const intOrNull = (s: string) => (s.trim() === '' ? null : /^\d+$/.test(s.trim()) ? Number(s) : undefined)

// The open read, else the one with the latest date; before-the-app reads (no dates) come last. listReads has no order.
const latestRead = (rs: Read[]) => [...rs].sort((a, b) => Number(!b.finished_on && !b.before_app) - Number(!a.finished_on && !a.before_app)
  || (b.finished_on ?? b.started_on ?? '').localeCompare(a.finished_on ?? a.started_on ?? ''))[0] ?? null

type Props = {
  initial: Partial<Item>
  collection: 'book' | 'manga'
  forms: string[]
  reads?: Read[] // the book's reads; the latest one's dates are editable
  onSaved: (deleted: boolean) => void // the caller reloads
  onCancel: () => void
}

export default function BookForm({ initial, collection, forms, reads = [], onSaved, onCancel }: Props) {
  const latest = latestRead(reads)
  const [v, setV] = useState({
    title: text(initial.title), author: text(initial.author), series: text(initial.series), number: text(initial.series_number),
    form: text(initial.form), genres: (initial.genres ?? []).join(', '), pages: text(initial.pages), language: text(initial.language),
    price: initial.price_cents != null ? (initial.price_cents / 100).toFixed(2).replace('.', ',') : '', store: text(initial.store),
    cover: text(initial.image_url), link: text(initial.url), summary: text(initial.summary), started: text(latest?.started_on), finished: text(latest?.finished_on),
  })
  const [rating, setRating] = useState(initial.rating ?? 0)
  const [own, setOwn] = useState(initial.bought ?? true)
  const [found, setFound] = useState<Candidate[] | LookupError | null>(null)
  const [errs, setErrs] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [failure, setFailure] = useState('')
  const set = (k: keyof typeof v) => (x: string) => setV((o) => ({ ...o, [k]: x }))

  const find = () => searchBooks(v.title).then(setFound)
  const pick = (c: Candidate) => {
    setV((o) => ({ ...o, title: c.title || o.title, author: c.authors.join(', ') || o.author,
      pages: c.pages != null ? String(c.pages) : o.pages, language: c.language ?? o.language, cover: c.cover ?? o.cover,
      summary: o.summary.trim() ? o.summary : c.summary ?? '' })) // never overwrite a summary the user already has
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
    const url = v.link.trim() ? normalizeUrl(v.link) : null
    if (v.link.trim() && !url) e2.link = LINK_ERR
    if (initial.id && own && latest) {
      if (v.finished && !v.started) e2.started = 'Add a start date first'
      else if (v.finished && v.started > v.finished) e2.finished = "Finish can't be before start"
    }
    setErrs(e2)
    if (Object.keys(e2).length) return
    const genres = v.genres.split(',').map((g) => g.trim()).filter(Boolean)
    const n = (s: string) => s.trim() || null
    const fields: NewItem = {
      title: v.title.trim(), author: n(v.author), series: n(v.series), series_number: number ?? null, form: n(v.form),
      genres: genres.length ? genres : null, pages: pages ?? null, language: n(v.language), price_cents: cents ?? null,
      store: n(v.store), url, image_url: cover, summary: n(v.summary), rating: rating || null,
      bought: own, bought_on: own ? (initial.bought ? initial.bought_on ?? null : todayISO()) : null, // owned stays as-is (imports have no date)
    }
    run(async () => {
      if (initial.id) {
        await updateItem(initial.id, fields)
        const [s, f] = [n(v.started), n(v.finished)]
        if (own && latest && (s !== latest.started_on || f !== latest.finished_on)) await updateRead(latest.id, { started_on: s, finished_on: f, ...(latest.before_app && { before_app: false }) })
      } else await addItem({ ...fields, collection })
    })
  }
  const run = (p: () => Promise<unknown>, deleted = false) => {
    setSaving(true); setFailure('')
    p().then(() => onSaved(deleted), (x) => { setFailure(x instanceof Error ? x.message : 'Something went wrong.'); setSaving(false) })
  }

  const err = (k: string) => errs[k] && <small role="alert">{errs[k]}</small>
  const field = (k: keyof typeof v, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <label>{label}<input value={v[k]} onChange={(e) => set(k)(e.target.value)} aria-invalid={!!errs[k]} {...props} /></label>
      {err(k)}
    </div>
  )
  const name = initial.id ? 'Edit book' : 'Add book'

  return (
    <form className="form bookform" aria-label={name} onSubmit={submit} noValidate>
      <header className="edit-head">
        <button type="button" className="cancel" onClick={onCancel}>Cancel</button>
        <h1>{name}</h1>
        <button type="submit" disabled={saving}>Save</button>
      </header>
      <div className="edit-top">
        {v.cover.trim() ? <img className="cover-preview" src={v.cover.trim()} alt="Cover preview" /> : <span className="cover-preview" aria-hidden="true" />}
        <div className="edit-title">
          {field('title', 'Title')}
          <button type="button" className="ghost" disabled={!v.title.trim()} onClick={find}>Find details</button>
        </div>
      </div>
      {found && <BookMatches found={found} onPick={pick} />}
      <section>
        <h2>BOOK</h2>
        {field('author', 'Author')}
        <div className="pair narrow">{field('series', 'Series')}{field('number', 'Number', { inputMode: 'numeric' })}</div>
        <label>Summary<textarea rows={4} value={v.summary} onChange={(e) => set('summary')(e.target.value)} /></label>
      </section>
      <section>
        <h2>DETAILS</h2>
        <div className="pair"><TypePicker label="Form" value={v.form} onChange={set('form')} types={forms} />{field('pages', 'Pages', { inputMode: 'numeric' })}</div>
        {field('genres', 'Genres')}
        <div className="pair">{field('language', 'Language')}{field('cover', 'Cover URL', { inputMode: 'url' })}</div>
      </section>
      <section>
        <h2>MY COPY</h2>
        <div role="group" aria-label="Ownership" className="lib-switch own">
          {[true, false].map((o) => (
            <button key={String(o)} type="button" aria-pressed={own === o} onClick={() => setOwn(o)}>{o ? 'I own it' : 'I want it'}</button>
          ))}
        </div>
        <div className="pair">{field('price', own ? 'Price paid (€)' : 'Price (€)')}{field('store', 'Store')}</div>
        {field('link', 'Shop link', { inputMode: 'url' })}
        {initial.id && own && latest && <div className="pair">{field('started', 'Started on', { type: 'date' })}{field('finished', 'Finished on', { type: 'date' })}</div>}
        <div role="group" aria-label="Rating" className="rating">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" aria-pressed={rating === n} aria-label={`${n} star${n === 1 ? '' : 's'}`}
              className={n <= rating ? 'on' : undefined} onClick={() => setRating(rating === n ? 0 : n)}>★</button>
          ))}
        </div>
      </section>
      {failure && <p role="alert">{failure}</p>}
      {initial.id && (confirming ? (
        <div className="row confirm">
          <span>Delete this book?</span>
          <button type="button" className="danger" disabled={saving} onClick={() => run(() => deleteItem(initial.id!), true)}>Yes</button>
          <button type="button" onClick={() => setConfirming(false)}>No</button>
        </div>
      ) : <button type="button" className="danger" onClick={() => setConfirming(true)}>Delete this book</button>)}
    </form>
  )
}
