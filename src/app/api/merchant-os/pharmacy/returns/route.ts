import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withDevModeBypass } from '@/lib/auth-middleware'

// GET /api/merchant-os/pharmacy/returns - List medicine returns
export const GET = withDevModeBypass(async (request: NextRequest, { user }) => {
  try {
    const merchantId = user!.merchantId
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const returnReason = searchParams.get('returnReason')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build filter conditions
    const whereClause: any = { merchantId }
    if (status) {
      whereClause.status = status
    }
    if (returnReason) {
      whereClause.returnReason = returnReason
    }

    // Get total count
    const total = await db.medicineReturn.count({
      where: whereClause,
    })

    // Get returns with pagination
    const returns = await db.medicineReturn.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc',
      },
      skip: offset,
      take: limit,
    })

    return NextResponse.json({
      data: returns,
      total,
      limit,
      offset,
    })
  } catch (error) {
    console.error('Error fetching medicine returns:', error)
    return NextResponse.json(
      { error: 'Failed to fetch medicine returns' },
      { status: 500 }
    )
  }
})

// POST /api/merchant-os/pharmacy/returns - Create medicine return
export const POST = withDevModeBypass(async (request: NextRequest, { user }) => {
  try {
    const merchantId = user!.merchantId
    const body = await request.json()
    const {
      productName,
      nappiCode,
      batchNumber,
      quantity,
      returnReason,
      initiatedBy,
      initiatedByName,
      notes,
    } = body

    // Validate required fields
    if (!productName || !batchNumber || !quantity || !returnReason) {
      return NextResponse.json(
        { error: 'Missing required fields: productName, batchNumber, quantity, returnReason' },
        { status: 400 }
      )
    }

    // Validate return reason
    const validReasons = ['expired', 'damaged', 'recalled', 'patient_return']
    if (!validReasons.includes(returnReason)) {
      return NextResponse.json(
        { error: `Invalid return reason. Must be one of: ${validReasons.join(', ')}` },
        { status: 400 }
      )
    }

    // Create return record
    const medicineReturn = await db.medicineReturn.create({
      data: {
        id: `ret_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        merchantId,
        productName,
        nappiCode: nappiCode || null,
        batchNumber,
        quantity,
        returnReason,
        status: 'pending',
        initiatedBy: initiatedBy || 'unknown',
        initiatedByName: initiatedByName || null,
        notes: notes || null,
      },
    })

    return NextResponse.json({
      success: true,
      data: medicineReturn,
    })
  } catch (error) {
    console.error('Error creating medicine return:', error)
    return NextResponse.json(
      { error: 'Failed to create medicine return' },
      { status: 500 }
    )
  }
})

// PUT /api/merchant-os/pharmacy/returns - Approve/process return
export const PUT = withDevModeBypass(async (request: NextRequest, { user }) => {
  try {
    const merchantId = user!.merchantId
    const body = await request.json()
    const {
      returnId,
      action,
      approvedBy,
      approvedByName,
      disposalMethod,
      disposalWitness,
      disposalWitnessName,
      disposalNotes,
    } = body

    if (!returnId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: returnId, action' },
        { status: 400 }
      )
    }

    // Validate action
    const validActions = ['approve', 'dispose', 'reject']
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: `Invalid action. Must be one of: ${validActions.join(', ')}` },
        { status: 400 }
      )
    }

    // Get return record
    const existingReturn = await db.medicineReturn.findFirst({
      where: {
        id: returnId,
        merchantId,
      },
    })

    if (!existingReturn) {
      return NextResponse.json(
        { error: 'Medicine return not found' },
        { status: 404 }
      )
    }

    let updateData: any = {
      updatedAt: new Date(),
    }

    switch (action) {
      case 'approve':
        if (existingReturn.status !== 'pending') {
          return NextResponse.json(
            { error: 'Only pending returns can be approved' },
            { status: 400 }
          )
        }
        updateData.status = 'approved'
        updateData.approvedBy = approvedBy || 'unknown'
        updateData.approvedByName = approvedByName || null
        updateData.approvedAt = new Date()
        break

      case 'dispose':
        if (existingReturn.status !== 'approved') {
          return NextResponse.json(
            { error: 'Only approved returns can be disposed' },
            { status: 400 }
          )
        }
        updateData.status = 'disposed'
        updateData.disposalDate = new Date().toISOString().split('T')[0]
        updateData.disposalMethod = disposalMethod || 'incineration'
        updateData.disposalWitness = disposalWitness || null
        updateData.disposalWitnessName = disposalWitnessName || null
        updateData.disposalNotes = disposalNotes || null
        break

      case 'reject':
        updateData.status = 'rejected'
        updateData.notes = `${existingReturn.notes || ''}\nRejected: ${disposalNotes || 'No reason provided'}`
        break
    }

    // Update return record
    const updatedReturn = await db.medicineReturn.update({
      where: { id: returnId },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      data: updatedReturn,
    })
  } catch (error) {
    console.error('Error processing medicine return:', error)
    return NextResponse.json(
      { error: 'Failed to process medicine return' },
      { status: 500 }
    )
  }
})

// DELETE /api/merchant-os/pharmacy/returns - Delete a return record
export const DELETE = withDevModeBypass(async (request: NextRequest, { user }) => {
  try {
    const merchantId = user!.merchantId
    const { searchParams } = new URL(request.url)
    const returnId = searchParams.get('returnId')

    if (!returnId) {
      return NextResponse.json(
        { error: 'Missing required parameter: returnId' },
        { status: 400 }
      )
    }

    // Verify return exists and belongs to merchant
    const existingReturn = await db.medicineReturn.findFirst({
      where: {
        id: returnId,
        merchantId,
      },
    })

    if (!existingReturn) {
      return NextResponse.json(
        { error: 'Medicine return not found' },
        { status: 404 }
      )
    }

    // Only allow deletion of pending returns
    if (existingReturn.status !== 'pending') {
      return NextResponse.json(
        { error: 'Only pending returns can be deleted' },
        { status: 400 }
      )
    }

    // Delete return
    await db.medicineReturn.delete({
      where: { id: returnId },
    })

    return NextResponse.json({
      success: true,
      message: 'Medicine return deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting medicine return:', error)
    return NextResponse.json(
      { error: 'Failed to delete medicine return' },
      { status: 500 }
    )
  }
})
