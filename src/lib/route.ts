import { useSyncExternalStore } from 'react'

export type Kind = 'book' | 'manga'
export type Route =
  | { name: 'home' }
  | { name: 'wishlist' }
  | { name: 'library'; kind: Kind; view: 'shelf' | 'wishlist' }
  | { name: 'stats' }
  | { name: 'item'; id: string; edit: boolean }
  | { name: 'genre'; genre: string }

export function parseRoute(hash: string): Route {
  const p = hash.replace(/^#\/?/, '').split('/')
  if (p[0] === 'wishlist' && p.length === 1) return { name: 'wishlist' }
  if (p[0] === 'library' && p[1] === 'stats' && p.length === 2) return { name: 'stats' }
  if (p[0] === 'library' && p.length === 3 && (p[1] === 'book' || p[1] === 'manga') && (p[2] === 'shelf' || p[2] === 'wishlist'))
    return { name: 'library', kind: p[1], view: p[2] }
  try {
    if (p[0] === 'item' && p[1] && (p.length === 2 || (p.length === 3 && p[2] === 'edit')))
      return { name: 'item', id: decodeURIComponent(p[1]), edit: p.length === 3 }
    if (p[0] === 'genre' && p[1] && p.length === 2) return { name: 'genre', genre: decodeURIComponent(p[1]) }
  } catch { /* malformed escape: fall through to home */ }
  return { name: 'home' }
}

export function href(r: Route): string {
  switch (r.name) {
    case 'home': return '#/'
    case 'wishlist': return '#/wishlist'
    case 'stats': return '#/library/stats'
    case 'library': return `#/library/${r.kind}/${r.view}`
    case 'item': return `#/item/${encodeURIComponent(r.id)}${r.edit ? '/edit' : ''}`
    case 'genre': return `#/genre/${encodeURIComponent(r.genre)}`
  }
}

const sub = (cb: () => void) => {
  window.addEventListener('hashchange', cb)
  return () => window.removeEventListener('hashchange', cb)
}
const snap = () => window.location.hash

export function useRoute(): Route {
  return parseRoute(useSyncExternalStore(sub, snap))
}

// Back to the previous screen; a deep link (no in-app history) goes to the fallback instead.
export const goBack = (fallback: Route) => (history.length > 1 ? history.back() : location.replace(href(fallback)))
