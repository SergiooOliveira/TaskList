export type Candidate = { title: string; authors: string[]; pages: number | null; language: string | null; cover: string | null; year: string | null; summary: string | null }

const LANGS: Record<string, string> = { pt: 'Portuguese', en: 'English', es: 'Spanish', fr: 'French', ja: 'Japanese' }

export const isIsbn = (s: string) => /^(\d{9}[\dX]|\d{13})$/i.test(s.replace(/[\s-]/g, ''))

// Google descriptions carry <p>/<b>/<br> and entities; DOMParser decodes them without running anything.
const plainText = (html: string) =>
  (new DOMParser().parseFromString(html.replace(/<br\s*\/?>|<\/p>/gi, '\n'), 'text/html').body.textContent ?? '').trim() || null

export function toCandidate(volume: unknown): Candidate {
  const v = ((volume as { volumeInfo?: Record<string, unknown> })?.volumeInfo ?? {}) as {
    title?: string; description?: string; authors?: string[]; pageCount?: number; language?: string; publishedDate?: string
    imageLinks?: { thumbnail?: string; smallThumbnail?: string }
  }
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
  }
}

// Google's own reason (e.g. "403: Requests from referer … are blocked") is shown so a bad key setup is diagnosable.
export type LookupError = { ok: false; reason: string }

export type SearchFields = { title: string; author?: string; series?: string; number?: string }

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

// Searches with the author first; if that finds nothing, tries again without it (Google's author names vary).
export async function findDetails(f: SearchFields): Promise<Candidate[] | LookupError> {
  const q = buildQuery(f)
  if (!q) return []
  const first = await searchBooks(q)
  if (Array.isArray(first) && first.length === 0 && f.author?.trim()) {
    const loose = buildQuery({ ...f, author: '' })
    if (loose && loose !== q) return searchBooks(loose)
  }
  return first
}

export async function searchBooks(query: string): Promise<Candidate[] | LookupError> {
  try {
    // Keyless calls share Google's global daily quota, which is usually exhausted; a referrer-restricted key is safe in the client.
    const key = import.meta.env.VITE_GOOGLE_BOOKS_KEY
    const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=5${key ? `&key=${encodeURIComponent(key)}` : ''}`)
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
