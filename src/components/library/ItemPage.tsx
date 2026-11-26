import { useState } from 'react'
import type { Item } from '../../lib/items'
import { forms, nextInSeries, seriesGroup } from '../../lib/library'
import { goBack, href, type Route } from '../../lib/route'
import BookDetail from './BookDetail'
import BookForm from './BookForm'
import SeriesPanel from './SeriesPanel'
import { HiganbanaArt, NightshadeArt } from './themes'
import { useLibraryData } from './useLibraryData'

// #/item/<id> (details) and #/item/<id>/edit (full-screen form) for one book or manga volume.
export default function ItemPage({ id, edit }: { id: string; edit: boolean }) {
  const { data, failed, error, load, fail, saveRead, saveItems } = useLibraryData()
  const [panel, setPanel] = useState(false)
  const [adding, setAdding] = useState<Partial<Item> | null>(null) // "+ Add a book" from the series panel
  const item = data?.items.find((i) => i.id === id)
  const kind = item?.collection === 'manga' ? 'manga' : 'book'
  const mine = data?.items.filter((i) => i.collection === kind) ?? []
  const readsOf = (i: Item) => data?.reads.filter((r) => r.item_id === i.id) ?? []
  const self: Route = { name: 'item', id, edit: false }
  const shelf: Route = { name: 'library', kind, view: item && !item.bought ? 'wishlist' : 'shelf' }
  const form = !!item && (edit || !!adding)

  return (
    <div className={`library ${kind === 'book' ? 'theme-nightshade' : 'theme-higanbana'}`}>
      {form ? <div className="lib-art" aria-hidden="true" /> : kind === 'book' ? <NightshadeArt /> : <HiganbanaArt />}
      {error && <p role="alert">{error}</p>}
      {failed ? (
        <div><p>Couldn't load your library.</p><button onClick={load}>Try again</button></div>
      ) : !data ? null : !item ? (
        <div className="detail">
          <a className="back" href={href(shelf)}>‹ Library</a>
          <p className="gone">This book isn't in your library anymore.</p>
        </div>
      ) : adding ? (
        <BookForm initial={adding} collection={kind} forms={forms(mine)} onCancel={() => setAdding(null)} onSaved={() => { setAdding(null); load() }} />
      ) : edit ? (
        <BookForm initial={item} collection={kind} forms={forms(mine)} reads={readsOf(item)} onCancel={() => goBack(self)}
          onSaved={(deleted) => { if (deleted) location.replace(href(shelf)); else { load(); goBack(self) } }} />
      ) : <>
        <BookDetail item={item} reads={readsOf(item)} back={shelf} onSeries={() => setPanel(true)} onChange={saveRead} onError={fail} />
        {panel && item.series && <SeriesPanel group={seriesGroup(mine, data.reads, item.series, kind)} reads={data.reads}
          onClose={() => setPanel(false)} onChange={saveRead} onBought={(u) => saveItems([u])} onError={fail}
          onAddToSeries={(name, author) => setAdding({ series: name, author, bought: false, series_number: nextInSeries(mine, name) })} />}
      </>}
    </div>
  )
}
