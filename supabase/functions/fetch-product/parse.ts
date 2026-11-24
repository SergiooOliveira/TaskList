import { parsePrice } from '../_shared/price.ts'

export { parsePrice }
export type Product = { title?: string; imageUrl?: string; priceCents?: number }

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' }
const cp = (n: number, orig: string) => (n >= 0 && n <= 0x10ffff ? String.fromCodePoint(n) : orig)
const decode = (s: string) =>
  s.replace(/&(?:#(\d+)|#x([0-9a-f]+)|(\w+));/gi, (m, d, h, n) =>
    d || h ? cp(d ? +d : parseInt(h, 16), m) : (ENTITIES[n.toLowerCase()] ?? m))

function meta(html: string, key: string): string | undefined {
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const attr = (n: string) => tag.match(new RegExp(`\\b${n}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i'))
    const k = attr('property') ?? attr('name')
    const c = attr('content')
    if (k && c && (k[1] ?? k[2]).toLowerCase() === key) return decode(c[1] ?? c[2]).trim() || undefined
  }
}

// deno-lint-ignore no-explicit-any
function findProduct(node: any): any {
  if (Array.isArray(node)) {
    for (const n of node) { const p = findProduct(n); if (p) return p }
    return
  }
  if (!node || typeof node !== 'object') return
  if ([node['@type']].flat().includes('Product')) return node
  return findProduct(node['@graph'])
}

function jsonLdPrice(html: string): number | undefined {
  for (const m of html.matchAll(/<script\b[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const product = findProduct(JSON.parse(m[1]))
      for (const o of [product?.offers].flat()) {
        const raw = o?.price ?? o?.lowPrice
        const cents = raw === undefined ? undefined : parsePrice(raw)
        if (cents !== undefined) return cents
      }
    } catch { /* malformed JSON-LD: ignore */ }
  }
}

export function parseProduct(html: string): Product {
  const imageUrl = meta(html, 'og:image')
  const metaPrice = meta(html, 'product:price:amount')
  const priceCents = jsonLdPrice(html) ?? (metaPrice ? parsePrice(metaPrice) : undefined)
  // <title> is only trusted with some product signal; block pages ("Robot Check") have none.
  const signal = imageUrl !== undefined || priceCents !== undefined
  const title = meta(html, 'og:title') ??
    (signal ? decode(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '').trim() || undefined : undefined)
  return Object.fromEntries(Object.entries({ title, imageUrl, priceCents }).filter(([, v]) => v !== undefined))
}
