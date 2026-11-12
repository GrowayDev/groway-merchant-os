import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/merchants - List all merchants
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const status = searchParams.get('status')
    const limit = searchParams.get('limit')
    const offset = searchParams.get('offset')

    const where: {
      status?: string
      OR?: Array<{
        name?: { contains: string; mode: 'insensitive' }
        code?: { contains: string; mode: 'insensitive' }
        tradingName?: { contains: string; mode: 'insensitive' }
        email?: { contains: string; mode: 'insensitive' }
      }>
    } = {}

    if (status) where.status = status
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { tradingName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    }

    const take = limit ? parseInt(limit) : undefined
    const skip = offset ? parseInt(offset) : undefined

    const [merchants, total] = await Promise.all([
      db.merchant.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take,
        skip,
        include: {
          _count: {
            select: {
              branches: true,
              products: true,
              users: true
            }
          }
        }
      }),
      db.merchant.count({ where })
    ])

    return NextResponse.json({
      merchants,
      total,
      limit: take,
      offset: skip
    })
  } catch (error) {
    console.error('Error fetching merchants:', error)
    return NextResponse.json({ error: 'Failed to fetch merchants' }, { status: 500 })
  }
}

// POST /api/merchants - Create a new merchant
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ error: 'Merchant name is required' }, { status: 400 })
    }

    // Generate merchant code if not provided
    const code = body.code || `MER-${Date.now().toString(36).toUpperCase()}`

    // Check if code already exists
    const existingMerchant = await db.merchant.findUnique({
      where: { code }
    })

    if (existingMerchant) {
      return NextResponse.json({ error: 'Merchant code already exists' }, { status: 400 })
    }

    // Check unique constraints for registration number and VAT number
    if (body.registrationNumber) {
      const existingReg = await db.merchant.findUnique({
        where: { registrationNumber: body.registrationNumber }
      })
      if (existingReg) {
        return NextResponse.json({ error: 'Registration number already exists' }, { status: 400 })
      }
    }

    if (body.vatNumber) {
      const existingVat = await db.merchant.findUnique({
        where: { vatNumber: body.vatNumber }
      })
      if (existingVat) {
        return NextResponse.json({ error: 'VAT number already exists' }, { status: 400 })
      }
    }

    const merchant = await db.merchant.create({
      data: {
        code,
        name: body.name,
        tradingName: body.tradingName,
        registrationNumber: body.registrationNumber,
        vatNumber: body.vatNumber,
        type: body.type || 'sole_proprietor',
        industry: body.industry || 'retail',
        subVertical: body.subVertical,
        phone: body.phone,
        email: body.email,
        website: body.website,
        addressLine1: body.addressLine1,
        addressLine2: body.addressLine2,
        city: body.city,
        province: body.province,
        postalCode: body.postalCode,
        country: body.country || 'ZA',
        bankName: body.bankName,
        bankAccountNumber: body.bankAccountNumber,
        bankAccountType: body.bankAccountType,
        bankBranchCode: body.bankBranchCode,
        status: body.status || 'pending',
        subscriptionPlan: body.subscriptionPlan || 'starter',
        subscriptionStatus: body.subscriptionStatus || 'trial',
        currency: body.currency || 'ZAR',
        timezone: body.timezone || 'Africa/Johannesburg',
        language: body.language || 'en',
        vatRate: body.vatRate ?? 15.0,
        vatEnabled: body.vatEnabled ?? true,
        featuresEnabled: body.featuresEnabled ? JSON.stringify(body.featuresEnabled) : null,
        maxBranches: body.maxBranches ?? 1,
        maxUsers: body.maxUsers ?? 5,
        maxProducts: body.maxProducts ?? 500,
        maxTransactions: body.maxTransactions ?? 10000,
        onboardingStatus: body.onboardingStatus || 'pending',
        onboardingStep: body.onboardingStep ?? 0,
        kycStatus: body.kycStatus || 'pending',
        ficaCompliant: body.ficaCompliant ?? false
      },
      include: {
        _count: {
          select: {
            branches: true,
            products: true,
            users: true
          }
        }
      }
    })

    return NextResponse.json({ merchant }, { status: 201 })
  } catch (error) {
    console.error('Error creating merchant:', error)
    return NextResponse.json({ error: 'Failed to create merchant' }, { status: 500 })
  }
}
