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
