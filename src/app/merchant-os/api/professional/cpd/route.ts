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

// GET /api/merchant-os/professional/cpd - Get CPD records with activities for merchant
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period')
    const council = searchParams.get('council')

    const where: any = {
      merchantId: session.merchantId,
    }

    if (council && council !== 'all') {
      where.council = council
    }

    // Get professional registrations with their CPD activities
    const registrations = await db.professionalRegistration.findMany({
      where,
      include: {
        _count: {
          select: { CPDActivity: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Get CPD activities for the period if specified
    let activitiesFilter: any = {
      merchantId: session.merchantId,
    }

    if (period) {
      const year = parseInt(period)
      const startDate = `${year}-01-01`
      const endDate = `${year}-12-31`
      activitiesFilter.date = {
        gte: startDate,
        lte: endDate,
      }
    }

    // Get all CPD activities for the merchant
    const allActivities = await db.cPDActivity.findMany({
      where: activitiesFilter,
      orderBy: { date: 'desc' },
    })

    // Group activities by registration
    const recordsWithActivities = registrations.map(reg => {
      const registrationActivities = allActivities.filter(a => a.registrationId === reg.id)
      
      // Calculate total points from activities
      const totalPoints = registrationActivities.reduce((sum, a) => sum + a.points, 0)
      const ethicsPoints = registrationActivities.reduce((sum, a) => sum + a.ethicsPoints, 0)
      
      // Use stored values or calculated ones
      const cpdPoints = reg.cpdPoints || totalPoints
      const requiredPoints = reg.cpdRequired || 0

      return {
        id: reg.id,
        staffName: reg.professionalName,
        staffId: reg.staffId,
        professionalBody: reg.council,
        membershipNumber: reg.registrationNumber,
        cpdPoints,
        requiredPoints,
        period: period || new Date().getFullYear().toString(),
        status: reg.status,
        cpdDueDate: reg.cpdDueDate,
        activities: registrationActivities.map(a => ({
          id: a.id,
          title: a.title,
          type: a.type,
          category: a.category,
          points: a.points,
          ethicsPoints: a.ethicsPoints,
          date: a.date,
          provider: a.provider,
          certificateUrl: a.certificateUrl,
        })),
        totalActivities: registrationActivities.length,
        isCompliant: cpdPoints >= requiredPoints,
        pointsRemaining: Math.max(0, requiredPoints - cpdPoints),
      }
    })

    // Calculate stats
    const stats = {
      totalStaff: recordsWithActivities.length,
      compliant: recordsWithActivities.filter(r => r.isCompliant).length,
      nonCompliant: recordsWithActivities.filter(r => !r.isCompliant).length,
      totalPoints: recordsWithActivities.reduce((sum, r) => sum + r.cpdPoints, 0),
      totalActivities: allActivities.length,
      byCouncil: registrations.reduce((acc: any, reg) => {
        if (!acc[reg.council]) {
          acc[reg.council] = 0
        }
        acc[reg.council]++
        return acc
      }, {}),
    }

    return NextResponse.json({
      success: true,
      records: recordsWithActivities,
      stats,
    })
  } catch (error) {
    console.error('Get CPD records error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch CPD records' },
      { status: 500 }
    )
  }
}

// POST /api/merchant-os/professional/cpd - Add CPD activity
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      registrationId,
      title,
      type,
      category,
      points,
      ethicsPoints = 0,
      date,
      provider,
      certificateUrl,
      notes,
      // For creating new registration if needed
      staffName,
      staffId,
      professionalBody,
      membershipNumber,
      requiredPoints,
    } = body

    let targetRegistrationId = registrationId

    // If no registration ID provided, create a new registration
    if (!registrationId && staffName && professionalBody && membershipNumber) {
      // Check if registration already exists
      const existing = await db.professionalRegistration.findFirst({
        where: {
          merchantId: session.merchantId,
          council: professionalBody,
          registrationNumber: membershipNumber,
        },
      })

      if (existing) {
        targetRegistrationId = existing.id
      } else {
        // Create new registration
        const newId = `reg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const newRegistration = await db.professionalRegistration.create({
          data: {
            id: newId,
            merchantId: session.merchantId,
            staffId,
            professionalName: staffName,
            council: professionalBody,
            registrationNumber: membershipNumber,
            registrationType: 'practitioner',
            issueDate: new Date().toISOString().split('T')[0],
            status: 'active',
            cpdRequired: requiredPoints ? parseFloat(requiredPoints) : null,
          },
        })
        targetRegistrationId = newRegistration.id
      }
    }

    if (!targetRegistrationId) {
      return NextResponse.json(
        { error: 'Registration ID or staff details are required' },
        { status: 400 }
      )
    }

    // Validation for activity
    if (!title || !type || !points || !date || !provider) {
      return NextResponse.json(
        { error: 'Title, type, points, date, and provider are required' },
        { status: 400 }
      )
    }

    // Generate unique ID
    const id = `cpd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Create CPD activity
    const activity = await db.cPDActivity.create({
      data: {
        id,
        merchantId: session.merchantId,
        registrationId: targetRegistrationId,
        title,
        type,
        category: category || 'general',
        points: parseFloat(points),
        ethicsPoints: parseFloat(ethicsPoints) || 0,
        date,
        provider,
        certificateUrl,
        notes,
      },
    })

    // Update the registration's total CPD points
    const allActivities = await db.cPDActivity.findMany({
      where: {
        merchantId: session.merchantId,
        registrationId: targetRegistrationId,
      },
    })

    const totalPoints = allActivities.reduce((sum, a) => sum + a.points, 0)

    await db.professionalRegistration.update({
      where: { id: targetRegistrationId },
      data: { cpdPoints: totalPoints },
    })

    return NextResponse.json({
      success: true,
      activity,
    })
  } catch (error) {
    console.error('Create CPD activity error:', error)
    return NextResponse.json(
      { error: 'Failed to create CPD activity' },
      { status: 500 }
    )
  }
}
