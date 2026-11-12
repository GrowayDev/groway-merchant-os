import { NextRequest, NextResponse } from 'next/server'

// South African ID validation (Luhn algorithm)
function validateSAId(id: string): boolean {
  if (!/^\d{13}$/.test(id)) return false
  
  // Validate date
  const year = parseInt(id.slice(0, 2))
  const month = parseInt(id.slice(2, 4))
  const day = parseInt(id.slice(4, 6))
  
  if (month < 1 || month > 12) return false
  if (day < 1 || day > 31) return false
  
  // Luhn check
  let sum = 0
  for (let i = 0; i < 13; i++) {
    let digit = parseInt(id[i])
    if (i % 2 === 1) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    sum += digit
  }
  return sum % 10 === 0
}

// GET /api/merchant-os/electronics/rica - List RICA registrations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Mock data for RICA registrations
    const mockRegistrations = [
      {
        id: 'rica_001',
        ricaReference: 'RICA-2024-001234',
        simNumber: '8912345678901234567',
        imsi: '655011234567890',
        networkProvider: 'Vodacom',
        fullName: 'John Smith',
        saIdNumber: '8001015009088',
        contactNumber: '+27 82 123 4567',
        emailAddress: 'john.smith@email.com',
        streetAddress: '123 Main Street',
        suburb: 'Sandton',
        city: 'Johannesburg',
        province: 'Gauteng',
        postalCode: '2196',
        idDocumentUploaded: true,
        idDocumentUrl: '/documents/id/rica_001_id.pdf',
        proofOfResidenceUploaded: true,
        proofOfResidenceUrl: '/documents/por/rica_001_por.pdf',
        status: 'verified',
        verifiedBy: 'Jane Doe',
        verifiedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        registeredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        saleId: 'sale_001',
        imei: '359847621234575',
      },
      {
        id: 'rica_002',
        ricaReference: 'RICA-2024-001235',
        simNumber: '8912345678901234568',
        imsi: '655011234567891',
        networkProvider: 'MTN',
        fullName: 'Sarah Johnson',
        saIdNumber: '8502050089012',
        contactNumber: '+27 83 987 6543',
        emailAddress: 'sarah.j@email.com',
        streetAddress: '45 Beach Road',
        suburb: 'Sea Point',
        city: 'Cape Town',
        province: 'Western Cape',
        postalCode: '8005',
        idDocumentUploaded: true,
        idDocumentUrl: '/documents/id/rica_002_id.pdf',
        proofOfResidenceUploaded: false,
        proofOfResidenceUrl: null,
        status: 'pending',
        verifiedBy: null,
        verifiedAt: null,
        registeredAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        saleId: 'sale_003',
        imei: null,
      },
      {
        id: 'rica_003',
        ricaReference: 'RICA-2024-001236',
        simNumber: '8912345678901234569',
        imsi: '655011234567892',
        networkProvider: 'Cell C',
        fullName: 'Peter van der Merwe',
        saIdNumber: '7903155123456',
        contactNumber: '+27 84 567 8901',
        emailAddress: 'peter.vdm@email.com',
        streetAddress: '78 O.R. Thambo Road',
        suburb: 'Morningside',
        city: 'Durban',
        province: 'KwaZulu-Natal',
        postalCode: '4001',
        idDocumentUploaded: true,
        idDocumentUrl: '/documents/id/rica_003_id.pdf',
        proofOfResidenceUploaded: true,
        proofOfResidenceUrl: '/documents/por/rica_003_por.pdf',
        status: 'verified',
        verifiedBy: 'Jane Doe',
        verifiedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        registeredAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        saleId: null,
        imei: null,
      },
      {
        id: 'rica_004',
        ricaReference: 'RICA-2024-001237',
        simNumber: '8912345678901234570',
        imsi: '655011234567893',
        networkProvider: 'Telkom',
        fullName: 'Nompumelelo Nkosi',
        saIdNumber: '9208280456789',
        contactNumber: '+27 81 234 5678',
        emailAddress: 'mpumi.nkosi@email.com',
        streetAddress: '12 Nelson Mandela Drive',
        suburb: 'Arcadia',
        city: 'Pretoria',
        province: 'Gauteng',
        postalCode: '0083',
        idDocumentUploaded: false,
        idDocumentUrl: null,
        proofOfResidenceUploaded: false,
        proofOfResidenceUrl: null,
        status: 'pending',
        verifiedBy: null,
        verifiedAt: null,
        registeredAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        saleId: 'sale_005',
        imei: '359847621234600',
      },
    ]

    // Apply filters
    let filtered = mockRegistrations
    if (status) {
      filtered = filtered.filter(r => r.status === status)
    }
    if (search) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter(r => 
        r.ricaReference.toLowerCase().includes(searchLower) ||
        r.fullName.toLowerCase().includes(searchLower) ||
        r.saIdNumber.includes(search) ||
        r.simNumber.includes(search)
      )
    }

    // Apply pagination
    const total = filtered.length
    const paginated = filtered.slice(offset, offset + limit)

    return NextResponse.json({
      data: paginated,
      total,
      limit,
      offset,
    })
  } catch (error) {
    console.error('Error fetching RICA registrations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch RICA registrations' },
      { status: 500 }
    )
  }
}

// POST /api/merchant-os/electronics/rica - Register RICA
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      simNumber,
      networkProvider,
      fullName,
      saIdNumber,
      contactNumber,
      emailAddress,
      streetAddress,
      suburb,
      city,
      province,
      postalCode,
      imei,
    } = body
    
    // Validate required fields
    if (!simNumber || !networkProvider || !fullName || !saIdNumber || !contactNumber || !streetAddress || !city || !province || !postalCode) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // Validate SA ID
    if (!validateSAId(saIdNumber)) {
      return NextResponse.json(
        { error: 'Invalid South African ID number' },
        { status: 400 }
      )
    }
    
    // Generate RICA reference
    const ricaReference = `RICA-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`
    
    // Create registration
    const registration = {
      id: `rica_${Date.now()}`,
      ricaReference,
      simNumber,
      networkProvider,
      fullName,
      saIdNumber,
      contactNumber,
      emailAddress,
      streetAddress,
      suburb,
      city,
      province,
      postalCode,
      idDocumentUploaded: false,
      idDocumentUrl: null,
      proofOfResidenceUploaded: false,
      proofOfResidenceUrl: null,
      status: 'pending',
      verifiedBy: null,
      verifiedAt: null,
      registeredAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      imei: imei || null,
    }
    
    // In production, save to database
    // await db.rICARegistration.create({ data: registration })
    
    return NextResponse.json({
      success: true,
      data: registration,
    })
  } catch (error) {
    console.error('Error creating RICA registration:', error)
    return NextResponse.json(
      { error: 'Failed to create RICA registration' },
      { status: 500 }
    )
  }
}
