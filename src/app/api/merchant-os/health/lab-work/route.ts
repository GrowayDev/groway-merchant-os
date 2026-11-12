import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { nanoid } from 'nanoid'

// GET /api/merchant-os/health/lab-work - Get lab work orders for a merchant
export async function GET(request: NextRequest) {
  try {
    const merchantId = request.headers.get('x-merchant-id') ||
      request.nextUrl.searchParams.get('merchantId')

    if (!merchantId) {
      return NextResponse.json({ error: 'Merchant ID required' }, { status: 400 })
    }

    const labWorkOrders = await db.dentalLabWork.findMany({
      where: { merchantId },
      orderBy: { createdAt: 'desc' }
    })

    // Transform to match frontend interface
    const labWork = labWorkOrders.map(order => ({
      id: order.id,
      patientId: order.patientId,
      patientName: order.patientName,
      workType: order.workType,
      toothNumbers: order.toothNumbers ? JSON.parse(order.toothNumbers) : [],
      labName: order.labName,
      shade: order.shade,
      status: order.status,
      orderDate: order.orderDate,
      expectedDate: order.expectedDate,
      receivedDate: order.receivedDate,
      cost: order.cost,
      notes: order.notes
    }))

    return NextResponse.json({ records: labWork })
  } catch (error) {
    console.error('Error fetching lab work orders:', error)
    return NextResponse.json({ error: 'Failed to fetch lab work orders' }, { status: 500 })
  }
}

// POST /api/merchant-os/health/lab-work - Create a new lab work order
export async function POST(request: NextRequest) {
  try {
    const merchantId = request.headers.get('x-merchant-id') ||
      request.nextUrl.searchParams.get('merchantId')

    if (!merchantId) {
      return NextResponse.json({ error: 'Merchant ID required' }, { status: 400 })
    }

    const body = await request.json()
    const id = `LAB-${nanoid(8).toUpperCase()}`

    const labWork = await db.dentalLabWork.create({
      data: {
        id,
        merchantId,
        patientId: body.patientId,
        patientName: body.patientName,
        workType: body.workType || 'other',
        toothNumbers: body.toothNumbers ? JSON.stringify(body.toothNumbers) : '[]',
        labName: body.labName,
        labContact: body.labContact,
        shade: body.shade,
        status: body.status || 'ordered',
        orderDate: body.orderDate || new Date().toISOString().split('T')[0],
        expectedDate: body.expectedDate,
        receivedDate: body.receivedDate,
        fittedDate: body.fittedDate,
        cost: body.cost || 0,
        notes: body.notes
      }
    })

    return NextResponse.json({ success: true, record: labWork })
  } catch (error) {
    console.error('Error creating lab work order:', error)
    return NextResponse.json({ error: 'Failed to create lab work order' }, { status: 500 })
  }
}

// PUT /api/merchant-os/health/lab-work - Update a lab work order
export async function PUT(request: NextRequest) {
  try {
    const merchantId = request.headers.get('x-merchant-id') ||
      request.nextUrl.searchParams.get('merchantId')

    if (!merchantId) {
      return NextResponse.json({ error: 'Merchant ID required' }, { status: 400 })
    }

    const body = await request.json()

    const labWork = await db.dentalLabWork.update({
      where: {
        id: body.id,
        merchantId
      },
      data: {
        status: body.status,
        receivedDate: body.receivedDate,
        fittedDate: body.fittedDate,
        notes: body.notes
      }
    })

    return NextResponse.json({ success: true, record: labWork })
  } catch (error) {
    console.error('Error updating lab work order:', error)
    return NextResponse.json({ error: 'Failed to update lab work order' }, { status: 500 })
  }
}
