import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateReference, generateIdempotencyKey, generateCardToken, generateNFCToken, type ApiResponse } from '@/lib/wallet-utils'

// GET - List user cards
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'User ID is required'
      }, { status: 400 })
    }

    const cards = await db.consumerCard.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    })

    // Mask sensitive data for display
    const maskedCards = cards.map(card => ({
      id: card.id,
      cardType: card.cardType,
      cardCategory: card.cardCategory,
      lastFourDigits: card.lastFourDigits,
      cardholderName: card.cardholderName,
      status: card.status,
      spendingLimitDaily: card.spendingLimitDaily,
      spendingLimitMonthly: card.spendingLimitMonthly,
      spentTodayCents: card.spentTodayCents,
      spentThisMonthCents: card.spentThisMonthCents,
      onlineEnabled: card.onlineEnabled,
      contactlessEnabled: card.contactlessEnabled,
      atmEnabled: card.atmEnabled,
      internationalEnabled: card.internationalEnabled,
      issuedAt: card.issuedAt,
      activatedAt: card.activatedAt
    }))

    return NextResponse.json<ApiResponse>({
      success: true,
      data: maskedCards
    })
  } catch (error) {
    console.error('Error fetching cards:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to fetch cards'
    }, { status: 500 })
  }
}

// POST - Create virtual card
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userId,
      cardType = 'visa', // visa, mastercard
      cardholderName,
      spendingLimitDaily,
      spendingLimitMonthly
    } = body

    if (!userId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'User ID is required'
      }, { status: 400 })
    }

    // Check user exists
    const user = await db.consumerUser.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'User not found'
      }, { status: 404 })
    }

    // Check KYC level (need at least L1 for virtual card)
    if (user.kycLevel < 1) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'KYC Level 1 required to create a virtual card'
      }, { status: 400 })
    }

    // Generate card details
    const cardToken = generateCardToken()
    const lastFourDigits = String(Math.floor(1000 + Math.random() * 9000))
    const expiryMonth = String((new Date().getMonth() + 1)).padStart(2, '0')
    const expiryYear = String(new Date().getFullYear() + 4).slice(-2)

    // Generate NFC token for contactless payments
    const nfcToken = generateNFCToken()
    const nfcTokenExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

    // Create card
    const card = await db.consumerCard.create({
      data: {
        id: `card_${Date.now()}`,
        userId,
        cardType,
        cardCategory: 'virtual',
        cardDesign: 'default',
        lastFourDigits,
        cardToken,
        panEncrypted: 'ENCRYPTED_PAN', // In production, this would be properly encrypted
        cvvEncrypted: 'ENCRYPTED_CVV',
        expiryMonth,
        expiryYear,
        cardholderName: cardholderName || `${user.firstName} ${user.lastName}`,
        status: 'active',
        spendingLimitDaily: spendingLimitDaily ? BigInt(spendingLimitDaily) : BigInt(500000), // R5000 default
        spendingLimitMonthly: spendingLimitMonthly ? BigInt(spendingLimitMonthly) : BigInt(5000000), // R50000 default
        spentTodayCents: BigInt(0),
        spentThisMonthCents: BigInt(0),
        onlineEnabled: true,
        contactlessEnabled: true,
        atmEnabled: false,
        internationalEnabled: false,
        nfcToken,
        nfcTokenExpiry,
        issuedAt: new Date(),
        activatedAt: new Date()
      }
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        id: card.id,
        cardType: card.cardType,
        lastFourDigits: card.lastFourDigits,
        expiryMonth: card.expiryMonth,
        expiryYear: card.expiryYear,
        cardholderName: card.cardholderName,
        status: card.status,
        nfcEnabled: !!card.nfcToken
      },
      transaction: {
        id: card.id,
        reference: generateReference('CARD'),
        status: 'completed'
      }
    })
  } catch (error) {
    console.error('Error creating card:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to create card'
    }, { status: 500 })
  }
}

// PUT - Update card settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userId,
      cardId,
      action, // freeze, unfreeze, update_limits, regenerate_nfc
      data
    } = body

    if (!userId || !cardId || !action) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Missing required fields'
      }, { status: 400 })
    }

    // Verify card belongs to user
    const card = await db.consumerCard.findFirst({
      where: { id: cardId, userId }
    })

    if (!card) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Card not found'
      }, { status: 404 })
    }

    let updateData: Record<string, unknown> = {}

    switch (action) {
      case 'freeze':
        updateData = { status: 'frozen' }
        break
      case 'unfreeze':
        updateData = { status: 'active' }
        break
      case 'update_limits':
        if (data?.spendingLimitDaily) {
          updateData.spendingLimitDaily = BigInt(data.spendingLimitDaily)
        }
        if (data?.spendingLimitMonthly) {
          updateData.spendingLimitMonthly = BigInt(data.spendingLimitMonthly)
        }
        if (data?.onlineEnabled !== undefined) {
          updateData.onlineEnabled = data.onlineEnabled
        }
        if (data?.contactlessEnabled !== undefined) {
          updateData.contactlessEnabled = data.contactlessEnabled
        }
        if (data?.atmEnabled !== undefined) {
          updateData.atmEnabled = data.atmEnabled
        }
        if (data?.internationalEnabled !== undefined) {
          updateData.internationalEnabled = data.internationalEnabled
        }
        break
      case 'regenerate_nfc':
        updateData = {
          nfcToken: generateNFCToken(),
          nfcTokenExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
        break
      default:
        return NextResponse.json<ApiResponse>({
          success: false,
          error: 'Invalid action'
        }, { status: 400 })
        break
    }

    const updatedCard = await db.consumerCard.update({
      where: { id: cardId },
      data: updateData
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        id: updatedCard.id,
        status: updatedCard.status,
        spendingLimitDaily: updatedCard.spendingLimitDaily,
        spendingLimitMonthly: updatedCard.spendingLimitMonthly,
        onlineEnabled: updatedCard.onlineEnabled,
        contactlessEnabled: updatedCard.contactlessEnabled,
        atmEnabled: updatedCard.atmEnabled,
        internationalEnabled: updatedCard.internationalEnabled,
        nfcToken: action === 'regenerate_nfc' ? updatedCard.nfcToken : undefined
      },
      transaction: {
        id: updatedCard.id,
        reference: generateReference('CARD'),
        status: 'completed'
      }
    })
  } catch (error) {
    console.error('Error updating card:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to update card'
    }, { status: 500 })
  }
}

// DELETE - Cancel card
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const cardId = searchParams.get('cardId')
    const reason = searchParams.get('reason')

    if (!userId || !cardId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'User ID and Card ID are required'
      }, { status: 400 })
    }

    // Verify card belongs to user
    const card = await db.consumerCard.findFirst({
      where: { id: cardId, userId }
    })

    if (!card) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Card not found'
      }, { status: 404 })
    }

    // Cancel card
    const updatedCard = await db.consumerCard.update({
      where: { id: cardId },
      data: {
        status: 'cancelled',
        cancelledAt: new Date(),
        cancelledReason: reason || 'User requested cancellation',
        nfcToken: null,
        nfcTokenExpiry: null
      }
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        id: updatedCard.id,
        status: updatedCard.status,
        cancelledAt: updatedCard.cancelledAt
      }
    })
  } catch (error) {
    console.error('Error cancelling card:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to cancel card'
    }, { status: 500 })
  }
}
