import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// In-memory store for demo (in production, use database)
let controlledRegister: any[] = []
let runningBalances: Record<string, number> = {}
let entryCounter = 1000

// GET /api/merchant-os/pharmacy/controlled-register - List controlled substance entries
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const schedule = searchParams.get('schedule')
    const entryType = searchParams.get('entryType')
    const nappiCode = searchParams.get('nappiCode')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Generate mock data if empty
    if (controlledRegister.length === 0) {
      const mockEntries = [
        {
          id: 'entry_001',
          entryNumber: 'CSR-2024-001001',
          entryType: 'receipt',
          date: new Date().toISOString().split('T')[0],
          time: '08:30:00',
          productName: 'Morphine Sulphate 10mg/ml Injection',
          nappiCode: '730001-001',
          scheduleClass: 6,
          batchNumber: 'MOR2024A',
          expiryDate: '2025-12-31',
          prescriptionNumber: null,
          patientId: null,
          patientName: null,
          quantityIn: 100,
          quantityOut: 0,
          runningBalance: 100,
          pharmacistName: 'Dr. Jane Smith',
          pharmacistSapcNumber: 'SAPC-123456',
          notes: 'Stock received from supplier',
          createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'entry_002',
          entryNumber: 'CSR-2024-001002',
          entryType: 'dispensing',
          date: new Date().toISOString().split('T')[0],
          time: '10:15:00',
          productName: 'Morphine Sulphate 10mg/ml Injection',
          nappiCode: '730001-001',
          scheduleClass: 6,
          batchNumber: 'MOR2024A',
          expiryDate: '2025-12-31',
          prescriptionNumber: 'RX-2024-00050',
          patientId: 'ID555123456',
          patientName: 'Patient A (Confidential)',
          quantityIn: 0,
          quantityOut: 5,
          runningBalance: 95,
          pharmacistName: 'Dr. Jane Smith',
          pharmacistSapcNumber: 'SAPC-123456',
          notes: 'Post-operative pain management',
          createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'entry_003',
          entryNumber: 'CSR-2024-001003',
          entryType: 'receipt',
          date: new Date().toISOString().split('T')[0],
          time: '11:00:00',
          productName: 'Pethidine 50mg/ml Injection',
          nappiCode: '730002-001',
          scheduleClass: 6,
          batchNumber: 'PET2024B',
          expiryDate: '2025-06-30',
          prescriptionNumber: null,
          patientId: null,
          patientName: null,
          quantityIn: 50,
          quantityOut: 0,
          runningBalance: 50,
          pharmacistName: 'Dr. Jane Smith',
          pharmacistSapcNumber: 'SAPC-123456',
          notes: 'Emergency stock replenishment',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'entry_004',
          entryNumber: 'CSR-2024-001004',
          entryType: 'dispensing',
          date: new Date().toISOString().split('T')[0],
          time: '14:30:00',
          productName: 'Myprodol 20s',
          nappiCode: '711010-001',
          scheduleClass: 2,
          batchNumber: 'MYP2024C',
          expiryDate: '2026-01-31',
          prescriptionNumber: 'RX-2024-00052',
          patientId: 'ID789456123',
          patientName: 'Patient B',
          quantityIn: 0,
          quantityOut: 1,
          runningBalance: 49,
          pharmacistName: 'Dr. John Doe',
          pharmacistSapcNumber: 'SAPC-789012',
          notes: '',
          createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        },
      ]
      controlledRegister = mockEntries
      
      // Set running balances
      runningBalances['730001-001'] = 95
      runningBalances['730002-001'] = 50
      runningBalances['711010-001'] = 49
    }

    // Apply filters
    let filtered = controlledRegister
    if (schedule) {
      filtered = filtered.filter(e => e.scheduleClass === parseInt(schedule))
    }
    if (entryType) {
      filtered = filtered.filter(e => e.entryType === entryType)
    }
    if (nappiCode) {
      filtered = filtered.filter(e => e.nappiCode === nappiCode)
    }

    // Sort by date/time descending
    filtered.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    // Apply pagination
    const paginated = filtered.slice(offset, offset + limit)

    return NextResponse.json({
      data: paginated,
      total: filtered.length,
      limit,
      offset,
    })
  } catch (error) {
    console.error('Error fetching controlled register:', error)
    return NextResponse.json(
      { error: 'Failed to fetch controlled register' },
      { status: 500 }
    )
  }
}

// POST /api/merchant-os/pharmacy/controlled-register - Log controlled substance movement
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      entryType,
      productName,
      nappiCode,
      scheduleClass,
      batchNumber,
      expiryDate,
      prescriptionNumber,
      patientId,
      patientName,
      quantityIn,
      quantityOut,
      notes,
    } = body

    // Validate required fields
    if (!productName || !nappiCode) {
      return NextResponse.json(
        { error: 'Missing required fields: productName, nappiCode' },
        { status: 400 }
      )
    }

    // Validate Schedule 5-6 requirements
    if (scheduleClass >= 5 && entryType === 'dispensing') {
      if (!prescriptionNumber || !patientId) {
        return NextResponse.json(
          { error: 'Schedule 5-6 dispensing requires prescription number and patient ID' },
          { status: 400 }
        )
      }
    }

    // Get or initialize running balance
    if (!runningBalances[nappiCode]) {
      runningBalances[nappiCode] = 0
    }

    // Update running balance
    const netChange = (quantityIn || 0) - (quantityOut || 0)
    runningBalances[nappiCode] += netChange

    // Generate entry number
    entryCounter++
    const entryNumber = `CSR-${new Date().getFullYear()}-${String(entryCounter).padStart(6, '0')}`

    // Get current pharmacist on duty (mock)
    const currentPharmacist = {
      name: 'Dr. Jane Smith',
      sapcNumber: 'SAPC-123456',
    }

    // Create entry
    const entry = {
      id: `entry_${Date.now()}`,
      entryNumber,
      entryType,
      date: body.date || new Date().toISOString().split('T')[0],
      time: body.time || new Date().toTimeString().split(' ')[0],
      productName,
      nappiCode,
      scheduleClass: scheduleClass || 5,
      batchNumber,
      expiryDate,
      prescriptionNumber: entryType === 'dispensing' ? prescriptionNumber : null,
      patientId: entryType === 'dispensing' ? patientId : null,
      patientName: entryType === 'dispensing' ? patientName : null,
      quantityIn: quantityIn || 0,
      quantityOut: quantityOut || 0,
      runningBalance: runningBalances[nappiCode],
      pharmacistName: currentPharmacist.name,
      pharmacistSapcNumber: currentPharmacist.sapcNumber,
      notes,
      createdAt: new Date().toISOString(),
    }

    // Add to register
    controlledRegister.unshift(entry)

    // In production, save to database
    // await db.controlledSubstanceEntry.create({ data: entry })

    return NextResponse.json({
      success: true,
      data: entry,
    })
  } catch (error) {
    console.error('Error logging controlled substance entry:', error)
    return NextResponse.json(
      { error: 'Failed to log entry' },
      { status: 500 }
    )
  }
}
