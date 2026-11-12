import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface RouteParams {
  params: Promise<{ id: string }>
}

// Date validation helper
const isValidDate = (date: string): boolean => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(date)) return false
  const parsed = new Date(date)
  return !isNaN(parsed.getTime())
}

// Valid status transitions
const validStatusTransitions: Record<string, string[]> = {
  draft: ['ready', 'draft'],
  ready: ['submitted', 'draft'],
  submitted: ['paid', 'refunded', 'submitted'],
  paid: [], // Terminal state
  refunded: [] // Terminal state
}

// GET /api/sars/vat-returns/[id] - Get a single VAT return
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const vatReturn = await db.vatReturnSubmission.findUnique({
      where: { id }
    })

    if (!vatReturn) {
      return NextResponse.json(
        { error: 'VAT return not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(vatReturn)
  } catch (error) {
    console.error('Error fetching VAT return:', error)
    return NextResponse.json(
      { error: 'Failed to fetch VAT return' },
      { status: 500 }
    )
  }
}

// PUT /api/sars/vat-returns/[id] - Update a VAT return
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()

    // Check if VAT return exists
    const existing = await db.vatReturnSubmission.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'VAT return not found' },
        { status: 404 }
      )
    }

    // Validate status transition if status is being updated
    if (body.status && body.status !== existing.status) {
      const allowedTransitions = validStatusTransitions[existing.status] || []
      if (!allowedTransitions.includes(body.status)) {
        return NextResponse.json(
          { 
            error: `Invalid status transition from '${existing.status}' to '${body.status}'`,
            currentStatus: existing.status,
            allowedTransitions 
          },
          { status: 400 }
        )
      }
    }

    // Validate date fields if provided
    const dateFields = ['paymentDueDate', 'paidAt']
    for (const field of dateFields) {
      if (body[field] && !isValidDate(body[field])) {
        return NextResponse.json(
          { error: `Invalid ${field} format. Use YYYY-MM-DD` },
          { status: 400 }
        )
      }
    }

    // Validate numeric fields
    const numericFields = [
      'outputVat', 'inputVat', 'totalSales', 'capitalGoods',
      'totalPurchases', 'exports', 'zeroRated'
    ]
    for (const field of numericFields) {
      if (body[field] !== undefined && typeof body[field] !== 'number') {
        return NextResponse.json(
          { error: `${field} must be a number` },
          { status: 400 }
        )
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {}
    const allowedFields = [
      'outputVat', 'inputVat', 'totalSales', 'capitalGoods',
      'totalPurchases', 'exports', 'zeroRated', 'status',
      'paymentDueDate', 'paymentStatus', 'paymentReference',
      'sarsReferenceNumber'
    ]

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    // Recalculate netVat if outputVat or inputVat changed
    if (body.outputVat !== undefined || body.inputVat !== undefined) {
      const outputVat = body.outputVat ?? existing.outputVat
      const inputVat = body.inputVat ?? existing.inputVat
      updateData.netVat = outputVat - inputVat
    }

    // Handle paidAt date
    if (body.paidAt) {
      updateData.paidAt = new Date(body.paidAt)
    }

    const vatReturn = await db.vatReturnSubmission.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json(vatReturn)
  } catch (error) {
    console.error('Error updating VAT return:', error)
    return NextResponse.json(
      { error: 'Failed to update VAT return' },
      { status: 500 }
    )
  }
}

// DELETE /api/sars/vat-returns/[id] - Delete a VAT return (only if draft)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    // Check if VAT return exists
    const existing = await db.vatReturnSubmission.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'VAT return not found' },
        { status: 404 }
      )
    }

    // Only allow deletion of draft returns
    if (existing.status !== 'draft') {
      return NextResponse.json(
        { error: 'Cannot delete VAT return that is not in draft status' },
        { status: 400 }
      )
    }

    await db.vatReturnSubmission.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'VAT return deleted successfully' })
  } catch (error) {
    console.error('Error deleting VAT return:', error)
    return NextResponse.json(
      { error: 'Failed to delete VAT return' },
      { status: 500 }
    )
  }
}
