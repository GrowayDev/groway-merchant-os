import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// CPD requirements by council
const CPD_REQUIREMENTS: Record<string, { points: number; period: string; description: string }> = {
  'HPCSA': { points: 30, period: 'yearly', description: '30 CEU per calendar year' },
  'ECSA': { points: 25, period: '3-years', description: '25 points over 3 years' },
  'SAICA': { points: 120, period: '3-years', description: '120 hours over 3 years' },
  'LPC': { points: 5, period: 'yearly', description: '5 points per year' },
  'SANC': { points: 30, period: 'yearly', description: '30 CEU per calendar year' },
  'SAPC': { points: 40, period: 'yearly', description: '40 CEU per calendar year' },
}

// GET: List CPD records with staffId filter
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const staffId = searchParams.get('staffId')
    const year = searchParams.get('year')
    const verified = searchParams.get('verified')
    const category = searchParams.get('category')

    const where: Record<string, unknown> = {}

    if (staffId) {
      where.staffId = staffId
    }
    if (year) {
      const startDate = new Date(`${year}-01-01`)
      const endDate = new Date(`${year}-12-31`)
      where.date = {
        gte: startDate,
        lte: endDate
      }
    }
    if (verified !== null) {
      where.verified = verified === 'true'
    }
    if (category) {
      where.category = category
    }

    const cpdRecords = await db.cPDRecord.findMany({
      where,
      include: {
        staff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            council: true,
            registrationNumber: true,
            practice: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        }
      },
      orderBy: { date: 'desc' }
    })

    // Calculate compliance status for each staff member represented
    const complianceStatus: Record<string, unknown> = {}
    const currentYear = new Date().getFullYear()

    if (staffId) {
      // Get staff info for compliance calculation
      const staff = await db.professionalStaff.findUnique({
        where: { id: staffId },
        include: {
          cpdRecords: {
            where: {
              date: {
                gte: new Date(`${currentYear}-01-01`),
                lte: new Date(`${currentYear}-12-31`)
              }
            }
          }
        }
      })

      if (staff) {
        const totalPoints = staff.cpdRecords.reduce((sum, r) => sum + (r.points || 0), 0)
        const verifiedPoints = staff.cpdRecords
          .filter(r => r.verified)
          .reduce((sum, r) => sum + (r.points || 0), 0)

        const requirement = CPD_REQUIREMENTS[staff.council] || CPD_REQUIREMENTS['HPCSA']
        const progress = Math.min(100, Math.round((totalPoints / requirement.points) * 100))
        const remaining = Math.max(0, requirement.points - totalPoints)

        complianceStatus[staffId] = {
          staffId: staff.id,
          staffName: `${staff.firstName} ${staff.lastName}`,
          council: staff.council,
          currentYear,
          totalPoints,
          verifiedPoints,
          requiredPoints: requirement.points,
          progress,
          remaining,
          isCompliant: totalPoints >= requirement.points,
          requirementDescription: requirement.description,
          recordsCount: staff.cpdRecords.length,
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: cpdRecords,
      count: cpdRecords.length,
      complianceStatus: Object.keys(complianceStatus).length > 0 ? complianceStatus : undefined,
      requirements: CPD_REQUIREMENTS
    })
  } catch (error) {
    console.error('Error fetching CPD records:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch CPD records' },
      { status: 500 }
    )
  }
}

// POST: Add CPD activity
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    const requiredFields = ['staffId', 'activityType', 'title', 'date', 'duration']
    for (const field of requiredFields) {
      if (body[field] === undefined || body[field] === null || body[field] === '') {
        return NextResponse.json(
          { success: false, error: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
    }

    // Verify staff exists
    const staff = await db.professionalStaff.findUnique({
      where: { id: body.staffId },
      select: { id: true, council: true }
    })

    if (!staff) {
      return NextResponse.json(
        { success: false, error: 'Staff member not found' },
        { status: 404 }
      )
    }

    // Calculate points if not provided
    let points = body.points
    if (!points && body.duration) {
      // Default: 1 point per hour of activity
      points = body.duration / 60
    }

    // Create the CPD record
    const cpdRecord = await db.cPDRecord.create({
      data: {
        staffId: body.staffId,
        activityType: body.activityType,
        title: body.title,
        description: body.description || null,
        provider: body.provider || null,
        date: new Date(body.date),
        duration: parseFloat(body.duration),
        points: points ? parseFloat(points) : null,
        category: body.category || null,
        certificateUrl: body.certificateUrl || null,
        verified: body.verified || false,
        notes: body.notes || null,
      },
      include: {
        staff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            council: true,
            registrationNumber: true,
          }
        }
      }
    })

    // Calculate updated compliance status
    const currentYear = new Date().getFullYear()
    const yearRecords = await db.cPDRecord.findMany({
      where: {
        staffId: body.staffId,
        date: {
          gte: new Date(`${currentYear}-01-01`),
          lte: new Date(`${currentYear}-12-31`)
        }
      }
    })

    const totalPoints = yearRecords.reduce((sum, r) => sum + (r.points || 0), 0)
    const requirement = CPD_REQUIREMENTS[staff.council] || CPD_REQUIREMENTS['HPCSA']
    const progress = Math.min(100, Math.round((totalPoints / requirement.points) * 100))

    const complianceResult = {
      totalPoints,
      requiredPoints: requirement.points,
      progress,
      isCompliant: totalPoints >= requirement.points,
      remaining: Math.max(0, requirement.points - totalPoints),
    }

    return NextResponse.json({
      success: true,
      data: cpdRecord,
      complianceStatus: complianceResult,
      message: 'CPD activity added successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating CPD record:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create CPD record' },
      { status: 500 }
    )
  }
}
