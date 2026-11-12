import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { nanoid } from 'nanoid'

// GET /api/merchant-os/health/hpcsa - Get HPCSA registrations for a merchant
export async function GET(request: NextRequest) {
  try {
    const merchantId = request.headers.get('x-merchant-id') ||
      request.nextUrl.searchParams.get('merchantId')

    if (!merchantId) {
      return NextResponse.json({ error: 'Merchant ID required' }, { status: 400 })
    }

    const registrations = await db.professionalRegistration.findMany({
      where: {
        merchantId,
        council: 'HPCSA'
      },
      orderBy: { createdAt: 'desc' }
    })

    // Transform to match frontend interface
    const hpcsaRecords = registrations.map(reg => ({
      id: reg.id,
      practitionerName: reg.professionalName,
      hpcsaNumber: reg.registrationNumber,
      registrationType: reg.registrationType,
      registrationDate: reg.issueDate,
      expiryDate: reg.expiryDate || '',
      status: getRegistrationStatus(reg.expiryDate),
      practiceCardExpiry: reg.expiryDate || ''
    }))

    return NextResponse.json({ records: hpcsaRecords })
  } catch (error) {
    console.error('Error fetching HPCSA records:', error)
    return NextResponse.json({ error: 'Failed to fetch HPCSA records' }, { status: 500 })
  }
}

// POST /api/merchant-os/health/hpcsa - Create a new HPCSA registration
export async function POST(request: NextRequest) {
  try {
    const merchantId = request.headers.get('x-merchant-id') ||
      request.nextUrl.searchParams.get('merchantId')

    if (!merchantId) {
      return NextResponse.json({ error: 'Merchant ID required' }, { status: 400 })
    }

    const body = await request.json()
    const id = `HPCSA-${nanoid(8).toUpperCase()}`

    const registration = await db.professionalRegistration.create({
      data: {
        id,
        merchantId,
        professionalName: body.practitionerName,
        council: 'HPCSA',
        registrationNumber: body.hpcsaNumber,
        registrationType: body.registrationType || 'Dentist',
        category: body.category,
        specialty: body.specialty,
        issueDate: body.registrationDate,
        expiryDate: body.expiryDate,
        status: getRegistrationStatus(body.expiryDate),
        practiceNumber: body.practiceNumber,
        notes: body.notes
      }
    })

    return NextResponse.json({ success: true, record: registration })
  } catch (error) {
    console.error('Error creating HPCSA record:', error)
    return NextResponse.json({ error: 'Failed to create HPCSA record' }, { status: 500 })
  }
}

// Helper function to determine registration status based on expiry date
function getRegistrationStatus(expiryDate: string | null): string {
  if (!expiryDate) return 'active'

  const expiry = new Date(expiryDate)
  const now = new Date()
  const daysUntilExpiry = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  if (daysUntilExpiry < 0) return 'expired'
  if (daysUntilExpiry <= 90) return 'pending_renewal'
  return 'active'
}
