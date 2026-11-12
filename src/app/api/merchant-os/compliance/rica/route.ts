import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { nanoid } from 'nanoid'

// Validate South African ID number using Luhn algorithm
function validateSAId(idNumber: string): boolean {
  if (idNumber.length !== 13) return false
  if (!/^\d+$/.test(idNumber)) return false
  
  // Luhn check
  let sum = 0
  let alternate = false
  for (let i = idNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(idNumber[i], 10)
    if (alternate) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    sum += digit
    alternate = !alternate
  }
  return sum % 10 === 0
}

// GET /api/merchant-os/compliance/rica - Get RICA registrations
export async function GET(request: NextRequest) {
  try {
    const merchantId = request.headers.get('x-merchant-id') || 
                       request.nextUrl.searchParams.get('merchantId')
    const search = request.nextUrl.searchParams.get('search')

    if (!merchantId) {
      return NextResponse.json({ error: 'Merchant ID required' }, { status: 400 })
    }

    const where: { merchantId: string; OR?: Array<{ simNumber: { contains: string }; msisdn: { contains: string }; customerIdNumber: { contains: string } }> } = { merchantId }
    
    if (search) {
      where.OR = [
        { simNumber: { contains: search } },
        { msisdn: { contains: search } },
        { customerIdNumber: { contains: search } }
      ]
    }

    const registrations = await db.rICARegistration.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })

    // Get summary
    const summary = {
      total: registrations.length,
      active: registrations.filter(r => r.status === 'active').length,
      cancelled: registrations.filter(r => r.status === 'cancelled').length
    }

    return NextResponse.json({ registrations, summary })
  } catch (error) {
    console.error('Error fetching RICA registrations:', error)
    return NextResponse.json({ error: 'Failed to fetch RICA registrations' }, { status: 500 })
  }
}

// POST /api/merchant-os/compliance/rica - Register SIM (RICA)
export async function POST(request: NextRequest) {
  try {
    const merchantId = request.headers.get('x-merchant-id') ||
                       request.nextUrl.searchParams.get('merchantId')

    if (!merchantId) {
      return NextResponse.json({ error: 'Merchant ID required' }, { status: 400 })
    }

    const body = await request.json()

    // Validate SA ID number
    if (!validateSAId(body.customerIdNumber)) {
      return NextResponse.json({ 
        error: 'Invalid South African ID number. Please verify the ID number.' 
      }, { status: 400 })
    }

    // Check if SIM already registered
    const existing = await db.rICARegistration.findUnique({
      where: { simNumber: body.simNumber }
    })

    if (existing) {
      return NextResponse.json({ 
        error: 'This SIM number is already registered' 
      }, { status: 400 })
    }

    const registrationId = `RICA-${nanoid(8).toUpperCase()}`

    const registration = await db.rICARegistration.create({
      data: {
        id: registrationId,
        merchantId,
        simNumber: body.simNumber,
        msisdn: body.msisdn,
        customerId: body.customerId,
        customerName: body.customerName,
        customerIdNumber: body.customerIdNumber,
        customerAddress: body.customerAddress,
        registrationDate: new Date().toISOString().split('T')[0],
        registeredBy: body.registeredBy || 'System',
        documentUrl: body.documentUrl,
        status: 'active'
      }
    })

    return NextResponse.json({ 
      success: true, 
      registration,
      message: 'SIM successfully registered in compliance with RICA Act 70 of 2002'
    })
  } catch (error) {
    console.error('Error creating RICA registration:', error)
    return NextResponse.json({ error: 'Failed to register SIM' }, { status: 500 })
  }
}

// PATCH /api/merchant-os/compliance/rica - Cancel registration
export async function PATCH(request: NextRequest) {
  try {
    const merchantId = request.headers.get('x-merchant-id') ||
                       request.nextUrl.searchParams.get('merchantId')

    if (!merchantId) {
      return NextResponse.json({ error: 'Merchant ID required' }, { status: 400 })
    }

    const body = await request.json()

    const registration = await db.rICARegistration.update({
      where: { id: body.id, merchantId },
      data: {
        status: 'cancelled',
        cancelledAt: new Date(),
        cancelledReason: body.reason,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ success: true, registration })
  } catch (error) {
    console.error('Error updating RICA registration:', error)
    return NextResponse.json({ error: 'Failed to update registration' }, { status: 500 })
  }
}
