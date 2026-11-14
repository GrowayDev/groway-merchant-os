// Electronic Voucher System (EVS) — Types
export type VoucherCategory = 'airtime' | 'data' | 'electricity' | 'isp_package'
export type VoucherStatus = 'available' | 'reserved' | 'sold' | 'consumed' | 'expired' | 'void'
export type VoucherCurrency = 'ZAR' | 'MWK'
export type DeliveryType = 'pin_voucher' | 'direct_topup' | 'meter_token' | 'qr_code'

export interface VoucherProduct {
  id: string; category: VoucherCategory; name: string; description: string
  faceValueMinor: bigint; costMinor: bigint; currency: VoucherCurrency
  country: 'ZA' | 'MW'; provider: string; providerName: string; denomination: string
  stockType: 'pin' | 'direct' | 'token'; deliveryType: DeliveryType
  marginBps: number; active: boolean
}

export interface Voucher {
  id: string; productId: string; pin?: string; token?: string; serial: string
  qrCode?: string; status: VoucherStatus; batchId: string
  faceValueMinor: bigint; currency: VoucherCurrency
  expiryDate: Date; createdAt: Date; soldAt?: Date; consumedAt?: Date
  customerMsisdn?: string; meterNumber?: string; reference: string
  deliveryType: DeliveryType
}

export interface VoucherSale {
  id: string; voucherId: string; productId: string; customerMsisdn: string
  meterNumber?: string; faceValueMinor: bigint; salePriceMinor: bigint
  costMinor: bigint; profitMinor: bigint; currency: VoucherCurrency
  paymentMethod: 'wallet' | 'cash' | 'card' | 'mobile_money' | 'credit_advance'
  reference: string; soldAt: Date; channel: string
  serial: string; pin?: string; token?: string; qrCode?: string; deliveryType: DeliveryType
  productName: string; providerName: string
}

export interface DeviceFinanceProduct {
  id: string; name: string; brand: string; model: string
  category: 'smartphone' | 'tablet' | 'router' | 'solar' | 'pos_terminal'
  retailPriceMinor: bigint; depositMinor: bigint; dailyPaymentMinor: bigint
  termDays: number; currency: VoucherCurrency; country: 'ZA' | 'MW'
  specs: { storage?: string; ram?: string; screen?: string; battery?: string; network?: string }
  active: boolean
}

export interface DeviceFinanceContract {
  id: string; productId: string; productName: string; brand: string
  customerMsisdn: string; customerName: string; customerNationalId?: string
  deviceId?: string; depositPaidMinor: bigint; dailyPaymentMinor: bigint
  termDays: number; daysPaid: number; totalPaidMinor: bigint; outstandingMinor: bigint
  status: 'active' | 'completed' | 'defaulted' | 'repossessed'
  startDate: Date; expectedEndDate: Date; lastPaymentDate?: Date; locked: boolean
  contractNumber: string
}
