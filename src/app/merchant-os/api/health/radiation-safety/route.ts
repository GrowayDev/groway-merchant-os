import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { randomUUID } from 'crypto'

// GET /api/merchant-os/health/radiation-safety - Fetch radiation safety equipment records
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const merchantId = searchParams.get('merchantId') || 'merchant-001'
    const status = searchParams.get('status')
    const equipmentType = searchParams.get('equipmentType')

    const where: any = { merchantId }
    
    if (status && status !== 'all') {
      where.status = status
    }
    
    if (equipmentType && equipmentType !== 'all') {
      where.equipmentType = equipmentType
    }

    const equipment = await db.radiationSafetyEquipment.findMany({
      where,
      orderBy: { nextInspection: 'asc' }
    })

    // Transform to match the component interface
    const radiationRecords = equipment.map(eq => ({
      id: eq.id,
      equipmentType: eq.equipmentType,
      serialNumber: eq.serialNumber,
      lastInspection: eq.lastInspection,
      nextInspection: eq.nextInspection,
      licenceNumber: eq.licenceNumber,
      licenceExpiry: eq.licenceExpiry,
      status: eq.status,
      manufacturer: eq.manufacturer,
      model: eq.model,
      responsiblePerson: eq.responsiblePerson,
      notes: eq.notes
    }))

    return NextResponse.json({
      success: true,
      data: radiationRecords,
      count: radiationRecords.length
    })
  } catch (error) {
    console.error('Error fetching radiation safety equipment:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch radiation safety equipment' },
      { status: 500 }
    )
  }
}

// POST /api/merchant-os/health/radiation-safety - Add radiation safety record
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      merchantId = 'merchant-001',
      equipmentType,
      serialNumber,
      manufacturer,
      model,
      installationDate,
      lastInspection,
      nextInspection,
      licenceNumber,
      licenceExpiry,
      status = 'compliant',
      inspectionAgency,
      responsiblePerson,
      notes,
      documentUrl
    } = body

    // Validate required fields
    if (!equipmentType || !serialNumber || !lastInspection || !nextInspection || !licenceNumber || !licenceExpiry) {
      return NextResponse.json(
        { success: false, error: 'Equipment type, serial number, inspection dates, licence number, and licence expiry are required' },
        { status: 400 }
      )
    }

    // Check for duplicate serial number for this merchant
    const existing = await db.radiationSafetyEquipment.findFirst({
      where: { merchantId, serialNumber }
    })
    
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Equipment with this serial number already exists' },
        { status: 400 }
      )
    }

    // Determine status based on dates if not provided
    let calculatedStatus = status
    const today = new Date()
    const nextInspectionDate = new Date(nextInspection)
    const licenceExpiryDate = new Date(licenceExpiry)
    
    if (calculatedStatus === 'compliant') {
      const daysUntilInspection = Math.floor((nextInspectionDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      const daysUntilExpiry = Math.floor((licenceExpiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysUntilInspection < 0 || daysUntilExpiry < 0) {
        calculatedStatus = 'expired'
      } else if (daysUntilInspection <= 30 || daysUntilExpiry <= 30) {
        calculatedStatus = 'expiring_soon'
      }
    }

    // Create equipment record
    const equipment = await db.radiationSafetyEquipment.create({
      data: {
        id: randomUUID(),
        merchantId,
        equipmentType,
        serialNumber,
        manufacturer: manufacturer || null,
        model: model || null,
        installationDate: installationDate || null,
        lastInspection,
        nextInspection,
        licenceNumber,
        licenceExpiry,
        status: calculatedStatus,
        inspectionAgency: inspectionAgency || null,
        responsiblePerson: responsiblePerson || null,
        notes: notes || null,
        documentUrl: documentUrl || null,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        id: equipment.id,
        equipmentType: equipment.equipmentType,
        serialNumber: equipment.serialNumber,
        lastInspection: equipment.lastInspection,
        nextInspection: equipment.nextInspection,
        licenceNumber: equipment.licenceNumber,
        licenceExpiry: equipment.licenceExpiry,
        status: equipment.status
      },
      message: 'Radiation safety equipment record created successfully'
    })
  } catch (error) {
    console.error('Error creating radiation safety equipment:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create radiation safety equipment record' },
      { status: 500 }
    )
  }
}
