import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { randomUUID } from 'crypto'

// GET /api/merchant-os/health/cpd - Fetch CPD records with activities
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const merchantId = searchParams.get('merchantId') || 'merchant-001'
    const registrationId = searchParams.get('registrationId')
    const status = searchParams.get('status')

    // Get all HPCSA registrations for this merchant
    const registrations = await db.professionalRegistration.findMany({
      where: { 
        merchantId,
        council: 'HPCSA'
      },
      orderBy: { professionalName: 'asc' }
    })

    // Get all CPD activities for this merchant
    const activitiesWhere: any = { merchantId }
    if (registrationId) {
      activitiesWhere.registrationId = registrationId
    }

    const activities = await db.cPDActivity.findMany({
      where: activitiesWhere,
      orderBy: { date: 'desc' }
    })

    // Build CPD records with activities
    const cpdRecords = registrations.map(reg => {
      const regActivities = activities.filter(a => a.registrationId === reg.id)
      const earnedPoints = regActivities.reduce((sum, a) => sum + a.points, 0)
      const ethicsPoints = regActivities.reduce((sum, a) => sum + a.ethicsPoints, 0)
      const requiredPoints = reg.cpdRequired || 60
      
      // Determine status based on progress
      let cpdStatus: 'compliant' | 'at_risk' | 'non_compliant' = 'non_compliant'
      const progress = earnedPoints / requiredPoints
      if (progress >= 1) {
        cpdStatus = 'compliant'
      } else if (progress >= 0.7) {
        cpdStatus = 'at_risk'
      }

      // Check for status filter
      if (status && status !== 'all' && cpdStatus !== status) {
        return null
      }

      return {
        id: reg.id,
        staffName: reg.professionalName,
        hpcsaNumber: reg.registrationNumber,
        cycleStart: reg.cpdDueDate ? reg.cpdDueDate.substring(0, 4) + '-01-01' : new Date().getFullYear() - 1 + '-01-01',
        cycleEnd: reg.cpdDueDate || new Date().getFullYear() + 1 + '-12-31',
        requiredPoints,
        earnedPoints,
        ethicsPoints,
        activities: regActivities.map(a => ({
          id: a.id,
          title: a.title,
          type: a.type,
          category: a.category,
          points: a.points,
          ethicsPoints: a.ethicsPoints,
          date: a.date,
          provider: a.provider,
          certificateUrl: a.certificateUrl
        })),
        status: cpdStatus
      }
    }).filter(Boolean)

    return NextResponse.json({
      success: true,
      data: cpdRecords,
      count: cpdRecords.length
    })
  } catch (error) {
    console.error('Error fetching CPD records:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch CPD records' },
      { status: 500 }
    )
  }
}

// POST /api/merchant-os/health/cpd - Add CPD activity
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      merchantId = 'merchant-001',
      registrationId,
      title,
      type,
      category,
      points,
      ethicsPoints = 0,
      date,
      provider,
      certificateUrl,
      notes
    } = body

    // Validate required fields
    if (!registrationId || !title || !type || !category || points === undefined || !date || !provider) {
      return NextResponse.json(
        { success: false, error: 'Registration ID, title, type, category, points, date, and provider are required' },
        { status: 400 }
      )
    }

    // Verify the registration exists and belongs to this merchant
    const registration = await db.professionalRegistration.findFirst({
      where: { 
        id: registrationId,
        merchantId,
        council: 'HPCSA'
      }
    })

    if (!registration) {
      return NextResponse.json(
        { success: false, error: 'Registration not found' },
        { status: 404 }
      )
    }

    // Create CPD activity
    const activity = await db.cPDActivity.create({
      data: {
        id: randomUUID(),
        merchantId,
        registrationId,
        title,
        type,
        category,
        points: parseFloat(points),
        ethicsPoints: parseFloat(ethicsPoints),
        date,
        provider,
        certificateUrl: certificateUrl || null,
        notes: notes || null,
        updatedAt: new Date()
      }
    })

    // Update the registration's CPD points
    const allActivities = await db.cPDActivity.findMany({
      where: { registrationId }
    })
    const totalPoints = allActivities.reduce((sum, a) => sum + a.points, 0)

    await db.professionalRegistration.update({
      where: { id: registrationId },
      data: { 
        cpdPoints: totalPoints,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        id: activity.id,
        title: activity.title,
        type: activity.type,
        category: activity.category,
        points: activity.points,
        ethicsPoints: activity.ethicsPoints,
        date: activity.date,
        provider: activity.provider,
        certificateUrl: activity.certificateUrl
      },
      message: 'CPD activity added successfully'
    })
  } catch (error) {
    console.error('Error adding CPD activity:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to add CPD activity' },
      { status: 500 }
    )
  }
}
