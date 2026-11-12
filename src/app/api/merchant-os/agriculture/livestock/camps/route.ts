import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET camps and rotation data
export async function GET(request: NextRequest) {
  try {
    const merchantId = request.nextUrl.searchParams.get('merchantId')
    const farmId = request.nextUrl.searchParams.get('farmId')

    if (!merchantId) {
      return NextResponse.json({ camps: [], rotationPlans: [], rotationHistory: [] })
    }

    const where: Record<string, unknown> = {}
    if (farmId) where.farmId = farmId

    // Get camps
    const camps = await db.campPen.findMany({
      where,
      include: {
        _count: {
          select: { animals: true }
        }
      },
      orderBy: { name: 'asc' }
    })

    const formattedCamps = camps.map(camp => ({
      ...camp,
      currentOccupancy: camp._count.animals,
      rotationHistory: []
    }))

    // Get rotation history from movements
    const rotationHistory = await db.livestockMovement.findMany({
      where: {
        ...where,
        movementType: 'rotation'
      },
      include: {
        fromCamp: { select: { name: true } },
        toCamp: { select: { name: true } },
        animal: { select: { species: true } }
      },
      orderBy: { movementDate: 'desc' },
      take: 50
    })

    const formattedHistory = rotationHistory.map(movement => ({
      id: movement.id,
      fromCampId: movement.fromCampId || '',
      fromCampName: movement.fromCamp?.name || 'Unknown',
      toCampId: movement.toCampId || '',
      toCampName: movement.toCamp?.name || 'Unknown',
      animalCount: 1, // Would aggregate in real implementation
      species: movement.animal?.species || 'unknown',
      rotatedAt: movement.movementDate.toISOString(),
      reason: movement.reason || undefined
    }))

    // Generate rotation plans based on grass condition
    const rotationPlans = []
    const now = new Date()

    for (const camp of formattedCamps) {
      if (camp.grassCondition && camp.grassCondition < 50 && camp.currentOccupancy > 0) {
        const rotationDate = new Date(now)
        rotationDate.setDate(rotationDate.getDate() + Math.floor((camp.grassCondition / 10)))

        // Find a suitable target camp
        const targetCamp = formattedCamps.find(c => 
          c.id !== camp.id && 
          c.status === 'ACTIVE' && 
          c.currentOccupancy < c.capacity &&
          (!c.grassCondition || c.grassCondition > 60)
        )

        rotationPlans.push({
          id: `plan-${camp.id}`,
          name: `Rotate from ${camp.name}`,
          species: 'cattle',
          animalCount: camp.currentOccupancy,
          currentCampId: camp.id,
          currentCampName: camp.name,
          nextCampId: targetCamp?.id,
          nextCampName: targetCamp?.name,
          rotationDate: rotationDate.toISOString(),
          daysUntilRotation: Math.ceil((rotationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
          status: camp.grassCondition < 30 ? 'OVERDUE' : camp.grassCondition < 40 ? 'DUE_NOW' : 'ON_SCHEDULE'
        })
      }
    }

    return NextResponse.json({
      camps: formattedCamps,
      rotationPlans,
      rotationHistory: formattedHistory
    })
  } catch (error) {
    console.error('Error fetching camp data:', error)
    return NextResponse.json({ camps: [], rotationPlans: [], rotationHistory: [] })
  }
}

// POST create camp
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    const camp = await db.campPen.create({
      data: {
        code: data.code,
        name: data.name,
        type: data.type || 'CAMP',
        section: data.section,
        areaHectares: data.areaHectares,
        capacity: data.capacity,
        currentOccupancy: 0,
        status: 'ACTIVE',
        farmId: data.farmId
      }
    })

    return NextResponse.json({ camp })
  } catch (error) {
    console.error('Error creating camp:', error)
    return NextResponse.json({ error: 'Failed to create camp' }, { status: 500 })
  }
}
