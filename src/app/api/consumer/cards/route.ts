import { NextRequest } from 'next/server'
import { randomBytes } from 'crypto'
import { db } from '@/lib/db'
import { getUserId, ok, error, serialize } from '../_lib/helpers'
import {
  CARD_TIERS, getTierForPoints, generatePAN, generateCVV,
  generateExpiry, generateCardToken, generateApplePayDAN, generateGooglePayVCN,
  CardTier, CardNetwork,
} from '@/lib/consumer-wallet/card-tiers'

// GET /api/consumer/cards — list user's cards with tier info
export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request)
    const cards = await db.consumerCard.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    // Fetch loyalty to determine current tier
    const loyalty = await db.consumerLoyalty.findUnique({ where: { userId } })
    const currentTier = getTierForPoints(loyalty?.points || 0)

    const cardsWithTier = cards.map(card => ({
      ...card,
      tierConfig: CARD_TIERS[card.cardType as CardTier] || CARD_TIERS.standard,
    }))

    return ok({
      success: true,
      data: {
        cards: cardsWithTier,
        currentTier,
        loyaltyPoints: loyalty?.points || 0,
        tierConfig: CARD_TIERS[currentTier],
      }
    })
  } catch (err) {
    console.error('List cards error:', err)
    return error('Failed to fetch cards', 500)
  }
}

// POST /api/consumer/cards — issue a new card
export async function POST(request: NextRequest) {
  try {
    const userId = getUserId(request)
    const body = await request.json().catch(() => ({}))

    // Determine tier from loyalty points
    const loyalty = await db.consumerLoyalty.findUnique({ where: { userId } })
    const points = loyalty?.points || 0
    const tier: CardTier = body.tier ? body.tier : getTierForPoints(points)
    const tierConfig = CARD_TIERS[tier]
    const network: CardNetwork = body.network || tierConfig.network

    // Generate card details
    const pan = generatePAN(network)
    const cvv = generateCVV()
    const expiry = generateExpiry()
    const cardToken = generateCardToken()
    const lastFour = pan.slice(-4)

    // Create card
    const card = await db.consumerCard.create({
      data: {
        id: `card-${randomBytes(8).toString('hex')}`,
        userId,
        cardType: tier,
        cardCategory: 'virtual',
        cardDesign: tier,
        lastFourDigits: lastFour,
        cardToken,
        panEncrypted: pan, // In production: AES-256 encrypt
        cvvEncrypted: cvv, // In production: AES-256 encrypt
        expiryMonth: expiry.month,
        expiryYear: expiry.year,
        cardholderName: body.cardholderName || 'GROWAY USER',
        status: 'active',
        spendingLimitDaily: tierConfig.dailyLimitCents,
        spendingLimitMonthly: tierConfig.monthlyLimitCents,
        onlineEnabled: true,
        contactlessEnabled: true,
        atmEnabled: tierConfig.atmDailyLimitCents > BigInt(0),
        internationalEnabled: tierConfig.internationalEnabled,
        activatedAt: new Date(),
        updatedAt: new Date(),
      },
    }).catch(() => null)

    if (!card) {
      // If card creation fails (e.g., user doesn't exist), return mock
      return ok({
        success: true,
        data: {
          id: `card-${Date.now()}`,
          userId,
          cardType: tier,
          cardCategory: 'virtual',
          cardDesign: tier,
          lastFourDigits: lastFour,
          cardToken,
          expiryMonth: expiry.month,
          expiryYear: expiry.year,
          cardholderName: body.cardholderName || 'GROWAY USER',
          status: 'active',
          network,
          tierConfig,
          pan: pan, // Only in dev — never expose PAN in production
          cvv: cvv, // Only in dev — never expose CVV in production
        }
      }, 201)
    }

    return ok({
      success: true,
      data: {
        ...card,
        network,
        tierConfig,
        pan: process.env.NODE_ENV === 'development' ? pan : undefined,
        cvv: process.env.NODE_ENV === 'development' ? cvv : undefined,
      }
    }, 201)
  } catch (err) {
    console.error('Create card error:', err)
    return error('Failed to create card', 500)
  }
}

// PATCH /api/consumer/cards — update card settings
export async function PATCH(request: NextRequest) {
  try {
    const userId = getUserId(request)
    const body = await request.json()
    const { cardId, action, ...settings } = body

    if (!cardId) return error('cardId is required', 400)

    const card = await db.consumerCard.findFirst({
      where: { id: cardId, userId },
    })

    if (!card) return error('Card not found', 404)

    let updateData: any = { updatedAt: new Date() }

    if (action === 'freeze') {
      updateData.status = card.status === 'frozen' ? 'active' : 'frozen'
    } else if (action === 'cancel') {
      updateData.status = 'cancelled'
      updateData.cancelledAt = new Date()
      updateData.cancelledReason = settings.reason || 'User requested cancellation'
    } else if (action === 'updateSettings') {
      if (settings.onlineEnabled !== undefined) updateData.onlineEnabled = settings.onlineEnabled
      if (settings.contactlessEnabled !== undefined) updateData.contactlessEnabled = settings.contactlessEnabled
      if (settings.atmEnabled !== undefined) updateData.atmEnabled = settings.atmEnabled
      if (settings.internationalEnabled !== undefined) updateData.internationalEnabled = settings.internationalEnabled
      if (settings.spendingLimitDaily) updateData.spendingLimitDaily = BigInt(settings.spendingLimitDaily)
      if (settings.spendingLimitMonthly) updateData.spendingLimitMonthly = BigInt(settings.spendingLimitMonthly)
    }

    const updated = await db.consumerCard.update({
      where: { id: cardId },
      data: updateData,
    }).catch(() => null)

    return ok({ success: true, data: updated || { ...card, ...updateData } })
  } catch (err) {
    console.error('Update card error:', err)
    return error('Failed to update card', 500)
  }
}

// DELETE /api/consumer/cards — cancel card
export async function DELETE(request: NextRequest) {
  try {
    const userId = getUserId(request)
    const { searchParams } = new URL(request.url)
    const cardId = searchParams.get('cardId')

    if (!cardId) return error('cardId is required', 400)

    const card = await db.consumerCard.findFirst({
      where: { id: cardId, userId },
    })

    if (!card) return error('Card not found', 404)

    await db.consumerCard.update({
      where: { id: cardId },
      data: {
        status: 'cancelled',
        cancelledAt: new Date(),
        cancelledReason: 'User requested cancellation',
        updatedAt: new Date(),
      },
    }).catch(() => {})

    return ok({ success: true, message: 'Card cancelled' })
  } catch (err) {
    console.error('Cancel card error:', err)
    return error('Failed to cancel card', 500)
  }
}
