import { supabase } from './supabase'

export type Item = {
  id: string
  user_id: string
  url: string | null
  title: string
  image_url: string | null
  store: string | null
  price_cents: number | null
  previous_price_cents: number | null
  price_checked_at: string | null
  category: string | null
  bought: boolean
  created_at: string
  collection: 'book' | 'manga' | null
  author: string | null
  series: string | null
  form: string | null
  language: string | null
  series_number: number | null
  pages: number | null
  rating: number | null
  genres: string[] | null
  bought_on: string | null
  summary: string | null
}

export type NewItem = Partial<Omit<Item, 'id' | 'user_id' | 'created_at'>> & { title: string }

export const boughtPatch = (bought: boolean, today: string): Pick<Item, 'bought' | 'bought_on'> => ({ bought, bought_on: bought ? today : null })

export async function listItems(): Promise<Item[]> {
  const { data, error } = await supabase.from('items').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data as Item[]
}

export async function addItem(p: NewItem): Promise<Item> {
  const { data, error } = await supabase.from('items').insert(p).select().single()
  if (error) throw error
  return data as Item
}

export async function updateItem(id: string, patch: Partial<Item>): Promise<Item> {
  const { data, error } = await supabase.from('items').update(patch).eq('id', id).select().single()
  if (error) throw error
  return data as Item
}

export async function deleteItem(id: string): Promise<void> {
  const { error } = await supabase.from('items').delete().eq('id', id)
  if (error) throw error
}

export function applyPriceCheck(item: Item, newCents: number | undefined): Partial<Item> | null {
  if (newCents === undefined) return null
  const price_checked_at = new Date().toISOString()
  const cur = item.price_cents
  if (cur === null) return { price_cents: newCents, price_checked_at }
  if (newCents < cur) return { price_cents: newCents, previous_price_cents: cur, price_checked_at }
  if (newCents > cur) return { price_cents: newCents, previous_price_cents: null, price_checked_at }
  return { price_checked_at }
}

export const dropPercent = (prev: number, cur: number) => Math.round((1 - cur / prev) * 100)

const eur = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' })
export const formatEuro = (cents: number) => eur.format(cents / 100)
