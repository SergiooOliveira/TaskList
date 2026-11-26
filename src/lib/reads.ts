import { supabase } from './supabase'

export type Read = { id: string; item_id: string; started_on: string | null; finished_on: string | null; before_app: boolean }

export async function listReads(): Promise<Read[]> {
  const { data, error } = await supabase.from('reads').select('*')
  if (error) throw error
  return data as Read[]
}

export async function startRead(itemId: string, today: string): Promise<Read> {
  const { data, error } = await supabase.from('reads').insert({ item_id: itemId, started_on: today }).select().single()
  if (error) throw error
  return data as Read
}

export async function finishRead(readId: string, today: string): Promise<Read> {
  return updateRead(readId, { finished_on: today })
}

export async function updateRead(id: string, patch: Partial<Read>): Promise<Read> {
  const { data, error } = await supabase.from('reads').update(patch).eq('id', id).select().single()
  if (error) throw error
  return data as Read
}

// Local date parts: toISOString would give the UTC day.
export const todayISO = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export const openRead = (reads: Read[]) => reads.find(r => !r.finished_on && !r.before_app)

export const readState = (reads: Read[]): 'reading' | 'read' | 'unread' =>
  openRead(reads) ? 'reading' : reads.some(r => r.finished_on || r.before_app) ? 'read' : 'unread'

export const canStart = (reads: Read[]) => !openRead(reads)
