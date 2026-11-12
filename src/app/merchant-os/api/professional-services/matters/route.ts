import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET: List matters with client info
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const practiceId = searchParams.get('practiceId')
    const clientId = searchParams.get('clientId')
    const status = searchParams.get('status')
    const matterType = searchParams.get('matterType')
    const responsibleStaffId = searchParams.get('responsibleStaffId')

    const where: Record<string, unknown> = {}

    if (practiceId) {
      where.practiceId = practiceId
    }
    if (clientId) {
      where.clientId = clientId
    }
    if (status) {
      where.status = status
    }
    if (matterType) {
      where.matterType = matterType
    }
    if (responsibleStaffId) {
      where.responsibleStaffId = responsibleStaffId
    }

    const matters = await db.professionalMatter.findMany({
      where,
      include: {
        practice: {
          select: {
            id: true,
            name: true,
            council: true,
          }
        },
        client: {
          select: {
            id: true,
            clientNumber: true,
            firstName: true,
            lastName: true,
            companyName: true,
            email: true,
            phone: true,
            trustBalance: true,
          }
        }
      },
      orderBy: { openedDate: 'desc' }
    })

    // Add computed fields
    const mattersWithStats = matters.map(matter => {
      const outstandingFees = matter.feesBilled - matter.feesPaid
      const daysOpen = matter.closedDate
        ? Math.ceil((new Date(matter.closedDate).getTime() - new Date(matter.openedDate).getTime()) / (1000 * 60 * 60 * 24))
        : Math.ceil((new Date().getTime() - new Date(matter.openedDate).getTime()) / (1000 * 60 * 60 * 24))

      return {
        ...matter,
        clientDisplayName: matter.client.companyName || 
          `${matter.client.firstName || ''} ${matter.client.lastName || ''}`.trim(),
        outstandingFees,
        daysOpen,
        isBillable: matter.billableHours > 0,
      }
    })

    return NextResponse.json({
      success: true,
      data: mattersWithStats,
      count: mattersWithStats.length
    })
  } catch (error) {
    console.error('Error fetching matters:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch matters' },
      { status: 500 }
    )
  }
}

// POST: Create new matter
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    const requiredFields = ['practiceId', 'clientId', 'matterType']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
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

    // Verify client exists and belongs to practice
    const client = await db.professionalClient.findFirst({
      where: {
        id: body.clientId,
        practiceId: body.practiceId
      }
    })

    if (!client) {
      return NextResponse.json(
        { success: false, error: 'Client not found or does not belong to this practice' },
        { status: 404 }
      )
    }

    // Generate matter number if not provided
    let matterNumber = body.matterNumber
    if (!matterNumber) {
      const matterCount = await db.professionalMatter.count({
        where: { practiceId: body.practiceId }
      })
      const year = new Date().getFullYear()
      matterNumber = `MAT-${year}-${String(matterCount + 1).padStart(5, '0')}`
    }

    // Check if matter number already exists
    const existingMatter = await db.professionalMatter.findUnique({
      where: { matterNumber }
    })

    if (existingMatter) {
      return NextResponse.json(
        { success: false, error: 'Matter number already exists' },
        { status: 400 }
      )
    }

    // Create the matter
    const matter = await db.professionalMatter.create({
      data: {
        practiceId: body.practiceId,
        clientId: body.clientId,
        matterNumber,
        matterType: body.matterType,
        description: body.description || null,
        responsibleStaffId: body.responsibleStaffId || null,
        status: body.status || 'open',
        openedDate: body.openedDate ? new Date(body.openedDate) : new Date(),
        closedDate: body.closedDate ? new Date(body.closedDate) : null,
        billableHours: body.billableHours || 0,
        feesBilled: body.feesBilled || 0,
        feesPaid: body.feesPaid || 0,
        notes: body.notes || null,
      },
      include: {
        practice: {
          select: {
            id: true,
            name: true,
            council: true,
          }
        },
        client: {
          select: {
            id: true,
            clientNumber: true,
            firstName: true,
            lastName: true,
            companyName: true,
            email: true,
            phone: true,
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: matter,
      message: 'Matter created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating matter:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create matter' },
      { status: 500 }
    )
  }
}
