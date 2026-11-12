import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { nanoid } from 'nanoid'

// GET /api/merchant-os/childcare/fees - Get all fees for a merchant
export async function GET(request: NextRequest) {
  try {
    const merchantId = request.headers.get('x-merchant-id') || 
                       request.nextUrl.searchParams.get('merchantId')

    if (!merchantId) {
      return NextResponse.json({ error: 'Merchant ID required' }, { status: 400 })
    }

    const fees = await db.childcareFee.findMany({
      where: { merchantId },
      include: {
        ChildcareChild: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { dueDate: 'asc' }
    })

    // Calculate summary stats
    const pendingFees = fees.filter(f => f.status === 'pending' || f.status === 'overdue')
      .reduce((sum, f) => sum + f.totalAmount, 0)
    const overdueFees = fees.filter(f => f.status === 'overdue')
      .reduce((sum, f) => sum + f.totalAmount, 0)
    const paidFees = fees.filter(f => f.status === 'paid')
      .reduce((sum, f) => sum + f.totalAmount, 0)

    // Transform to match frontend interface
    const transformedFees = fees.map(fee => ({
      id: fee.id,
      childId: fee.childId,
      child: {
        firstName: fee.ChildcareChild.firstName,
        lastName: fee.ChildcareChild.lastName
      },
      type: fee.type,
      amount: fee.amount,
      dueDate: fee.dueDate,
      paidDate: fee.paidDate,
      status: fee.status,
      siblingDiscount: fee.siblingDiscount,
      totalAmount: fee.totalAmount,
      paymentMethod: fee.paymentMethod,
      invoiceNumber: fee.invoiceNumber,
      notes: fee.notes
    }))

    return NextResponse.json({ 
      fees: transformedFees,
      summary: {
        totalPending: pendingFees,
        totalOverdue: overdueFees,
        totalPaid: paidFees,
        count: fees.length
      }
    })
  } catch (error) {
    console.error('Error fetching fees:', error)
    return NextResponse.json({ error: 'Failed to fetch fees' }, { status: 500 })
  }
}

// POST /api/merchant-os/childcare/fees - Create a new fee
export async function POST(request: NextRequest) {
  try {
    const merchantId = request.headers.get('x-merchant-id') ||
                       request.nextUrl.searchParams.get('merchantId')

    if (!merchantId) {
      return NextResponse.json({ error: 'Merchant ID required' }, { status: 400 })
    }

    const body = await request.json()
    const feeId = `FEE-${nanoid(8).toUpperCase()}`

    const fee = await db.childcareFee.create({
      data: {
        id: feeId,
        merchantId,
        childId: body.childId,
        type: body.type || 'monthly_tuition',
        amount: body.amount || 0,
        dueDate: body.dueDate,
        paidDate: body.paidDate,
        status: body.status || 'pending',
        siblingDiscount: body.siblingDiscount || 0,
        totalAmount: body.totalAmount || body.amount || 0,
        paymentMethod: body.paymentMethod,
        invoiceNumber: body.invoiceNumber || `INV-${new Date().getFullYear()}-${nanoid(6).toUpperCase()}`,
        notes: body.notes
      }
    })

    return NextResponse.json({ success: true, fee })
  } catch (error) {
    console.error('Error creating fee:', error)
    return NextResponse.json({ error: 'Failed to create fee' }, { status: 500 })
  }
}
