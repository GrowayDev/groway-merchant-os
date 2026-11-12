import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateReference, SASSA_GRANT_TYPES, type ApiResponse } from '@/lib/wallet-utils'

// GET - Get grant status and info
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

    // Get user's grants
    const grants = await db.sassaGrant.findMany({
      where: { userId },
      include: {
        SassaGrantPayment: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    })

    // Calculate next payment dates based on grant type
    const now = new Date()
    const grantsWithDates = grants.map(grant => {
      const grantType = SASSA_GRANT_TYPES.find(g => g.id === grant.grantType)
      const nextPayment = new Date(now.getFullYear(), now.getMonth(), grant.paymentDay)
      if (nextPayment <= now) {
        nextPayment.setMonth(nextPayment.getMonth() + 1)
      }

      return {
        ...grant,
        grantTypeName: grantType?.name || grant.grantType,
        nextPaymentDate: nextPayment.toISOString().split('T')[0]
      }
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        grants: grantsWithDates,
        grantTypes: SASSA_GRANT_TYPES
      }
    })
  } catch (error) {
    console.error('Error fetching grants:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to fetch grant information'
    }, { status: 500 })
  }
}

// POST - Link SASSA grant or request early access
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, userId, grantData } = body

    if (!userId || !action) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'User ID and action are required'
      }, { status: 400 })
    }

    switch (action) {
      case 'link': {
        // Link a new SASSA grant
        const { grantType, sassaId, beneficiaryName, beneficiaryIdNumber, paymentDay } = grantData

        if (!grantType || !sassaId) {
          return NextResponse.json<ApiResponse>({
            success: false,
            error: 'Grant type and SASSA ID are required'
          }, { status: 400 })
        }

        // Check if grant already linked
        const existing = await db.sassaGrant.findFirst({
          where: { userId, grantType }
        })

        if (existing) {
          return NextResponse.json<ApiResponse>({
            success: false,
            error: 'Grant of this type already linked'
          }, { status: 400 })
        }

        const grantTypeInfo = SASSA_GRANT_TYPES.find(g => g.id === grantType)

        // Create grant
        const grant = await db.sassaGrant.create({
          data: {
            id: `sassa_${Date.now()}`,
            userId,
            grantType,
            grantAmountCents: BigInt(grantTypeInfo?.amount || 0),
            paymentDay: paymentDay || grantTypeInfo?.paymentDay || 1,
            status: 'active',
            sassaId,
            beneficiaryName,
            beneficiaryIdNumber,
            linkedAt: new Date(),
            earlyAccessEnabled: false
          }
        })

        return NextResponse.json<ApiResponse>({
          success: true,
          data: grant,
          transaction: {
            id: grant.id,
            reference: generateReference('SASSA'),
            status: 'completed'
          }
        })
      }

      case 'early': {
        // Request early access to grant (60% with 3% fee)
        const { grantId } = grantData

        if (!grantId) {
          return NextResponse.json<ApiResponse>({
            success: false,
            error: 'Grant ID is required'
          }, { status: 400 })
        }

        const grant = await db.sassaGrant.findFirst({
          where: { id: grantId, userId }
        })

        if (!grant) {
          return NextResponse.json<ApiResponse>({
            success: false,
            error: 'Grant not found'
          }, { status: 404 })
        }

        // Check if early access enabled
        if (!grant.earlyAccessEnabled) {
          return NextResponse.json<ApiResponse>({
            success: false,
            error: 'Early access not enabled for this grant'
          }, { status: 400 })
        }

        // Calculate early amount (60% of grant)
        const earlyAmount = (Number(grant.grantAmountCents) * 60) / 100
        const feeCents = (earlyAmount * 3) / 100 // 3% fee
        const netAmount = earlyAmount - feeCents

        // Create payment record
        const reference = generateReference('GRANT')
        const payment = await db.sassaGrantPayment.create({
          data: {
            id: `gp_${Date.now()}`,
            grantId: grant.id,
            amountCents: BigInt(earlyAmount),
            paymentDate: new Date().toISOString().split('T')[0],
            paymentType: 'early_access',
            feeCents: BigInt(feeCents),
            netAmountCents: BigInt(netAmount),
            status: 'pending',
            reference
          }
        })

        // Process payment
        processGrantPayment(payment.id, userId, BigInt(netAmount))

        return NextResponse.json<ApiResponse>({
          success: true,
          data: {
            payment,
            breakdown: {
              totalGrant: grant.grantAmountCents,
              earlyAmount: BigInt(earlyAmount),
              feeCents: BigInt(feeCents),
              netAmount: BigInt(netAmount),
              feePercent: 3
            }
          },
          transaction: {
            id: payment.id,
            reference: payment.reference || '',
            status: payment.status
          }
        })
      }

      case 'enable_early': {
        // Enable early access for a grant
        const { grantId } = grantData

        const grant = await db.sassaGrant.update({
          where: { id: grantId },
          data: { earlyAccessEnabled: true }
        })

        return NextResponse.json<ApiResponse>({
          success: true,
          data: grant
        })
      }

      default:
        return NextResponse.json<ApiResponse>({
          success: false,
          error: 'Invalid action'
        }, { status: 400 })
    }
  } catch (error) {
    console.error('Error processing grant action:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to process grant action'
    }, { status: 500 })
  }
}

// Process grant payment
async function processGrantPayment(
  paymentId: string,
  userId: string,
  netAmount: bigint
) {
  try {
    // Get wallet
    const wallet = await db.consumerWallet.findUnique({
      where: { userId }
    })

    if (wallet) {
      // Credit wallet
      await db.consumerWallet.update({
        where: { userId },
        data: {
          balanceCents: { increment: netAmount }
        }
      })

      // Create wallet transaction
      await db.consumerTransaction.create({
        data: {
          id: `txn_${Date.now()}_grant`,
          idempotencyKey: `grant_${paymentId}`,
          userId,
          transactionType: 'grant',
          direction: 'credit',
          amountCents: netAmount,
          feeCents: BigInt(0),
          netAmountCents: netAmount,
          status: 'completed',
          description: 'SASSA Grant Payment',
          reference: generateReference('GRANT'),
          completedAt: new Date()
        }
      })
    }

    // Mark completed
    await db.sassaGrantPayment.update({
      where: { id: paymentId },
      data: {
        status: 'completed',
        processedAt: new Date()
      }
    })
  } catch (error) {
    console.error('Error processing grant payment:', error)
    await db.sassaGrantPayment.update({
      where: { id: paymentId },
      data: {
        status: 'failed'
      }
    })
  }
}
