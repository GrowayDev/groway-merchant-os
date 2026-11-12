import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verify } from 'jsonwebtoken'
import { nanoid } from 'nanoid'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

// Rate limiting
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW = 60 * 1000
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

// GET /api/gopay/merchants - List all GoPay merchants
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 'unknown'
    const rateLimit = checkRateLimit(ip)
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const tier = searchParams.get('tier')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // Build where clause
    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (tier) where.tier = tier
    if (search) {
      where.OR = [
        { businessName: { contains: search, mode: 'insensitive' } },
        { tradingName: { contains: search, mode: 'insensitive' } },
        { merchantCode: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Get total count
    const total = await db.GopayMerchant.count({ where })

    // Get merchants
    const merchants = await db.GopayMerchant.findMany({
      where,
      include: {
        _count: {
          select: { devices: true, settlements: true }
        }
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit
    })

    // Get aggregated stats
    const stats = await db.GopayMerchant.aggregate({
      where,
      _count: { id: true },
      _sum: { totalRevenue: true, totalTransactions: true }
    })

    return NextResponse.json({
      success: true,
      data: merchants.map(m => ({
        id: m.id,
        merchantCode: m.merchantCode,
        businessName: m.businessName,
        tradingName: m.tradingName,
        contactName: m.contactName,
        contactEmail: m.contactEmail,
        contactPhone: m.contactPhone,
        tier: m.tier,
        status: m.status,
        riskScore: m.riskScore,
        totalRevenue: m.totalRevenue,
        totalTransactions: m.totalTransactions,
        deviceCount: m._count.devices,
        settlementCount: m._count.settlements,
        createdAt: m.createdAt,
        lastActive: m.lastActive
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      stats: {
        totalMerchants: stats._count.id,
        totalRevenue: stats._sum.totalRevenue || 0,
        totalTransactions: stats._sum.totalTransactions || 0
      }
    }, {
      headers: {
        'X-Total-Count': total.toString(),
        'X-Page': page.toString(),
        'X-Per-Page': limit.toString(),
        'X-RateLimit-Limit': RATE_LIMIT_MAX.toString(),
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        'X-RateLimit-Reset': rateLimit.resetTime.toString()
      }
    })
  } catch (error) {
    console.error('Error fetching merchants:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch merchants' },
      { status: 500 }
    )
  }
}

// POST /api/gopay/merchants - Create a new GoPay merchant
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      businessName,
      tradingName,
      contactName,
      contactEmail,
      contactPhone,
      addressLine1,
      addressLine2,
      city,
      province,
      postalCode,
      bankName,
      bankAccount,
      bankBranch,
      accountHolder,
      tier = 'standard',
      notes
    } = body

    // Validate required fields
    if (!businessName || !contactEmail || !contactPhone) {
      return NextResponse.json(
        { success: false, error: 'Business name, contact email, and contact phone are required' },
        { status: 400 }
      )
    }

    // Generate merchant code
    const merchantCode = `GP${nanoid(8).toUpperCase()}`

    // Create merchant
    const merchant = await db.GopayMerchant.create({
      data: {
        id: `gpm_${nanoid(12)}`,
        merchantCode,
        businessName,
        tradingName: tradingName || businessName,
        contactName,
        contactEmail,
        contactPhone,
        addressLine1,
        addressLine2,
        city,
        province,
        postalCode,
        bankName,
        bankAccount,
        bankBranch,
        accountHolder,
        tier,
        status: 'pending',
        riskScore: 50,
        totalRevenue: 0,
        totalTransactions: 0,
        notes
      }
    })

    // Create audit log
    await db.auditLogEntry.create({
      data: {
        id: `audit_${Date.now()}_${nanoid(8)}`,
        action: 'gopay_merchant_created',
        category: 'gopay',
        targetType: 'merchant',
        targetId: merchant.id,
        details: JSON.stringify({
          businessName,
          merchantCode,
          tier
        }),
        createdAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      data: merchant,
      message: 'Merchant created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating merchant:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create merchant' },
      { status: 500 }
    )
  }
}
