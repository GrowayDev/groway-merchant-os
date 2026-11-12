import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { nanoid } from 'nanoid'

// South African Excise Duty Rates (2024/2025)
// Spirits: R108.71 per liter absolute alcohol
// Wine: R4.96 per liter
// Beer: R2.33 per liter
// Ciders: R2.33 per liter

// GET - List age verifications
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const flagged = searchParams.get('flagged')
    const today = searchParams.get('today')
    
    const where: Record<string, unknown> = {}
    if (flagged === 'true') where.flagged = true
    
    // Filter for today's verifications
    if (today === 'true') {
      const todayDate = new Date().toISOString().split('T')[0]
      where.createdAt = {
        gte: new Date(todayDate + 'T00:00:00.000Z'),
        lte: new Date(todayDate + 'T23:59:59.999Z')
      }
    }
    
    const verifications = await db.ageVerification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    })
    
    const total = await db.ageVerification.count({ where })
    
    // Calculate stats for today
    const todayDate = new Date().toISOString().split('T')[0]
    const todayStats = await db.ageVerification.aggregate({
      where: {
        createdAt: {
          gte: new Date(todayDate + 'T00:00:00.000Z'),
          lte: new Date(todayDate + 'T23:59:59.999Z')
        }
      },
      _count: { id: true },
      _sum: { confidence: true }
    })
    
    const flaggedToday = await db.ageVerification.count({
      where: {
        flagged: true,
        createdAt: {
          gte: new Date(todayDate + 'T00:00:00.000Z'),
          lte: new Date(todayDate + 'T23:59:59.999Z')
        }
      }
    })
    
    return NextResponse.json({
      success: true,
      data: verifications,
      pagination: { total, limit, offset },
      stats: {
        todayCount: todayStats._count.id,
        flaggedToday,
        avgConfidence: todayStats._count.id > 0 
          ? (todayStats._sum.confidence || 0) / todayStats._count.id 
          : 0
      }
    })
  } catch (error) {
    console.error('Error fetching age verifications:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch age verifications' },
      { status: 500 }
    )
  }
}

// POST - Log age verification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.dateOfBirth) {
      return NextResponse.json(
        { success: false, error: 'Date of birth is required' },
        { status: 400 }
      )
    }
    
    // Calculate age
    const dob = new Date(body.dateOfBirth)
    const today = new Date()
    let age = today.getFullYear() - dob.getFullYear()
    const monthDiff = today.getMonth() - dob.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--
    }
    
    const isAdult = age >= 18 // South African legal drinking age
    
    const verification = await db.ageVerification.create({
      data: {
        verificationId: `AV-${Date.now()}-${nanoid(6)}`,
        documentType: body.documentType || 'id_card', // SA ID, Passport, Driver's License
        documentNumber: body.documentNumber,
        customerName: body.customerName,
        dateOfBirth: body.dateOfBirth,
        ageVerified: isAdult,
        verificationMethod: body.verificationMethod || 'manual', // manual, scanner, app
        verifiedBy: body.verifiedBy,
        verifiedByName: body.verifiedByName,
        imageUrl: body.imageUrl,
        confidence: body.confidence, // AI confidence score
        productId: body.productId,
        productName: body.productName,
        saleId: body.saleId,
        location: body.location,
        notes: body.notes,
        flagged: !isAdult || body.flagged || false,
        flagReason: !isAdult 
          ? 'Underage customer (under 18)' 
          : body.flagReason,
      },
    })
    
    return NextResponse.json({
      success: true,
      data: verification,
      ageResult: { age, isAdult }
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating age verification:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create age verification' },
      { status: 500 }
    )
  }
}
