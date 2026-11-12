import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { randomUUID } from 'crypto'

// GET /api/merchant-os/health/hpcsa - Fetch HPCSA registrations for merchant's staff
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const merchantId = searchParams.get('merchantId') || 'merchant-001'
    const status = searchParams.get('status')

    const where: any = { 
      merchantId,
      council: 'HPCSA'
    }
    
    if (status && status !== 'all') {
      where.status = status
    }

    const registrations = await db.professionalRegistration.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })

    // Transform to match the component interface
    const hpcsaRecords = registrations.map(reg => ({
      id: reg.id,
      practitionerName: reg.professionalName,
      hpcsaNumber: reg.registrationNumber,
      registrationType: reg.registrationType,
      registrationDate: reg.issueDate,
      expiryDate: reg.expiryDate || '',
      status: reg.status, // active, expired, pending_renewal
      practiceCardExpiry: reg.expiryDate || '',
      category: reg.category,
      specialty: reg.specialty,
      practiceNumber: reg.practiceNumber,
      cpdPoints: reg.cpdPoints,
      cpdRequired: reg.cpdRequired,
      cpdDueDate: reg.cpdDueDate
    }))

    return NextResponse.json({
      success: true,
      data: hpcsaRecords,
      count: hpcsaRecords.length
    })
  } catch (error) {
    console.error('Error fetching HPCSA registrations:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch HPCSA registrations' },
      { status: 500 }
    )
  }
}

// POST /api/merchant-os/health/hpcsa - Add HPCSA registration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      merchantId = 'merchant-001',
      practitionerName,
      hpcsaNumber,
      registrationType,
      registrationDate,
      expiryDate,
      status = 'active',
      practiceCardExpiry,
      category,
      specialty,
      practiceNumber,
      staffId
    } = body

    // Validate required fields
    if (!practitionerName || !hpcsaNumber || !registrationType) {
      return NextResponse.json(
        { success: false, error: 'Practitioner name, HPCSA number, and registration type are required' },
        { status: 400 }
      )
    }

    // Check for duplicate registration number
    const existing = await db.professionalRegistration.findFirst({
      where: { 
        council: 'HPCSA',
        registrationNumber: hpcsaNumber 
      }
    })
    
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'A registration with this HPCSA number already exists' },
        { status: 400 }
      )
    }

    // Create registration
    const registration = await db.professionalRegistration.create({
      data: {
        id: randomUUID(),
        merchantId,
        staffId: staffId || null,
        professionalName: practitionerName,
        council: 'HPCSA',
        registrationNumber: hpcsaNumber,
        registrationType,
        category: category || null,
        specialty: specialty || null,
        issueDate: registrationDate || new Date().toISOString().split('T')[0],
        expiryDate: expiryDate || null,
        status,
        practiceNumber: practiceNumber || null,
        cpdPoints: 0,
        cpdRequired: 60,
        cpdDueDate: null,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        id: registration.id,
        practitionerName: registration.professionalName,
        hpcsaNumber: registration.registrationNumber,
        registrationType: registration.registrationType,
        registrationDate: registration.issueDate,
        expiryDate: registration.expiryDate || '',
        status: registration.status,
        practiceCardExpiry: practiceCardExpiry || registration.expiryDate || ''
      },
      message: 'HPCSA registration created successfully'
    })
  } catch (error) {
    console.error('Error creating HPCSA registration:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create HPCSA registration' },
      { status: 500 }
    )
  }
}
