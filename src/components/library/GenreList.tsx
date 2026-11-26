import { ownedInGenre } from '../../lib/library'
import { readState } from '../../lib/reads'
import { goBack, href, type Route } from '../../lib/route'
import { Cover } from './BookRow'
import { roman } from './SeriesPanel'
import { NightshadeArt } from './themes'
import { useLibraryData } from './useLibraryData'

const STATE = { reading: 'Reading', read: 'Read', unread: 'Not started' }
const shelf: Route = { name: 'library', kind: 'book', view: 'shelf' }

// #/genre/<g>: owned books and manga in one genre, per library-mockups/GenreList.html.
export default function GenreList({ genre }: { genre: string }) {
  const { data, failed, load } = useLibraryData()
  const list = data ? ownedInGenre(data.items, genre) : []
  const stateOf = (id: string) => readState(data?.reads.filter((r) => r.item_id === id) ?? [])
  const read = list.filter((i) => stateOf(i.id) === 'read').length
  const hl = (s: string) => <span className="hl">{s}</span>
  return (
    <div className="library theme-nightshade">
      <NightshadeArt />
      <div className="detail genre">
        <a className="back" href={href(shelf)} onClick={(e) => { e.preventDefault(); goBack(shelf) }}>‹ Back</a>
        <header>
          <div className="eyebrow">GENRE</div>
          <h1>{genre}</h1>
          <p className="lede">{data ? <>{hl(`${list.length} book${list.length === 1 ? '' : 's'}`)} you own in this genre, {hl(String(read))} read.</> : '…'}</p>
        </header>
        {failed ? <div><p>Couldn't load your library.</p><button onClick={load}>Try again</button></div> : (
          <div className="lib-list">
            {list.map((i) => {
              const manga = i.collection === 'manga'
              const n = i.series_number
              const series = i.series && `${i.series}${n != null ? ` ${manga ? n : roman(n)}` : ''}`
              return (
                <a key={i.id} className="book" href={href({ name: 'item', id: i.id, edit: false })}>
                  <Cover item={i} />
                  <span className="body">
                    <span className="title">{i.title}{manga && <span className="tag-manga">MANGA</span>}</span>
                    <span className="sub">{[i.author, series].filter(Boolean).join(' · ')}</span>
                  </span>
                  <span className={`state ${stateOf(i.id)}`}>{STATE[stateOf(i.id)]}</span>
                </a>
              )
            })}
            {data && list.length === 0 && <p className="foot">Nothing on your shelf in this genre.</p>}
          </div>
        )}
      </div>
    </div>
  )
}
