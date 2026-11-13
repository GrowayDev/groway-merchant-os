import { Money, money, add, sub, ZERO } from './currency'
import { GroCoreError } from './errors'
import { SettlementSplit, splitSettlement, cappedRepaymentShare } from './repayment'
export type PaymentMethod = 'qr' | 'payshap' | 'card' | 'instant_eft'
export interface GoPayCaptureInput { tenantId: string; merchantId: string; captureId: string; amount: Money; fee: Money; paymentMethod: PaymentMethod; liveMode: boolean }
export interface GoPayCapture extends GoPayCaptureInput { id: string; status: 'captured' | 'settled' | 'reversed'; settlementId?: string | null; createdAt: Date }
export interface GoPaySettlement { id: string; tenantId: string; merchantId: string; batchId: string; captureCount: number; gross: Money; fee: Money; repayment: Money; net: Money; currency: 'ZAR' | 'MWK' | 'USD'; status: 'pending' | 'settled' | 'failed'; scheduledAt: Date; processedAt?: Date | null; bankReference?: string | null }
export function captureCurrency(c: GoPayCapture | GoPayCaptureInput): 'ZAR' | 'MWK' | 'USD' { return c.amount.currency }
export function assertGoPayLive(capture: GoPayCaptureInput): void { if (!capture.liveMode) throw new GroCoreError('GOPAY_NOT_LIVE', 'GoPay split is disabled while liveMode is false') }
export function settleCapture(capture: GoPayCapture, outstandingBalance: Money | null, repaymentShareOfGross: number, liveMode: boolean): SettlementSplit & { settlementId: string } {
  if (!liveMode) throw new GroCoreError('GOPAY_NOT_LIVE', 'GoPay split disabled while liveMode is false')
  if (capture.status === 'reversed') throw new GroCoreError('GOPAY_CAPTURE_REVERSED', `Cannot settle reversed capture ${capture.captureId}`)
  const repayment = outstandingBalance ? cappedRepaymentShare(capture.amount, outstandingBalance, repaymentShareOfGross) : ZERO
  return { ...splitSettlement(capture.amount, capture.fee, repayment), settlementId: `settle-${capture.captureId}` }
}
export function aggregateSettlement(tenantId: string, merchantId: string, captures: GoPayCapture[], scheduledAt: Date = new Date()): GoPaySettlement {
  if (captures.length === 0) throw new GroCoreError('VALIDATION_ERROR', 'No captures to settle')
  const currency = captures[0].amount.currency; let gross = ZERO, fee = ZERO, count = 0
  for (const c of captures) { if (c.amount.currency !== currency) throw new GroCoreError('VALIDATION_ERROR', 'Currency mismatch'); if (c.status === 'reversed') continue; gross = add(gross, c.amount); fee = add(fee, c.fee); count++ }
  const batchId = `batch-${merchantId}-${scheduledAt.getTime()}`
  return { id: `set-${batchId}`, tenantId, merchantId, batchId, captureCount: count, gross, fee, repayment: ZERO, net: sub(gross, fee), currency, status: 'pending', scheduledAt, processedAt: null }
}
