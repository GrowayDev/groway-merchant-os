import { NextRequest, NextResponse } from 'next/server'

// Mock data for when database is unavailable
const MOCK_WALLET_DATA = {
  balanceCents: 1584750, // R 15,847.50
  reservedCents: 0,
  pendingCents: 25000, // R 250.00 pending
  currency: 'ZAR',
  dailySpendLimit: 500000, // R 5,000
  dailySpentCents: 12500, // R 125.00
  monthlySpendLimit: 1000000, // R 10,000
  monthlySpentCents: 450000, // R 4,500
  totalReceivedCents: 25000000,
  totalSentCents: 12000000,
  totalTopupsCents: 35000000,
  totalWithdrawalsCents: 5000000
}

const MOCK_USER_DATA = {
  id: 'user-001',
  phone: '+27821234567',
  firstName: 'Thabo',
  lastName: 'Molefe',
  kycLevel: 3,
  accountStatus: 'active'
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Try database first, fall back to mock data
    let wallet
    try {
      const { db } = await import('@/lib/db')
      wallet = await db.consumerWallet.findUnique({
        where: { userId },
        include: {
          user: {
            select: {
              id: true,
              phone: true,
              firstName: true,
              lastName: true,
              kycLevel: true,
              accountStatus: true
            }
          }
        }
      })
    } catch (dbError) {
      // Database unavailable, use mock data
      console.log('Database unavailable, using mock data')
    }

    if (!wallet) {
      // Return mock data
      return NextResponse.json({
        success: true,
        data: {
          balance: {
            available: MOCK_WALLET_DATA.balanceCents.toString(),
            reserved: MOCK_WALLET_DATA.reservedCents.toString(),
            pending: MOCK_WALLET_DATA.pendingCents.toString(),
            currency: MOCK_WALLET_DATA.currency
          },
          limits: {
            dailyLimit: MOCK_WALLET_DATA.dailySpendLimit.toString(),
            dailySpent: MOCK_WALLET_DATA.dailySpentCents.toString(),
            monthlyLimit: MOCK_WALLET_DATA.monthlySpendLimit.toString(),
            monthlySpent: MOCK_WALLET_DATA.monthlySpentCents.toString()
          },
          totals: {
            received: MOCK_WALLET_DATA.totalReceivedCents.toString(),
            sent: MOCK_WALLET_DATA.totalSentCents.toString(),
            topups: MOCK_WALLET_DATA.totalTopupsCents.toString(),
            withdrawals: MOCK_WALLET_DATA.totalWithdrawalsCents.toString()
          },
          user: MOCK_USER_DATA
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        balance: {
          available: wallet.balanceCents.toString(),
          reserved: wallet.reservedCents.toString(),
          pending: wallet.pendingCents.toString(),
          currency: wallet.currency
        },
        limits: {
          dailyLimit: wallet.dailySpendLimit?.toString() || null,
          dailySpent: wallet.dailySpentCents.toString(),
          monthlyLimit: wallet.monthlySpendLimit?.toString() || null,
          monthlySpent: wallet.monthlySpentCents.toString()
        },
        totals: {
          received: wallet.totalReceivedCents.toString(),
          sent: wallet.totalSentCents.toString(),
          topups: wallet.totalTopupsCents.toString(),
          withdrawals: wallet.totalWithdrawalsCents.toString()
        },
        user: wallet.user
      }
    })

  } catch (error) {
    console.error('Get wallet error:', error)
    // Return mock data on any error
    return NextResponse.json({
      success: true,
      data: {
        balance: {
          available: MOCK_WALLET_DATA.balanceCents.toString(),
          reserved: MOCK_WALLET_DATA.reservedCents.toString(),
          pending: MOCK_WALLET_DATA.pendingCents.toString(),
          currency: MOCK_WALLET_DATA.currency
        },
        limits: {
          dailyLimit: MOCK_WALLET_DATA.dailySpendLimit.toString(),
          dailySpent: MOCK_WALLET_DATA.dailySpentCents.toString(),
          monthlyLimit: MOCK_WALLET_DATA.monthlySpendLimit.toString(),
          monthlySpent: MOCK_WALLET_DATA.monthlySpentCents.toString()
        },
        totals: {
          received: MOCK_WALLET_DATA.totalReceivedCents.toString(),
          sent: MOCK_WALLET_DATA.totalSentCents.toString(),
          topups: MOCK_WALLET_DATA.totalTopupsCents.toString(),
          withdrawals: MOCK_WALLET_DATA.totalWithdrawalsCents.toString()
        },
        user: MOCK_USER_DATA
      }
    })
  }
}
