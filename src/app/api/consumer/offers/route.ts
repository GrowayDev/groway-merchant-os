import { NextRequest } from 'next/server'
import { randomBytes } from 'crypto'
import { db } from '@/lib/db'
import { getUserId, ok, error, parseMoney } from '../_lib/helpers'

/**
 * /api/consumer/offers
 *
 * There is no dedicated Prisma model for merchant offers, so we keep a
 * static catalogue of available offers (read-only reference data) and
 * persist "clip" / "redeem" actions as ConsumerTransaction rows:
 *   - transactionType = 'offer_redemption'
 *   - direction = 'credit' (cashback) or 'debit' (payment)
 *   - counterpartyId = offer id
 *   - counterpartyName = merchant name
 *   - description = offer title
 *   - reference = offer code
 *
 * Clipping state stays in-memory because it is ephemeral UI state — once
 * a user redeems, the DB transaction is the source of truth.
 */

// Static catalogue of available offers
const OFFERS_CATALOGUE = [
  {
    id: 'offer-1',
    merchantId: 'java-jungle',
    merchantName: 'Java Jungle Cafe',
    merchantInitials: 'JJ',
    merchantColor: '#8B4513',
    title: 'Morning Brew Special',
    description: 'Get 20% off any coffee beverage before 10am.',
    discountType: 'percentage',
    discountValue: 20,
    originalPrice: null,
    discountedPrice: null,
    category: 'food',
    tags: ['coffee', 'breakfast', 'morning'],
    distance: 0.3,
    expiresAt: new Date(Date.now() + 2.5 * 60 * 60 * 1000).toISOString(),
    terms: 'Valid before 10am only. Not combinable with other offers.',
    code: 'MORNING20',
    isActive: true,
    isFlash: false,
  },
  {
    id: 'offer-2',
    merchantId: 'urban-style',
    merchantName: 'Urban Style Boutique',
    merchantInitials: 'US',
    merchantColor: '#E91E63',
    title: 'Flash Sale - 50% Off',
    description: 'Limited time flash sale! 50% off selected items.',
    discountType: 'percentage',
    discountValue: 50,
    originalPrice: 59900,
    discountedPrice: 29900,
    category: 'shopping',
    tags: ['fashion', 'clothing', 'sale'],
    distance: 0.8,
    expiresAt: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
    terms: 'Selected items only. While stocks last.',
    code: 'FLASH50',
    isActive: true,
    isFlash: true,
  },
  {
    id: 'offer-3',
    merchantId: 'braai-grill',
    merchantName: 'Braai & Grill House',
    merchantInitials: 'BG',
    merchantColor: '#FF5722',
    title: 'Buy 1 Get 1 Free',
    description: 'BOGO special on all main courses!',
    discountType: 'bogo',
    discountValue: 100,
    originalPrice: null,
    discountedPrice: null,
    category: 'food',
    tags: ['restaurant', 'braai', 'dinner'],
    distance: 1.2,
    expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
    terms: 'Dine-in only. Equal or lesser value item free.',
    code: 'BOGO24',
    isActive: true,
    isFlash: false,
  },
  {
    id: 'offer-4',
    merchantId: 'techzone',
    merchantName: 'TechZone Electronics',
    merchantInitials: 'TZ',
    merchantColor: '#2196F3',
    title: 'R500 Off Smartphones',
    description: 'Get R500 off any smartphone purchase over R5000.',
    discountType: 'fixed',
    discountValue: 50000,
    originalPrice: 699900,
    discountedPrice: 649900,
    category: 'shopping',
    tags: ['electronics', 'phones', 'tech'],
    distance: 2.1,
    expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    terms: 'Minimum purchase R5000. One per customer.',
    code: 'TECH500',
    isActive: true,
    isFlash: false,
  },
  {
    id: 'offer-5',
    merchantId: 'freshmart',
    merchantName: 'FreshMart Groceries',
    merchantInitials: 'FM',
    merchantColor: '#4CAF50',
    title: 'Double Cashback Weekend',
    description: 'Earn 2X cashback on all grocery purchases this weekend.',
    discountType: 'cashback',
    discountValue: 2,
    originalPrice: null,
    discountedPrice: null,
    category: 'food',
    tags: ['groceries', 'cashback', 'weekend'],
    distance: 0.5,
    expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    terms: 'Cashback credited to Groway wallet. Max R200 cashback.',
    code: '2XCASH',
    isActive: true,
    isFlash: false,
  },
  {
    id: 'offer-6',
    merchantId: 'shell-garage',
    merchantName: 'Shell Garage',
    merchantInitials: 'SHL',
    merchantColor: '#FBCE07',
    title: 'R2/L Off Fuel',
    description: 'Save R2 per liter on all fuel purchases.',
    discountType: 'fixed',
    discountValue: 200,
    originalPrice: null,
    discountedPrice: null,
    category: 'fuel',
    tags: ['fuel', 'automotive', 'travel'],
    distance: 1.8,
    expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
    terms: 'Maximum 100 liters. Groway wallet payment required.',
    code: 'FUEL2',
    isActive: true,
    isFlash: true,
  },
  {
    id: 'offer-7',
    merchantId: 'clicks-pharmacy',
    merchantName: 'Clicks Pharmacy',
    merchantInitials: 'CLK',
    merchantColor: '#00897B',
    title: '30% Off Skincare',
    description: 'Get 30% off all skincare products this week.',
    discountType: 'percentage',
    discountValue: 30,
    originalPrice: null,
    discountedPrice: null,
    category: 'beauty',
    tags: ['beauty', 'skincare', 'health'],
    distance: 0.4,
    expiresAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    terms: 'Valid on selected brands.',
    code: 'GLOW30',
    isActive: true,
    isFlash: false,
  },
  {
    id: 'offer-8',
    merchantId: 'nandos-sandton',
    merchantName: "Nando's Sandton",
    merchantInitials: 'NAN',
    merchantColor: '#E31837',
    title: 'Free Chicken Wing Bucket',
    description: 'Order any full platter and get a free 6-piece wing bucket.',
    discountType: 'freebie',
    discountValue: 8900,
    originalPrice: 8900,
    discountedPrice: 0,
    category: 'food',
    tags: ['restaurant', 'chicken', 'portuguese'],
    distance: 0.7,
    expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    terms: 'Dine-in or takeout. Must order full platter.',
    code: 'WINGME',
    isActive: true,
    isFlash: false,
  },
] as const

const CATEGORIES = [
  { id: 'all', name: 'All Offers', icon: 'tag' },
  { id: 'food', name: 'Food & Dining', icon: 'utensils' },
  { id: 'shopping', name: 'Shopping', icon: 'shopping-bag' },
  { id: 'fuel', name: 'Fuel', icon: 'fuel' },
  { id: 'beauty', name: 'Beauty & Health', icon: 'heart' },
  { id: 'entertainment', name: 'Entertainment', icon: 'film' },
]

// Ephemeral, session-scoped store of which offers the user has clipped.
// Redemption is persisted as a ConsumerTransaction, so this Map is only
// used to drive UI state for clipped offers that have not yet been used.
const clippedOffers = new Map<string, Set<string>>()

// GET /api/consumer/offers
export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request)
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const category = searchParams.get('category')
    const offerId = searchParams.get('offerId')
    const radius = parseFloat(searchParams.get('radius') || '5')

    if (action === 'categories') {
      return ok({ success: true, categories: CATEGORIES })
    }

    if (action === 'offer' && offerId) {
      const offer = OFFERS_CATALOGUE.find((o) => o.id === offerId)
      if (!offer) return error('Offer not found', 404)
      const clippedIds = clippedOffers.get(userId) || new Set<string>()
      return ok({ success: true, offer: { ...offer, clipped: clippedIds.has(offer.id) } })
    }

    if (action === 'clipped') {
      const clippedIds = clippedOffers.get(userId) || new Set<string>()
      const offers = OFFERS_CATALOGUE.filter((o) => clippedIds.has(o.id)).map((o) => ({
        ...o,
        clipped: true,
      }))
      return ok({ success: true, offers, count: offers.length, userId })
    }

    if (action === 'nearby') {
      const offers = OFFERS_CATALOGUE.filter((o) => o.distance <= radius)
      return ok({
        success: true,
        offers,
        location: {
          lat: parseFloat(searchParams.get('lat') || '-26.2041'),
          lng: parseFloat(searchParams.get('lng') || '28.0473'),
        },
        radius,
      })
    }

    if (action === 'flash') {
      const offers = OFFERS_CATALOGUE.filter((o) => o.isFlash && o.isActive)
      return ok({ success: true, offers })
    }

    if (action === 'redemptions') {
      // Return previously redeemed offers for this user from the DB
      const txs = await db.consumerTransaction.findMany({
        where: { userId, transactionType: 'offer_redemption' },
        orderBy: { createdAt: 'desc' },
        take: 50,
      })
      return ok({ success: true, redemptions: txs, userId })
    }

    // Default: return the catalogue (optionally filtered by category)
    const clippedIds = clippedOffers.get(userId) || new Set<string>()
    let offers = OFFERS_CATALOGUE.map((o) => ({ ...o, clipped: clippedIds.has(o.id) }))
    if (category && category !== 'all') {
      offers = offers.filter((o) => o.category === category)
    }
    return ok({ success: true, offers, categories: CATEGORIES })
  } catch (err) {
    console.error('Offers GET error:', err)
    return error('Failed to fetch offers', 500)
  }
}

// POST /api/consumer/offers - clip / unclip / redeem
export async function POST(request: NextRequest) {
  try {
    const userId = getUserId(request)
    const body = await request.json().catch(() => ({} as Record<string, unknown>))
    const action = body.action as string | undefined
    const offerId = body.offerId as string | undefined
    const purchaseAmountInput = body.purchaseAmountCents ?? body.amountCents

    if (!action) return error('action is required')
    if (!offerId && action !== 'list') return error('offerId is required')

    const offer = OFFERS_CATALOGUE.find((o) => o.id === offerId)
    if (action !== 'list' && !offer) return error('Offer not found', 404)

    if (action === 'clip') {
      const set = clippedOffers.get(userId) || new Set<string>()
      set.add(offerId as string)
      clippedOffers.set(userId, set)
      return ok({
        success: true,
        message: `Offer "${offer!.title}" clipped successfully!`,
        clippedCount: set.size,
        userId,
      })
    }

    if (action === 'unclip') {
      const set = clippedOffers.get(userId)
      if (set) set.delete(offerId as string)
      return ok({ success: true, message: 'Offer removed from your wallet', userId })
    }

    if (action === 'redeem') {
      const set = clippedOffers.get(userId)
      if (!set || !set.has(offerId as string)) {
        return error('Offer not clipped', 400)
      }

      // Persist the redemption as a ConsumerTransaction.
      const purchaseAmount = parseMoney((purchaseAmountInput ?? 0) as string | number)
      let cashbackCents = BigInt(0)
      if (offer!.discountType === 'cashback') {
        // 2X cashback == 2% of purchase
        cashbackCents = BigInt(Math.round(Number(purchaseAmount) * (offer!.discountValue / 100)))
      } else if (offer!.discountType === 'fixed') {
        cashbackCents = BigInt(offer!.discountValue)
      }

      const tx = await db.consumerTransaction.create({
        data: {
          id: `tx-${randomBytes(8).toString('hex')}`,
          idempotencyKey: randomBytes(16).toString('hex'),
          userId,
          transactionType: 'offer_redemption',
          direction: cashbackCents > 0 ? 'credit' : 'debit',
          amountCents: purchaseAmount > 0 ? purchaseAmount : BigInt(offer!.discountValue),
          feeCents: BigInt(0),
          netAmountCents: cashbackCents > 0 ? cashbackCents : BigInt(offer!.discountValue),
          currency: 'ZAR',
          status: 'completed',
          description: `Offer redeemed: ${offer!.title}`,
          reference: offer!.code,
          category: offer!.category,
          counterpartyId: offer!.merchantId,
          counterpartyName: offer!.merchantName,
          counterpartyType: 'merchant',
          paymentMethod: 'wallet_balance',
          completedAt: new Date(),
          updatedAt: new Date(),
        },
      })

      // If cashback > 0, credit the user's wallet.
      if (cashbackCents > 0) {
        const wallet = await db.consumerWallet.findUnique({ where: { userId } })
        if (wallet) {
          await db.consumerWallet.update({
            where: { userId },
            data: {
              balanceCents: { increment: cashbackCents },
              totalReceivedCents: { increment: cashbackCents },
              updatedAt: new Date(),
            },
          })
        }
      }

      set!.delete(offerId as string)

      return ok({
        success: true,
        message: `Offer "${offer!.title}" redeemed!`,
        code: offer!.code,
        discount: offer!.discountValue,
        discountType: offer!.discountType,
        transactionId: tx.id,
        cashbackCents,
        userId,
      })
    }

    return error('Invalid action. Use clip, unclip, or redeem', 400)
  } catch (err) {
    console.error('Offers POST error:', err)
    return error('Failed to process offer', 500)
  }
}
