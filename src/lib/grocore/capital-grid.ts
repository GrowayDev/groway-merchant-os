import { Money, money, sub, add, ZERO } from './currency'
import { GroCoreError } from './errors'
export type CapitalSourceType = 'lender' | 'groway_balance_sheet' | 'supplier_credit' | 'grant'
export interface CapitalSource { id: string; tenantId: string; name: string; type: CapitalSourceType; currency: 'ZAR' | 'MWK' | 'USD'; committed: Money; deployed: Money; costRateBps: number; status: 'active' | 'exhausted' | 'withdrawn'; startDate: Date; endDate?: Date | null }
export interface CapitalAllocation { source: CapitalSource; amount: Money }
export function available(source: CapitalSource): Money { return sub(source.committed, source.deployed) }
export function allocateCapital(sources: CapitalSource[], amount: Money, now: Date = new Date()): CapitalAllocation[] {
  const eligible = sources.filter(s => s.currency === amount.currency && s.status === 'active' && (!s.endDate || s.endDate >= now) && available(s).cents > 0n).sort((a, b) => a.costRateBps - b.costRateBps)
  let remaining = amount; const allocations: CapitalAllocation[] = []
  for (const s of eligible) { if (remaining.cents === 0n) break; const avail = available(s); const take = avail.cents <= remaining.cents ? avail : remaining; allocations.push({ source: s, amount: take }); remaining = sub(remaining, take) }
  if (remaining.cents > 0n) throw new GroCoreError('CAPITAL_INSUFFICIENT', `Insufficient capital: short ${remaining.cents}`)
  return allocations
}
export function applyAllocations(allocations: CapitalAllocation[]): Map<string, CapitalSource> { const updated = new Map<string, CapitalSource>(); for (const a of allocations) { const prev = updated.get(a.source.id) ?? a.source; const newDeployed = add(prev.deployed, a.amount); updated.set(a.source.id, { ...prev, deployed: newDeployed, status: newDeployed.cents >= prev.committed.cents ? 'exhausted' : prev.status }) } return updated }
export function releaseCapital(source: CapitalSource, amount: Money): CapitalSource { const newDeployed = sub(source.deployed, amount); return { ...source, deployed: newDeployed, status: source.status === 'exhausted' ? 'active' : source.status } }
export interface CapitalGridSummary { currency: string; committedCents: bigint; deployedCents: bigint; availableCents: bigint; sources: number }
export function summariseGrid(sources: CapitalSource[]): CapitalGridSummary[] { const m = new Map<string, CapitalGridSummary>(); for (const s of sources) { const r = m.get(s.currency) ?? { currency: s.currency, committedCents: 0n, deployedCents: 0n, availableCents: 0n, sources: 0 }; r.committedCents += s.committed.cents; r.deployedCents += s.deployed.cents; r.availableCents += available(s).cents; r.sources++; m.set(s.currency, r) } return Array.from(m.values()) }
