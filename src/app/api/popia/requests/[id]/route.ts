import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/popia/requests/[id] - Get a single POPIA request
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const popiaRequest = await db.pOPIARequest.findUnique({
      where: { id }
    })

    if (!popiaRequest) {
      return NextResponse.json({ error: 'POPIA request not found' }, { status: 404 })
    }

    // Get related audit logs
    const auditLogs = await db.auditLog.findMany({
      where: {
        targetType: 'popia_request',
        targetId: id
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    })

    // Calculate days remaining
    const daysRemaining = Math.ceil(
      (new Date(popiaRequest.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )

    return NextResponse.json({
      request: {
        ...popiaRequest,
        daysRemaining,
        isOverdue: daysRemaining < 0 && !['completed', 'rejected'].includes(popiaRequest.status)
      },
      auditLogs
    })
  } catch (error) {
    console.error('Error fetching POPIA request:', error)
    return NextResponse.json({ error: 'Failed to fetch POPIA request' }, { status: 500 })
  }
}

// PUT /api/popia/requests/[id] - Update a POPIA request (admin actions)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { action, notes, adminId, adminName } = body

    // Get the current request
    const currentRequest = await db.pOPIARequest.findUnique({
      where: { id }
    })

    if (!currentRequest) {
      return NextResponse.json({ error: 'POPIA request not found' }, { status: 404 })
    }

    let updateData: Record<string, unknown> = { updatedAt: new Date() }
    let auditAction = action
    let auditDetails = ''

    switch (action) {
      case 'verify_identity':
        updateData = {
          ...updateData,
          identityVerified: true,
          identityVerifiedBy: adminId,
          identityVerifiedAt: new Date()
        }
        auditDetails = `Identity verified by ${adminName}`
        break

      case 'assign':
        updateData = {
          ...updateData,
          assignedTo: body.assignedTo,
          assignedToName: body.assignedToName,
          assignedAt: new Date(),
          status: 'processing'
        }
        auditDetails = `Assigned to ${body.assignedToName}`
        break

      case 'start_processing':
        updateData = {
          ...updateData,
          status: 'processing',
          assignedTo: adminId,
          assignedToName: adminName,
          assignedAt: new Date()
        }
        auditDetails = `Processing started by ${adminName}`
        break

      case 'complete':
        updateData = {
          ...updateData,
          status: 'completed',
          completedAt: new Date(),
          responseNotes: notes,
          dataProvidedAt: currentRequest.requestType === 'access' ? new Date() : null,
          dataDeletedAt: currentRequest.requestType === 'deletion' ? new Date() : null
        }
        auditDetails = `Request completed by ${adminName}`
        break

      case 'reject':
        updateData = {
          ...updateData,
          status: 'rejected',
          completedAt: new Date(),
          rejectionReason: body.rejectionReason,
          responseNotes: notes
        }
        auditDetails = `Request rejected: ${body.rejectionReason}`
        break

      case 'extend_deadline':
        // POPIA allows one extension of up to 30 more days
        const newDueDate = new Date(currentRequest.dueDate)
        newDueDate.setDate(newDueDate.getDate() + 30)
        updateData = {
          ...updateData,
          dueDate: newDueDate,
          responseNotes: notes
        }
        auditDetails = `Deadline extended to ${newDueDate.toISOString().split('T')[0]}`
        break

      case 'add_notes':
        updateData = {
          ...updateData,
          responseNotes: notes
        }
        auditDetails = `Notes added by ${adminName}`
        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Update the request
    const updatedRequest = await db.pOPIARequest.update({
      where: { id },
      data: updateData
    })

    // Create audit log
    await db.auditLog.create({
      data: {
        id: `audit-${Date.now()}`,
        action: auditAction,
        category: 'popia',
        actorId: adminId,
        actorName: adminName || 'System',
        targetType: 'popia_request',
        targetId: id,
        targetName: `POPIA ${currentRequest.requestType} request`,
        details: auditDetails,
        createdAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      request: updatedRequest
    })
  } catch (error) {
    console.error('Error updating POPIA request:', error)
    return NextResponse.json({ error: 'Failed to update POPIA request' }, { status: 500 })
  }
}

// DELETE /api/popia/requests/[id] - Delete a POPIA request (admin only, for cleanup)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await db.pOPIARequest.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting POPIA request:', error)
    return NextResponse.json({ error: 'Failed to delete POPIA request' }, { status: 500 })
  }
}
