import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { nanoid } from 'nanoid'
import { CampPenType, CampPenStatus } from '@prisma/client'

// GET /api/merchant-os/agriculture/camps - List camps/pens for a farm
export async function GET(request: NextRequest) {
  try {
    const merchantId = request.headers.get('x-merchant-id') || 
                       request.nextUrl.searchParams.get('merchantId')

    if (!merchantId) {
      return NextResponse.json({ 
        success: false,
        camps: [], 
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
        camps: [], 
        total: 0,
        message: 'No farm found for this merchant' 
      })
    }

    // Parse query parameters
    const type = request.nextUrl.searchParams.get('type') as CampPenType | null
    const status = request.nextUrl.searchParams.get('status') as CampPenStatus | null
    const section = request.nextUrl.searchParams.get('section')
    const limitParam = request.nextUrl.searchParams.get('limit')
    const offsetParam = request.nextUrl.searchParams.get('offset')
    
    const limit = limitParam ? parseInt(limitParam, 10) : 100
    const offset = offsetParam ? parseInt(offsetParam, 10) : 0

    // Build where clause
    const where: Record<string, unknown> = { farmId: farm.id }
    if (type) where.type = type
    if (status) where.status = status
    if (section) where.section = section

    // Get total count
    const total = await db.campPen.count({ where })

    // Get camps with animal counts
    const camps = await db.campPen.findMany({
      where,
      include: {
        _count: {
          select: { 
            animals: {
              where: { status: 'ACTIVE' }
            }
          }
        },
        animals: {
          where: { status: 'ACTIVE' },
          select: {
            species: true,
            trackingType: true,
            batchQuantity: true,
            currentWeight: true
          }
        }
      },
      orderBy: [
        { section: 'asc' },
        { code: 'asc' }
      ],
      take: limit,
      skip: offset
    })

    // Calculate additional stats for each camp
    const campsWithStats = camps.map(camp => {
      // Calculate total animal units (considering batches)
      const totalUnits = camp.animals.reduce((sum, animal) => {
        return sum + (animal.trackingType === 'BATCH' && animal.batchQuantity 
          ? animal.batchQuantity 
          : 1)
      }, 0)

      // Calculate occupancy percentage
      const occupancyPercent = camp.capacity > 0 
        ? Math.round((totalUnits / camp.capacity) * 100) 
        : 0

      // Group animals by species
      const bySpecies = camp.animals.reduce((acc, animal) => {
        const sp = animal.species
        if (!acc[sp]) acc[sp] = { count: 0, totalWeight: 0 }
        acc[sp].count += animal.trackingType === 'BATCH' && animal.batchQuantity 
          ? animal.batchQuantity 
          : 1
        acc[sp].totalWeight += animal.currentWeight || 0
        return acc
      }, {} as Record<string, { count: number; totalWeight: number }>)

      return {
        id: camp.id,
        code: camp.code,
        name: camp.name,
        type: camp.type,
        capacity: camp.capacity,
        section: camp.section,
        areaHectares: camp.areaHectares,
        currentOccupancy: totalUnits,
        occupancyPercent,
        status: camp.status,
        grassCondition: camp.grassCondition,
        grazingDaysRemaining: camp.grazingDaysRemaining,
        biomassEstimate: camp.biomassEstimate,
        lastAssessmentDate: camp.lastAssessmentDate,
        animalsBySpecies: bySpecies,
        isOverCapacity: totalUnits > camp.capacity,
        availableCapacity: Math.max(0, camp.capacity - totalUnits)
      }
    })

    // Get summary statistics
    const typeSummary = await db.campPen.groupBy({
      by: ['type'],
      where: { farmId: farm.id, status: 'ACTIVE' },
      _count: { id: true },
      _sum: { capacity: true, areaHectares: true }
    })

    const statusSummary = await db.campPen.groupBy({
      by: ['status'],
      where: { farmId: farm.id },
      _count: { id: true }
    })

    // Get total farm capacity
    const totalCapacity = await db.campPen.aggregate({
      where: { farmId: farm.id, status: 'ACTIVE' },
      _sum: { capacity: true }
    })

    // Get total current occupancy
    const totalOccupancy = await db.animalUnit.count({
      where: { 
        farmId: farm.id, 
        status: 'ACTIVE',
        currentCampId: { not: null }
      }
    })

    return NextResponse.json({ 
      success: true,
      camps: campsWithStats,
      total,
      summary: {
        byType: typeSummary.map(t => ({
          type: t.type,
          count: t._count.id,
          totalCapacity: t._sum.capacity || 0,
          totalArea: t._sum.areaHectares || 0
        })),
        byStatus: statusSummary.map(s => ({
          status: s.status,
          count: s._count.id
        })),
        totalFarmCapacity: totalCapacity._sum.capacity || 0,
        totalFarmOccupancy: totalOccupancy,
        overallUtilization: (totalCapacity._sum.capacity || 0) > 0 
          ? Math.round((totalOccupancy / (totalCapacity._sum.capacity || 1)) * 100)
          : 0
      }
    })
  } catch (error) {
    console.error('Error fetching camps/pens:', error)
    return NextResponse.json({ 
      success: false,
      camps: [], 
      total: 0,
      error: 'Failed to fetch camps/pens',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// POST /api/merchant-os/agriculture/camps - Create camp/pen
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
    
    // Validate required fields
    if (!body.name) {
      return NextResponse.json({ 
        success: false, 
        error: 'Camp/pen name is required' 
      }, { status: 400 })
    }

    // Generate code if not provided
    const code = body.code || `CAMP-${nanoid(6).toUpperCase()}`
    
    // Check if code already exists for this farm
    const existingCamp = await db.campPen.findFirst({
      where: { 
        farmId: farm.id,
        code
      }
    })
    
    if (existingCamp) {
      return NextResponse.json({ 
        success: false, 
        error: 'Camp/pen with this code already exists' 
      }, { status: 400 })
    }

    // Validate capacity
    const capacity = body.capacity ? parseInt(body.capacity, 10) : 100
    if (capacity <= 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Capacity must be greater than 0' 
      }, { status: 400 })
    }

    // Create the camp/pen
    const camp = await db.campPen.create({
      data: {
        code,
        name: body.name,
        type: body.type as CampPenType || 'CAMP',
        capacity,
        section: body.section || null,
        areaHectares: body.areaHectares ? parseFloat(body.areaHectares) : null,
        lastAssessmentDate: body.lastAssessmentDate ? new Date(body.lastAssessmentDate) : null,
        grassCondition: body.grassCondition ? parseFloat(body.grassCondition) : null,
        grazingDaysRemaining: body.grazingDaysRemaining ? parseInt(body.grazingDaysRemaining, 10) : null,
        biomassEstimate: body.biomassEstimate ? parseFloat(body.biomassEstimate) : null,
        currentOccupancy: 0,
        status: body.status as CampPenStatus || 'ACTIVE',
        farmId: farm.id
      }
    })

    return NextResponse.json({ 
      success: true, 
      camp
    })
  } catch (error) {
    console.error('Error creating camp/pen:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to create camp/pen',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
