// Wallet API Types and Utilities
import { nanoid } from 'nanoid'

// API Response Type
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  transaction?: {
    id: string
    reference: string
    status: string
    confirmationUrl?: string
  }
}

// Transaction States
export type TransactionStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'

// Generate unique reference number
export function generateReference(prefix: string = 'TXN'): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = nanoid(6).toUpperCase()
  return `${prefix}${timestamp}${random}`
}

// Generate idempotency key
export function generateIdempotencyKey(): string {
  return nanoid(32)
}

// Generate card token
export function generateCardToken(): string {
  return `card_${nanoid(24)}`
}

// Generate NFC token
export function generateNFCToken(): string {
  return `nfc_${nanoid(32)}`
}

// Generate QR data
export function generateQRData(userId: string, amount?: number): string {
  const qrData = {
    type: 'groway_pay',
    userId,
    amount: amount || null,
    timestamp: Date.now(),
    nonce: nanoid(8)
  }
  return Buffer.from(JSON.stringify(qrData)).toString('base64')
}

// Format currency (cents to ZAR)
export function formatZAR(cents: bigint | number): string {
  const amount = typeof cents === 'bigint' ? Number(cents) : cents
  return `R ${(amount / 100).toFixed(2)}`
}

// Parse currency (ZAR to cents)
export function parseZAR(zar: string): bigint {
  const amount = parseFloat(zar.replace(/[^0-9.]/g, ''))
  return BigInt(Math.round(amount * 100))
}

// Calculate fee
export function calculateFee(amountCents: bigint, feePercent: number, minFeeCents: bigint = BigInt(0)): bigint {
  const percentFee = (amountCents * BigInt(Math.round(feePercent * 100))) / BigInt(10000)
  return percentFee > minFeeCents ? percentFee : minFeeCents
}

// Validate SA phone number
export function isValidSAPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '')
  return /^(\+27|27|0)[6-8][0-9]{8}$/.test(cleaned) || /^0[1-9][0-9]{8}$/.test(cleaned)
}

// Format SA phone number
export function formatSAPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.startsWith('27')) {
    return `+${cleaned}`
  }
  if (cleaned.startsWith('0')) {
    return `+27${cleaned.slice(1)}`
  }
  return `+27${cleaned}`
}

// Validate SA ID number
export function isValidSAId(idNumber: string): boolean {
  const cleaned = idNumber.replace(/\D/g, '')
  if (cleaned.length !== 13) return false

  // Basic Luhn check
  let sum = 0
  for (let i = 0; i < 13; i++) {
    let digit = parseInt(cleaned[i])
    if ((13 - i) % 2 === 0) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    sum += digit
  }
  return sum % 10 === 0
}

// Get date from SA ID
export function getDateFromSAId(idNumber: string): Date | null {
  const cleaned = idNumber.replace(/\D/g, '')
  if (cleaned.length < 6) return null

  const yearPart = parseInt(cleaned.slice(0, 2))
  const month = parseInt(cleaned.slice(2, 4)) - 1
  const day = parseInt(cleaned.slice(4, 6))

  const currentYear = new Date().getFullYear()
  const century = yearPart > (currentYear % 100) ? 1900 : 2000
  const year = century + yearPart

  return new Date(year, month, day)
}

// Get gender from SA ID
export function getGenderFromSAId(idNumber: string): 'M' | 'F' | null {
  const cleaned = idNumber.replace(/\D/g, '')
  if (cleaned.length < 10) return null

  const genderDigits = parseInt(cleaned.slice(6, 10))
  return genderDigits < 5000 ? 'F' : 'M'
}

// SA Provinces
export const SA_PROVINCES = [
  'Eastern Cape',
  'Free State',
  'Gauteng',
  'KwaZulu-Natal',
  'Limpopo',
  'Mpumalanga',
  'Northern Cape',
  'North West',
  'Western Cape'
]

// SASSA Grant Types
export const SASSA_GRANT_TYPES = [
  { id: 'older_person', name: "Older Person's Grant", amount: 209000, paymentDay: 1 },
  { id: 'disability', name: 'Disability Grant', amount: 209000, paymentDay: 3 },
  { id: 'child_support', name: 'Child Support Grant', amount: 53000, paymentDay: 5 },
  { id: 'foster_child', name: 'Foster Child Grant', amount: 113000, paymentDay: 5 },
  { id: 'care_dependency', name: 'Care Dependency Grant', amount: 209000, paymentDay: 5 },
  { id: 'war_veteran', name: "War Veteran's Grant", amount: 212000, paymentDay: 1 },
  { id: 'srd', name: 'Social Relief of Distress', amount: 35000, paymentDay: 25 }
] as const

// Mobile Networks
export const SA_NETWORKS = [
  { id: 'vodacom', name: 'Vodacom', prefix: ['082', '072', '060', '065'] },
  { id: 'mtn', name: 'MTN', prefix: ['083', '073', '063', '066'] },
  { id: 'cellc', name: 'Cell C', prefix: ['084', '074', '061'] },
  { id: 'telkom', name: 'Telkom', prefix: ['081', '071', '068'] },
  { id: 'rain', name: 'Rain', prefix: ['063', '066'] }
] as const

// Banks for PayShap
export const SA_BANKS = [
  { id: 'absa', name: 'Absa', code: '632005', payshap: true },
  { id: 'capitec', name: 'Capitec', code: '470010', payshap: true },
  { id: 'fnb', name: 'FNB', code: '250655', payshap: true },
  { id: 'nedbank', name: 'Nedbank', code: '198765', payshap: true },
  { id: 'standard', name: 'Standard Bank', code: '051001', payshap: true },
  { id: 'investec', name: 'Investec', code: '580105', payshap: true },
  { id: 'african', name: 'African Bank', code: '430000', payshap: false },
  { id: 'tyme', name: 'TymeBank', code: '678910', payshap: true }
] as const

// SA Airports
export const SA_AIRPORTS = [
  { code: 'JNB', name: 'OR Tambo International', city: 'Johannesburg', province: 'Gauteng' },
  { code: 'CPT', name: 'Cape Town International', city: 'Cape Town', province: 'Western Cape' },
  { code: 'DUR', name: 'King Shaka International', city: 'Durban', province: 'KwaZulu-Natal' },
  { code: 'PLZ', name: 'Port Elizabeth Airport', city: 'Port Elizabeth', province: 'Eastern Cape' },
  { code: 'GRJ', name: 'George Airport', city: 'George', province: 'Western Cape' },
  { code: 'ELS', name: 'East London Airport', city: 'East London', province: 'Eastern Cape' },
  { code: 'BFN', name: 'Bloemfontein Airport', city: 'Bloemfontein', province: 'Free State' },
  { code: 'PTA', name: 'Wonderboom Airport', city: 'Pretoria', province: 'Gauteng' },
  { code: 'Lanseria', name: 'Lanseria International', city: 'Johannesburg', province: 'Gauteng' },
  { code: 'KIM', name: 'Kimberley Airport', city: 'Kimberley', province: 'Northern Cape' },
  { code: 'POL', name: 'Polokwane Airport', city: 'Polokwane', province: 'Limpopo' },
  { code: 'NLP', name: 'Nelspruit Airport', city: 'Nelspruit', province: 'Mpumalanga' }
] as const

// SA Airlines
export const SA_AIRLINES = [
  { code: 'SA', name: 'South African Airways', logo: '/airlines/saa.png' },
  { code: 'MN', name: 'Kulula', logo: '/airlines/kulula.png' },
  { code: 'BA', name: 'British Airways (Comair)', logo: '/airlines/ba.png' },
  { code: 'FA', name: 'FlySafair', logo: '/airlines/safair.png' },
  { code: '4Z', name: 'Airlink', logo: '/airlines/airlink.png' },
  { code: '5Z', name: 'CemAir', logo: '/airlines/cemair.png' },
  { code: 'H4', name: 'FlyCemair', logo: '/airlines/h4.png' }
] as const

// Bus Operators
export const BUS_OPERATORS = [
  { code: 'GREYHOUND', name: 'Greyhound', logo: '/bus/greyhound.png' },
  { code: 'INTERCAPE', name: 'Intercape', logo: '/bus/intercape.png' },
  { code: 'ELDORADO', name: 'Eldo Coaches', logo: '/bus/eldorado.png' },
  { code: 'CITILINER', name: 'Citiliner', logo: '/bus/citiliner.png' },
  { code: 'DELTA', name: 'Delta Coaches', logo: '/bus/delta.png' },
  { code: 'BAZ', name: 'BAZ Bus', logo: '/bus/baz.png' },
  { code: 'CITYTOLI', name: 'City to City', logo: '/bus/citytocity.png' }
] as const

// Gautrain Stations
export const GAUTRAIN_STATIONS = [
  { code: 'HBF', name: 'Hatfield', line: 'north', city: 'Pretoria' },
  { code: 'PTN', name: 'Pretoria', line: 'north', city: 'Pretoria' },
  { code: 'CEN', name: 'Centurion', line: 'north', city: 'Centurion' },
  { code: 'MID', name: 'Midrand', line: 'north', city: 'Midrand' },
  { code: 'MAR', name: 'Marlboro', line: 'north', city: 'Johannesburg' },
  { code: 'SAN', name: 'Sandton', line: 'north', city: 'Johannesburg' },
  { code: 'ROS', name: 'Rosebank', line: 'north', city: 'Johannesburg' },
  { code: 'PKT', name: 'Park Station', line: 'north', city: 'Johannesburg' },
  { code: 'RHO', name: 'Rhodesfield', line: 'east', city: 'Kempton Park' },
  { code: 'OR', name: 'OR Tambo', line: 'east', city: 'Johannesburg' }
] as const

// Bill Categories
export const BILL_CATEGORIES = [
  { id: 'electricity', name: 'Electricity', icon: 'Zap' },
  { id: 'water', name: 'Water', icon: 'Droplets' },
  { id: 'dstv', name: 'DStv', icon: 'Tv' },
  { id: 'municipal', name: 'Municipal', icon: 'Building' },
  { id: 'traffic', name: 'Traffic Fines', icon: 'Car' },
  { id: 'sabc', name: 'SABC TV Licence', icon: 'Radio' }
] as const

// Voucher Types
export const VOUCHER_TYPES = [
  { id: 'gaming', name: 'Gaming Vouchers', providers: ['1voucher', 'OTT', 'Blu Voucher'] },
  { id: 'betting', name: 'Betting Vouchers', providers: ['Hollywoodbets', 'Betway', 'Supabets'] },
  { id: 'retail', name: 'Retail Vouchers', providers: ['Checkers', 'Pick n Pay', 'Shoprite', 'Woolworths'] },
  { id: 'gift', name: 'Gift Cards', providers: ['Netflix', 'Spotify', 'Xbox', 'PlayStation', 'Steam'] }
] as const

// Remittance Providers
export const REMITTANCE_PROVIDERS = [
  { code: 'chipper', name: 'Chipper Cash', countries: ['NG', 'GH', 'UG', 'RW', 'KE'] },
  { code: 'mukuru', name: 'Mukuru', countries: ['ZW', 'MW', 'MZ', 'ZM'] },
  { code: 'terrapay', name: 'TerraPay', countries: ['MW', 'MZ', 'ZW', 'GH', 'KE', 'NG'] },
  { code: 'worldremit', name: 'WorldRemit', countries: ['ZW', 'NG', 'GH', 'KE', 'UG'] },
  { code: 'aza', name: 'AZA Finance', countries: ['NG', 'GH', 'KE', 'UG'] },
  { code: 'stablecoin', name: 'Stablecoin (USDC)', countries: ['*'] }
] as const

// Credit Lenders
export const CREDIT_LENDERS = {
  personal: [
    { name: 'Capitec Credit', ncrNumber: 'NCRCP58', minAmount: 100000n, maxAmount: 25000000n, rateMin: 12.5, rateMax: 24.5 },
    { name: 'African Bank', ncrNumber: 'NCRCP10', minAmount: 100000n, maxAmount: 30000000n, rateMin: 15.0, rateMax: 27.5 },
    { name: 'FNB Loans', ncrNumber: 'NCRCP20', minAmount: 200000n, maxAmount: 30000000n, rateMin: 10.5, rateMax: 21.0 },
    { name: 'Wonga', ncrNumber: 'NCRCP68', minAmount: 50000n, maxAmount: 800000n, rateMin: 3.0, rateMax: 5.0 },
    { name: 'Bayport', ncrNumber: 'NCRCP35', minAmount: 100000n, maxAmount: 25000000n, rateMin: 14.0, rateMax: 26.0 },
    { name: 'DirectAxis', ncrNumber: 'NCRCP47', minAmount: 100000n, maxAmount: 20000000n, rateMin: 13.5, rateMax: 24.0 }
  ],
  business: [
    { name: 'Lulalend', ncrNumber: 'NCRCP88', minAmount: 1000000n, maxAmount: 50000000n, rateMin: 6.0, rateMax: 12.0 },
    { name: 'Bridgement', ncrNumber: 'NCRCP92', minAmount: 500000n, maxAmount: 5000000n, rateMin: 3.0, rateMax: 6.0 },
    { name: 'Merchant Capital', ncrNumber: 'NCRCP55', minAmount: 1000000n, maxAmount: 100000000n, rateMin: 8.0, rateMax: 15.0 },
    { name: 'Fundrr', ncrNumber: 'NCRCP78', minAmount: 500000n, maxAmount: 20000000n, rateMin: 5.0, rateMax: 10.0 },
    { name: 'Business Partners', ncrNumber: 'NCRCP12', minAmount: 5000000n, maxAmount: 500000000n, rateMin: 10.0, rateMax: 18.0 },
    { name: 'FNB Business', ncrNumber: 'NCRCP20', minAmount: 1000000n, maxAmount: 100000000n, rateMin: 8.5, rateMax: 16.0 }
  ]
} as const

// Insurance Types
export const INSURANCE_TYPES = [
  { id: 'funeral', name: 'Funeral Cover', icon: 'Heart' },
  { id: 'life', name: 'Life Insurance', icon: 'Shield' },
  { id: 'health', name: 'Health Insurance', icon: 'Activity' },
  { id: 'vehicle', name: 'Vehicle Insurance', icon: 'Car' },
  { id: 'device', name: 'Device Insurance', icon: 'Smartphone' }
] as const

// Insurance Providers
export const INSURANCE_PROVIDERS = [
  { name: 'Hollard', fspNumber: '17673', types: ['funeral', 'vehicle', 'device'] },
  { name: 'Old Mutual', fspNumber: '18042', types: ['funeral', 'life', 'health'] },
  { name: 'Sanlam', fspNumber: '16928', types: ['funeral', 'life', 'health'] },
  { name: 'Clientele', fspNumber: '15268', types: ['funeral', 'life'] },
  { name: 'King Price', fspNumber: '44632', types: ['vehicle', 'device'] },
  { name: 'Discovery', fspNumber: '47318', types: ['life', 'health', 'vehicle'] },
  { name: 'Metropolitan', fspNumber: '15987', types: ['funeral', 'life'] },
  { name: '1Life', fspNumber: '24769', types: ['funeral', 'life'] }
] as const
