// One-time import: node scripts/notion-import.mjs <csv> [coverBaseUrl] > import.sql
import { readFileSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import { pathToFileURL } from 'node:url'

export function parseCsv(text) {
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1)
  const rows = []
  let row = [], f = '', q = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++ } else q = false } else f += c
    } else if (c === '"') q = true
    else if (c === ',') { row.push(f); f = '' }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(f); f = ''; rows.push(row); row = []
    } else f += c
  }
  if (f !== '' || row.length) { row.push(f); rows.push(row) }
  return rows
}

const iso = (d) => { const m = /^(\d\d)\/(\d\d)\/(\d{4})$/.exec((d ?? '').trim()); return m ? `${m[3]}-${m[1]}-${m[2]}` : null }
const orNull = (s) => (s && s.trim() ? s.trim() : null)

export function mapRow(r, coverBase) {
  const title = (r['Book Title'] ?? '').trim()
  if (!title) return null
  const status = (r.Status ?? '').trim()
  const num = Number((r['Series Number'] ?? '').trim())
  const series = orNull(r['Collection / Series'])
  const hasSeries = series && series !== 'No Collection'
  const stars = (r.Rating ?? '').split('⭐').length - 1
  const price = (r.Price ?? '').replace(/[^0-9.]/g, '')
  const store = orNull(r.Bought)
  const genres = (r.Genre ?? '').split(',').map((g) => g.trim()).filter(Boolean)
  const cover = orNull(r.Cover)
  const type = (r.Type ?? '').trim()
  const item = {
    id: randomUUID(),
    title,
    author: orNull(r.Author),
    collection: type === 'Manga' ? 'manga' : 'book',
    form: type === 'Prose' ? 'Prose' : null,
    series: hasSeries ? series : null,
    series_number: hasSeries && num > 0 ? num : null,
    genres: genres.length ? genres : null,
    pages: r.Pages?.trim() ? Number(r.Pages) : null,
    language: orNull(r.Language),
    rating: stars >= 1 && stars <= 5 ? stars : null,
    store,
    price_cents: store === 'Gift' ? 0 : price ? Math.round(Number(price) * 100) : null,
    bought: status !== 'Wishlist',
    bought_on: null,
    image_url: cover && coverBase ? coverBase + cover : null,
  }
  let read = null
  if (status === 'Finished') read = { item_id: item.id, started_on: null, finished_on: null, before_app: true }
  else if (status === 'Currently Reading') read = { item_id: item.id, started_on: iso(r['Date Start']), finished_on: null, before_app: false }
  return { item, read }
}

const lit = (v) =>
  v === null || v === undefined ? 'NULL'
  : Array.isArray(v) ? `ARRAY[${v.map(lit).join(',')}]::text[]`
  : typeof v === 'number' ? String(v)
  : typeof v === 'boolean' ? String(v)
  : `'${String(v).replace(/'/g, "''")}'`

export function toSql(rows) {
  const out = ['begin;']
  for (const m of rows.filter(Boolean)) {
    const cols = Object.keys(m.item)
    out.push(`insert into items (user_id, ${cols.join(', ')}) values ((select id from auth.users limit 1), ${cols.map((c) => lit(m.item[c])).join(', ')});`)
    if (m.read) {
      const rc = Object.keys(m.read)
      out.push(`insert into reads (user_id, ${rc.join(', ')}) values ((select id from auth.users limit 1), ${rc.map((c) => lit(m.read[c])).join(', ')});`)
    }
  }
  out.push('commit;')
  return out.join('\n') + '\n'
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [file, coverBase] = process.argv.slice(2)
  if (!file) { console.error('usage: node scripts/notion-import.mjs <csv> [coverBaseUrl] > import.sql'); process.exit(1) }
  const [head, ...data] = parseCsv(readFileSync(file, 'utf8'))
  const rows = data.map((d) => mapRow(Object.fromEntries(head.map((h, i) => [h.trim(), d[i] ?? ''])), coverBase ?? null))
  process.stdout.write(toSql(rows))
}
