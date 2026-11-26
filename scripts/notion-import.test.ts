import { parseCsv, mapRow, toSql } from './notion-import.mjs'

const base = {
  'Book Title': 'Test Book', Author: 'A. Writer', Bought: 'Shop', 'Collection / Series': 'No Collection',
  Cover: '', 'Date Finish': '', 'Date Start': '', Genre: '', Language: 'English', Pages: '100',
  Price: '€24.90', Rating: '', 'Series Number': '0', Status: 'Owned', Type: 'Prose',
}
const row = (o: Record<string, string>) => ({ ...base, ...o })
const COVERS = 'https://x.supabase.co/storage/v1/object/public/covers/'

describe('parseCsv', () => {
  it('handles quotes, escapes, newlines and BOM', () => {
    expect(parseCsv('a,"b ""c""",d\n')).toEqual([['a', 'b "c"', 'd']])
    expect(parseCsv('﻿x,"l1\nl2"\r\ny,z')).toEqual([['x', 'l1\nl2'], ['y', 'z']])
  })
})

describe('mapRow', () => {
  it('Finished -> bought + before_app read', () => {
    const m = mapRow(row({ Status: 'Finished' }), null)!
    expect(m.item.bought).toBe(true)
    expect(m.item.bought_on).toBeNull()
    expect(m.read).toMatchObject({ before_app: true, started_on: null, finished_on: null })
  })
  it('Currently Reading -> started read', () => {
    const m = mapRow(row({ Status: 'Currently Reading', 'Date Start': '06/09/2026' }), null)!
    expect(m.read).toMatchObject({ started_on: '2026-06-09', finished_on: null, before_app: false })
  })
  it('Owned has no read; Wishlist is not bought', () => {
    expect(mapRow(row({}), null)!.read).toBeNull()
    const w = mapRow(row({ Status: 'Wishlist' }), null)!
    expect(w.item.bought).toBe(false)
    expect(w.read).toBeNull()
  })
  it('maps type, series, rating, price, genre, title', () => {
    expect(mapRow(row({ Type: 'Manga' }), null)!.item).toMatchObject({ collection: 'manga', form: null })
    expect(mapRow(row({}), null)!.item).toMatchObject({ collection: 'book', form: 'Prose', series: null, series_number: null })
    expect(mapRow(row({ 'Collection / Series': 'Saga', 'Series Number': '2' }), null)!.item).toMatchObject({ series: 'Saga', series_number: 2 })
    expect(mapRow(row({ 'Collection / Series': 'Saga', 'Series Number': '0' }), null)!.item.series_number).toBeNull()
    expect(mapRow(row({ Rating: '⭐️⭐️⭐️' }), null)!.item.rating).toBe(3)
    expect(mapRow(row({ Rating: 'No Rating' }), null)!.item.rating).toBeNull()
    expect(mapRow(row({ Rating: '' }), null)!.item.rating).toBeNull()
    expect(mapRow(row({}), null)!.item.price_cents).toBe(2490)
    expect(mapRow(row({ Bought: 'Gift', Price: '€0.00' }), null)!.item).toMatchObject({ store: 'Gift', price_cents: 0 })
    expect(mapRow(row({ Genre: 'Fantasy, Fiction, Young Adult Fiction' }), null)!.item.genres).toEqual(['Fantasy', 'Fiction', 'Young Adult Fiction'])
    expect(mapRow(row({ 'Book Title': 'Dawn ' }), null)!.item.title).toBe('Dawn')
  })
  it('cover and empty title', () => {
    expect(mapRow(row({ Cover: 'imagem%207.png' }), COVERS)!.item.image_url).toBe(COVERS + 'imagem%207.png')
    expect(mapRow(row({ Cover: 'imagem%207.png' }), null)!.item.image_url).toBeNull()
    expect(mapRow(row({ 'Book Title': '' }), null)).toBeNull()
  })
})

describe('toSql', () => {
  it('wraps in a transaction and escapes quotes', () => {
    const rows = [mapRow(row({ 'Book Title': "It's here", Status: 'Finished', Genre: 'A, B' }), null), mapRow(row({}), null)]
    const sql = toSql(rows)
    expect(sql).toContain('begin;')
    expect(sql).toContain('commit;')
    expect(sql).toContain("'It''s here'")
    expect(sql).toContain("ARRAY['A','B']::text[]")
    expect(sql.match(/insert into items/g)).toHaveLength(2)
    expect(sql.match(/insert into reads/g)).toHaveLength(1)
  })
})
