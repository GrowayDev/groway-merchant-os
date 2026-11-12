import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { nanoid } from 'nanoid'

// GET /api/merchant-os/she-compliance/inspections - Get inspections
export async function GET(request: NextRequest) {
  try {
    const merchantId = request.headers.get('x-merchant-id') || 
                       request.nextUrl.searchParams.get('merchantId')
    const branchId = request.nextUrl.searchParams.get('branchId')
    const status = request.nextUrl.searchParams.get('status')
    const complianceType = request.nextUrl.searchParams.get('complianceType')

    if (!merchantId) {
      return NextResponse.json({ error: 'Merchant ID required' }, { status: 400 })
    }

    const where: { merchantId: string; branchId?: string; status?: string; complianceType?: string } = { merchantId }
    if (branchId) where.branchId = branchId
    if (status) where.status = status
    if (complianceType) where.complianceType = complianceType

    const inspections = await db.sHECompliance.findMany({
      where,
      orderBy: { dueDate: 'asc' }
    })

    // Get summary statistics
    const summary = {
      total: inspections.length,
      pending: inspections.filter(i => i.status === 'pending').length,
      completed: inspections.filter(i => i.status === 'completed').length,
      overdue: inspections.filter(i => i.status === 'pending' && new Date(i.dueDate) < new Date()).length,
      byType: {} as Record<string, number>,
      byRisk: { low: 0, medium: 0, high: 0, critical: 0 }
    }

    inspections.forEach(i => {
      summary.byType[i.complianceType] = (summary.byType[i.complianceType] || 0) + 1
      if (i.riskLevel) {
        summary.byRisk[i.riskLevel as keyof typeof summary.byRisk]++
      }
    })

    return NextResponse.json({ inspections, summary })
  } catch (error) {
    console.error('Error fetching SHE inspections:', error)
    return NextResponse.json({ error: 'Failed to fetch inspections' }, { status: 500 })
  }
}

// POST /api/merchant-os/she-compliance/inspections - Create inspection
export async function POST(request: NextRequest) {
  try {
    const merchantId = request.headers.get('x-merchant-id') ||
                       request.nextUrl.searchParams.get('merchantId')

    if (!merchantId) {
      return NextResponse.json({ error: 'Merchant ID required' }, { status: 400 })
    }

    const body = await request.json()
    const inspectionId = `SHE-${nanoid(8).toUpperCase()}`

    const inspection = await db.sHECompliance.create({
      data: {
        id: inspectionId,
        merchantId,
        branchId: body.branchId,
        complianceType: body.complianceType,
        category: body.category,
        title: body.title,
        description: body.description,
        responsiblePerson: body.responsiblePerson,
        dueDate: body.dueDate,
        completedDate: body.completedDate,
        status: body.status || 'pending',
        frequency: body.frequency,
        nextDueDate: body.nextDueDate,
        documentUrl: body.documentUrl,
        attachments: body.attachments,
        notes: body.notes,
        riskLevel: body.riskLevel,
        remedialActions: body.remedialActions,
        verificationRequired: body.verificationRequired || false,
        verifiedBy: body.verifiedBy,
        verifiedAt: body.verifiedAt ? new Date(body.verifiedAt) : undefined
      }
    })

    return NextResponse.json({ success: true, inspection })
  } catch (error) {
    console.error('Error creating SHE inspection:', error)
    return NextResponse.json({ error: 'Failed to create inspection' }, { status: 500 })
  }
}

// PATCH /api/merchant-os/she-compliance/inspections - Update inspection
export async function PATCH(request: NextRequest) {
  try {
    const merchantId = request.headers.get('x-merchant-id') ||
                       request.nextUrl.searchParams.get('merchantId')

    if (!merchantId) {
      return NextResponse.json({ error: 'Merchant ID required' }, { status: 400 })
    }

    const body = await request.json()

    const inspection = await db.sHECompliance.update({
      where: { id: body.id, merchantId },
      data: {
        ...body,
        verifiedAt: body.verifiedAt ? new Date(body.verifiedAt) : undefined,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ success: true, inspection })
  } catch (error) {
    console.error('Error updating SHE inspection:', error)
    return NextResponse.json({ error: 'Failed to update inspection' }, { status: 500 })
  }
}
