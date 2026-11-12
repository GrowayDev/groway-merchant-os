import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST /api/sars/vat-returns/[id]/submit - Submit a VAT return to SARS
export async function POST(request: NextRequest, { params }: RouteParams) {
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

    // Validate current status - can only submit from 'ready' status
    if (existing.status !== 'ready') {
      return NextResponse.json(
        { 
          error: `Cannot submit VAT return with status '${existing.status}'. Must be 'ready' to submit.`,
          currentStatus: existing.status
        },
        { status: 400 }
      )
    }

    // Validate required data for submission
    if (existing.outputVat === 0 && existing.inputVat === 0) {
      return NextResponse.json(
        { error: 'VAT return has no VAT data. Please add output and/or input VAT amounts.' },
        { status: 400 }
      )
    }

    // Check if merchant has SARS eFiling config
    const sarsConfig = await db.sarsEfilingConfig.findUnique({
      where: { merchantId: existing.merchantId }
    })

    if (!sarsConfig) {
      return NextResponse.json(
        { error: 'Merchant does not have SARS eFiling configuration. Please configure SARS eFiling first.' },
        { status: 400 }
      )
    }

    if (sarsConfig.efilingStatus !== 'linked') {
      return NextResponse.json(
        { error: `SARS eFiling account is not linked. Current status: ${sarsConfig.efilingStatus}` },
        { status: 400 }
      )
    }

    // In a real implementation, this would:
    // 1. Connect to SARS eFiling API
    // 2. Submit the VAT201 return
    // 3. Receive a SARS reference number
    // 4. Update the status accordingly

    // Simulate submission process
    const sarsReferenceNumber = `SARS-VAT-${Date.now()}-${existing.merchantId.slice(-6).toUpperCase()}`
    const submittedAt = new Date()
    const submittedBy = body.submittedBy || 'system'

    // Update VAT return with submission details
    const updatedReturn = await db.vatReturnSubmission.update({
      where: { id },
      data: {
        status: 'submitted',
        submittedAt,
        submittedBy,
        sarsReferenceNumber
      }
    })

    // Update the SARS config with last submission date
    await db.sarsEfilingConfig.update({
      where: { merchantId: existing.merchantId },
      data: {
        lastVatSubmitted: existing.periodEnd,
        lastSyncAt: new Date()
      }
    })

    // Log the submission in IntegrationConfig
    await db.integrationConfig.upsert({
      where: {
        merchantId_integrationType: {
          merchantId: existing.merchantId,
          integrationType: 'sars_efiling'
        }
      },
      create: {
        merchantId: existing.merchantId,
        integrationType: 'sars_efiling',
        integrationName: 'SARS eFiling',
        status: 'connected',
        lastSyncAt: new Date()
      },
      update: {
        lastSyncAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: 'VAT return submitted successfully to SARS',
      vatReturn: updatedReturn,
      submissionDetails: {
        sarsReferenceNumber,
        submittedAt,
        period: `${existing.periodStart} to ${existing.periodEnd}`,
        netVat: existing.netVat,
        taxType: sarsConfig.taxType
      }
    })
  } catch (error) {
    console.error('Error submitting VAT return:', error)
    return NextResponse.json(
      { error: 'Failed to submit VAT return to SARS' },
      { status: 500 }
    )
  }
}
