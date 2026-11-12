import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { nanoid } from 'nanoid'

// GET /api/merchant-os/health/cpd - Get CPD records for a merchant
export async function GET(request: NextRequest) {
  try {
    const merchantId = request.headers.get('x-merchant-id') ||
      request.nextUrl.searchParams.get('merchantId')

    if (!merchantId) {
      return NextResponse.json({ error: 'Merchant ID required' }, { status: 400 })
    }

    // Get all HPCSA registrations for this merchant
    const registrations = await db.professionalRegistration.findMany({
      where: {
        merchantId,
        council: 'HPCSA'
      },
      include: {
        CPDActivity: true
      }
    })

    // Transform to match frontend interface
    const cpdRecords = registrations.map(reg => {
      const activities = reg.CPDActivity.map(act => ({
        id: act.id,
        title: act.title,
        type: act.type,
        category: act.category,
        points: act.points,
        date: act.date,
        provider: act.provider,
        certificateUrl: act.certificateUrl
      }))

      const earnedPoints = activities.reduce((sum, act) => sum + act.points, 0)
      const requiredPoints = reg.cpdRequired || 60
      const status = getCPDStatus(earnedPoints, requiredPoints, reg.cpdDueDate)

      return {
        id: reg.id,
        staffName: reg.professionalName,
        hpcsaNumber: reg.registrationNumber,
        cycleStart: reg.issueDate,
        cycleEnd: reg.cpdDueDate || '',
        requiredPoints,
        earnedPoints,
        activities,
        status
      }
    })

    return NextResponse.json({ records: cpdRecords })
  } catch (error) {
    console.error('Error fetching CPD records:', error)
    return NextResponse.json({ error: 'Failed to fetch CPD records' }, { status: 500 })
  }
}

// POST /api/merchant-os/health/cpd - Create a CPD activity
export async function POST(request: NextRequest) {
  try {
    const merchantId = request.headers.get('x-merchant-id') ||
      request.nextUrl.searchParams.get('merchantId')

    if (!merchantId) {
      return NextResponse.json({ error: 'Merchant ID required' }, { status: 400 })
    }

    const body = await request.json()
    const activityId = `CPD-${nanoid(8).toUpperCase()}`

    // Check if registration exists, if not create one
    let registration = await db.professionalRegistration.findFirst({
      where: {
        merchantId,
        registrationNumber: body.hpcsaNumber
      }
    })

    if (!registration) {
      registration = await db.professionalRegistration.create({
        data: {
          id: `HPCSA-${nanoid(8).toUpperCase()}`,
          merchantId,
          professionalName: body.staffName,
          council: 'HPCSA',
          registrationNumber: body.hpcsaNumber,
          registrationType: 'Dentist',
          issueDate: body.cycleStart || new Date().toISOString().split('T')[0],
          cpdRequired: 60,
          cpdDueDate: body.cycleEnd
        }
      })
    }

    // Create the CPD activity
    const activity = await db.cPDActivity.create({
      data: {
        id: activityId,
        merchantId,
        registrationId: registration.id,
        title: body.title,
        type: body.type || 'course',
        category: body.category || 'clinical',
        points: body.points || 0,
        ethicsPoints: body.ethicsPoints || 0,
        date: body.date,
        provider: body.provider,
        certificateUrl: body.certificateUrl,
        notes: body.notes
      }
    })

    return NextResponse.json({ success: true, activity })
  } catch (error) {
    console.error('Error creating CPD activity:', error)
    return NextResponse.json({ error: 'Failed to create CPD activity' }, { status: 500 })
  }
}

// Helper function to determine CPD status
function getCPDStatus(earnedPoints: number, requiredPoints: number, dueDate: string | null): string {
  if (earnedPoints >= requiredPoints) return 'compliant'

  if (dueDate) {
    const due = new Date(dueDate)
    const now = new Date()
    const daysUntilDue = Math.floor((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (daysUntilDue < 0) return 'non_compliant'
    if (daysUntilDue <= 180 && earnedPoints < requiredPoints * 0.8) return 'at_risk'
  }

  if (earnedPoints < requiredPoints * 0.8) return 'at_risk'
  return 'compliant'
}
