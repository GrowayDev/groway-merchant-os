import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Get single transaction
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const transaction = await db.GopayTransaction.findUnique({
      where: { id },
      include: {
        device: true
      }
    })
    
    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }
    
    return NextResponse.json({ transaction })
  } catch (error) {
    console.error('Error fetching transaction:', error)
    return NextResponse.json({ error: 'Failed to fetch transaction' }, { status: 500 })
  }
}

// PUT - Update transaction (for refunds, status changes)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const transaction = await db.GopayTransaction.update({
      where: { id },
      data: {
        ...body,
        amount: body.amount ? parseFloat(body.amount) : undefined,
        settledAt: body.settlementStatus === 'settled' ? new Date() : undefined,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ transaction })
  } catch (error) {
    console.error('Error updating transaction:', error)
    return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 })
  }
}
