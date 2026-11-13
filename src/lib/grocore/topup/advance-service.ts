import { Money, add, sub, money, ZERO } from '../currency'
import { GroCoreError } from '../errors'
import { TopupProduct } from './products'
import { quote } from './fees'
import { EligibilityInput, checkEligibility } from './eligibility'
export type AdvanceStatus = 'open' | 'recovered' | 'written_off' | 'added_to_bill'
export type DeliveryMethod = 'direct_recharge' | 'voucher_print' | 'voucher_qr'
export interface TopupAdvance { id: string; tenantId: string; subjectId: string; product: TopupProduct['code']; principal: Money; fee: Money; totalDue: Money; paid: Money; currency: 'ZAR' | 'MWK'; status: AdvanceStatus; dueAt: Date; createdAt: Date; recoveredAt?: Date | null; writtenOffAt?: Date | null; deliveryMethod: DeliveryMethod; voucherSerial?: string | null; decisionId?: string | null }
export function issueAdvance(input: { id: string; tenantId: string; subjectId: string; product: TopupProduct; amount: Money; eligibility: EligibilityInput; deliveryMethod: DeliveryMethod; voucherSerial?: string; decisionId?: string; now?: Date }): TopupAdvance {
  const now = input.now ?? new Date(); const elig = checkEligibility(input.eligibility, input.product)
  if (!elig.eligible) throw new GroCoreError('VALIDATION_ERROR', `Not eligible: ${elig.reasonCodes.join(', ')}`)
  if (input.amount.cents > elig.limitCents) throw new GroCoreError('VALIDATION_ERROR', `Amount exceeds limit ${elig.limitCents}`)
  const q = quote(input.amount, input.product); const dueAt = new Date(now); dueAt.setDate(dueAt.getDate() + 7)
  return { id: input.id, tenantId: input.tenantId, subjectId: input.subjectId, product: input.product.code, principal: q.principal, fee: q.fee, totalDue: q.totalDue, paid: ZERO, currency: input.product.currency, status: 'open', dueAt, createdAt: now, recoveredAt: null, writtenOffAt: null, deliveryMethod: input.deliveryMethod, voucherSerial: input.voucherSerial ?? null, decisionId: input.decisionId ?? null }
}
