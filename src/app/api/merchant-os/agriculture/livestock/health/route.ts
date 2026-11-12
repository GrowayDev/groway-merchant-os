import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { nanoid } from 'nanoid'

// POST /api/merchant-os/agriculture/livestock/health - Record health event
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
    const { animalId, recordType, description, treatment, medication, dosage, veterinarian } = body

    if (!animalId || !description) {
      return NextResponse.json({ 
        success: false, 
        error: 'Animal ID and description are required' 
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

    // Create health record
    const healthRecord = await db.healthRecord.create({
      data: {
        id: `HLT-${nanoid(8).toUpperCase()}`,
        livestockId: livestock.id,
        recordType: recordType || 'checkup',
        recordDate: new Date(),
        description,
        treatment,
        medication,
        dosage,
        veterinarian
      }
    })

    // Update livestock health status based on record type
    let newHealthStatus = livestock.healthStatus
    let newNextVaccination = livestock.nextVaccination

    switch (recordType) {
      case 'illness':
        newHealthStatus = 'sick'
        break
      case 'treatment':
        newHealthStatus = 'recovering'
        break
      case 'vaccination':
        // Set next vaccination date (typically 1 year later for most vaccines)
        const nextYear = new Date()
        nextYear.setFullYear(nextYear.getFullYear() + 1)
        newNextVaccination = nextYear
        break
      case 'checkup':
        if (livestock.healthStatus === 'sick' || livestock.healthStatus === 'recovering') {
          newHealthStatus = 'healthy'
        }
        break
    }

    // Update livestock if status changed
    if (newHealthStatus !== livestock.healthStatus || newNextVaccination !== livestock.nextVaccination) {
      await db.livestock.update({
        where: { id: livestock.id },
        data: {
          healthStatus: newHealthStatus,
          nextVaccination: newNextVaccination,
          lastHealthCheck: new Date(),
          updatedAt: new Date()
        }
      })
    }

    return NextResponse.json({ 
      success: true, 
      healthRecord,
      livestock: {
        id: livestock.id,
        identificationNumber: livestock.identificationNumber,
        healthStatus: newHealthStatus
      }
    })
  } catch (error) {
    console.error('Error recording health event:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to record health event',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET /api/merchant-os/agriculture/livestock/health - Get health records
export async function GET(request: NextRequest) {
  try {
    const merchantId = request.nextUrl.searchParams.get('merchantId')
    const animalId = request.nextUrl.searchParams.get('animalId')
    const recordType = request.nextUrl.searchParams.get('recordType')

    if (!merchantId) {
      return NextResponse.json({ 
        healthRecords: [],
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

    if (recordType) {
      where.recordType = recordType
    }

    const healthRecords = await db.healthRecord.findMany({
      where,
      orderBy: { recordDate: 'desc' },
      take: 50,
      include: {
        Livestock: {
          select: {
            id: true,
            identificationNumber: true,
            animalType: true,
            breed: true,
            healthStatus: true
          }
        }
      }
    })

    return NextResponse.json({ healthRecords })
  } catch (error) {
    console.error('Error fetching health records:', error)
    return NextResponse.json({ healthRecords: [] })
  }
}
