import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// In-memory store for demo (in production, use database)
let currentPharmacist: any = {
  id: 'pharm_001',
  name: 'Dr. Jane Smith',
  sapcNumber: 'SAPC-123456',
  qualification: 'pharmacist',
  photoUrl: null,
  shiftStart: '08:00',
  shiftEnd: '17:00',
  status: 'on_duty',
  phone: '+27 82 123 4567',
  email: 'jane.smith@pharmacy.co.za',
  specialPermissions: ['schedule_5', 'schedule_6'],
  verified: true,
  verifiedAt: new Date().toISOString(),
}

let pharmacistSchedule: any[] = [
  {
    id: 'pharm_001',
    name: 'Dr. Jane Smith',
    sapcNumber: 'SAPC-123456',
    qualification: 'pharmacist',
    shiftStart: '08:00',
    shiftEnd: '17:00',
    status: 'on_duty',
    phone: '+27 82 123 4567',
    email: 'jane.smith@pharmacy.co.za',
    specialPermissions: ['schedule_5', 'schedule_6'],
    verified: true,
  },
  {
    id: 'pharm_002',
    name: 'Dr. John Doe',
    sapcNumber: 'SAPC-789012',
    qualification: 'pharmacist',
    shiftStart: '17:00',
    shiftEnd: '22:00',
    status: 'off',
    phone: '+27 83 987 6543',
    email: 'john.doe@pharmacy.co.za',
    specialPermissions: ['schedule_5'],
    verified: true,
  },
  {
    id: 'pharm_003',
    name: 'Sarah Williams',
    sapcNumber: 'SAPC-456789',
    qualification: 'pharmacist_assistant',
    shiftStart: '09:00',
    shiftEnd: '18:00',
    status: 'off',
    phone: '+27 84 567 8901',
    email: 'sarah.williams@pharmacy.co.za',
    specialPermissions: [],
    verified: true,
  },
]

// GET /api/merchant-os/pharmacy/pharmacist-on-duty - Get current pharmacist status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeSchedule = searchParams.get('schedule') === 'true'

    if (includeSchedule) {
      return NextResponse.json({
        pharmacist: currentPharmacist,
        schedule: pharmacistSchedule,
      })
    }

    return NextResponse.json({
      pharmacist: currentPharmacist,
      isPharmacistOnDuty: currentPharmacist !== null,
    })
  } catch (error) {
    console.error('Error fetching pharmacist on duty:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pharmacist on duty' },
      { status: 500 }
    )
  }
}

// POST /api/merchant-os/pharmacy/pharmacist-on-duty - Set pharmacist on duty
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      sapcNumber,
      qualification,
      shiftStart,
      shiftEnd,
      phone,
      email,
    } = body

    // Validate required fields
    if (!name || !sapcNumber) {
      return NextResponse.json(
        { error: 'Missing required fields: name, sapcNumber' },
        { status: 400 }
      )
    }

    // Validate SAPC number format (basic validation)
    if (!sapcNumber.match(/^(SAPC-)?\d{6}$/i)) {
      return NextResponse.json(
        { error: 'Invalid SAPC registration number format' },
        { status: 400 }
      )
    }

    // Determine special permissions based on qualification
    const specialPermissions: string[] = []
    if (qualification === 'pharmacist' || qualification === 'responsible_pharmacist') {
      specialPermissions.push('schedule_5')
    }
    if (qualification === 'responsible_pharmacist') {
      specialPermissions.push('schedule_6')
    }

    // Create new pharmacist on duty
    const newPharmacist = {
      id: `pharm_${Date.now()}`,
      name,
      sapcNumber: sapcNumber.startsWith('SAPC-') ? sapcNumber : `SAPC-${sapcNumber}`,
      qualification: qualification || 'pharmacist',
      photoUrl: null,
      shiftStart: shiftStart || new Date().toTimeString().split(' ')[0].slice(0, 5),
      shiftEnd: shiftEnd || '22:00',
      status: 'on_duty',
      phone: phone || '',
      email: email || '',
      specialPermissions,
      verified: false, // Will be verified by checking SAPC database
      verifiedAt: null,
    }

    // Update previous pharmacist status
    if (currentPharmacist) {
      const prevIndex = pharmacistSchedule.findIndex(p => p.id === currentPharmacist.id)
      if (prevIndex >= 0) {
        pharmacistSchedule[prevIndex].status = 'off'
      }
    }

    // Set new pharmacist on duty
    currentPharmacist = newPharmacist

    // Update schedule
    const existingIndex = pharmacistSchedule.findIndex(p => p.sapcNumber === newPharmacist.sapcNumber)
    if (existingIndex >= 0) {
      pharmacistSchedule[existingIndex] = { ...newPharmacist, status: 'on_duty' }
    } else {
      pharmacistSchedule.unshift({ ...newPharmacist, status: 'on_duty' })
    }

    // In production, save to database
    // await db.pharmacistOnDuty.create({ data: newPharmacist })

    return NextResponse.json({
      success: true,
      pharmacist: currentPharmacist,
      message: 'Pharmacist set on duty successfully',
    })
  } catch (error) {
    console.error('Error setting pharmacist on duty:', error)
    return NextResponse.json(
      { error: 'Failed to set pharmacist on duty' },
      { status: 500 }
    )
  }
}

// PATCH /api/merchant-os/pharmacy/pharmacist-on-duty - Update pharmacist status
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { status, breakStart, breakEnd } = body

    if (!currentPharmacist) {
      return NextResponse.json(
        { error: 'No pharmacist currently on duty' },
        { status: 400 }
      )
    }

    // Update status
    currentPharmacist = {
      ...currentPharmacist,
      status: status || currentPharmacist.status,
      breakStart: breakStart || currentPharmacist.breakStart,
      breakEnd: breakEnd || currentPharmacist.breakEnd,
    }

    // Update in schedule
    const index = pharmacistSchedule.findIndex(p => p.id === currentPharmacist.id)
    if (index >= 0) {
      pharmacistSchedule[index] = currentPharmacist
    }

    return NextResponse.json({
      success: true,
      pharmacist: currentPharmacist,
    })
  } catch (error) {
    console.error('Error updating pharmacist status:', error)
    return NextResponse.json(
      { error: 'Failed to update pharmacist status' },
      { status: 500 }
    )
  }
}

// DELETE /api/merchant-os/pharmacy/pharmacist-on-duty - Clear pharmacist on duty
export async function DELETE() {
  try {
    if (currentPharmacist) {
      // Update schedule
      const index = pharmacistSchedule.findIndex(p => p.id === currentPharmacist.id)
      if (index >= 0) {
        pharmacistSchedule[index].status = 'off'
      }
    }

    currentPharmacist = null

    return NextResponse.json({
      success: true,
      message: 'Pharmacist on duty cleared',
    })
  } catch (error) {
    console.error('Error clearing pharmacist on duty:', error)
    return NextResponse.json(
      { error: 'Failed to clear pharmacist on duty' },
      { status: 500 }
    )
  }
}
