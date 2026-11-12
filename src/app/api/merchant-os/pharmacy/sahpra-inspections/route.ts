import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withDevModeBypass } from '@/lib/auth-middleware'

// GET /api/merchant-os/pharmacy/sahpra-inspections - List SAHPRA inspections
export const GET = withDevModeBypass(async (request: NextRequest, { user }) => {
  try {
    const merchantId = user!.merchantId
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const inspectionType = searchParams.get('inspectionType')
    const upcoming = searchParams.get('upcoming') === 'true'
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build filter conditions
    const whereClause: any = { merchantId }
    if (status) {
      whereClause.status = status
    }
    if (inspectionType) {
      whereClause.inspectionType = inspectionType
    }
    if (upcoming) {
      whereClause.scheduledDate = { gte: new Date().toISOString().split('T')[0] }
    }

    // Get total count
    const total = await db.sahpraInspection.count({
      where: whereClause,
    })

    // Get inspections with pagination
    const inspections = await db.sahpraInspection.findMany({
      where: whereClause,
      orderBy: {
        scheduledDate: 'asc',
      },
      skip: offset,
      take: limit,
    })

    return NextResponse.json({
      data: inspections,
      total,
      limit,
      offset,
    })
  } catch (error) {
    console.error('Error fetching SAHPRA inspections:', error)
    return NextResponse.json(
      { error: 'Failed to fetch SAHPRA inspections' },
      { status: 500 }
    )
  }
})

// POST /api/merchant-os/pharmacy/sahpra-inspections - Schedule inspection
export const POST = withDevModeBypass(async (request: NextRequest, { user }) => {
  try {
    const merchantId = user!.merchantId
    const body = await request.json()
    const {
      inspectionType,
      scheduledDate,
      scheduledTime,
      inspectorName,
      inspectorId,
      licenseNumber,
      licenseExpiryDate,
      documentsRequested,
      notes,
    } = body

    // Validate required fields
    if (!inspectionType || !scheduledDate) {
      return NextResponse.json(
        { error: 'Missing required fields: inspectionType, scheduledDate' },
        { status: 400 }
      )
    }

    // Validate inspection type
    const validTypes = ['routine', 'complaint', 'follow_up', 'license_renewal']
    if (!validTypes.includes(inspectionType)) {
      return NextResponse.json(
        { error: `Invalid inspection type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Create inspection record
    const inspection = await db.sahpraInspection.create({
      data: {
        id: `insp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        merchantId,
        inspectionType,
        scheduledDate,
        scheduledTime: scheduledTime || null,
        inspectorName: inspectorName || null,
        inspectorId: inspectorId || null,
        status: 'scheduled',
        licenseNumber: licenseNumber || null,
        licenseExpiryDate: licenseExpiryDate || null,
        documentsRequested: documentsRequested ? JSON.stringify(documentsRequested) : null,
        notes: notes || null,
      },
    })

    return NextResponse.json({
      success: true,
      data: inspection,
    })
  } catch (error) {
    console.error('Error scheduling SAHPRA inspection:', error)
    return NextResponse.json(
      { error: 'Failed to schedule SAHPRA inspection' },
      { status: 500 }
    )
  }
})

// PUT /api/merchant-os/pharmacy/sahpra-inspections - Update inspection results
export const PUT = withDevModeBypass(async (request: NextRequest, { user }) => {
  try {
    const merchantId = user!.merchantId
    const body = await request.json()
    const {
      inspectionId,
      action,
      status,
      findings,
      correctiveActions,
      score,
      passed,
      followUpRequired,
      followUpDate,
      documentsSubmitted,
      notes,
      inspectorName,
      inspectorId,
      scheduledDate,
      scheduledTime,
    } = body

    if (!inspectionId) {
      return NextResponse.json(
        { error: 'Missing required field: inspectionId' },
        { status: 400 }
      )
    }

    // Get inspection record
    const existingInspection = await db.sahpraInspection.findFirst({
      where: {
        id: inspectionId,
        merchantId,
      },
    })

    if (!existingInspection) {
      return NextResponse.json(
        { error: 'SAHPRA inspection not found' },
        { status: 404 }
      )
    }

    // Build update data
    const updateData: any = {
      updatedAt: new Date(),
    }

    // Handle specific actions
    if (action) {
      switch (action) {
        case 'start':
          updateData.status = 'in_progress'
          break
        case 'complete':
          updateData.status = 'completed'
          updateData.completedAt = new Date()
          if (findings !== undefined) updateData.findings = findings
          if (correctiveActions !== undefined) updateData.correctiveActions = correctiveActions
          if (score !== undefined) updateData.score = score
          if (passed !== undefined) updateData.passed = passed
          if (followUpRequired !== undefined) updateData.followUpRequired = followUpRequired
          if (followUpDate !== undefined) updateData.followUpDate = followUpDate
          break
        case 'fail':
          updateData.status = 'failed'
          updateData.completedAt = new Date()
          if (findings !== undefined) updateData.findings = findings
          if (correctiveActions !== undefined) updateData.correctiveActions = correctiveActions
          break
        case 'postpone':
          updateData.status = 'postponed'
          if (scheduledDate !== undefined) updateData.scheduledDate = scheduledDate
          if (scheduledTime !== undefined) updateData.scheduledTime = scheduledTime
          break
        case 'reschedule':
          if (scheduledDate !== undefined) updateData.scheduledDate = scheduledDate
          if (scheduledTime !== undefined) updateData.scheduledTime = scheduledTime
          updateData.status = 'scheduled'
          break
        default:
          return NextResponse.json(
            { error: `Invalid action: ${action}` },
            { status: 400 }
          )
      }
    } else {
      // Direct field updates
      if (status !== undefined) updateData.status = status
      if (findings !== undefined) updateData.findings = findings
      if (correctiveActions !== undefined) updateData.correctiveActions = correctiveActions
      if (score !== undefined) updateData.score = score
      if (passed !== undefined) updateData.passed = passed
      if (followUpRequired !== undefined) updateData.followUpRequired = followUpRequired
      if (followUpDate !== undefined) updateData.followUpDate = followUpDate
      if (documentsSubmitted !== undefined) updateData.documentsSubmitted = JSON.stringify(documentsSubmitted)
      if (notes !== undefined) updateData.notes = notes
      if (inspectorName !== undefined) updateData.inspectorName = inspectorName
      if (inspectorId !== undefined) updateData.inspectorId = inspectorId
    }

    // Update inspection record
    const updatedInspection = await db.sahpraInspection.update({
      where: { id: inspectionId },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      data: updatedInspection,
    })
  } catch (error) {
    console.error('Error updating SAHPRA inspection:', error)
    return NextResponse.json(
      { error: 'Failed to update SAHPRA inspection' },
      { status: 500 }
    )
  }
})

// DELETE /api/merchant-os/pharmacy/sahpra-inspections - Delete an inspection
export const DELETE = withDevModeBypass(async (request: NextRequest, { user }) => {
  try {
    const merchantId = user!.merchantId
    const { searchParams } = new URL(request.url)
    const inspectionId = searchParams.get('inspectionId')

    if (!inspectionId) {
      return NextResponse.json(
        { error: 'Missing required parameter: inspectionId' },
        { status: 400 }
      )
    }

    // Verify inspection exists and belongs to merchant
    const existingInspection = await db.sahpraInspection.findFirst({
      where: {
        id: inspectionId,
        merchantId,
      },
    })

    if (!existingInspection) {
      return NextResponse.json(
        { error: 'SAHPRA inspection not found' },
        { status: 404 }
      )
    }

    // Only allow deletion of scheduled inspections
    if (!['scheduled', 'postponed'].includes(existingInspection.status)) {
      return NextResponse.json(
        { error: 'Only scheduled or postponed inspections can be deleted' },
        { status: 400 }
      )
    }

    // Delete inspection
    await db.sahpraInspection.delete({
      where: { id: inspectionId },
    })

    return NextResponse.json({
      success: true,
      message: 'SAHPRA inspection deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting SAHPRA inspection:', error)
    return NextResponse.json(
      { error: 'Failed to delete SAHPRA inspection' },
      { status: 500 }
    )
  }
})
