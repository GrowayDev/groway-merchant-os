import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateReference, type ApiResponse } from '@/lib/wallet-utils'

// PCI DSS compliant logging - never log full PAN
const maskPAN = (pan: string) => {
  if (pan.length <= 4) return '****'
  return '****' + pan.slice(-4)
}

// GET - Get card details (masked by default)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cardId: string }> }
) {
  try {
    const { cardId } = await params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const reveal = searchParams.get('reveal') === 'true'

    if (!userId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'User ID is required'
      }, { status: 400 })
    }

    const card = await db.consumerCard.findFirst({
      where: { id: cardId, userId },
      include: {
        CardSettings: true
      }
    })

    if (!card) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Card not found'
      }, { status: 404 })
    }

    // Base response with masked data
    const baseResponse = {
      cardId: card.id,
      cardType: card.cardType,
      cardCategory: card.cardCategory,
      lastFourDigits: card.lastFourDigits,
      maskedNumber: `•••• •••• •••• ${card.lastFourDigits}`,
      cardholderName: card.cardholderName,
      status: card.status,
      expiryDisplay: `${card.expiryMonth}/${card.expiryYear}`,
      expiryMonth: card.expiryMonth,
      expiryYear: card.expiryYear,
      features: {
        nfcEnabled: card.contactlessEnabled,
        onlinePaymentsEnabled: card.onlineEnabled,
        internationalPaymentsEnabled: card.internationalEnabled,
        atmWithdrawalsEnabled: card.atmEnabled
      },
      spendingLimits: {
        dailyLimitCents: Number(card.spendingLimitDaily || 0),
        perTransactionLimitCents: Number(card.CardSettings?.dailyLimit || 500000),
        monthlyLimitCents: Number(card.spendingLimitMonthly || 0)
      },
      merchantRestrictions: {
        gambling: false,
        alcohol: false,
        tobacco: false,
        adultContent: false,
        crypto: false,
        ...(card.CardSettings?.blockedMerchants ? JSON.parse(card.CardSettings.blockedMerchants) : {})
      },
      issuedAt: card.issuedAt?.toISOString() || new Date().toISOString(),
      expiresAt: `${card.expiryMonth}/01/20${card.expiryYear}`,
      hasPhysicalCard: card.cardCategory === 'physical',
      physicalCardRequested: false
    }

    // If reveal is requested and card is not frozen/cancelled
    if (reveal && card.status === 'active') {
      // In production, this would decrypt the stored PAN/CVV
      // For demo purposes, generate a fake PAN
      const fakePAN = `411111111111${card.lastFourDigits}`
      const fakeCVV = '123'

      console.log('[CardAPI] Sensitive data revealed for card:', maskPAN(fakePAN))

      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          ...baseResponse,
          fullNumber: fakePAN,
          cvv: fakeCVV
        }
      })
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: baseResponse
    })
  } catch (error) {
    console.error('[CardAPI] Error fetching card:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to fetch card details'
    }, { status: 500 })
  }
}

// PUT - Update card settings
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ cardId: string }> }
) {
  try {
    const { cardId } = await params
    const body = await request.json()
    const {
      userId,
      action,
      data
    } = body

    if (!userId || !action) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Missing required fields'
      }, { status: 400 })
    }

    // Verify card belongs to user
    const card = await db.consumerCard.findFirst({
      where: { id: cardId, userId },
      include: { CardSettings: true }
    })

    if (!card) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Card not found'
      }, { status: 404 })
    }

    let updateData: Record<string, unknown> = {}
    let settingsUpdateData: Record<string, unknown> = {}

    switch (action) {
      case 'freeze':
        if (card.status !== 'active') {
          return NextResponse.json<ApiResponse>({
            success: false,
            error: 'Card cannot be frozen in current state'
          }, { status: 400 })
        }
        updateData = { status: 'frozen' }
        console.log('[CardAPI] Card frozen:', maskPAN(card.lastFourDigits))
        break

      case 'unfreeze':
        if (card.status !== 'frozen') {
          return NextResponse.json<ApiResponse>({
            success: false,
            error: 'Card is not frozen'
          }, { status: 400 })
        }
        updateData = { status: 'active' }
        console.log('[CardAPI] Card unfrozen:', maskPAN(card.lastFourDigits))
        break

      case 'report_lost':
      case 'report_stolen':
        updateData = {
          status: action === 'report_lost' ? 'lost' : 'stolen',
          cancelledAt: new Date(),
          cancelledReason: action === 'report_lost' ? 'Reported lost by user' : 'Reported stolen by user',
          nfcToken: null,
          nfcTokenExpiry: null
        }
        console.log('[CardAPI] Card reported as', action, ':', maskPAN(card.lastFourDigits))
        break

      case 'request_physical':
        // In production, this would trigger a physical card fulfillment process
        updateData = { cardCategory: 'physical' }
        console.log('[CardAPI] Physical card requested:', maskPAN(card.lastFourDigits))
        break

      case 'update_features':
        if (data?.nfcEnabled !== undefined) {
          updateData.contactlessEnabled = data.nfcEnabled
        }
        if (data?.onlinePaymentsEnabled !== undefined) {
          updateData.onlineEnabled = data.onlinePaymentsEnabled
        }
        if (data?.internationalPaymentsEnabled !== undefined) {
          updateData.internationalEnabled = data.internationalPaymentsEnabled
        }
        if (data?.atmWithdrawalsEnabled !== undefined) {
          updateData.atmEnabled = data.atmWithdrawalsEnabled
        }
        console.log('[CardAPI] Features updated for card:', maskPAN(card.lastFourDigits))
        break

      case 'update_limits':
        if (data?.dailyLimitCents !== undefined) {
          updateData.spendingLimitDaily = BigInt(data.dailyLimitCents)
        }
        if (data?.monthlyLimitCents !== undefined) {
          updateData.spendingLimitMonthly = BigInt(data.monthlyLimitCents)
        }
        if (data?.perTransactionLimitCents !== undefined) {
          settingsUpdateData.dailyLimit = BigInt(data.perTransactionLimitCents)
        }
        console.log('[CardAPI] Limits updated for card:', maskPAN(card.lastFourDigits))
        break

      case 'update_restrictions':
        settingsUpdateData.blockedMerchants = JSON.stringify(data || {})
        console.log('[CardAPI] Restrictions updated for card:', maskPAN(card.lastFourDigits))
        break

      default:
        return NextResponse.json<ApiResponse>({
          success: false,
          error: 'Invalid action'
        }, { status: 400 })
    }

    // Update card
    const updatedCard = await db.consumerCard.update({
      where: { id: cardId },
      data: updateData
    })

    // Update or create card settings if needed
    if (Object.keys(settingsUpdateData).length > 0) {
      if (card.CardSettings) {
        await db.cardSettings.update({
          where: { cardId },
          data: settingsUpdateData
        })
      } else {
        await db.cardSettings.create({
          data: {
            id: `cs_${Date.now()}`,
            cardId,
            ...settingsUpdateData
          }
        })
      }
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        id: updatedCard.id,
        status: updatedCard.status,
        features: {
          nfcEnabled: updatedCard.contactlessEnabled,
          onlinePaymentsEnabled: updatedCard.onlineEnabled,
          internationalPaymentsEnabled: updatedCard.internationalEnabled,
          atmWithdrawalsEnabled: updatedCard.atmEnabled
        },
        spendingLimits: {
          dailyLimitCents: Number(updatedCard.spendingLimitDaily || 0),
          monthlyLimitCents: Number(updatedCard.spendingLimitMonthly || 0)
        }
      },
      transaction: {
        id: updatedCard.id,
        reference: generateReference('CARD'),
        status: 'completed'
      }
    })
  } catch (error) {
    console.error('[CardAPI] Error updating card:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to update card'
    }, { status: 500 })
  }
}
