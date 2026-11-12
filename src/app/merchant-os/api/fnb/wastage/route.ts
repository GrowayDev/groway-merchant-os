import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { randomUUID } from 'crypto'

// Wastage reason codes
export const WASTAGE_REASONS = [
  { code: 'spoilage', label: 'Spoilage', description: 'Food spoiled before use' },
  { code: 'over_production', label: 'Over Production', description: 'Made more than needed' },
  { code: 'quality_issues', label: 'Quality Issues', description: 'Did not meet quality standards' },
  { code: 'expired', label: 'Expired', description: 'Past expiration date' },
  { code: 'damaged', label: 'Damaged', description: 'Physically damaged' },
  { code: 'temperature_abuse', label: 'Temperature Abuse', description: 'Improper temperature storage' },
  { code: 'contamination', label: 'Contamination', description: 'Contaminated during handling' },
  { code: 'other', label: 'Other', description: 'Other reasons' },
]

// Disposition options
export const DISPOSITION_OPTIONS = [
  { code: 'disposed', label: 'Disposed' },
  { code: 'donated', label: 'Donated' },
  { code: 'returned_to_supplier', label: 'Returned to Supplier' },
  { code: 'repurposed', label: 'Repurposed' },
  { code: 'composted', label: 'Composted' },
]

// Generate record number
function generateRecordNumber(): string {
  const date = new Date()
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `WST-${dateStr}-${random}`
}

// GET - Fetch wastage records
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const merchantId = searchParams.get('merchantId')
    const branchId = searchParams.get('branchId')
    const status = searchParams.get('status')
    const wastageType = searchParams.get('wastageType')
    const reasonCode = searchParams.get('reasonCode')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = parseInt(searchParams.get('limit') || '50')

    if (!merchantId) {
      return NextResponse.json({ error: 'merchantId is required' }, { status: 400 })
    }

    const where: any = { merchantId }
    if (branchId) where.branchId = branchId
    if (status) where.status = status
    if (wastageType) where.wastageType = wastageType
    if (reasonCode) where.reasonCode = reasonCode
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = new Date(startDate)
      if (endDate) where.createdAt.lte = new Date(endDate + 'T23:59:59')
    }

    const [records, total] = await Promise.all([
      db.wastageRecord.findMany({
        where,
        include: {
          WastageItem: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      db.wastageRecord.count({ where }),
    ])

    // Calculate summary stats
    const stats = {
      totalRecords: total,
      totalCost: records.reduce((sum, r) => sum + r.totalCost, 0),
      pendingCount: records.filter(r => r.status === 'pending').length,
      approvedCount: records.filter(r => r.status === 'approved').length,
      byReason: {} as Record<string, number>,
      byType: {} as Record<string, number>,
    }

    records.forEach(r => {
      stats.byReason[r.reasonCode] = (stats.byReason[r.reasonCode] || 0) + r.totalCost
      stats.byType[r.wastageType] = (stats.byType[r.wastageType] || 0) + r.totalCost
    })

    return NextResponse.json({
      success: true,
      data: records,
      stats,
      pagination: { total, limit },
    })
  } catch (error) {
    console.error('Error fetching wastage records:', error)
    return NextResponse.json({ error: 'Failed to fetch wastage records' }, { status: 500 })
  }
}

// POST - Create wastage record
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      merchantId,
      branchId,
      wastageType,
      itemType,
      itemId,
      itemName,
      sku,
      quantity,
      unit,
      unitCost,
      reasonCode,
      reasonDetails,
      disposition,
      location,
      batchNumber,
      expiryDate,
      identifiedBy,
      identifiedByName,
      notes,
      photos,
      items, // For multi-item wastage
    } = body

    if (!merchantId || !itemName) {
      return NextResponse.json({ error: 'merchantId and itemName are required' }, { status: 400 })
    }

    const recordNumber = generateRecordNumber()
    const totalCost = quantity && unitCost ? quantity * unitCost : 0

    const record = await db.wastageRecord.create({
      data: {
        id: `wst-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        merchantId,
        branchId,
        recordNumber,
        wastageType: wastageType || 'ingredient',
        itemType: itemType || 'ingredient',
        itemId,
        itemName,
        sku,
        quantity: quantity || 0,
        unit: unit || 'each',
        unitCost: unitCost || 0,
        totalCost,
        reasonCode: reasonCode || 'other',
        reasonDetails,
        disposition: disposition || 'disposed',
        location,
        batchNumber,
        expiryDate,
        identifiedBy,
        identifiedByName,
        notes,
        photos: photos ? JSON.stringify(photos) : null,
        status: 'pending',
        updatedAt: new Date(),
        WastageItem: items ? {
          create: items.map((item: any) => ({
            id: `wsti-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            itemId: item.itemId,
            itemName: item.itemName,
            sku: item.sku,
            quantity: item.quantity,
            unit: item.unit,
            unitCost: item.unitCost,
            totalCost: item.quantity * item.unitCost,
            reasonCode: item.reasonCode,
            location: item.location,
          }))
        } : undefined,
      },
      include: {
        WastageItem: true,
      },
    })

    // Create audit log entry
    await db.auditLog.create({
      data: {
        id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        action: 'wastage_created',
        category: 'fnb',
        actorId: identifiedBy,
        actorName: identifiedByName || 'System',
        targetType: 'wastage_record',
        targetId: record.id,
        targetName: recordNumber,
        details: `Wastage record created: ${itemName} - ${reasonCode}`,
      },
    })

    return NextResponse.json({
      success: true,
      data: record,
      message: 'Wastage record created successfully',
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating wastage record:', error)
    return NextResponse.json({ error: 'Failed to create wastage record' }, { status: 500 })
  }
}

// PUT - Update wastage record (approve/reject)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, action, approvedBy, approvedByName, rejectionReason } = body

    if (!id || !action) {
      return NextResponse.json({ error: 'id and action are required' }, { status: 400 })
    }

    const record = await db.wastageRecord.findUnique({ where: { id } })
    if (!record) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 })
    }

    let updateData: any = { updatedAt: new Date() }

    if (action === 'approve') {
      updateData = {
        ...updateData,
        status: 'approved',
        approvedBy,
        approvedByName,
        approvedAt: new Date(),
      }
    } else if (action === 'reject') {
      updateData = {
        ...updateData,
        status: 'rejected',
        rejectionReason,
      }
    }

    const updatedRecord = await db.wastageRecord.update({
      where: { id },
      data: updateData,
    })

    // Create audit log
    await db.auditLog.create({
      data: {
        id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        action: `wastage_${action}d`,
        category: 'fnb',
        actorId: approvedBy,
        actorName: approvedByName || 'System',
        targetType: 'wastage_record',
        targetId: id,
        targetName: record.recordNumber,
        details: `Wastage record ${action}d: ${record.itemName}`,
      },
    })

    return NextResponse.json({
      success: true,
      data: updatedRecord,
      message: `Wastage record ${action}d successfully`,
    })
  } catch (error) {
    console.error('Error updating wastage record:', error)
    return NextResponse.json({ error: 'Failed to update wastage record' }, { status: 500 })
  }
}
