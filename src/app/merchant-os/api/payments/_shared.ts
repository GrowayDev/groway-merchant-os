/**
 * Shared helpers for the merchant-os payment gateway API routes.
 *
 * Fee model (GoPay settlement fee model):
 *   percentage fee: 2.5% of gross amount
 *   fixed fee:      R1.50 per transaction
 */

export const FEE_PERCENTAGE = 2.5
export const FEE_FIXED_PER_TXN = 1.5

export const GOPAY_PROCESSOR_ID = 'gropay'
export const GOPAY_PROCESSOR_NAME = 'GoPay'

/** Round to 2 decimal places (avoid floating point drift on currency). */
export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

/** Compute settlement fee for a gross amount and transaction count. */
export function computeFees(amount: number, transactionCount: number = 1): number {
  const count = Math.max(transactionCount, 1)
  return round2((amount * FEE_PERCENTAGE) / 100 + FEE_FIXED_PER_TXN * count)
}

// --------------------------------------------
// Status / enum mappers (DB string values -> UI unions)
// --------------------------------------------

export type UiTxnStatus = 'pending' | 'processing' | 'approved' | 'declined' | 'refunded' | 'cancelled'

export function mapTransactionStatus(raw: string | null | undefined): UiTxnStatus {
  const s = (raw || '').toLowerCase()
  switch (s) {
    case 'approved':
    case 'completed':
    case 'complete':
    case 'success':
    case 'successful':
    case 'paid':
    case 'captured':
    case 'settled':
      return 'approved'
    case 'declined':
    case 'failed':
    case 'failure':
    case 'error':
      return 'declined'
    case 'refunded':
    case 'partially_refunded':
    case 'partial_refund':
      return 'refunded'
    case 'cancelled':
    case 'canceled':
    case 'voided':
    case 'void':
      return 'cancelled'
    case 'processing':
    case 'authorised':
    case 'authorized':
      return 'processing'
    default:
      return 'pending'
  }
}

export type UiTxnMethod = 'card' | 'qr' | 'ewallet' | 'bank' | 'cash'

export function mapTransactionMethod(raw: string | null | undefined): UiTxnMethod {
  const s = (raw || '').toLowerCase()
  switch (s) {
    case 'qr':
    case 'qr_code':
    case 'qrcode':
      return 'qr'
    case 'wallet':
    case 'ewallet':
    case 'e_wallet':
    case 'mobile':
    case 'mobile_money':
      return 'ewallet'
    case 'eft':
    case 'bank':
    case 'bank_transfer':
    case 'instant_eft':
    case 'eftpos':
    case 'account':
      return 'bank'
    case 'cash':
      return 'cash'
    default:
      return 'card'
  }
}

export function mapCardType(raw: string | null | undefined): 'visa' | 'mastercard' | 'amex' | 'unionpay' | 'other' {
  const s = (raw || '').toLowerCase()
  if (s.includes('visa')) return 'visa'
  if (s.includes('master')) return 'mastercard'
  if (s.includes('amex') || s.includes('american')) return 'amex'
  if (s.includes('union')) return 'unionpay'
  return 'other'
}

/** Extract the last four digits from a masked card string like "**** **** **** 1234". */
export function extractLastFour(masked: string | null | undefined): string | null {
  if (!masked) return null
  const digits = masked.replace(/\D/g, '')
  if (digits.length < 4) return null
  return digits.slice(-4)
}

/** Deterministic 4-digit suffix derived from a seed string (used for masked bank account display). */
export function deterministicLastFour(seed: string): string {
  let h = 7
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) % 100000
  }
  return String(h % 10000).padStart(4, '0')
}

// --------------------------------------------
// Settlement status mapping (GopaySettlement.status -> UI union)
// --------------------------------------------

export type UiSettlementStatus = 'pending' | 'processing' | 'completed' | 'failed'

export function mapSettlementStatus(raw: string | null | undefined): UiSettlementStatus {
  const s = (raw || '').toLowerCase()
  switch (s) {
    case 'processing':
      return 'processing'
    case 'completed':
    case 'complete':
    case 'paid':
    case 'settled':
    case 'success':
      return 'completed'
    case 'failed':
    case 'failure':
    case 'error':
      return 'failed'
    default:
      return 'pending'
  }
}

// --------------------------------------------
// Processor registry names (used to map processorId -> display name)
// --------------------------------------------

export const PROCESSOR_NAMES: Record<string, string> = {
  gropay: 'GoPay',
  yoco: 'Yoco',
  ikhokha: 'iKhokha',
  peach: 'Peach Payments',
  payfast: 'PayFast',
  ozow: 'Ozow',
  stitch: 'Stitch',
  paygate: 'PayGate',
}

export function processorName(id: string): string {
  return PROCESSOR_NAMES[id] || id
}

// --------------------------------------------
// Date / period label helpers (locale-safe, no Intl dependency)
// --------------------------------------------

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** e.g. "12 Jun 2025" */
export function formatDayLabel(date: Date): string {
  return `${String(date.getDate()).padStart(2, '0')} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`
}

/** Monday-based start of week for the given date. */
export function startOfWeek(date: Date): Date {
  const d = new Date(date)
  const dow = (d.getDay() + 6) % 7 // Monday = 0
  d.setDate(d.getDate() - dow)
  d.setHours(0, 0, 0, 0)
  return d
}

/** e.g. "Week of 09 Jun 2025" */
export function formatWeekLabel(weekStart: Date): string {
  return `Week of ${formatDayLabel(weekStart)}`
}

/** Parse an int query param with a default, clamped to a sane range. */
export function parseIntParam(
  searchParams: URLSearchParams,
  key: string,
  defaultValue: number,
  min: number,
  max: number
): number {
  const raw = searchParams.get(key)
  if (!raw) return defaultValue
  const parsed = Number.parseInt(raw, 10)
  if (Number.isNaN(parsed)) return defaultValue
  return Math.min(Math.max(parsed, min), max)
}
