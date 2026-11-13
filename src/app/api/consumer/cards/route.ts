import { NextRequest } from 'next/server'
import { randomBytes } from 'crypto'
import { db } from '@/lib/db'
import { getUserId, ok, error, parseMoney } from '../_lib/helpers'

/**
 * /api/consumer/cards
 *
 * Replaces the previous in-memory cardsStore Map with Prisma ConsumerCard.
 * All money fields are BigInt cents and serialised to strings in JSON.
 */

// GET /api/consumer/cards - list cards for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request)

    const cards = await db.consumerCard.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    return ok({ success: true, data: cards })
  } catch (err) {
    console.error('List cards error:', err)
    return error('Failed to fetch cards', 500)
  }
}

// POST /api/consumer/cards - create a new virtual card
export async function POST(request: NextRequest) {
  try {
    const userId = getUserId(request)
    const body = await request.json().catch(() => ({} as Record<string, unknown>))

    const cardType = (body.cardType as string) || 'visa'
    const cardholderName = (body.cardholderName as string | undefined)?.toUpperCase() || 'GROWAY USER'
    const monthlyLimit = parseMoney((body.monthlyLimitCents ?? body.monthlyLimit ?? 500000) as string | number)
    const dailyLimit = parseMoney((body.dailyLimitCents ?? body.dailyLimit ?? 20000) as string | number)

    // Verify that the user exists so we don't create orphaned cards.
    const user = await db.consumerUser.findUnique({ where: { id: userId }, select: { id: true } })
    if (!user) {
      return error('User not found', 404)
    }

    const pan = generatePan(cardType)
    const cvv = generateCvv()
    const expiryMonth = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')
    const expiryYear = String(new Date().getFullYear() + 4).slice(-2)
    const lastFour = pan.slice(-4)
    const cardToken = `tok_${randomBytes(12).toString('hex')}`

    const card = await db.consumerCard.create({
      data: {
        id: `card-${randomBytes(8).toString('hex')}`,
        userId,
        cardType,
        cardCategory: 'virtual',
        cardDesign: 'default',
        lastFourDigits: lastFour,
        cardToken,
        panEncrypted: `enc_pan_${randomBytes(16).toString('hex')}`,
        cvvEncrypted: `enc_cvv_${randomBytes(8).toString('hex')}`,
        expiryMonth,
        expiryYear,
        cardholderName,
        status: 'active',
        spendingLimitDaily: dailyLimit,
        spendingLimitMonthly: monthlyLimit,
        spentTodayCents: BigInt(0),
        spentThisMonthCents: BigInt(0),
        onlineEnabled: true,
        contactlessEnabled: true,
        atmEnabled: false,
        internationalEnabled: false,
        activatedAt: new Date(),
        updatedAt: new Date(),
      },
    })

    return ok({ success: true, data: card, message: 'Virtual card created successfully' }, 201)
  } catch (err) {
    console.error('Create card error:', err)
    return error('Failed to create card', 500)
  }
}

// PATCH /api/consumer/cards - update card settings (freeze/unfreeze, toggles, limits)
export async function PATCH(request: NextRequest) {
  try {
    const userId = getUserId(request)
    const body = await request.json().catch(() => ({} as Record<string, unknown>))
    const cardId = body.cardId as string | undefined
    const updates = (body.updates as Record<string, unknown>) || {}

    if (!cardId) {
      return error('Card ID required')
    }

    const existing = await db.consumerCard.findUnique({ where: { id: cardId } })
    if (!existing || existing.userId !== userId) {
      return error('Card not found', 404)
    }

    const data: Record<string, unknown> = {}

    if (typeof updates.status === 'string') {
      // freeze / unfreeze / block / activate
      data.status = updates.status
    }
    if (typeof updates.onlineEnabled === 'boolean') data.onlineEnabled = updates.onlineEnabled
    if (typeof updates.contactlessEnabled === 'boolean') data.contactlessEnabled = updates.contactlessEnabled
    if (typeof updates.atmEnabled === 'boolean') data.atmEnabled = updates.atmEnabled
    if (typeof updates.internationalEnabled === 'boolean') data.internationalEnabled = updates.internationalEnabled
    if (updates.monthlyLimitCents !== undefined) {
      data.spendingLimitMonthly = parseMoney(updates.monthlyLimitCents as string | number)
    }
    if (updates.dailyLimitCents !== undefined) {
      data.spendingLimitDaily = parseMoney(updates.dailyLimitCents as string | number)
    }
    if (typeof updates.cardholderName === 'string') {
      data.cardholderName = updates.cardholderName.toUpperCase()
    }

    const updated = await db.consumerCard.update({
      where: { id: cardId },
      data: { ...data, updatedAt: new Date() },
    })

    return ok({ success: true, data: updated, message: 'Card updated successfully' })
  } catch (err) {
    console.error('Update card error:', err)
    return error('Failed to update card', 500)
  }
}

// DELETE /api/consumer/cards - soft-delete by setting status to 'cancelled'
export async function DELETE(request: NextRequest) {
  try {
    const userId = getUserId(request)
    const { searchParams } = new URL(request.url)
    const cardId = searchParams.get('cardId')

    if (!cardId) {
      return error('Card ID required')
    }

    const existing = await db.consumerCard.findUnique({ where: { id: cardId } })
    if (!existing || existing.userId !== userId) {
      return error('Card not found', 404)
    }

    const updated = await db.consumerCard.update({
      where: { id: cardId },
      data: {
        status: 'cancelled',
        cancelledAt: new Date(),
        cancelledReason: 'User requested cancellation',
        updatedAt: new Date(),
      },
    })

    return ok({ success: true, data: updated, message: 'Card terminated successfully' })
  } catch (err) {
    console.error('Delete card error:', err)
    return error('Failed to terminate card', 500)
  }
}

// --- Card number generation helpers -------------------------------------

function generatePan(type: string): string {
  if (type === 'mastercard') {
    const prefix = ['51', '52', '53', '54', '55'][Math.floor(Math.random() * 5)]
    return prefix + Array.from({ length: 14 }, () => Math.floor(Math.random() * 10)).join('')
  }
  // Default to Visa-style PAN
  return '4' + Array.from({ length: 15 }, () => Math.floor(Math.random() * 10)).join('')
}

function generateCvv(): string {
  return String(Math.floor(Math.random() * 900) + 100)
}
