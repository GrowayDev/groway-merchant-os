import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { nanoid } from 'nanoid'

// GET /api/merchant-os/childcare/compliance - Get compliance items for a merchant
export async function GET(request: NextRequest) {
  try {
    const merchantId = request.headers.get('x-merchant-id') || 
                       request.nextUrl.searchParams.get('merchantId')

    if (!merchantId) {
      return NextResponse.json({ error: 'Merchant ID required' }, { status: 400 })
    }

    const compliance = await db.childcareCompliance.findMany({
      where: { merchantId },
      orderBy: { dueDate: 'asc' }
    })

    // Calculate summary
    const expiringSoon = compliance.filter(c => c.status === 'expiring_soon' || c.status === 'expired').length
    const compliant = compliance.filter(c => c.status === 'compliant').length
    const pending = compliance.filter(c => c.status === 'pending').length

    return NextResponse.json({ 
      compliance,
      summary: {
        total: compliance.length,
        compliant,
        pending,
        expiringSoon,
        needsAttention: expiringSoon + pending
      }
    })
  } catch (error) {
    console.error('Error fetching compliance:', error)
    return NextResponse.json({ error: 'Failed to fetch compliance items' }, { status: 500 })
  }
}

// POST /api/merchant-os/childcare/compliance - Create a compliance item
export async function POST(request: NextRequest) {
  try {
    const merchantId = request.headers.get('x-merchant-id') ||
                       request.nextUrl.searchParams.get('merchantId')

    if (!merchantId) {
      return NextResponse.json({ error: 'Merchant ID required' }, { status: 400 })
    }

    const body = await request.json()
    const complianceId = `CMP-${nanoid(8).toUpperCase()}`

    const compliance = await db.childcareCompliance.create({
      data: {
        id: complianceId,
        merchantId,
        type: body.type,
        name: body.name,
        dueDate: body.dueDate,
        completedDate: body.completedDate,
        status: body.status || 'pending',
        assignedTo: body.assignedTo,
        notes: body.notes,
        documentUrl: body.documentUrl
      }
    })

    return NextResponse.json({ success: true, compliance })
  } catch (error) {
    console.error('Error creating compliance item:', error)
    return NextResponse.json({ error: 'Failed to create compliance item' }, { status: 500 })
  }
}
