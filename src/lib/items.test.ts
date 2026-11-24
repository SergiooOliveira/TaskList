import { applyPriceCheck, dropPercent, formatEuro, type Item } from './items'

vi.mock('./supabase', () => ({ supabase: {} }))

const base = { price_cents: 37999, previous_price_cents: null } as Item

it('applies the price-check rule', () => {
  expect(applyPriceCheck(base, undefined)).toBeNull()
  expect(applyPriceCheck(base, 29999)).toMatchObject({ price_cents: 29999, previous_price_cents: 37999 })
  expect(applyPriceCheck({ ...base, previous_price_cents: 40000 }, 39999)).toMatchObject({ price_cents: 39999, previous_price_cents: null })
  expect(applyPriceCheck(base, 37999)).not.toHaveProperty('previous_price_cents')
  expect(applyPriceCheck({ ...base, price_cents: null }, 1000)).toMatchObject({ price_cents: 1000 })
  expect(applyPriceCheck(base, 29999)).toHaveProperty('price_checked_at')
})

it('formats', () => {
  expect(dropPercent(37999, 29999)).toBe(21)
  expect(formatEuro(29999)).toMatch(/299,99\s?€/)
})
