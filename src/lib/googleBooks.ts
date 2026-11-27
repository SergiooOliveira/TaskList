import { searchOpenLibrary } from './openLibrary'

export type Candidate = { title: string; authors: string[]; pages: number | null; language: string | null; cover: string | null; year: string | null; summary: string | null; isbn: string | null }

const LANGS: Record<string, string> = { pt: 'Portuguese', en: 'English', es: 'Spanish', fr: 'French', ja: 'Japanese' }

export const isIsbn = (s: string) => /^(\d{9}[\dX]|\d{13})$/i.test(s.replace(/[\s-]/g, ''))

// Google descriptions carry <p>/<b>/<br> and entities; DOMParser decodes them without running anything.
const plainText = (html: string) =>
  (new DOMParser().parseFromString(html.replace(/<br\s*\/?>|<\/p>/gi, '\n'), 'text/html').body.textContent ?? '').trim() || null

export function toCandidate(volume: unknown): Candidate {
  const v = ((volume as { volumeInfo?: Record<string, unknown> })?.volumeInfo ?? {}) as {
    title?: string; description?: string; authors?: string[]; pageCount?: number; language?: string; publishedDate?: string
    imageLinks?: { thumbnail?: string; smallThumbnail?: string }; industryIdentifiers?: { type: string; identifier: string }[]
  }
  const id = (t: string) => v.industryIdentifiers?.find((x) => x.type === t)?.identifier
  const cover = v.imageLinks?.thumbnail ?? v.imageLinks?.smallThumbnail
  return {
    title: v.title ?? '',
    authors: v.authors ?? [],
    pages: v.pageCount || null,
    // Google often tags Portuguese editions as pt-BR, so regional variants collapse to the base language.
    language: v.language ? LANGS[v.language.split('-')[0]] ?? v.language : null,
    cover: cover ? cover.replace(/^http:/, 'https:') : null,
    year: v.publishedDate?.slice(0, 4) || null,
    summary: v.description ? plainText(v.description) : null,
    isbn: id('ISBN_13') ?? id('ISBN_10') ?? null,
  }
}

// Google's own reason (e.g. "403: Requests from referer … are blocked") is shown so a bad key setup is diagnosable.
export type LookupError = { ok: false; reason: string }

export type SearchFields = { title: string; author?: string; series?: string; number?: string; language?: string }

// Volume-only titles ("Volume I", "Vol. 3", "Tomo 2") say nothing to Google, so those search by series + number instead.
const GENERIC = /^(vol(ume)?\.?|tomo|livro|book|n\.?º?)\s*[\divxlc]+$/i
const quoted = (s: string) => `"${s.replace(/"/g, '').trim()}"`

export function buildQuery({ title, author = '', series = '', number = '' }: SearchFields): string | null {
  const t = title.trim()
  if (isIsbn(t)) return `isbn:${t.replace(/[\s-]/g, '')}`
  const main = !t || GENERIC.test(t)
    ? [series.replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim(), number.trim()].filter(Boolean).join(' ')
    : `intitle:${quoted(t)}`
  if (!main) return null
  return author.trim() ? `${main} inauthor:${quoted(author)}` : main
}

const words = (...xs: string[]) => xs.map((x) => x.replace(/[^\p{L}\p{N}\s]/gu, ' ')).join(' ').replace(/\s+/g, ' ').trim()
const norm = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '').trim()
const langCode = (l: string) => Object.keys(LANGS).find((k) => k === norm(l) || norm(LANGS[k]) === norm(l))

// Same ISBN, or (when either lacks one) same title + first author: one book, so each field comes from whichever result has it.
const sameBook = (a: Candidate, b: Candidate) => a.isbn && b.isbn ? a.isbn === b.isbn
  : !!a.title && norm(a.title) === norm(b.title) && norm(a.authors[0] ?? '') === norm(b.authors[0] ?? '')
const longer = (a: string | null, b: string | null) => (b?.length ?? 0) > (a?.length ?? 0) ? b : a

export function mergeCandidates(cs: Candidate[]): Candidate[] {
  const out: Candidate[] = []
  for (const c of cs) {
    const i = out.findIndex((o) => sameBook(o, c))
    if (i < 0) { out.push({ ...c }); continue }
    const o = out[i]
    out[i] = { title: o.title || c.title, authors: o.authors.length ? o.authors : c.authors, pages: o.pages ?? c.pages, language: o.language ?? c.language,
      cover: o.cover ?? c.cover, year: o.year ?? c.year, summary: longer(o.summary, c.summary), isbn: o.isbn ?? c.isbn }
  }
  // Open Library's ISBN cover 404s (default=false) when it has none; BookMatches then shows "No cover".
  return out.map((c) => c.cover || !c.isbn ? c : { ...c, cover: `https://covers.openlibrary.org/b/isbn/${c.isbn}-M.jpg?default=false` })
}

// Best first (stable): has a title > language matches > has a cover > author matches > has a summary.
export function rankCandidates(cs: Candidate[], { author = '', language = '' }: SearchFields): Candidate[] {
  const a = norm(author), l = norm(language)
  const score = (c: Candidate) => [!!c.title, !!l && norm(c.language ?? '') === l, !!c.cover, !!a && norm(c.authors.join(' ')).includes(a), !!c.summary]
  return [...cs].sort((x, y) => {
    const [sx, sy] = [score(x), score(y)]
    const i = sx.findIndex((v, k) => v !== sy[k])
    return i < 0 ? 0 : Number(sy[i]) - Number(sx[i])
  })
}

// Several Google queries plus Open Library, in parallel, merged and ranked. Only if every request fails is it an error.
export async function findDetails(f: SearchFields): Promise<Candidate[] | LookupError> {
  const q = buildQuery(f)
  if (!q) return []
  const t = f.title.trim(), author = f.author?.trim() ?? '', series = f.series?.trim() ?? '', number = f.number?.trim() ?? ''
  let reqs: Promise<Candidate[] | LookupError>[]
  if (isIsbn(t)) reqs = [searchBooks(q), searchOpenLibrary({ isbn: t.replace(/[\s-]/g, '') })]
  else {
    const generic = !t || GENERIC.test(t)
    const bySeries = series ? words(series, number, author) : ''
    const lang = f.language ? langCode(f.language) : undefined
    const google = [...new Set([q, generic ? bySeries : words(t, author), bySeries].filter(Boolean))]
    reqs = [...google.map((x) => searchBooks(x)), ...(lang ? [searchBooks(q, lang)] : []),
      searchOpenLibrary(generic ? { q: words(series, number), author } : { title: t, author })]
  }
  const all = await Promise.all(reqs)
  const ok = all.filter((r): r is Candidate[] => Array.isArray(r))
  if (!ok.length) return { ok: false, reason: [...new Set(all.map((r) => (r as LookupError).reason))].join('; ') }
  return rankCandidates(mergeCandidates(ok.flat()), f).slice(0, 8)
}

export async function searchBooks(query: string, langRestrict?: string): Promise<Candidate[] | LookupError> {
  try {
    // Keyless calls share Google's global daily quota, which is usually exhausted; a referrer-restricted key is safe in the client.
    const key = import.meta.env.VITE_GOOGLE_BOOKS_KEY
    const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=5${langRestrict ? `&langRestrict=${langRestrict}` : ''}${key ? `&key=${encodeURIComponent(key)}` : ''}`)
    if (!res.ok) {
      const err = await res.json().catch(() => null) as { error?: { message?: string } } | null
      return { ok: false, reason: `${res.status}${err?.error?.message ? `: ${err.error.message}` : ''}` }
    }
    const body = await res.json() as { items?: unknown[] }
    return (body.items ?? []).map(toCandidate)
  } catch {
    return { ok: false, reason: 'network error' }
  }
}
