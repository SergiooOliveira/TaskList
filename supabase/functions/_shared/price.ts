// Pure TS, no imports: shared by the browser client and the Deno edge function.
/** Parses a price like "1.299,99", "1,299.99", "€ 1 299,99" or 299.99 into cents. */
export function parsePrice(raw: string | number): number | undefined {
  if (typeof raw === 'number') return Number.isFinite(raw) ? Math.round(raw * 100) : undefined
  const s = raw.replace(/[^\d.,]/g, '')
  if (!/\d/.test(s)) return undefined
  // Last . or , followed by 1-2 digits at the end is the decimal separator.
  const m = s.match(/^(.*?)[.,](\d{1,2})$/)
  const whole = (m ? m[1] : s).replace(/[.,]/g, '')
  const frac = m ? m[2].padEnd(2, '0') : '00'
  const cents = Number(whole || '0') * 100 + Number(frac)
  return Number.isFinite(cents) ? cents : undefined
}
