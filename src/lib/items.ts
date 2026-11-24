import { supabase } from './supabase'
import type { Product } from '../../supabase/functions/fetch-product/parse.ts'

export type Item = {
  id: string
  user_id: string
  url: string
  title: string
  image_url: string | null
  store: string | null
  price_cents: number | null
  previous_price_cents: number | null
  price_checked_at: string | null
  bought: boolean
  created_at: string
}

export async function listItems(): Promise<Item[]> {
  const { data, error } = await supabase.from('items').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data as Item[]
}

export async function addItem(p: Pick<Item, 'url' | 'title' | 'image_url' | 'store' | 'price_cents'>): Promise<Item> {
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

export async function fetchProduct(url: string): Promise<Product> {
  try {
    const { data, error } = await supabase.functions.invoke('fetch-product', { body: { url } })
    return error || !data ? {} : (data as Product)
  } catch {
    return {}
  }
}
