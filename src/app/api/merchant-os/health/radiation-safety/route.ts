import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { nanoid } from 'nanoid'

// GET /api/merchant-os/health/radiation-safety - Get radiation safety equipment for a merchant
export async function GET(request: NextRequest) {
  try {
    const merchantId = request.headers.get('x-merchant-id') ||
      request.nextUrl.searchParams.get('merchantId')

    if (!merchantId) {
      return NextResponse.json({ error: 'Merchant ID required' }, { status: 400 })
    }

    const equipment = await db.radiationSafetyEquipment.findMany({
      where: { merchantId },
      orderBy: { createdAt: 'desc' }
    })

    // Transform to match frontend interface
    const radiationSafety = equipment.map(eq => ({
      id: eq.id,
      equipmentType: eq.equipmentType,
      serialNumber: eq.serialNumber,
      lastInspection: eq.lastInspection,
      nextInspection: eq.nextInspection,
      licenceNumber: eq.licenceNumber,
      licenceExpiry: eq.licenceExpiry,
      status: getRadiationStatus(eq.nextInspection, eq.licenceExpiry)
    }))

    return NextResponse.json({ records: radiationSafety })
  } catch (error) {
    console.error('Error fetching radiation safety equipment:', error)
    return NextResponse.json({ error: 'Failed to fetch radiation safety equipment' }, { status: 500 })
  }
}

// POST /api/merchant-os/health/radiation-safety - Create a new radiation safety equipment record
export async function POST(request: NextRequest) {
  try {
    const merchantId = request.headers.get('x-merchant-id') ||
      request.nextUrl.searchParams.get('merchantId')

    if (!merchantId) {
      return NextResponse.json({ error: 'Merchant ID required' }, { status: 400 })
    }

    const body = await request.json()
    const id = `RAD-${nanoid(8).toUpperCase()}`

    const equipment = await db.radiationSafetyEquipment.create({
      data: {
        id,
        merchantId,
        equipmentType: body.equipmentType,
        serialNumber: body.serialNumber,
        manufacturer: body.manufacturer,
        model: body.model,
        installationDate: body.installationDate,
        lastInspection: body.lastInspection,
        nextInspection: body.nextInspection,
        licenceNumber: body.licenceNumber,
        licenceExpiry: body.licenceExpiry,
        status: getRadiationStatus(body.nextInspection, body.licenceExpiry),
        inspectionAgency: body.inspectionAgency,
        responsiblePerson: body.responsiblePerson,
        notes: body.notes
      }
    })

    return NextResponse.json({ success: true, record: equipment })
  } catch (error) {
    console.error('Error creating radiation safety equipment:', error)
    return NextResponse.json({ error: 'Failed to create radiation safety equipment' }, { status: 500 })
  }
}

// Helper function to determine radiation safety status
function getRadiationStatus(nextInspection: string, licenceExpiry: string): string {
  const now = new Date()
  const inspection = new Date(nextInspection)
  const licence = new Date(licenceExpiry)

  const daysUntilInspection = Math.floor((inspection.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  const daysUntilLicenceExpiry = Math.floor((licence.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  if (daysUntilInspection < 0 || daysUntilLicenceExpiry < 0) return 'expired'
  if (daysUntilInspection <= 90 || daysUntilLicenceExpiry <= 90) return 'expiring_soon'
  return 'compliant'
}
