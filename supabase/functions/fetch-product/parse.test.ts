import { readFileSync } from 'node:fs'
import { parsePrice, parseProduct } from './parse'

const fx = (n: string) => readFileSync(`supabase/functions/fetch-product/fixtures/${n}.html`, 'utf8')

it('parse re-exports parsePrice', () => expect(parsePrice('1.299,99')).toBe(129999))

it('reads og tags and JSON-LD offers.price', () => {
  const html = `<meta property="og:title" content="Kindle"><meta property="og:image" content="https://x/k.jpg">
    <script type="application/ld+json">{"@type":"Product","offers":{"price":"169.99"}}</script>`
  expect(parseProduct(html)).toEqual({ title: 'Kindle', imageUrl: 'https://x/k.jpg', priceCents: 16999 })
})
it('falls back to <title> and product:price:amount', () => {
  const html = `<title>Foo &amp; Bar</title><meta content="12,50" property="product:price:amount">`
  expect(parseProduct(html)).toEqual({ title: 'Foo & Bar', priceCents: 1250 })
})
it('handles JSON-LD @graph arrays and offers arrays', () => {
  const g = `<script type="application/ld+json">{"@graph":[{"@type":"WebPage"},{"@type":["Product"],"offers":[{"price":"5.5"}]}]}</script>`
  expect(parseProduct(g).priceCents).toBe(550)
  const a = `<script type="application/ld+json">[{"@type":"Product","offers":{"@type":"AggregateOffer","lowPrice":"7"}}]</script>`
  expect(parseProduct(a).priceCents).toBe(700)
})
it('returns {} for a page with nothing', () => expect(parseProduct('<html></html>')).toEqual({}))

it('fnac fixture', () => expect(parseProduct(fx('fnac'))).toEqual({
  title: 'Kindle Paperwhite 16GB & Capa', imageUrl: 'https://static.fnac-static.com/multimedia/kindle.jpg', priceCents: 17999 }))
it('worten fixture', () => expect(parseProduct(fx('worten'))).toEqual({
  title: 'Auscultadores Sony WH-1000XM5', imageUrl: 'https://www.worten.pt/i/sony-xm5.jpg', priceCents: 129990 }))
it('amazon fixture', () => expect(parseProduct(fx('amazon'))).toEqual({
  title: 'Amazon.es: Cafetera Nespresso Vertuo', imageUrl: 'https://m.media-amazon.com/images/I/nespresso.jpg', priceCents: 129999 }))
it('blocked fixture', () => expect(parseProduct(fx('blocked'))).toEqual({}))
it('invalid numeric entity does not throw', () =>
  expect(parseProduct('<meta property="og:title" content="A&#1114112;B">')).toEqual({ title: 'A&#1114112;B' }))
it('does not trust <title> without product signals', () =>
  expect(parseProduct('<title>Just a moment...</title>')).toEqual({}))

it.each([['29.9900', 2999], ['1299.000', 129900]])('JSON-LD machine price %s = %i cents', (p, c) =>
  expect(parseProduct(`<script type="application/ld+json">{"@type":"Product","offers":{"price":"${p}"}}</script>`).priceCents).toBe(c))
