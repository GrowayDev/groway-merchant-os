import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verify } from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

// Rate limiting
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW = 60 * 1000
const RATE_LIMIT_MAX = 300

function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const record = rateLimitStore.get(ip)
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1, resetTime: now + RATE_LIMIT_WINDOW }
  }
  
  if (record.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime }
  }
  
  record.count++
  return { allowed: true, remaining: RATE_LIMIT_MAX - record.count, resetTime: record.resetTime }
}

// GET /api/wallet/balance - Get wallet balance and limits
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 'unknown'
    const rateLimit = checkRateLimit(ip)
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': RATE_LIMIT_MAX.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimit.resetTime.toString()
          }
        }
      )
    }

    // Authentication
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('auth_token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let decoded: { userId: string }
    try {
      decoded = verify(token, JWT_SECRET) as { userId: string }
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Get wallet
    const wallet = await db.consumerWallet.findUnique({
      where: { userId: decoded.userId }
    })

    if (!wallet) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 })
    }

    // Get loyalty info
    const loyalty = await db.consumerLoyalty.findUnique({
      where: { userId: decoded.userId }
    })

    // Get today's spent amount
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    
    const todayTransactions = await db.consumerTransaction.aggregate({
      where: {
        userId: decoded.userId,
        direction: 'debit',
        createdAt: { gte: todayStart },
        status: 'completed'
      },
      _sum: { amountCents: true }
    })

    // Get this month's spent amount
    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)
    
    const monthTransactions = await db.consumerTransaction.aggregate({
      where: {
        userId: decoded.userId,
        direction: 'debit',
        createdAt: { gte: monthStart },
        status: 'completed'
      },
      _sum: { amountCents: true }
    })

    // Get pending transactions
    const pendingTransactions = await db.consumerTransaction.aggregate({
      where: {
        userId: decoded.userId,
        status: 'pending'
      },
      _sum: { amountCents: true }
    })

    // Calculate available balance
    const balance = Number(wallet.balanceCents) / 100
    const reserved = Number(wallet.reservedCents || 0) / 100
    const pending = Number(wallet.pendingCents || 0) / 100
    const availableBalance = balance - reserved - pending

    // Calculate daily and monthly limits
    const dailySpent = Number(todayTransactions._sum.amountCents || 0) / 100
    const monthlySpent = Number(monthTransactions._sum.amountCents || 0) / 100
    const dailyLimit = wallet.dailySpendLimit ? Number(wallet.dailySpendLimit) / 100 : null
    const monthlyLimit = wallet.monthlySpendLimit ? Number(wallet.monthlySpendLimit) / 100 : null

    // Calculate remaining limits
    const dailyRemaining = dailyLimit ? Math.max(0, dailyLimit - dailySpent) : null
    const monthlyRemaining = monthlyLimit ? Math.max(0, monthlyLimit - monthlySpent) : null

    return NextResponse.json({
      success: true,
      data: {
        balance: {
          available: availableBalance,
          current: balance,
          reserved,
          pending,
          currency: wallet.currency || 'ZAR'
        },
        limits: {
          daily: {
            limit: dailyLimit,
            spent: dailySpent,
            remaining: dailyRemaining,
            percentUsed: dailyLimit ? Math.round((dailySpent / dailyLimit) * 100) : null
          },
          monthly: {
            limit: monthlyLimit,
            spent: monthlySpent,
            remaining: monthlyRemaining,
            percentUsed: monthlyLimit ? Math.round((monthlySpent / monthlyLimit) * 100) : null
          }
        },
        totals: {
          received: Number(wallet.totalReceivedCents || 0) / 100,
          sent: Number(wallet.totalSentCents || 0) / 100,
          topups: Number(wallet.totalTopupsCents || 0) / 100,
          withdrawals: Number(wallet.totalWithdrawalsCents || 0) / 100
        },
        loyalty: loyalty ? {
          tier: loyalty.tier,
          points: loyalty.points,
          totalEarned: loyalty.totalEarned,
          totalRedeemed: loyalty.totalRedeemed,
          pointsToNextTier: loyalty.pointsToNextTier,
          tierProgress: loyalty.tierProgress
        } : null,
        lastUpdated: wallet.updatedAt.toISOString()
      }
    }, {
      headers: {
        'X-RateLimit-Limit': RATE_LIMIT_MAX.toString(),
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        'X-RateLimit-Reset': rateLimit.resetTime.toString(),
        'Cache-Control': 'no-store'
      }
    })
  } catch (error) {
    console.error('Wallet balance error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch wallet balance' },
      { status: 500 }
    )
  }
}
