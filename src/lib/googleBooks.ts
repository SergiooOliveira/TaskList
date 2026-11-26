export type Candidate = { title: string; authors: string[]; pages: number | null; language: string | null; cover: string | null; year: string | null }

const LANGS: Record<string, string> = { pt: 'Portuguese', en: 'English', es: 'Spanish', fr: 'French', ja: 'Japanese' }

export const isIsbn = (s: string) => /^(\d{9}[\dX]|\d{13})$/i.test(s.replace(/[\s-]/g, ''))

export function toCandidate(volume: unknown): Candidate {
  const v = ((volume as { volumeInfo?: Record<string, unknown> })?.volumeInfo ?? {}) as {
    title?: string; authors?: string[]; pageCount?: number; language?: string; publishedDate?: string
    imageLinks?: { thumbnail?: string; smallThumbnail?: string }
  }
  const cover = v.imageLinks?.thumbnail ?? v.imageLinks?.smallThumbnail
  return {
    title: v.title ?? '',
    authors: v.authors ?? [],
    pages: v.pageCount || null,
    language: v.language ? LANGS[v.language] ?? v.language : null,
    cover: cover ? cover.replace(/^http:/, 'https:') : null,
    year: v.publishedDate?.slice(0, 4) || null,
  }
}

// Google's own reason (e.g. "403: Requests from referer … are blocked") is shown so a bad key setup is diagnosable.
export type LookupError = { ok: false; reason: string }

export async function searchBooks(q: string): Promise<Candidate[] | LookupError> {
  try {
    const query = isIsbn(q) ? `isbn:${q.replace(/[\s-]/g, '')}` : `intitle:${q.trim()}`
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
