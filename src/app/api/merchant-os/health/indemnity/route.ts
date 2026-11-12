import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { nanoid } from 'nanoid'

// GET /api/merchant-os/health/indemnity - Get professional indemnity insurance for a merchant
export async function GET(request: NextRequest) {
  try {
    const merchantId = request.headers.get('x-merchant-id') ||
      request.nextUrl.searchParams.get('merchantId')

    if (!merchantId) {
      return NextResponse.json({ error: 'Merchant ID required' }, { status: 400 })
    }

    const policies = await db.professionalIndemnityInsurance.findMany({
      where: { merchantId },
      orderBy: { createdAt: 'desc' }
    })

    // Transform to match frontend interface
    const indemnityInsurance = policies.map(policy => ({
      id: policy.id,
      provider: policy.provider,
      policyNumber: policy.policyNumber,
      coverageAmount: policy.coverageAmount,
      startDate: policy.startDate,
      endDate: policy.endDate,
      status: getIndemnityStatus(policy.endDate)
    }))

    return NextResponse.json({ records: indemnityInsurance })
  } catch (error) {
    console.error('Error fetching indemnity insurance:', error)
    return NextResponse.json({ error: 'Failed to fetch indemnity insurance' }, { status: 500 })
  }
}

// POST /api/merchant-os/health/indemnity - Create a new professional indemnity insurance policy
export async function POST(request: NextRequest) {
  try {
    const merchantId = request.headers.get('x-merchant-id') ||
      request.nextUrl.searchParams.get('merchantId')

    if (!merchantId) {
      return NextResponse.json({ error: 'Merchant ID required' }, { status: 400 })
    }

    const body = await request.json()
    const id = `PII-${nanoid(8).toUpperCase()}`

    const policy = await db.professionalIndemnityInsurance.create({
      data: {
        id,
        merchantId,
        provider: body.provider,
        policyNumber: body.policyNumber,
        coverageAmount: body.coverageAmount || 0,
        excessAmount: body.excessAmount,
        startDate: body.startDate,
        endDate: body.endDate,
        status: getIndemnityStatus(body.endDate),
        premiumAmount: body.premiumAmount,
        premiumFrequency: body.premiumFrequency,
        certificateUrl: body.certificateUrl,
        notes: body.notes
      }
    })

    return NextResponse.json({ success: true, record: policy })
  } catch (error) {
    console.error('Error creating indemnity insurance:', error)
    return NextResponse.json({ error: 'Failed to create indemnity insurance' }, { status: 500 })
  }
}

// Helper function to determine indemnity status based on end date
function getIndemnityStatus(endDate: string): string {
  const end = new Date(endDate)
  const now = new Date()
  const daysUntilExpiry = Math.floor((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  if (daysUntilExpiry < 0) return 'expired'
  if (daysUntilExpiry <= 90) return 'pending_renewal'
  return 'active'
}
