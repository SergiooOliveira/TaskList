import { parsePrice } from './price'

it.each([
  ['299.99', 29999], ['299,99', 29999], [299.99, 29999],
  ['1.299,99', 129999], ['1,299.99', 129999], ['€ 1 299,99', 129999], ['12', 1200],
])('parsePrice(%s) = %i', (raw, cents) => expect(parsePrice(raw)).toBe(cents))
it.each([
  ['1.299', 129900], ['0,5', 50], ['EUR 1.299,99 (IVA incl.)', 129999],
])('parsePrice(%s) = %i', (raw, cents) => expect(parsePrice(raw)).toBe(cents))
it('parsePrice rejects negatives', () => {
  expect(parsePrice('-5')).toBeUndefined()
  expect(parsePrice(-5)).toBeUndefined()
})
it('parsePrice rejects junk', () => expect(parsePrice('abc')).toBeUndefined())
