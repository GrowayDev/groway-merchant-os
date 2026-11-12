import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Helper to get session
async function getSession(request: NextRequest) {
  const sessionToken = request.cookies.get('groway_session')?.value
  if (!sessionToken) return null
  
  try {
    return await db.merchantSession.findFirst({
      where: { 
        token: sessionToken,
        expiresAt: { gt: new Date() }
      },
      include: { user: true, merchant: true },
    })
  } catch {
    return null
  }
}

// GET /api/merchant-os/professional/fica - Get FICA records for merchant
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const clientType = searchParams.get('clientType')
    const search = searchParams.get('search')

    const where: any = {
      merchantId: session.merchantId,
    }

    if (status && status !== 'all') {
      where.status = status
    }

    if (clientType && clientType !== 'all') {
      where.clientType = clientType
    }

    if (search) {
      where.OR = [
        { clientName: { contains: search } },
        { clientIdNumber: { contains: search } },
        { documentNumber: { contains: search } },
      ]
    }

    const ficaRecords = await db.fICARecord.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    // Calculate stats
    const stats = {
      total: ficaRecords.length,
      pending: ficaRecords.filter(r => r.status === 'pending').length,
      verified: ficaRecords.filter(r => r.status === 'verified').length,
      rejected: ficaRecords.filter(r => r.status === 'rejected').length,
      expired: ficaRecords.filter(r => r.status === 'expired').length,
      individuals: ficaRecords.filter(r => r.clientType === 'individual').length,
      companies: ficaRecords.filter(r => r.clientType === 'company').length,
    }

    return NextResponse.json({
      success: true,
      records: ficaRecords,
      stats,
    })
  } catch (error) {
    console.error('Get FICA records error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch FICA records' },
      { status: 500 }
    )
  }
}

// POST /api/merchant-os/professional/fica - Create new FICA verification
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      clientName,
      clientIdNumber,
      clientType,
      documentType,
      documentNumber,
      verifiedBy,
      verificationDate,
      status = 'pending',
      expiryDate,
      riskRating,
      pepStatus = false,
      sanctionsChecked = false,
      notes,
      documentUrl,
    } = body

    // Validation
    if (!clientName || !clientIdNumber || !clientType || !documentType || !documentNumber) {
      return NextResponse.json(
        { error: 'Client name, ID number, client type, document type, and document number are required' },
        { status: 400 }
      )
    }

    // Check for duplicate client ID
    const existing = await db.fICARecord.findFirst({
      where: {
        merchantId: session.merchantId,
        clientIdNumber,
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'A FICA record for this client ID already exists' },
        { status: 400 }
      )
    }

    // Generate unique ID
    const id = `fica_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Create FICA record
    const ficaRecord = await db.fICARecord.create({
      data: {
        id,
        merchantId: session.merchantId,
        clientName,
        clientIdNumber,
        clientType,
        documentType,
        documentNumber,
        verifiedBy: verifiedBy || session.user.id,
        verifiedByName: session.user.name,
        verificationDate: verificationDate || new Date().toISOString().split('T')[0],
        status,
        expiryDate,
        riskRating,
        pepStatus,
        sanctionsChecked,
        notes,
        documentUrl,
      },
    })

    return NextResponse.json({
      success: true,
      record: ficaRecord,
    })
  } catch (error) {
    console.error('Create FICA record error:', error)
    return NextResponse.json(
      { error: 'Failed to create FICA record' },
      { status: 500 }
    )
  }
}
