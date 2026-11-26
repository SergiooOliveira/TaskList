import { useSyncExternalStore } from 'react'

export type Kind = 'book' | 'manga'
export type Route =
  | { name: 'home' }
  | { name: 'wishlist' }
  | { name: 'library'; kind: Kind; view: 'shelf' | 'wishlist' }
  | { name: 'stats' }

export function parseRoute(hash: string): Route {
  const p = hash.replace(/^#\/?/, '').split('/')
  if (p[0] === 'wishlist' && p.length === 1) return { name: 'wishlist' }
  if (p[0] === 'library' && p[1] === 'stats' && p.length === 2) return { name: 'stats' }
  if (p[0] === 'library' && p.length === 3 && (p[1] === 'book' || p[1] === 'manga') && (p[2] === 'shelf' || p[2] === 'wishlist'))
    return { name: 'library', kind: p[1], view: p[2] }
  return { name: 'home' }
}

export function href(r: Route): string {
  switch (r.name) {
    case 'home': return '#/'
    case 'wishlist': return '#/wishlist'
    case 'stats': return '#/library/stats'
    case 'library': return `#/library/${r.kind}/${r.view}`
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
