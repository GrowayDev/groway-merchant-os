import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { nanoid } from 'nanoid'

// POST /api/merchant-os/agriculture/livestock/movement - Record animal movement
export async function POST(request: NextRequest) {
  try {
    const merchantId = request.nextUrl.searchParams.get('merchantId')

    if (!merchantId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Merchant ID required' 
      }, { status: 400 })
    }

    const body = await request.json()
    const { animalId, movementType, fromLocation, toLocation, reason, permitNumber } = body

    if (!animalId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Animal ID is required' 
      }, { status: 400 })
    }

    // Find the livestock by ID or identification number
    const livestock = await db.livestock.findFirst({
      where: {
        OR: [
          { id: animalId },
          { identificationNumber: animalId }
        ],
        merchantId
      }
    })

    if (!livestock) {
      return NextResponse.json({ 
        success: false, 
        error: 'Animal not found' 
      }, { status: 404 })
    }

    // Create movement record
    const movementRecord = await db.movementRecord.create({
      data: {
        id: `MOV-${nanoid(8).toUpperCase()}`,
        livestockId: livestock.id,
        movementType: movementType || 'transfer',
        movementDate: new Date(),
        fromLocation,
        toLocation,
        reason,
        permitNumber
      }
    })

    // Update livestock location if it's a transfer
    if (movementType === 'transfer' && toLocation) {
      await db.livestock.update({
        where: { id: livestock.id },
        data: {
          location: toLocation,
          updatedAt: new Date()
        }
      })
    }

    // Handle status changes for specific movement types
    if (movementType === 'sale') {
      await db.livestock.update({
        where: { id: livestock.id },
        data: {
          status: 'sold',
          updatedAt: new Date()
        }
      })
    } else if (movementType === 'death') {
      await db.livestock.update({
        where: { id: livestock.id },
        data: {
          status: 'deceased',
          healthStatus: 'deceased',
          updatedAt: new Date()
        }
      })
    } else if (movementType === 'purchase') {
      await db.livestock.update({
        where: { id: livestock.id },
        data: {
          status: 'active',
          updatedAt: new Date()
        }
      })
    }

    return NextResponse.json({ 
      success: true, 
      movementRecord,
      livestock: {
        id: livestock.id,
        identificationNumber: livestock.identificationNumber,
        location: toLocation || livestock.location,
        status: movementType === 'sale' ? 'sold' : movementType === 'death' ? 'deceased' : livestock.status
      }
    })
  } catch (error) {
    console.error('Error recording movement:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to record movement',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET /api/merchant-os/agriculture/livestock/movement - Get movement history
export async function GET(request: NextRequest) {
  try {
    const merchantId = request.nextUrl.searchParams.get('merchantId')
    const animalId = request.nextUrl.searchParams.get('animalId')
    const movementType = request.nextUrl.searchParams.get('movementType')

    if (!merchantId) {
      return NextResponse.json({ 
        movementRecords: [],
        message: 'No merchant ID provided' 
      })
    }

    const where: Record<string, unknown> = {
      Livestock: { merchantId }
    }

    if (animalId) {
      where.Livestock = {
        OR: [
          { id: animalId },
          { identificationNumber: animalId }
        ],
        merchantId
      }
    }

    if (movementType) {
      where.movementType = movementType
    }

    const movementRecords = await db.movementRecord.findMany({
      where,
      orderBy: { movementDate: 'desc' },
      take: 50,
      include: {
        Livestock: {
          select: {
            id: true,
            identificationNumber: true,
            animalType: true,
            breed: true
          }
        }
      }
    })

    return NextResponse.json({ movementRecords })
  } catch (error) {
    console.error('Error fetching movement records:', error)
    return NextResponse.json({ movementRecords: [] })
  }
}
