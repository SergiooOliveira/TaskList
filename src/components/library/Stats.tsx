import { useEffect, useState } from 'react'
import { formatEuro, listItems, type Item } from '../../lib/items'
import { listReads, type Read } from '../../lib/reads'
import { href } from '../../lib/route'
import { beforeApp, readingStats, spendingStats, years, type Pairs, type Year } from '../../lib/stats'
import { NightshadeArt } from './themes'

const num = new Intl.NumberFormat('pt-PT')
const MONTHS = Array.from({ length: 12 }, (_, m) => new Date(2000, m, 1).toLocaleString('en', { month: 'long' }))

const Big = ({ n, label }: { n: string; label: string }) => (
  <div className="stat-big"><b>{n}</b><span>{label}</span></div>
)

function Bars({ title, rows, fmt = num.format }: { title: string; rows: Pairs; fmt?: (n: number) => string }) {
  if (!rows.length) return null
  const max = Math.max(...rows.map((r) => r[1])) || 1
  return (
    <section aria-label={title}>
      <h3>{title}</h3>
      <ul className="stat-bars">
        {rows.map(([k, v]) => (
          <li key={k}><span>{k}</span><i style={{ width: `${(v / max) * 100}%` }} /><b>{fmt(v)}</b></li>
        ))}
      </ul>
    </section>
  )
}

function Reading({ items, reads, year }: { items: Item[]; reads: Read[]; year: Year }) {
  const s = readingStats(items, reads, year)
  const pre = beforeApp(items, reads)
  const max = Math.max(...s.perMonth, 1)
  return (
    <section aria-label="Reading">
      <h2>Reading</h2>
      {!s.books ? <p>No books finished in {year === 'all' ? 'total' : year} yet.</p> : (
        <>
          <div className="stat-row"><Big n={num.format(s.books)} label="books" /><Big n={num.format(s.pages)} label="pages" />
            {s.avgRating !== null && <Big n={String(s.avgRating)} label="average rating" />}</div>
          <ol className="stat-months" aria-label="Books finished per month">
            {s.perMonth.map((n, m) => (
              <li key={m}>
                <span className="sr-only">{MONTHS[m]}: {n}</span>
                <b aria-hidden="true">{n}</b><i aria-hidden="true" style={{ height: `${(n / max) * 100}%` }} /><span aria-hidden="true">{MONTHS[m][0]}</span>
              </li>
            ))}
          </ol>
          <div className="stat-covers">
            {s.finished.filter((i) => i.image_url).map((i, k) => <img key={k} src={i.image_url!} alt={i.title} />)}
          </div>
          <Bars title="Top genres" rows={s.topGenres} />
          {s.longest && <p>Longest: {s.longest.title} ({num.format(s.longest.pages!)} pages)</p>}
        </>
      )}
      {year === 'all' && (
        <section aria-label="Before the app">
          <h3>Before the app</h3>
          <p>{num.format(pre.books)} books · {num.format(pre.pages)} pages</p>
        </section>
      )}
    </section>
  )
}

function Spending({ items, year }: { items: Item[]; year: Year }) {
  const s = spendingStats(items, year)
  return (
    <section aria-label="Spending">
      <h2>Spending</h2>
      {!s.count ? <p>Nothing bought in {year === 'all' ? 'total' : year} yet.</p> : (
        <>
          <div className="stat-row"><Big n={formatEuro(s.total)} label="spent" /><Big n={formatEuro(s.average)} label={`average over ${num.format(s.count)}`} /></div>
          <Bars title="By store" rows={s.byStore} fmt={formatEuro} />
          <Bars title="By kind" rows={s.byKind} fmt={formatEuro} />
          <Bars title="By form" rows={s.byForm} fmt={formatEuro} />
          <Bars title="By genre" rows={s.byGenre} fmt={formatEuro} />
          <Bars title="Top authors" rows={s.topAuthors} />
          <Bars title="Top series" rows={s.topSeries} />
        </>
      )}
    </section>
  )
}

export default function Stats() {
  const [data, setData] = useState<{ items: Item[]; reads: Read[] } | null>(null)
  const [failed, setFailed] = useState(false)
  const [year, setYear] = useState<Year>('all')
  useEffect(() => {
    Promise.all([listItems(), listReads()]).then(([items, reads]) => setData({ items, reads }), () => setFailed(true))
  }, [])

  return (
    <div className="library theme-nightshade">
      <NightshadeArt />
      <header className="lib-head">
        <div>
          <a className="back" href={href({ name: 'library', kind: 'book', view: 'shelf' })}>‹ Library</a>
          <h1>Reading and spending</h1>
        </div>
      </header>
      {failed ? <p>Couldn’t load your library.</p> : !data ? <p>…</p> : (
        <>
          <label className="stat-year">Year{' '}
            <select value={String(year)} onChange={(e) => setYear(e.target.value === 'all' ? 'all' : Number(e.target.value))}>
              <option value="all">All time</option>
              {years(data.items, data.reads).map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </label>
          <Reading items={data.items} reads={data.reads} year={year} />
          <Spending items={data.items} year={year} />
        </>
      )}
    </div>
  )
}
