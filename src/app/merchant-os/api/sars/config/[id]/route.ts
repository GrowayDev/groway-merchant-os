import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/sars/config/[id] - Get a single SARS eFiling config
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const config = await db.sarsEfilingConfig.findUnique({
      where: { id }
    })

    if (!config) {
      return NextResponse.json(
        { error: 'SARS eFiling configuration not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(config)
  } catch (error) {
    console.error('Error fetching SARS eFiling config:', error)
    return NextResponse.json(
      { error: 'Failed to fetch SARS eFiling configuration' },
      { status: 500 }
    )
  }
}

// PUT /api/sars/config/[id] - Update a SARS eFiling config
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()

    // Check if config exists
    const existingConfig = await db.sarsEfilingConfig.findUnique({
      where: { id }
    })

    if (!existingConfig) {
      return NextResponse.json(
        { error: 'SARS eFiling configuration not found' },
        { status: 404 }
      )
    }

    // Validate taxType if provided
    if (body.taxType) {
      const validTaxTypes = ['vat', 'income_tax', 'paye', 'uif']
      if (!validTaxTypes.includes(body.taxType)) {
        return NextResponse.json(
          { error: `Invalid taxType. Must be one of: ${validTaxTypes.join(', ')}` },
          { status: 400 }
        )
      }
    }

    // Validate efilingStatus if provided
    if (body.efilingStatus) {
      const validStatuses = ['pending', 'linked', 'error']
      if (!validStatuses.includes(body.efilingStatus)) {
        return NextResponse.json(
          { error: 'Invalid efilingStatus. Must be pending, linked, or error' },
          { status: 400 }
        )
      }
    }

    // Validate vatReturnFrequency if provided
    if (body.vatReturnFrequency) {
      const validFrequencies = ['monthly', 'bi_monthly']
      if (!validFrequencies.includes(body.vatReturnFrequency)) {
        return NextResponse.json(
          { error: 'Invalid vatReturnFrequency. Must be monthly or bi_monthly' },
          { status: 400 }
        )
      }
    }

    // Validate date format (YYYY-MM-DD) for date fields
    const dateFields = [body.nextVatDueDate, body.lastVatSubmitted].filter(Boolean)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    for (const dateField of dateFields) {
      if (dateField && !dateRegex.test(dateField)) {
        return NextResponse.json(
          { error: 'Invalid date format. Use YYYY-MM-DD' },
          { status: 400 }
        )
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {}
    const allowedFields = [
      'taxNumber', 'taxType', 'registeredName', 'efilingUsername',
      'efilingStatus', 'vatReturnFrequency', 'nextVatDueDate', 'lastVatSubmitted'
    ]

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    // Update lastSyncAt if this is a sync operation
    if (body.syncNow) {
      updateData.lastSyncAt = new Date()
    }

    const config = await db.sarsEfilingConfig.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json(config)
  } catch (error) {
    console.error('Error updating SARS eFiling config:', error)
    return NextResponse.json(
      { error: 'Failed to update SARS eFiling configuration' },
      { status: 500 }
    )
  }
}

// DELETE /api/sars/config/[id] - Delete a SARS eFiling config
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    // Check if config exists
    const existingConfig = await db.sarsEfilingConfig.findUnique({
      where: { id }
    })

    if (!existingConfig) {
      return NextResponse.json(
        { error: 'SARS eFiling configuration not found' },
        { status: 404 }
      )
    }

    await db.sarsEfilingConfig.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'SARS eFiling configuration deleted successfully' })
  } catch (error) {
    console.error('Error deleting SARS eFiling config:', error)
    return NextResponse.json(
      { error: 'Failed to delete SARS eFiling configuration' },
      { status: 500 }
    )
  }
}
