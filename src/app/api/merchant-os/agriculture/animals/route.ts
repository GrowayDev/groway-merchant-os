import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { nanoid } from 'nanoid'
import { Species, TrackingType, AnimalStatus, HealthStatus, AnimalGender, ProductionType, SystemType, AnimalClassification, WeightUnit } from '@prisma/client'

// Type definitions for query parameters
interface AnimalQueryParams {
  farmId?: string
  species?: Species
  status?: AnimalStatus
  trackingType?: TrackingType
  breedId?: string
  healthStatus?: HealthStatus
  currentCampId?: string
  limit?: number
  offset?: number
}

// GET /api/merchant-os/agriculture/animals - List all animal units with filtering
export async function GET(request: NextRequest) {
  try {
    const merchantId = request.headers.get('x-merchant-id') || 
                       request.nextUrl.searchParams.get('merchantId')

    if (!merchantId) {
      return NextResponse.json({ 
        success: false,
        animals: [], 
        total: 0,
        message: 'No merchant ID provided' 
      })
    }

    // Get farm for this merchant
    const farm = await db.farm.findUnique({
      where: { merchantId },
      select: { id: true }
    })

    if (!farm) {
      return NextResponse.json({ 
        success: false,
        animals: [], 
        total: 0,
        message: 'No farm found for this merchant' 
      })
    }

    // Parse query parameters
    const species = request.nextUrl.searchParams.get('species') as Species | null
    const status = request.nextUrl.searchParams.get('status') as AnimalStatus | null
    const trackingType = request.nextUrl.searchParams.get('trackingType') as TrackingType | null
    const breedId = request.nextUrl.searchParams.get('breedId')
    const healthStatus = request.nextUrl.searchParams.get('healthStatus') as HealthStatus | null
    const currentCampId = request.nextUrl.searchParams.get('currentCampId')
    const limitParam = request.nextUrl.searchParams.get('limit')
    const offsetParam = request.nextUrl.searchParams.get('offset')
    
    const limit = limitParam ? parseInt(limitParam, 10) : 100
    const offset = offsetParam ? parseInt(offsetParam, 10) : 0

    // Build where clause
    const where: Record<string, unknown> = { farmId: farm.id }
    if (species) where.species = species
    if (status) where.status = status
    if (trackingType) where.trackingType = trackingType
    if (breedId) where.breedId = breedId
    if (healthStatus) where.healthStatus = healthStatus
    if (currentCampId) where.currentCampId = currentCampId

    // Get total count
    const total = await db.animalUnit.count({ where })

    // Get animals with relations
    const animals = await db.animalUnit.findMany({
      where,
      include: {
        breed: {
          select: {
            id: true,
            name: true,
            species: true
          }
        },
        lifecycleStage: {
          select: {
            id: true,
            name: true,
            sequence: true
          }
        },
        currentCamp: {
          select: {
            id: true,
            code: true,
            name: true,
            type: true
          }
        },
        _count: {
          select: {
            weightRecords: true,
            healthRecords: true,
            breedingRecordsAsDam: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    })

    // Get summary statistics
    const summary = await db.animalUnit.groupBy({
      by: ['species', 'status'],
      where: { farmId: farm.id },
      _count: { id: true }
    })

    // Get tracking type summary
    const trackingSummary = await db.animalUnit.groupBy({
      by: ['trackingType', 'species'],
      where: { farmId: farm.id, status: 'ACTIVE' },
      _count: { id: true },
      _sum: { batchQuantity: true }
    })

    return NextResponse.json({ 
      success: true,
      animals,
      total,
      summary: summary.map(s => ({
        species: s.species,
        status: s.status,
        count: s._count.id
      })),
      trackingSummary: trackingSummary.map(t => ({
        trackingType: t.trackingType,
        species: t.species,
        count: t._count.id,
        totalQuantity: t._sum.batchQuantity || t._count.id
      }))
    })
  } catch (error) {
    console.error('Error fetching animal units:', error)
    return NextResponse.json({ 
      success: false,
      animals: [], 
      total: 0,
      error: 'Failed to fetch animal units',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// POST /api/merchant-os/agriculture/animals - Create new animal unit (individual or batch)
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

    // Get farm for this merchant
    const farm = await db.farm.findUnique({
      where: { merchantId },
      select: { id: true }
    })

    if (!farm) {
      return NextResponse.json({ 
        success: false, 
        error: 'No farm found for this merchant. Please create a farm first.' 
      }, { status: 400 })
    }

    const body = await request.json()
    
    // Generate unique unit code
    const unitCode = body.unitCode || `ANM-${nanoid(8).toUpperCase()}`
    
    // Check if unit code already exists
    const existingUnit = await db.animalUnit.findUnique({
      where: { unitCode }
    })
    
    if (existingUnit) {
      return NextResponse.json({ 
        success: false, 
        error: 'Animal with this unit code already exists' 
      }, { status: 400 })
    }

    // Validate tracking type specific fields
    const trackingType = body.trackingType as TrackingType || 'INDIVIDUAL'
    
    if (trackingType === 'BATCH') {
      if (!body.batchQuantity || body.batchQuantity < 1) {
        return NextResponse.json({ 
          success: false, 
          error: 'Batch quantity is required for batch tracking' 
        }, { status: 400 })
      }
    } else {
      // For individual tracking, check for unique identification number if provided
      if (body.identificationNumber) {
        const existingId = await db.animalUnit.findUnique({
          where: { identificationNumber: body.identificationNumber }
        })
        if (existingId) {
          return NextResponse.json({ 
            success: false, 
            error: 'Animal with this identification number already exists' 
          }, { status: 400 })
        }
      }
    }

    // Validate breed if provided
    if (body.breedId) {
      const breed = await db.breed.findFirst({
        where: { id: body.breedId, farmId: farm.id }
      })
      if (!breed) {
        return NextResponse.json({ 
          success: false, 
          error: 'Invalid breed ID for this farm' 
        }, { status: 400 })
      }
    }

    // Validate lifecycle stage if provided
    if (body.lifecycleStageId) {
      const stage = await db.lifecycleStage.findFirst({
        where: { id: body.lifecycleStageId, farmId: farm.id }
      })
      if (!stage) {
        return NextResponse.json({ 
          success: false, 
          error: 'Invalid lifecycle stage ID for this farm' 
        }, { status: 400 })
      }
    }

    // Validate camp if provided
    if (body.currentCampId) {
      const camp = await db.campPen.findFirst({
        where: { id: body.currentCampId, farmId: farm.id }
      })
      if (!camp) {
        return NextResponse.json({ 
          success: false, 
          error: 'Invalid camp/pen ID for this farm' 
        }, { status: 400 })
      }
    }

    // Create the animal unit
    const animal = await db.animalUnit.create({
      data: {
        unitCode,
        trackingType,
        species: body.species as Species || 'CATTLE',
        breedId: body.breedId || null,
        productionType: body.productionType as ProductionType || 'COMMERCIAL',
        systemType: body.systemType as SystemType || 'GRAZING',
        lifecycleStageId: body.lifecycleStageId || null,
        classification: body.classification as AnimalClassification || 'COMMERCIAL_STOCK',
        
        // Batch fields
        batchQuantity: trackingType === 'BATCH' ? parseInt(body.batchQuantity, 10) : null,
        batchStartDate: trackingType === 'BATCH' && body.batchStartDate ? new Date(body.batchStartDate) : null,
        
        // Individual fields
        identificationNumber: trackingType === 'INDIVIDUAL' ? (body.identificationNumber || unitCode) : null,
        gender: trackingType === 'INDIVIDUAL' ? body.gender as AnimalGender : null,
        birthDate: trackingType === 'INDIVIDUAL' && body.birthDate ? new Date(body.birthDate) : null,
        damId: trackingType === 'INDIVIDUAL' ? body.damId || null : null,
        sireId: trackingType === 'INDIVIDUAL' ? body.sireId || null : null,
        
        // Location
        currentCampId: body.currentCampId || null,
        
        // Status
        status: body.status as AnimalStatus || 'ACTIVE',
        healthStatus: body.healthStatus as HealthStatus || 'HEALTHY',
        
        // Weight
        currentWeight: body.currentWeight ? parseFloat(body.currentWeight) : null,
        weightUnit: body.weightUnit as WeightUnit || 'KG',
        
        // Timestamps
        acquiredAt: body.acquiredAt ? new Date(body.acquiredAt) : null,
        
        // Farm relation
        farmId: farm.id
      },
      include: {
        breed: {
          select: {
            id: true,
            name: true,
            species: true
          }
        },
        lifecycleStage: {
          select: {
            id: true,
            name: true,
            sequence: true
          }
        },
        currentCamp: {
          select: {
            id: true,
            code: true,
            name: true,
            type: true
          }
        }
      }
    })

    // Update camp occupancy if camp assigned
    if (body.currentCampId) {
      await db.campPen.update({
        where: { id: body.currentCampId },
        data: {
          currentOccupancy: {
            increment: trackingType === 'BATCH' ? parseInt(body.batchQuantity, 10) : 1
          }
        }
      })
    }

    return NextResponse.json({ success: true, animal })
  } catch (error) {
    console.error('Error creating animal unit:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to create animal unit',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
