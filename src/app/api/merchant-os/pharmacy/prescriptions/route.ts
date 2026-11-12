import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/merchant-os/pharmacy/prescriptions - List prescriptions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const patientId = searchParams.get('patientId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // For demo purposes, return mock data
    // In production, this would query the database
    const mockPrescriptions = [
      {
        id: 'rx_001',
        prescriptionNumber: 'RX-2024-00001',
        patientName: 'John Smith',
        patientId: 'ID1234567890',
        patientPhone: '+27 82 123 4567',
        doctorName: 'Dr. Sarah Johnson',
        doctorPracticeNumber: 'MP123456',
        doctorPhone: '+27 21 555 1234',
        diagnosis: 'Hypertension',
        items: [
          {
            id: 'item_001',
            productName: 'Enalapril 10mg Tablets 30s',
            nappiCode: '720001-001',
            scheduleClass: 4,
            quantity: 30,
            dosage: '10mg',
            frequency: 'Once daily',
            duration: '30 days',
            price: 8950,
          },
        ],
        status: 'pending',
        scheduleRequired: 4,
        repeatAllowed: true,
        repeatsTotal: 3,
        repeatsRemaining: 3,
        issueDate: '2024-01-15',
        expiryDate: '2024-04-15',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'rx_002',
        prescriptionNumber: 'RX-2024-00002',
        patientName: 'Mary Thompson',
        patientId: 'ID9876543210',
        patientPhone: '+27 83 987 6543',
        doctorName: 'Dr. Michael Brown',
        doctorPracticeNumber: 'MP789012',
        doctorPhone: '+27 21 555 9876',
        diagnosis: 'Chronic Pain',
        items: [
          {
            id: 'item_002',
            productName: 'Myprodol 20s',
            nappiCode: '711010-001',
            scheduleClass: 2,
            quantity: 20,
            dosage: '1-2 tablets',
            frequency: 'Every 6 hours as needed',
            duration: '5 days',
            price: 10995,
          },
        ],
        status: 'verified',
        scheduleRequired: 2,
        repeatAllowed: false,
        repeatsTotal: 0,
        repeatsRemaining: 0,
        issueDate: '2024-01-16',
        expiryDate: '2024-02-16',
        verifiedBy: 'Pharmacist Jane Doe',
        verifiedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      },
      {
        id: 'rx_003',
        prescriptionNumber: 'RX-2024-00003',
        patientName: 'Peter van der Merwe',
        patientId: 'ID5678901234',
        patientPhone: '+27 84 567 8901',
        doctorName: 'Dr. Lisa Naidoo',
        doctorPracticeNumber: 'MP456789',
        doctorPhone: '+27 21 555 4567',
        diagnosis: 'Diabetes Type 2',
        items: [
          {
            id: 'item_003',
            productName: 'Metformin 500mg Tablets 60s',
            nappiCode: '720050-001',
            scheduleClass: 4,
            quantity: 60,
            dosage: '500mg',
            frequency: 'Twice daily',
            duration: '30 days',
            price: 12995,
          },
          {
            id: 'item_004',
            productName: 'Glucose Test Strips 50s',
            nappiCode: '707001-002',
            scheduleClass: 0,
            quantity: 50,
            dosage: 'N/A',
            frequency: 'As needed',
            duration: 'N/A',
            price: 29995,
          },
        ],
        status: 'dispensed',
        scheduleRequired: 4,
        repeatAllowed: true,
        repeatsTotal: 6,
        repeatsRemaining: 5,
        issueDate: '2024-01-14',
        expiryDate: '2024-07-14',
        verifiedBy: 'Pharmacist Jane Doe',
        verifiedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        dispensedBy: 'Pharmacist John Smith',
        dispensedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      },
    ]

    // Apply filters
    let filtered = mockPrescriptions
    if (status) {
      filtered = filtered.filter(p => p.status === status)
    }
    if (patientId) {
      filtered = filtered.filter(p => p.patientId.includes(patientId))
    }

    // Apply pagination
    const paginated = filtered.slice(offset, offset + limit)

    return NextResponse.json({
      data: paginated,
      total: filtered.length,
      limit,
      offset,
    })
  } catch (error) {
    console.error('Error fetching prescriptions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch prescriptions' },
      { status: 500 }
    )
  }
}

// POST /api/merchant-os/pharmacy/prescriptions - Create prescription
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      patientName,
      patientId,
      patientPhone,
      doctorName,
      doctorPracticeNumber,
      doctorPhone,
      diagnosis,
      items = [],
      repeatAllowed = false,
      repeatsTotal = 0,
      notes,
    } = body

    // Validate required fields
    if (!patientName || !patientId || !doctorName) {
      return NextResponse.json(
        { error: 'Missing required fields: patientName, patientId, doctorName' },
        { status: 400 }
      )
    }

    // Generate prescription number
    const prescriptionNumber = `RX-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`

    // Determine highest schedule class from items
    const scheduleRequired = items.length > 0 
      ? Math.max(...items.map((i: any) => i.scheduleClass || 0))
      : 0

    // Calculate expiry (6 months from now by default)
    const expiryDate = new Date()
    expiryDate.setMonth(expiryDate.getMonth() + 6)

    // Create prescription object
    const prescription = {
      id: `rx_${Date.now()}`,
      prescriptionNumber,
      patientName,
      patientId,
      patientPhone,
      doctorName,
      doctorPracticeNumber,
      doctorPhone,
      diagnosis,
      items: items.map((item: any, index: number) => ({
        id: `item_${index}`,
        ...item,
      })),
      status: 'pending',
      scheduleRequired,
      repeatAllowed,
      repeatsTotal,
      repeatsRemaining: repeatsTotal,
      issueDate: new Date().toISOString().split('T')[0],
      expiryDate: expiryDate.toISOString().split('T')[0],
      notes,
      createdAt: new Date().toISOString(),
    }

    // In production, save to database
    // await db.prescription.create({ data: prescription })

    return NextResponse.json({
      success: true,
      data: prescription,
    })
  } catch (error) {
    console.error('Error creating prescription:', error)
    return NextResponse.json(
      { error: 'Failed to create prescription' },
      { status: 500 }
    )
  }
}
