import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateReference, calculateFee, type ApiResponse } from '@/lib/wallet-utils'

// GET - Get available wage amount and PayPlus account
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

    // Get or create PayPlus account
    let account = await db.payPlusAccount.findUnique({
      where: { userId },
      include: {
        PayPlusTransaction: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    })

    if (!account) {
      // Create mock account for demo
      account = await db.payPlusAccount.create({
        data: {
          id: `ppa_${Date.now()}`,
          userId,
          employerName: 'Demo Employer',
          employmentStatus: 'active',
          monthlySalaryCents: BigInt(2500000), // R25,000
          daysWorked: 15,
          availableWageCents: BigInt(553600), // R5,536 (about 60% of worked days)
          feePlan: 'pay_per_use',
          nextPayDay: '25',
          status: 'active'
        },
        include: {
          PayPlusTransaction: true
        }
      })
    }

    // Calculate available amount (60% of worked wage)
    const dailyWage = Number(account.monthlySalaryCents) / 22 // Assuming 22 working days
    const availableAmount = Math.floor(dailyWage * account.daysWorked * 0.6)

    // Calculate fee based on plan
    let feeInfo = {
      plan: account.feePlan,
      feePercent: account.feePlan === 'pay_per_use' ? 3 : 0,
      monthlyFee: account.feePlan === 'unlimited' ? 9900 : 0
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        account: {
          id: account.id,
          employerName: account.employerName,
          employmentStatus: account.employmentStatus,
          monthlySalaryCents: account.monthlySalaryCents,
          daysWorked: account.daysWorked,
          availableWageCents: BigInt(availableAmount),
          totalAccessedCents: account.totalAccessedCents,
          feePlan: account.feePlan,
          nextPayDay: account.nextPayDay,
          status: account.status
        },
        feeInfo,
        transactions: account.PayPlusTransaction
      }
    })
  } catch (error) {
    console.error('Error fetching PayPlus account:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to fetch PayPlus account'
    }, { status: 500 })
  }
}

// POST - Request early wage access
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, amountCents, plan } = body

    if (!userId || !amountCents) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'User ID and amount are required'
      }, { status: 400 })
    }

    // Get account
    const account = await db.payPlusAccount.findUnique({
      where: { userId }
    })

    if (!account) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'PayPlus account not found'
      }, { status: 404 })
    }

    // Check available amount
    if (BigInt(amountCents) > account.availableWageCents) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Amount exceeds available wage'
      }, { status: 400 })
    }

    // Update plan if provided
    if (plan && plan !== account.feePlan) {
      await db.payPlusAccount.update({
        where: { userId },
        data: { feePlan: plan }
      })
    }

    // Calculate fee
    const feePercent = plan === 'unlimited' ? 0 : 3
    const feeCents = calculateFee(BigInt(amountCents), feePercent)
    const netAmount = BigInt(amountCents) - feeCents

    // Create transaction
    const reference = generateReference('EWA')
    const transaction = await db.payPlusTransaction.create({
      data: {
        id: `ewa_${Date.now()}`,
        accountId: account.id,
        transactionType: 'withdrawal',
        amountCents: BigInt(amountCents),
        feeCents,
        netAmountCents: netAmount,
        reference,
        status: 'pending'
      }
    })

    // Update account
    await db.payPlusAccount.update({
      where: { userId },
      data: {
        availableWageCents: { decrement: BigInt(amountCents) },
        totalAccessedCents: { increment: BigInt(amountCents) },
        lastWithdrawalAt: new Date()
      }
    })

    // Process asynchronously
    processEWAWithdrawal(transaction.id, userId, netAmount)

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        transaction,
        feeBreakdown: {
          amountCents: BigInt(amountCents),
          feeCents,
          feePercent,
          netAmountCents: netAmount
        }
      },
      transaction: {
        id: transaction.id,
        reference: transaction.reference,
        status: transaction.status
      }
    })
  } catch (error) {
    console.error('Error processing EWA request:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to process early wage access'
    }, { status: 500 })
  }
}

// Process EWA withdrawal
async function processEWAWithdrawal(
  transactionId: string,
  userId: string,
  netAmount: bigint
) {
  try {
    // Update to processing
    await db.payPlusTransaction.update({
      where: { id: transactionId },
      data: { status: 'processing' }
    })

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
          id: `txn_${Date.now()}_ewa`,
          idempotencyKey: `ewa_${transactionId}`,
          userId,
          transactionType: 'ewa',
          direction: 'credit',
          amountCents: netAmount,
          feeCents: BigInt(0),
          netAmountCents: netAmount,
          status: 'completed',
          description: 'Early Wage Access',
          reference: generateReference('EWA'),
          completedAt: new Date()
        }
      })
    }

    // Mark completed
    await db.payPlusTransaction.update({
      where: { id: transactionId },
      data: {
        status: 'completed',
        completedAt: new Date()
      }
    })
  } catch (error) {
    console.error('Error processing EWA withdrawal:', error)
    await db.payPlusTransaction.update({
      where: { id: transactionId },
      data: {
        status: 'failed',
        failedAt: new Date(),
        failureReason: 'Processing error'
      }
    })
  }
}
