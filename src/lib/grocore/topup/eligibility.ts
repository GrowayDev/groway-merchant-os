import { Money } from '../currency'
import { TopupProduct } from './products'
export interface EligibilityInput { tenureDays: number; activeMonths: number; averageMonthlySpend: Money; hasOpenAdvance: boolean }
export interface EligibilityResult { eligible: boolean; reasonCodes: string[]; limitCents: bigint }
export function checkEligibility(input: EligibilityInput, product: TopupProduct): EligibilityResult {
  const reasons: string[] = []; let ok = true
  if (input.tenureDays < product.minTenureDays) { reasons.push('INSUFFICIENT_TENURE'); ok = false }
  if (input.activeMonths < product.minActiveMonths) { reasons.push('INSUFFICIENT_ACTIVITY'); ok = false }
  if (input.averageMonthlySpend.cents < product.minSpendPerMonth.cents) { reasons.push('BELOW_MIN_SPEND'); ok = false }
  if (input.hasOpenAdvance) { reasons.push('OPEN_ADVANCE_EXISTS'); ok = false }
  if (!ok) return { eligible: false, reasonCodes: reasons, limitCents: 0n }
  const shareCap = (input.averageMonthlySpend.cents * 30n) / 100n
  const menuCaps = product.menu.filter(m => m.cents <= shareCap)
  const limit = menuCaps.length > 0 ? menuCaps[menuCaps.length - 1].cents : 0n
  return { eligible: limit > 0n, reasonCodes: limit > 0n ? ['ELIGIBLE'] : ['ZERO_LIMIT'], limitCents: limit }
}
