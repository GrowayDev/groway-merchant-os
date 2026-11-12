import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - List lending facilities
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const merchantId = searchParams.get('merchantId')
    const status = searchParams.get('status')
    
    const where: Record<string, unknown> = {}
    if (merchantId) where.merchantId = merchantId
    if (status) where.status = status
    
    const facilities = await db.GopayLendingFacility.findMany({
      where,
      include: {
        _count: { select: { repayments: true, applications: true } }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    // Calculate totals
    const totalLimit = facilities.reduce((sum, f) => sum + f.approvedLimit, 0)
    const totalUsed = facilities.reduce((sum, f) => sum + f.usedAmount, 0)
    const totalAvailable = facilities.reduce((sum, f) => sum + f.availableAmount, 0)
    
    return NextResponse.json({ 
      facilities,
      summary: {
        totalLimit,
        totalUsed,
        totalAvailable
      }
    })
  } catch (error) {
    console.error('Error fetching lending facilities:', error)
    return NextResponse.json({ error: 'Failed to fetch lending facilities' }, { status: 500 })
  }
}

// POST - Create new lending facility (admin/credit team only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      merchantId,
      type = 'working_capital',
      approvedLimit,
      interestRate = 18.5
    } = body

    const facility = await db.GopayLendingFacility.create({
      data: {
        merchantId,
        type,
        approvedLimit: parseFloat(approvedLimit),
        availableAmount: parseFloat(approvedLimit),
        interestRate: parseFloat(interestRate),
        status: 'active'
      }
    })

    return NextResponse.json({ facility })
  } catch (error) {
    console.error('Error creating lending facility:', error)
    return NextResponse.json({ error: 'Failed to create lending facility' }, { status: 500 })
  }
}
