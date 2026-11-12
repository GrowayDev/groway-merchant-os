import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { nanoid } from 'nanoid'

// GET /api/merchant-os/agriculture/livestock - Get livestock list
export async function GET(request: NextRequest) {
  try {
    const merchantId = request.headers.get('x-merchant-id') || 
                       request.nextUrl.searchParams.get('merchantId')
    const animalType = request.nextUrl.searchParams.get('animalType')
    const status = request.nextUrl.searchParams.get('status')

    if (!merchantId) {
      return NextResponse.json({ 
        livestock: [], 
        summary: [],
        message: 'No merchant ID provided' 
      })
    }

    const where: Record<string, unknown> = { merchantId }
    if (animalType) where.animalType = animalType
    if (status) where.status = status

    const livestock = await db.livestock.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100
    })

    // Get summary by animal type
    const summary = await db.livestock.groupBy({
      by: ['animalType', 'status'],
      where: { merchantId },
      _count: { id: true }
    })

    return NextResponse.json({ 
      livestock,
      summary: summary.map(s => ({
        animalType: s.animalType,
        status: s.status,
        _count: { id: s._count.id }
      }))
    })
  } catch (error) {
    console.error('Error fetching livestock:', error)
    return NextResponse.json({ livestock: [], summary: [] })
  }
}

// POST /api/merchant-os/agriculture/livestock - Register new animal
export async function POST(request: NextRequest) {
  try {
    const merchantId = request.headers.get('x-merchant-id') ||
                       request.nextUrl.searchParams.get('merchantId')

    if (!merchantId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Merchant ID required' 
      }, { status: 400 })
    }

    const body = await request.json()
    const animalId = `ANM-${nanoid(8).toUpperCase()}`

    const livestock = await db.livestock.create({
      data: {
        id: animalId,
        merchantId,
        animalType: body.animalType || 'cattle',
        breed: body.breed,
        gender: body.gender || 'female',
        dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
        identificationNumber: body.identificationNumber || animalId,
        status: 'active',
        purpose: body.purpose,
        weightBirth: body.weightBirth ? parseFloat(body.weightBirth) : null,
        weightCurrent: body.weightBirth ? parseFloat(body.weightBirth) : null,
        location: body.location,
        healthStatus: 'healthy',
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ success: true, livestock })
  } catch (error) {
    console.error('Error registering livestock:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to register animal',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
