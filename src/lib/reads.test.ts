import { canStart, openRead, readState, todayISO, type Read } from './reads'

vi.mock('./supabase', () => ({ supabase: {} }))

const r = (o: Partial<Read>): Read => ({ id: 'r', item_id: 'i', started_on: null, finished_on: null, before_app: false, ...o })

it('derives read state', () => {
  expect(readState([])).toBe('unread')
  expect(readState([r({ started_on: '2026-06-09' })])).toBe('reading')
  expect(readState([r({ before_app: true })])).toBe('read')
  expect(readState([r({ started_on: '2026-01-01', finished_on: '2026-02-01' }), r({ id: 'r2', started_on: '2026-06-01' })])).toBe('reading')
})

it('guards starting and finds the open read', () => {
  expect(canStart([r({ started_on: '2026-06-09' })])).toBe(false)
  expect(canStart([r({ before_app: true })])).toBe(true)
  expect(openRead([r({ before_app: true })])).toBeUndefined()
})

it('formats local date', () => {
  expect(todayISO(new Date(2026, 5, 9))).toBe('2026-06-09')
})
