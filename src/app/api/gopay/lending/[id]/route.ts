import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Get single lending facility
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const facility = await db.GopayLendingFacility.findUnique({
      where: { id },
      include: {
        repayments: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        },
        applications: {
          take: 5,
          orderBy: { createdAt: 'desc' }
        }
      }
    })
    
    if (!facility) {
      return NextResponse.json({ error: 'Facility not found' }, { status: 404 })
    }
    
    return NextResponse.json({ facility })
  } catch (error) {
    console.error('Error fetching facility:', error)
    return NextResponse.json({ error: 'Failed to fetch facility' }, { status: 500 })
  }
}

// PUT - Update lending facility
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const facility = await db.GopayLendingFacility.update({
      where: { id },
      data: {
        ...body,
        approvedLimit: body.approvedLimit ? parseFloat(body.approvedLimit) : undefined,
        usedAmount: body.usedAmount ? parseFloat(body.usedAmount) : undefined,
        availableAmount: body.availableAmount ? parseFloat(body.availableAmount) : undefined,
        interestRate: body.interestRate ? parseFloat(body.interestRate) : undefined,
        nextPaymentAmount: body.nextPaymentAmount ? parseFloat(body.nextPaymentAmount) : undefined,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ facility })
  } catch (error) {
    console.error('Error updating facility:', error)
    return NextResponse.json({ error: 'Failed to update facility' }, { status: 500 })
  }
}
