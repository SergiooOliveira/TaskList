import type { Candidate, LookupError } from './googleBooks'

const LANGS: Record<string, string> = { por: 'Portuguese', eng: 'English', spa: 'Spanish', fre: 'French', fra: 'French', jpn: 'Japanese' }

type Doc = { title?: string; author_name?: string[]; number_of_pages_median?: number; first_publish_year?: number; language?: string[]; isbn?: string[]; cover_i?: number }

export function toCandidate(d: Doc): Candidate {
  const lang = d.language?.[0]
  return {
    title: d.title ?? '',
    authors: d.author_name ?? [],
    pages: d.number_of_pages_median || null,
    language: lang ? LANGS[lang] ?? lang : null,
    cover: d.cover_i ? `https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg` : null,
    year: d.first_publish_year ? String(d.first_publish_year) : null,
    summary: null, // search results carry no description
    isbn: d.isbn?.[0] ?? null,
  }
}

// No key and CORS is open. params: { isbn } or { title, author } or { q, author }.
export async function searchOpenLibrary(params: Record<string, string>): Promise<Candidate[] | LookupError> {
  try {
    const qs = new URLSearchParams({ ...Object.fromEntries(Object.entries(params).filter(([, v]) => v.trim())), limit: '5' })
    const res = await fetch(`https://openlibrary.org/search.json?${qs}`)
    if (!res.ok) return { ok: false, reason: `Open Library ${res.status}` }
    const body = await res.json() as { docs?: Doc[] }
    return (body.docs ?? []).map(toCandidate)
  } catch {
    return { ok: false, reason: 'network error' }
  }
}
