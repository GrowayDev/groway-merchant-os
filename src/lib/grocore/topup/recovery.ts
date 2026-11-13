import { Money, money, sub } from '../currency'
import { GroCoreError } from '../errors'
import { TopupAdvance } from './advance-service'
import { TopupProduct } from './products'
export interface RecoveryInput { topupAmount: Money; idempotencyKey: string; source: 'topup_event' | 'wallet' | 'mobile_money' | 'settlement'; now?: Date }
export interface RecoveryResult { recovered: Money; passedThrough: Money; newPaid: Money; newStatus: TopupAdvance['status']; advance: TopupAdvance }
export function recover(advance: TopupAdvance, product: TopupProduct, input: RecoveryInput): RecoveryResult {
  if (advance.status !== 'open') throw new GroCoreError('ADVANCE_ALREADY_CLOSED', `Advance is ${advance.status}`)
  if (input.topupAmount.currency !== advance.currency) throw new GroCoreError('VALIDATION_ERROR', 'Currency mismatch')
  const outstanding = sub(advance.totalDue, advance.paid); let recovered: Money; let passedThrough: Money
  if (product.recovery === 'full_first') { if (input.topupAmount.cents >= outstanding.cents) { recovered = outstanding; passedThrough = sub(input.topupAmount, outstanding) } else { recovered = input.topupAmount; passedThrough = money(0n, input.topupAmount.currency) } }
  else { const share = (product.recovery as { cappedShare: number }).cappedShare; const capped = money((input.topupAmount.cents * BigInt(Math.round(share * 1000))) / 1000n, input.topupAmount.currency); recovered = capped.cents <= outstanding.cents ? capped : outstanding; passedThrough = sub(input.topupAmount, recovered) }
  const newPaid = money(advance.paid.cents + recovered.cents, advance.currency); const fullyRepaid = newPaid.cents >= advance.totalDue.cents; const now = input.now ?? new Date()
  return { recovered, passedThrough, newPaid, newStatus: fullyRepaid ? 'recovered' : 'open', advance: { ...advance, paid: newPaid, status: fullyRepaid ? 'recovered' : 'open', recoveredAt: fullyRepaid ? now : advance.recoveredAt } }
}
