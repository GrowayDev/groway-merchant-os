/**
 * Groway Card Tiers — Visa & Mastercard
 *
 * Tiered system from Standard to Elite based on loyalty points usage.
 * Each tier unlocks progressively better benefits.
 *
 * Tier progression:
 *   Standard  (0+ points)     — Entry level, Visa debit
 *   Silver    (1,000+ points) — Reduced fees, higher limits
 *   Gold      (5,000+ points) — Cashback 1%, priority support
 *   Platinum  (20,000+ points) — Cashback 2%, airport lounge, no fees
 *   Elite     (100,000+ points) — Cashback 3%, concierge, unlimited limits
 */

export type CardTier = 'standard' | 'silver' | 'gold' | 'platinum' | 'elite'
export type CardNetwork = 'visa' | 'mastercard'

export interface CardTierConfig {
  tier: CardTier
  label: string
  minPoints: number
  network: CardNetwork
  color: string
  gradient: string
  monthlyFeeCents: bigint
  cashbackPercent: number
  dailyLimitCents: bigint
  monthlyLimitCents: bigint
  atmDailyLimitCents: bigint
  internationalEnabled: boolean
  prioritySupport: boolean
  airportLounge: boolean
  concierge: boolean
  feeFreeTransfers: boolean
  feeFreeAirtime: boolean
  benefits: string[]
  icon: string
}

export const CARD_TIERS: Record<CardTier, CardTierConfig> = {
  standard: {
    tier: 'standard',
    label: 'Standard',
    minPoints: 0,
    network: 'visa',
    color: '#1A1A1A',
    gradient: 'from-gray-700 to-gray-900',
    monthlyFeeCents: BigInt(0),
    cashbackPercent: 0,
    dailyLimitCents: BigInt(20000),
    monthlyLimitCents: BigInt(100000),
    atmDailyLimitCents: BigInt(10000),
    internationalEnabled: false,
    prioritySupport: false,
    airportLounge: false,
    concierge: false,
    feeFreeTransfers: false,
    feeFreeAirtime: false,
    benefits: ['Free wallet-to-wallet transfers', 'QR payments', 'Bill payments', 'Airtime & data'],
    icon: '🟢',
  },
  silver: {
    tier: 'silver',
    label: 'Silver',
    minPoints: 1000,
    network: 'visa',
    color: '#757575',
    gradient: 'from-gray-400 to-gray-600',
    monthlyFeeCents: BigInt(0),
    cashbackPercent: 0.5,
    dailyLimitCents: BigInt(50000),
    monthlyLimitCents: BigInt(250000),
    atmDailyLimitCents: BigInt(20000),
    internationalEnabled: false,
    prioritySupport: true,
    airportLounge: false,
    concierge: false,
    feeFreeTransfers: true,
    feeFreeAirtime: false,
    benefits: ['0.5% cashback on all spend', 'Priority support', 'Free wallet transfers', 'Higher limits', 'Reduced PayShap fees'],
    icon: '⚪',
  },
  gold: {
    tier: 'gold',
    label: 'Gold',
    minPoints: 5000,
    network: 'mastercard',
    color: '#FFD700',
    gradient: 'from-yellow-500 to-yellow-700',
    monthlyFeeCents: BigInt(4900),
    cashbackPercent: 1,
    dailyLimitCents: BigInt(100000),
    monthlyLimitCents: BigInt(500000),
    atmDailyLimitCents: BigInt(50000),
    internationalEnabled: true,
    prioritySupport: true,
    airportLounge: false,
    concierge: false,
    feeFreeTransfers: true,
    feeFreeAirtime: true,
    benefits: ['1% cashback on all spend', 'International payments enabled', 'Free airtime purchases', 'Priority support', 'Free PayShap transfers'],
    icon: '🥇',
  },
  platinum: {
    tier: 'platinum',
    label: 'Platinum',
    minPoints: 20000,
    network: 'mastercard',
    color: '#E5E4E2',
    gradient: 'from-slate-300 to-slate-500',
    monthlyFeeCents: BigInt(9900),
    cashbackPercent: 2,
    dailyLimitCents: BigInt(250000),
    monthlyLimitCents: BigInt(1000000),
    atmDailyLimitCents: BigInt(100000),
    internationalEnabled: true,
    prioritySupport: true,
    airportLounge: true,
    concierge: false,
    feeFreeTransfers: true,
    feeFreeAirtime: true,
    benefits: ['2% cashback on all spend', 'Airport lounge access (4/year)', 'No transaction fees', 'International payments', 'Premium support', 'Exclusive merchant offers'],
    icon: '💠',
  },
  elite: {
    tier: 'elite',
    label: 'Elite',
    minPoints: 100000,
    network: 'visa',
    color: '#0F766E',
    gradient: 'from-[#0F766E] to-[#134E4A]',
    monthlyFeeCents: BigInt(19900),
    cashbackPercent: 3,
    dailyLimitCents: BigInt(1000000),
    monthlyLimitCents: BigInt(5000000),
    atmDailyLimitCents: BigInt(500000),
    internationalEnabled: true,
    prioritySupport: true,
    airportLounge: true,
    concierge: true,
    feeFreeTransfers: true,
    feeFreeAirtime: true,
    benefits: ['3% cashback on all spend', 'Unlimited airport lounge', 'Personal concierge service', 'No transaction fees', 'No limits on spending', 'Exclusive Elite events', 'Dedicated relationship manager'],
    icon: '👑',
  },
}

export const TIER_ORDER: CardTier[] = ['standard', 'silver', 'gold', 'platinum', 'elite']

/**
 * Determine the card tier based on loyalty points.
 */
export function getTierForPoints(points: number): CardTier {
  let result: CardTier = 'standard'
  for (const tier of TIER_ORDER) {
    if (points >= CARD_TIERS[tier].minPoints) {
      result = tier
    }
  }
  return result
}

/**
 * Get the next tier and points needed to reach it.
 */
export function getNextTier(currentTier: CardTier): { tier: CardTier; pointsNeeded: number } | null {
  const currentIndex = TIER_ORDER.indexOf(currentTier)
  if (currentIndex >= TIER_ORDER.length - 1) return null
  const nextTier = TIER_ORDER[currentIndex + 1]
  return { tier: nextTier, pointsNeeded: CARD_TIERS[nextTier].minPoints }
}

/**
 * Calculate tier progress (0-100) towards the next tier.
 */
export function getTierProgress(points: number, currentTier: CardTier): number {
  const next = getNextTier(currentTier)
  if (!next) return 100
  const currentMin = CARD_TIERS[currentTier].minPoints
  const nextMin = next.pointsNeeded
  const range = nextMin - currentMin
  const progress = range > 0 ? ((points - currentMin) / range) * 100 : 0
  return Math.min(100, Math.max(0, Math.round(progress)))
}

/**
 * Generate a realistic 16-digit PAN (Primary Account Number).
 * Visa starts with 4, Mastercard starts with 5.
 */
export function generatePAN(network: CardNetwork): string {
  const prefix = network === 'visa' ? '4' : '5'
  let pan = prefix
  for (let i = 1; i < 16; i++) {
    pan += Math.floor(Math.random() * 10)
  }
  return pan
}

/**
 * Generate a 3-digit CVV.
 */
export function generateCVV(): string {
  return String(Math.floor(100 + Math.random() * 900))
}

/**
 * Generate an expiry date (current month + 3 years).
 */
export function generateExpiry(): { month: string; year: string } {
  const now = new Date()
  const expiry = new Date(now.getFullYear() + 3, now.getMonth())
  return {
    month: String(expiry.getMonth() + 1).padStart(2, '0'),
    year: String(expiry.getFullYear()).slice(-2),
  }
}

/**
 * Generate a card token (for digital wallet provisioning).
 */
export function generateCardToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let token = 'GC-'
  for (let i = 0; i < 24; i++) {
    token += chars[Math.floor(Math.random() * chars.length)]
  }
  return token
}

/**
 * Generate an Apple Pay device account number.
 */
export function generateApplePayDAN(): string {
  let dan = ''
  for (let i = 0; i < 16; i++) {
    dan += Math.floor(Math.random() * 10)
  }
  return dan
}

/**
 * Generate a Google Pay virtual card number.
 */
export function generateGooglePayVCN(): string {
  let vcn = '4' // Google Pay uses Visa network
  for (let i = 1; i < 16; i++) {
    vcn += Math.floor(Math.random() * 10)
  }
  return vcn
}
