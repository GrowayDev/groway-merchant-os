import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET payment methods
export async function GET(request: NextRequest) {
  try {
    let methods = await db.paymentMethod.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' }
    })

    // If no methods exist, return defaults
    if (methods.length === 0) {
      methods = [
        { id: 'cash', name: 'Cash', type: 'cash', icon: 'banknote' },
        { id: 'card', name: 'Card', type: 'card', icon: 'credit-card' },
        { id: 'mobile', name: 'Mobile Pay', type: 'mobile', icon: 'smartphone' },
        { id: 'voucher', name: 'Voucher', type: 'voucher', icon: 'ticket' },
      ] as any
    }

    return NextResponse.json({
      success: true,
      data: methods
    })
  } catch (error) {
    console.error('Error fetching payment methods:', error)
    // Return defaults on error
    return NextResponse.json({
      success: true,
      data: [
        { id: 'cash', name: 'Cash', type: 'cash', icon: 'banknote' },
        { id: 'card', name: 'Card', type: 'card', icon: 'credit-card' },
        { id: 'mobile', name: 'Mobile Pay', type: 'mobile', icon: 'smartphone' },
        { id: 'voucher', name: 'Voucher', type: 'voucher', icon: 'ticket' },
      ]
    })
  }
}
