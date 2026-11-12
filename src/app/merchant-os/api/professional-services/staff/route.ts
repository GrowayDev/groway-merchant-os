import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET: List all professional staff with their registrations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const practiceId = searchParams.get('practiceId')
    const status = searchParams.get('status')
    const council = searchParams.get('council')

    const where: Record<string, unknown> = {}
    
    if (practiceId) {
      where.practiceId = practiceId
    }
    if (status) {
      where.status = status
    }
    if (council) {
      where.council = council
    }

    const staff = await db.professionalStaff.findMany({
      where,
      include: {
        practice: {
          select: {
            id: true,
            name: true,
            council: true,
          }
        },
        professionalRegistrations: {
          include: {
            certificates: true,
            renewals: {
              orderBy: { renewalYear: 'desc' },
              take: 1
            }
          },
          orderBy: { expiryDate: 'asc' }
        },
        cpdRecords: {
          select: {
            id: true,
            points: true,
            date: true,
            verified: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Calculate registration status for each staff member
    const staffWithStatus = staff.map(member => {
      const now = new Date()
      const thirtyDaysFromNow = new Date()
      thirtyDaysFromNow.setDate(now.getDate() + 30)

      // Find primary registration (the one matching their council)
      const primaryRegistration = member.professionalRegistrations.find(
        r => r.council === member.council
      ) || member.professionalRegistrations[0]

      let registrationStatus = 'unknown'
      let daysUntilExpiry = null

      if (primaryRegistration) {
        const expiryDate = new Date(primaryRegistration.expiryDate)
        daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

        if (expiryDate < now) {
          registrationStatus = 'expired'
        } else if (expiryDate < thirtyDaysFromNow) {
          registrationStatus = 'expiring_soon'
        } else {
          registrationStatus = 'valid'
        }
      }

      // Calculate CPD progress
      const currentYear = new Date().getFullYear()
      const yearCPD = member.cpdRecords.filter(r => 
        new Date(r.date).getFullYear() === currentYear
      )
      const totalPoints = yearCPD.reduce((sum, r) => sum + (r.points || 0), 0)
      const verifiedPoints = yearCPD.filter(r => r.verified).reduce((sum, r) => sum + (r.points || 0), 0)

      // CPD requirements by council
      const cpdRequirements: Record<string, number> = {
        'HPCSA': 30,
        'ECSA': 25,
        'SAICA': 40,
        'LPC': 5,
        'SANC': 30,
        'SAPC': 40,
      }
      const requiredPoints = cpdRequirements[member.council] || 30
      const cpdProgress = Math.min(100, Math.round((totalPoints / requiredPoints) * 100))

      return {
        ...member,
        registrationStatus,
        daysUntilExpiry,
        cpdProgress,
        cpdPoints: totalPoints,
        cpdVerifiedPoints: verifiedPoints,
        cpdRequired: requiredPoints,
        primaryRegistration,
      }
    })

    return NextResponse.json({
      success: true,
      data: staffWithStatus,
      count: staffWithStatus.length
    })
  } catch (error) {
    console.error('Error fetching staff:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch staff' },
      { status: 500 }
    )
  }
}

// POST: Create new professional staff member
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    const requiredFields = ['practiceId', 'firstName', 'lastName', 'email', 'council', 'registrationNumber']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
    }

    // Check if registration number already exists
    const existingStaff = await db.professionalStaff.findUnique({
      where: { registrationNumber: body.registrationNumber }
    })

    if (existingStaff) {
      return NextResponse.json(
        { success: false, error: 'Registration number already exists' },
        { status: 400 }
      )
    }

    // Create the staff member
    const staff = await db.professionalStaff.create({
      data: {
        practiceId: body.practiceId,
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        phone: body.phone || null,
        idNumber: body.idNumber || null,
        council: body.council,
        registrationNumber: body.registrationNumber,
        registrationCategory: body.registrationCategory || null,
        scopeOfPractice: body.scopeOfPractice || null,
        registrationDate: body.registrationDate ? new Date(body.registrationDate) : null,
        registrationExpiry: body.registrationExpiry ? new Date(body.registrationExpiry) : null,
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

    // Optionally create initial registration record
    if (body.createRegistration && body.registrationExpiry) {
      await db.professionalRegistration.create({
        data: {
          staffId: staff.id,
          council: body.council,
          registrationNumber: body.registrationNumber,
          category: body.registrationCategory || 'General',
          scopeOfPractice: body.scopeOfPractice || null,
          registrationDate: body.registrationDate ? new Date(body.registrationDate) : new Date(),
          expiryDate: new Date(body.registrationExpiry),
          status: 'active',
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: staff,
      message: 'Staff member created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating staff:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create staff member' },
      { status: 500 }
    )
  }
}
