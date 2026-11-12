import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST - Apply for a loan
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      merchantId,
      type = 'working_capital',
      requestedAmount,
      purpose,
      facilityId
    } = body

    if (!merchantId || !requestedAmount) {
      return NextResponse.json({ error: 'Merchant ID and requested amount are required' }, { status: 400 })
    }

    // Create loan application
    const application = await db.GopayLoanApplication.create({
      data: {
        type,
        requestedAmount: parseFloat(requestedAmount),
        purpose,
        facilityId,
        status: 'submitted'
      },
      include: {
        facility: true
      }
    })

    // Log activity (in real implementation, trigger notification to credit team)
    
    return NextResponse.json({ 
      application,
      message: 'Application submitted successfully. You will be notified within 24 hours.'
    })
  } catch (error) {
    console.error('Error applying for loan:', error)
    return NextResponse.json({ error: 'Failed to submit loan application' }, { status: 500 })
  }
}

// GET - List loan applications
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    
    const where: Record<string, unknown> = {}
    if (status) where.status = status
    
    const applications = await db.GopayLoanApplication.findMany({
      where,
      include: {
        facility: {
          select: { id: true, type: true, merchantId: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json({ applications })
  } catch (error) {
    console.error('Error fetching applications:', error)
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 })
  }
}
