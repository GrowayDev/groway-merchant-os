import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Helper to get session
async function getSession(request: NextRequest) {
  const sessionToken = request.cookies.get('groway_session')?.value
  if (!sessionToken) return null
  
  try {
    return await db.merchantSession.findFirst({
      where: { 
        token: sessionToken,
        expiresAt: { gt: new Date() }
      },
      include: { user: true, merchant: true },
    })
  } catch {
    return null
  }
}

// GET /api/merchant-os/professional/indemnity - Get PI insurance policies for merchant
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const where: any = {
      merchantId: session.merchantId,
    }

    if (status && status !== 'all') {
      where.status = status
    }

    const policies = await db.professionalIndemnityInsurance.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    // Check for expiring policies (within 30 days)
    const today = new Date()
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(today.getDate() + 30)

    const policiesWithExpiry = policies.map(policy => {
      const endDate = new Date(policy.endDate)
      const daysUntilExpiry = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      
      return {
        ...policy,
        daysUntilExpiry,
        isExpiringSoon: daysUntilExpiry <= 30 && daysUntilExpiry > 0,
        isExpired: endDate < today,
      }
    })

    // Calculate stats
    const stats = {
      total: policies.length,
      active: policies.filter(p => p.status === 'active').length,
      expired: policies.filter(p => p.status === 'expired').length,
      pendingRenewal: policies.filter(p => p.status === 'pending_renewal').length,
      expiringSoon: policiesWithExpiry.filter(p => p.isExpiringSoon).length,
      totalCoverage: policies
        .filter(p => p.status === 'active')
        .reduce((sum, p) => sum + p.coverageAmount, 0),
    }

    return NextResponse.json({
      success: true,
      policies: policiesWithExpiry,
      stats,
    })
  } catch (error) {
    console.error('Get PI insurance policies error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch PI insurance policies' },
      { status: 500 }
    )
  }
}

// POST /api/merchant-os/professional/indemnity - Add new insurance policy
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      provider,
      policyNumber,
      coverageAmount,
      excessAmount,
      startDate,
      endDate,
      status = 'active',
      premiumAmount,
      premiumFrequency,
      certificateUrl,
      notes,
    } = body

    // Validation
    if (!provider || !policyNumber || !coverageAmount || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Provider, policy number, coverage amount, start date, and end date are required' },
        { status: 400 }
      )
    }

    // Check for duplicate policy number
    const existing = await db.professionalIndemnityInsurance.findFirst({
      where: {
        merchantId: session.merchantId,
        policyNumber,
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'A policy with this policy number already exists' },
        { status: 400 }
      )
    }

    // Generate unique ID
    const id = `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Create PI insurance policy
    const policy = await db.professionalIndemnityInsurance.create({
      data: {
        id,
        merchantId: session.merchantId,
        provider,
        policyNumber,
        coverageAmount: parseFloat(coverageAmount),
        excessAmount: excessAmount ? parseFloat(excessAmount) : null,
        startDate,
        endDate,
        status,
        premiumAmount: premiumAmount ? parseFloat(premiumAmount) : null,
        premiumFrequency,
        certificateUrl,
        notes,
      },
    })

    return NextResponse.json({
      success: true,
      policy,
    })
  } catch (error) {
    console.error('Create PI insurance policy error:', error)
    return NextResponse.json(
      { error: 'Failed to create PI insurance policy' },
      { status: 500 }
    )
  }
}
