export type CurrencyCode = 'ZAR' | 'MWK' | 'USD'
export interface Money { cents: bigint; currency: CurrencyCode }
export const ZERO: Money = { cents: 0n, currency: 'ZAR' }
export function money(cents: bigint | number | string, currency: CurrencyCode = 'ZAR'): Money {
  const c = typeof cents === 'bigint' ? cents : BigInt(Math.trunc(Number(cents)))
  if (c < 0n) throw new Error(`Money cents must be non-negative, got ${c}`)
  return { cents: c, currency }
}
export function fromRand(rand: number): Money { return { cents: BigInt(Math.round(rand * 100)), currency: 'ZAR' } }
export function fromKwacha(kwacha: number): Money { return { cents: BigInt(Math.round(kwacha * 100)), currency: 'MWK' } }
export function add(a: Money, b: Money): Money { if (a.currency !== b.currency) throw new Error('currency mismatch'); return { cents: a.cents + b.cents, currency: a.currency } }
export function sub(a: Money, b: Money): Money { if (a.currency !== b.currency) throw new Error('currency mismatch'); const r = a.cents - b.cents; if (r < 0n) throw new Error('sub would be negative'); return { cents: r, currency: a.currency } }
export function min(a: Money, b: Money): Money { return a.cents <= b.cents ? a : b }
export function max(a: Money, b: Money): Money { return a.cents >= b.cents ? a : b }
export function lte(a: Money, b: Money): boolean { return a.cents <= b.cents }
export function gte(a: Money, b: Money): boolean { return a.cents >= b.cents }
export function lt(a: Money, b: Money): boolean { return a.cents < b.cents }
export function gt(a: Money, b: Money): boolean { return a.cents > b.cents }
export function isZero(m: Money): boolean { return m.cents === 0n }
export function equals(a: Money, b: Money): boolean { return a.cents === b.cents && a.currency === b.currency }
export function format(m: Money): string { const n = Number(m.cents) / 100; const s = m.currency === 'ZAR' ? 'R' : m.currency === 'MWK' ? 'K' : '$'; return `${s}${n.toFixed(2)}` }
export interface SignedMoney extends Money { signedCents: bigint }
export function debit(m: Money): SignedMoney { return { ...m, signedCents: m.cents } }
export function credit(m: Money): SignedMoney { return { ...m, signedCents: -m.cents } }
export function signed(cents: bigint, currency: CurrencyCode): SignedMoney { return { cents: cents < 0n ? -cents : cents, currency, signedCents: cents } }
export function feeBps(principal: Money, bps: number): Money { return { cents: (principal.cents * BigInt(Math.round(bps * 1000))) / 1_000_000n, currency: principal.currency } }
export function sum(amounts: Money[]): Money { if (!amounts.length) return ZERO; let t = 0n; for (const a of amounts) { if (a.currency !== amounts[0].currency) throw new Error('sum currency mismatch'); t += a.cents } return { cents: t, currency: amounts[0].currency } }
