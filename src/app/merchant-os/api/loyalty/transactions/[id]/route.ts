import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/loyalty/transactions/[id] - Get a single loyalty transaction
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const transaction = await db.loyaltyTransaction.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            loyaltyTier: true,
            loyaltyPoints: true,
            totalSpent: true,
            visitCount: true,
          }
        }
      }
    })

    if (!transaction) {
      return NextResponse.json(
        { error: 'Loyalty transaction not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ transaction })
  } catch (error) {
    console.error('Error fetching loyalty transaction:', error)
    return NextResponse.json(
      { error: 'Failed to fetch loyalty transaction' },
      { status: 500 }
    )
  }
}
