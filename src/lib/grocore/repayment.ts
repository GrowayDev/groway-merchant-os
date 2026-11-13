import { Money, money, add, sub, isZero, ZERO } from './currency'
export interface WaterfallComponent { code: 'fees' | 'interest' | 'principal' | 'penalty'; outstanding: Money }
export interface WaterfallAllocation { fees: Money; interest: Money; principal: Money; penalty: Money; remainder: Money }
export function allocatePayment(payment: Money, components: WaterfallComponent[]): WaterfallAllocation {
  let remaining = payment; const result: WaterfallAllocation = { fees: money(0n, payment.currency), interest: money(0n, payment.currency), principal: money(0n, payment.currency), penalty: money(0n, payment.currency), remainder: money(0n, payment.currency) }
  for (const code of ['fees', 'interest', 'principal', 'penalty'] as const) {
    const comp = components.find(c => c.code === code); if (!comp || isZero(comp.outstanding)) continue
    const applied = remaining.cents >= comp.outstanding.cents ? comp.outstanding : remaining; result[code] = applied; remaining = sub(remaining, applied); if (isZero(remaining)) break
  }
  result.remainder = remaining; return result
}
export interface SettlementSplit { gross: Money; fee: Money; repayment: Money; net: Money }
export function splitSettlement(gross: Money, fee: Money, repayment: Money): SettlementSplit { return { gross, fee, repayment, net: sub(gross, add(fee, repayment)) } }
export function cappedRepaymentShare(gross: Money, outstandingBalance: Money, shareOfGross: number): Money { const share = money((gross.cents * BigInt(Math.round(shareOfGross * 1000))) / 1000n, gross.currency); return share.cents <= outstandingBalance.cents ? share : outstandingBalance }
