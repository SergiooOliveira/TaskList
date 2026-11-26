import { href, parseRoute } from './route'

it('parses hashes, unknown goes home', () => {
  expect(parseRoute('')).toEqual({ name: 'home' })
  expect(parseRoute('#/nope')).toEqual({ name: 'home' })
  expect(parseRoute('#/library/manga/wishlist')).toEqual({ name: 'library', kind: 'manga', view: 'wishlist' })
  expect(parseRoute('#/library/comic/shelf')).toEqual({ name: 'home' })
})

it('href round-trips every valid hash', () => {
  for (const x of ['#/', '#/wishlist', '#/library/book/shelf', '#/library/book/wishlist', '#/library/manga/shelf', '#/library/manga/wishlist', '#/library/stats'])
    expect(href(parseRoute(x))).toBe(x)
})

it('item, edit and genre routes round-trip, with encoding', () => {
  expect(parseRoute('#/item/abc')).toEqual({ name: 'item', id: 'abc', edit: false })
  expect(parseRoute('#/item/abc/edit')).toEqual({ name: 'item', id: 'abc', edit: true })
  expect(parseRoute('#/item/abc/nope')).toEqual({ name: 'home' })
  expect(parseRoute('#/genre/Young%20Adult%20Fiction')).toEqual({ name: 'genre', genre: 'Young Adult Fiction' })
  expect(parseRoute('#/genre/%E0%A4%A')).toEqual({ name: 'home' }) // malformed escape
  for (const r of [{ name: 'item', id: 'b-1', edit: false }, { name: 'item', id: 'b-1', edit: true }, { name: 'genre', genre: 'Sci/Fi & Fantasia' }] as const)
    expect(parseRoute(href(r))).toEqual(r)
})
