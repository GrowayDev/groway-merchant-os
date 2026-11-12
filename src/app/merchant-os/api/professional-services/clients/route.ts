import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET: List clients with matter counts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const practiceId = searchParams.get('practiceId')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    const where: Record<string, unknown> = {}

    if (practiceId) {
      where.practiceId = practiceId
    }
    if (status) {
      where.status = status
    }
    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { companyName: { contains: search } },
        { clientNumber: { contains: search } },
        { email: { contains: search } },
      ]
    }

    const clients = await db.professionalClient.findMany({
      where,
      include: {
        practice: {
          select: {
            id: true,
            name: true,
            council: true,
          }
        },
        matters: {
          select: {
            id: true,
            matterNumber: true,
            matterType: true,
            status: true,
            billableHours: true,
            feesBilled: true,
            feesPaid: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Calculate matter counts and summaries for each client
    const clientsWithStats = clients.map(client => {
      const openMatters = client.matters.filter(m => m.status === 'open')
      const closedMatters = client.matters.filter(m => m.status === 'closed')
      const totalBillableHours = client.matters.reduce((sum, m) => sum + m.billableHours, 0)
      const totalFeesBilled = client.matters.reduce((sum, m) => sum + m.feesBilled, 0)
      const totalFeesPaid = client.matters.reduce((sum, m) => sum + m.feesPaid, 0)
      const outstandingFees = totalFeesBilled - totalFeesPaid

      return {
        ...client,
        matterCount: client.matters.length,
        openMatterCount: openMatters.length,
        closedMatterCount: closedMatters.length,
        totalBillableHours,
        totalFeesBilled,
        totalFeesPaid,
        outstandingFees,
        displayName: client.companyName || `${client.firstName} ${client.lastName}`,
      }
    })

    return NextResponse.json({
      success: true,
      data: clientsWithStats,
      count: clientsWithStats.length
    })
  } catch (error) {
    console.error('Error fetching clients:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch clients' },
      { status: 500 }
    )
  }
}

// POST: Create new client
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.practiceId) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: practiceId' },
        { status: 400 }
      )
    }

    // Must have either individual or company details
    if (!body.companyName && !body.firstName) {
      return NextResponse.json(
        { success: false, error: 'Either companyName or firstName is required' },
        { status: 400 }
      )
    }

    // Verify practice exists
    const practice = await db.professionalPractice.findUnique({
      where: { id: body.practiceId }
    })

    if (!practice) {
      return NextResponse.json(
        { success: false, error: 'Practice not found' },
        { status: 404 }
      )
    }

    // Generate client number if not provided
    let clientNumber = body.clientNumber
    if (!clientNumber) {
      const clientCount = await db.professionalClient.count({
        where: { practiceId: body.practiceId }
      })
      clientNumber = `CLI-${String(clientCount + 1).padStart(5, '0')}`
    }

    // Check if client number already exists
    const existingClient = await db.professionalClient.findUnique({
      where: { clientNumber }
    })

    if (existingClient) {
      return NextResponse.json(
        { success: false, error: 'Client number already exists' },
        { status: 400 }
      )
    }

    // Create the client
    const client = await db.professionalClient.create({
      data: {
        practiceId: body.practiceId,
        clientNumber,
        firstName: body.firstName || null,
        lastName: body.lastName || null,
        companyName: body.companyName || null,
        contactPerson: body.contactPerson || null,
        email: body.email || null,
        phone: body.phone || null,
        address: body.address || null,
        idNumber: body.idNumber || null,
        registrationNumber: body.registrationNumber || null,
        vatNumber: body.vatNumber || null,
        notes: body.notes || null,
        trustBalance: body.trustBalance || 0,
        status: body.status || 'active',
      },
      include: {
        practice: {
          select: {
            id: true,
            name: true,
            council: true,
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: client,
      message: 'Client created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating client:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create client' },
      { status: 500 }
    )
  }
}
