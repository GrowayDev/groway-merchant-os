import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { randomUUID } from 'crypto'

// GET /api/merchant-os/health/lab-work - Fetch lab work orders
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const merchantId = searchParams.get('merchantId') || 'merchant-001'
    const status = searchParams.get('status')
    const workType = searchParams.get('workType')
    const patientId = searchParams.get('patientId')
    const labName = searchParams.get('labName')

    const where: any = { merchantId }
    
    if (status && status !== 'all') {
      where.status = status
    }
    
    if (workType && workType !== 'all') {
      where.workType = workType
    }

    if (patientId) {
      where.patientId = patientId
    }

    if (labName) {
      where.labName = { contains: labName, mode: 'insensitive' }
    }

    const labWork = await db.dentalLabWork.findMany({
      where,
      orderBy: { expectedDate: 'asc' }
    })

    // Transform to match the component interface
    const labWorkRecords = labWork.map(lw => ({
      id: lw.id,
      patientId: lw.patientId,
      patientName: lw.patientName,
      workType: lw.workType,
      toothNumbers: lw.toothNumbers ? JSON.parse(lw.toothNumbers) : [],
      labName: lw.labName,
      labContact: lw.labContact,
      shade: lw.shade,
      status: lw.status,
      orderDate: lw.orderDate,
      expectedDate: lw.expectedDate,
      receivedDate: lw.receivedDate,
      fittedDate: lw.fittedDate,
      cost: lw.cost,
      chargeAmount: lw.chargeAmount,
      notes: lw.notes,
      attachments: lw.attachments ? JSON.parse(lw.attachments) : []
    }))

    return NextResponse.json({
      success: true,
      data: labWorkRecords,
      count: labWorkRecords.length
    })
  } catch (error) {
    console.error('Error fetching lab work orders:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch lab work orders' },
      { status: 500 }
    )
  }
}

// POST /api/merchant-os/health/lab-work - Create lab work order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      merchantId = 'merchant-001',
      patientId,
      patientName,
      workType,
      toothNumbers,
      labName,
      labContact,
      shade,
      status = 'ordered',
      orderDate,
      expectedDate,
      cost,
      chargeAmount,
      notes,
      attachments
    } = body

    // Validate required fields
    if (!patientName || !workType || !labName || !orderDate || !expectedDate) {
      return NextResponse.json(
        { success: false, error: 'Patient name, work type, lab name, order date, and expected date are required' },
        { status: 400 }
      )
    }

    // Create lab work order
    const labWork = await db.dentalLabWork.create({
      data: {
        id: randomUUID(),
        merchantId,
        patientId: patientId || null,
        patientName,
        workType,
        toothNumbers: toothNumbers ? JSON.stringify(toothNumbers) : '[]',
        labName,
        labContact: labContact || null,
        shade: shade || null,
        status,
        orderDate,
        expectedDate,
        receivedDate: null,
        fittedDate: null,
        cost: cost ? parseFloat(cost) : 0,
        chargeAmount: chargeAmount ? parseFloat(chargeAmount) : null,
        notes: notes || null,
        attachments: attachments ? JSON.stringify(attachments) : null,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        id: labWork.id,
        patientId: labWork.patientId,
        patientName: labWork.patientName,
        workType: labWork.workType,
        toothNumbers: toothNumbers || [],
        labName: labWork.labName,
        shade: labWork.shade,
        status: labWork.status,
        orderDate: labWork.orderDate,
        expectedDate: labWork.expectedDate,
        cost: labWork.cost
      },
      message: 'Lab work order created successfully'
    })
  } catch (error) {
    console.error('Error creating lab work order:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create lab work order' },
      { status: 500 }
    )
  }
}

// PUT /api/merchant-os/health/lab-work - Update lab work status
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      id,
      merchantId = 'merchant-001',
      status,
      receivedDate,
      fittedDate,
      notes
    } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Lab work ID is required' },
        { status: 400 }
      )
    }

    // Verify the lab work exists and belongs to this merchant
    const existing = await db.dentalLabWork.findFirst({
      where: { id, merchantId }
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Lab work order not found' },
        { status: 404 }
      )
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date()
    }

    if (status) {
      updateData.status = status
    }

    if (receivedDate) {
      updateData.receivedDate = receivedDate
    }

    if (fittedDate) {
      updateData.fittedDate = fittedDate
    }

    if (notes !== undefined) {
      updateData.notes = notes
    }

    // Update the lab work record
    const updated = await db.dentalLabWork.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        patientName: updated.patientName,
        workType: updated.workType,
        status: updated.status,
        orderDate: updated.orderDate,
        expectedDate: updated.expectedDate,
        receivedDate: updated.receivedDate,
        fittedDate: updated.fittedDate
      },
      message: 'Lab work order updated successfully'
    })
  } catch (error) {
    console.error('Error updating lab work order:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update lab work order' },
      { status: 500 }
    )
  }
}
