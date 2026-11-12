import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Rate limiting - simple in-memory store (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX = 100

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

// GET /api/platform/stats - Get platform-wide statistics
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               'unknown'
    const rateLimit = checkRateLimit(ip)
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many requests', retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000) },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': RATE_LIMIT_MAX.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimit.resetTime.toString(),
            'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString()
          }
        }
      )
    }

    // Get date ranges
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Run aggregations in parallel
    const [
      totalMerchants,
      activeMerchants,
      totalUsers,
      activeUsers,
      totalConsumers,
      platformTenants,
      gopayTransactions,
      grosellOrders,
      walletTransactions
    ] = await Promise.all([
      // Total merchants
      db.merchant.count(),
      
      // Active merchants (with activity in last 30 days)
      db.merchant.count({
        where: { lastLoginAt: { gte: thirtyDaysAgo } }
      }),
      
      // Total merchant users
      db.user.count(),
      
      // Active users (logged in last 30 days)
      db.user.count({
        where: { lastLoginAt: { gte: thirtyDaysAgo } }
      }),
      
      // Consumer wallet users
      db.consumerUser.count(),
      
      // Platform tenants
      db.platformTenant.count({
        where: { status: 'active' }
      }),
      
      // GoPay transaction stats
      db.gopayTransaction.aggregate({
        _count: { id: true },
        _sum: { amount: true },
        where: { createdAt: { gte: monthStart } }
      }),
      
      // Grosell order stats
      db.sellOrder.aggregate({
        _count: { id: true },
        _sum: { total: true },
        where: { createdAt: { gte: monthStart } }
      }),
      
      // Wallet transaction stats
      db.consumerTransaction.aggregate({
        _count: { id: true },
        _sum: { amountCents: true },
        where: { createdAt: { gte: monthStart } }
      })
    ])

    // Get revenue by tenant (platform)
    const tenants = await db.platformTenant.findMany({
      where: { status: 'active' },
      select: {
        id: true,
        name: true,
        slug: true,
        plan: true,
        _count: {
          select: { TenantUser: true }
        }
      },
      take: 20
    })

    // Calculate totals
    const totalGopayRevenue = gopayTransactions._sum.amount || 0
    const totalGrosellRevenue = grosellOrders._sum.total || 0
    const totalWalletVolume = Number(walletTransactions._sum.amountCents || 0) / 100

    // Get growth metrics (compare to previous period)
    const previousMonthStart = new Date(monthStart)
    previousMonthStart.setMonth(previousMonthStart.getMonth() - 1)
    
    const [previousGopay, previousGrosell] = await Promise.all([
      db.gopayTransaction.aggregate({
        _sum: { amount: true },
        where: {
          createdAt: {
            gte: previousMonthStart,
            lt: monthStart
          }
        }
      }),
      db.sellOrder.aggregate({
        _sum: { total: true },
        where: {
          createdAt: {
            gte: previousMonthStart,
            lt: monthStart
          }
        }
      })
    ])

    const gopayGrowth = previousGopay._sum.amount 
      ? ((totalGopayRevenue - (previousGopay._sum.amount || 0)) / (previousGopay._sum.amount || 1)) * 100 
      : 0
    const grosellGrowth = previousGrosell._sum.total 
      ? ((totalGrosellRevenue - (previousGrosell._sum.total || 0)) / (previousGrosell._sum.total || 1)) * 100 
      : 0

    // Log audit
    await logAudit('platform_stats_viewed', 'platform', null, { ip })

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalMerchants,
          activeMerchants,
          totalUsers,
          activeUsers,
          totalConsumers,
          platformTenants
        },
        revenue: {
          gopay: {
            total: totalGopayRevenue,
            transactions: gopayTransactions._count.id || 0,
            growth: Math.round(gopayGrowth * 100) / 100
          },
          grosell: {
            total: totalGrosellRevenue,
            orders: grosellOrders._count.id || 0,
            growth: Math.round(grosellGrowth * 100) / 100
          },
          wallet: {
            volume: totalWalletVolume,
            transactions: walletTransactions._count.id || 0
          }
        },
        tenants: tenants.map(t => ({
          id: t.id,
          name: t.name,
          slug: t.slug,
          plan: t.plan,
          users: t._count.TenantUser
        })),
        period: {
          start: monthStart.toISOString(),
          end: now.toISOString()
        }
      }
    }, {
      headers: {
        'X-RateLimit-Limit': RATE_LIMIT_MAX.toString(),
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        'X-RateLimit-Reset': rateLimit.resetTime.toString()
      }
    })
  } catch (error) {
    console.error('Platform stats error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch platform statistics' },
      { status: 500 }
    )
  }
}

async function logAudit(action: string, category: string, targetId: string | null, metadata: Record<string, unknown>) {
  try {
    await db.auditLogEntry.create({
      data: {
        id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        action,
        category,
        targetType: 'platform',
        targetId,
        details: JSON.stringify(metadata),
        createdAt: new Date()
      }
    })
  } catch (error) {
    console.error('Audit log error:', error)
  }
}
