import { useCallback, useEffect, useState } from 'react'
import { boughtPatch, formatEuro, listItems, updateItem, type Item } from '../../lib/items'
import { listReads, readState, todayISO, type Read } from '../../lib/reads'
import { forms, groupBooks, groupManga } from '../../lib/library'
import { href, type Kind } from '../../lib/route'
import SeriesPanel from './SeriesPanel'
import VolumePanel from './VolumePanel'
import BookRow, { SeriesRow, WantedBookRow } from './BookRow'
import { MangaShelfRow, MangaWishCard, sumCents } from './MangaRow'
import { HiganbanaArt, NightshadeArt } from './themes'

type View = 'shelf' | 'wishlist'
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

export default function Library({ kind, view }: { kind: Kind; view: View }) {
  const [data, setData] = useState<{ items: Item[]; reads: Read[] } | null>(null)
  const [failed, setFailed] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState<string | null>(null)
  const [panel, setPanel] = useState<{ kind: 'series' | 'volumes'; name: string } | null>(null)

  const load = useCallback(() => {
    setFailed(false)
    Promise.all([listItems(), listReads()]).then(([items, reads]) => setData({ items, reads }), () => setFailed(true))
  }, [])
  useEffect(load, [load])

  const fail = (e: unknown) => {
    setError(e instanceof Error ? e.message : 'Something went wrong.')
    setTimeout(() => setError(''), 4000)
  }
  const saveRead = (r: Read) => setData((d) => d && { ...d, reads: [...d.reads.filter((x) => x.id !== r.id), r] })
  const saveItems = (us: Item[]) => setData((d) => d && { ...d, items: d.items.map((x) => us.find((u) => u.id === x.id) ?? x) })
  const buy = (it: Item) => updateItem(it.id, boughtPatch(true, todayISO())).then((u) => saveItems([u]), fail)

  const mine = data?.items.filter((i) => i.collection === kind) ?? []
  const ids = new Set(mine.map((i) => i.id))
  const reads = data?.reads.filter((r) => ids.has(r.item_id)) ?? []
  const readsOf = (i: Item) => reads.filter((r) => r.item_id === i.id)
  const owned = mine.filter((i) => i.bought), wanted = mine.filter((i) => !i.bought)
  const allForms = forms(mine)
  const active = form && allForms.includes(form) ? form : null // a form that no longer exists falls back to All
  const shown = active ? mine.filter((i) => i.form?.toLowerCase() === active.toLowerCase()) : mine

  const hl = (s: string) => <span className="hl">{s}</span>
  const lede = !data ? '…'
    : view === 'wishlist' ? <>{hl(plural(wanted.length, kind === 'book' ? 'book' : 'volume'))} wanted, about {hl(formatEuro(sumCents(wanted)))}.</>
    : kind === 'book' ? <>{hl(plural(owned.length, 'book'))} on your shelf, {hl(String(owned.filter((i) => readState(readsOf(i)) === 'reading').length))} being read.</>
    : <>{hl(plural(owned.length, 'volume'))} from {hl(String(groupManga(mine, reads).filter((s) => s.owned.length).length))} series on your shelf.</>

  return (
    <div className={`library ${kind === 'book' ? 'theme-nightshade' : 'theme-higanbana'}`}>
      {kind === 'book' ? <NightshadeArt /> : <HiganbanaArt />}
      <header className="lib-head">
        <div>
          <a className="back" href={href({ name: 'home' })}>‹ Collections</a>
          <h1>Library</h1>
        </div>
        <div className="lib-actions">
          <a className="icon" href={href({ name: 'stats' })} aria-label="Reading and spending">
            <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="M3 17V9M8 17V4M13 17v-6M18 17V7" stroke="currentColor" strokeWidth="1.6" fill="none" /></svg>
          </a>
          {/* shortcut: + does nothing yet, BookForm arrives in Task 6 */}
          <button className="icon" aria-label={kind === 'book' ? 'Add a book' : 'Add a manga'}>+</button>
        </div>
      </header>
      <p className="lede">{lede}</p>
      <div role="tablist" aria-label="Kind" className="lib-tabs">
        {(['book', 'manga'] as const).map((k) => (
          <a key={k} role="tab" aria-selected={k === kind} href={href({ name: 'library', kind: k, view })}>{k === 'book' ? 'BOOKS' : 'MANGA'}</a>
        ))}
      </div>
      <div className="lib-bar">
        <div role="group" aria-label="Show" className="lib-switch">
          {(['shelf', 'wishlist'] as const).map((v) => (
            <a key={v} href={href({ name: 'library', kind, view: v })} aria-current={v === view ? 'page' : undefined}>
              {v === 'shelf' ? `Shelf · ${owned.length}` : `Wishlist · ${wanted.length}`}
            </a>
          ))}
        </div>
        {allForms.length > 0 && (
          <div role="group" aria-label="Form" className="lib-chips">
            {[null, ...allForms].map((f) => (
              <button key={f ?? ''} aria-pressed={active === f} onClick={() => setForm(f)}>{f ?? 'All'}</button>
            ))}
          </div>
        )}
      </div>
      {error && <p role="alert">{error}</p>}
      {failed ? (
        <div>
          <p>Couldn't load your library.</p>
          <button onClick={load}>Try again</button>
        </div>
      ) : data && (
        <div className="lib-list">
          {kind === 'book' && view === 'shelf' && <BookShelf items={shown} reads={reads} onChange={saveRead} onError={fail} onOpen={(name) => setPanel({ kind: 'series', name })} />}
          {kind === 'book' && view === 'wishlist' && <>
            {shown.filter((i) => !i.bought).map((i) => <WantedBookRow key={i.id} item={i} onBought={buy} />)}
            <p className="foot">{wanted.length ? 'Tick Bought and the book moves to your shelf.' : 'Nothing wanted yet.'}</p>
          </>}
          {kind === 'manga' && <MangaList series={groupManga(shown, reads)} view={view} onChoose={(name) => setPanel({ kind: 'volumes', name })} />}
        </div>
      )}
      {data && panel?.kind === 'series' && (() => {
        const group = groupBooks(mine, reads).series.find((s) => s.name === panel.name)
        // shortcut: + Add a book does nothing yet, BookForm arrives in Task 6
        return group && <SeriesPanel group={group} reads={reads} onClose={() => setPanel(null)} onChange={saveRead}
          onBought={(u) => saveItems([u])} onError={fail} onAddToSeries={() => {}} />
      })()}
      {data && panel?.kind === 'volumes' && (() => {
        const series = groupManga(mine, reads).find((s) => s.name === panel.name)
        return series && <VolumePanel series={series} onClose={() => setPanel(null)} onMoved={saveItems} onError={fail} />
      })()}
    </div>
  )
}

function BookShelf({ items, reads, onChange, onError, onOpen }: { items: Item[]; reads: Read[]; onChange: (r: Read) => void; onError: (e: unknown) => void; onOpen: (name: string) => void }) {
  const g = groupBooks(items, reads)
  const row = (i: Item) => <BookRow key={i.id} item={i} reads={reads.filter((r) => r.item_id === i.id)} onChange={onChange} onError={onError} />
  if (!g.reading.length && !g.series.length && !g.singles.length) return <p className="foot">Nothing on your shelf yet.</p>
  return <>
    {g.reading.length > 0 && <><h2>READING NOW</h2>{g.reading.map(row)}</>}
    {g.series.length > 0 && <><h2>SERIES</h2>{g.series.map((s) => <SeriesRow key={s.name} group={s} reads={reads} onOpen={() => onOpen(s.name)} />)}</>}
    {g.singles.length > 0 && <><h2>SINGLE BOOKS</h2>{g.singles.map(row)}</>}
  </>
}

function MangaList({ series, view, onChoose }: { series: ReturnType<typeof groupManga>; view: View; onChoose: (name: string) => void }) {
  const shelf = view === 'shelf'
  const list = series.filter((s) => (shelf ? s.owned : s.wanted).length > 0)
  return <>
    {list.map((s) => (shelf ? <MangaShelfRow key={s.name} s={s} /> : <MangaWishCard key={s.name} s={s} onChoose={() => onChoose(s.name)} />))}
    <p className="foot">{list.length === 0 ? (shelf ? 'Nothing on your shelf yet.' : 'Nothing wanted yet.') : shelf ? '' : 'Bought volumes move to your shelf.'}</p>
  </>
}
