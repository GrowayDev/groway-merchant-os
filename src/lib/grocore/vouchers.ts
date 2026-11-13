import { randomBytes } from 'crypto'
import { Money } from './currency'
import { GroCoreError } from './errors'
export type VoucherProduct = 'airtime' | 'data' | 'electricity' | 'isp_bundle'
export type VoucherStatus = 'issued' | 'redeemed' | 'voided' | 'expired'
export type DeliveryMethod = 'direct_recharge' | 'voucher_print' | 'voucher_qr'
export interface Voucher { id: string; tenantId: string; serial: string; product: VoucherProduct; supplier: string; faceValue: Money; cost: Money; recipientMsisdn?: string | null; meterNumber?: string | null; status: VoucherStatus; deliveryMethod: DeliveryMethod; redeemedAt?: Date | null; advanceId?: string | null; qrPayload?: string | null; pin?: string | null; createdAt: Date }
export function generateSerial(product: VoucherProduct, now: Date = new Date()): string { const d = now.toISOString().slice(0, 10).replace(/-/g, ''); const r = randomBytes(6).toString('base64url').replace(/[-_]/g, '').slice(0, 8).toUpperCase(); return `GC-${product.toUpperCase()}-${d}-${r}` }
export function generatePin(): string { return Array.from(randomBytes(12)).map(b => (b % 10).toString()).join('') }
export function buildQrPayload(v: Pick<Voucher, 'serial' | 'product' | 'pin'>): string { const p = new URLSearchParams({ serial: v.serial, product: v.product }); if (v.pin) p.set('pin', v.pin); return `grocore://voucher?${p.toString()}` }
export interface IssueVoucherInput { tenantId: string; product: VoucherProduct; supplier: string; faceValue: Money; cost: Money; recipientMsisdn?: string; meterNumber?: string; deliveryMethod: DeliveryMethod; advanceId?: string; now?: Date }
export function issueVoucher(input: IssueVoucherInput): Voucher {
  const now = input.now ?? new Date(); if (input.faceValue.currency !== input.cost.currency) throw new GroCoreError('VALIDATION_ERROR', 'Currency mismatch')
  const serial = generateSerial(input.product, now); const needsPin = input.deliveryMethod !== 'direct_recharge'; const pin = needsPin ? generatePin() : null; const qr = input.deliveryMethod === 'voucher_qr' && pin ? buildQrPayload({ serial, product: input.product, pin }) : null
  return { id: `vch-${serial}`, tenantId: input.tenantId, serial, product: input.product, supplier: input.supplier, faceValue: input.faceValue, cost: input.cost, recipientMsisdn: input.recipientMsisdn ?? null, meterNumber: input.meterNumber ?? null, status: 'issued', deliveryMethod: input.deliveryMethod, redeemedAt: null, advanceId: input.advanceId ?? null, qrPayload: qr, pin, createdAt: now }
}
export function redeemVoucher(v: Voucher, now: Date = new Date()): Voucher { if (v.status === 'redeemed') throw new GroCoreError('VOUCHER_ALREADY_REDEEMED', `Voucher ${v.serial} already redeemed`); if (v.status === 'voided' || v.status === 'expired') throw new GroCoreError('VOUCHER_EXPIRED', `Voucher ${v.serial} is ${v.status}`); return { ...v, status: 'redeemed', redeemedAt: now } }
export function voidVoucher(v: Voucher, now: Date = new Date()): Voucher { if (v.status === 'redeemed') throw new GroCoreError('VOUCHER_ALREADY_REDEEMED', `Cannot void redeemed voucher ${v.serial}`); return { ...v, status: 'voided' } }
