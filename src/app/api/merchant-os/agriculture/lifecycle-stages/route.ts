import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Species } from '@prisma/client'

// GET /api/merchant-os/agriculture/lifecycle-stages - List lifecycle stages for a species
export async function GET(request: NextRequest) {
  try {
    const merchantId = request.headers.get('x-merchant-id') || 
                       request.nextUrl.searchParams.get('merchantId')

    if (!merchantId) {
      return NextResponse.json({ 
        success: false,
        stages: [], 
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
        stages: [], 
        total: 0,
        message: 'No farm found for this merchant' 
      })
    }

    // Parse query parameters
    const species = request.nextUrl.searchParams.get('species') as Species | null
    const limitParam = request.nextUrl.searchParams.get('limit')
    const offsetParam = request.nextUrl.searchParams.get('offset')
    
    const limit = limitParam ? parseInt(limitParam, 10) : 100
    const offset = offsetParam ? parseInt(offsetParam, 10) : 0

    // Build where clause
    const where: Record<string, unknown> = { farmId: farm.id }
    if (species) where.species = species

    // Get total count
    const total = await db.lifecycleStage.count({ where })

    // Get lifecycle stages with animal counts
    const stages = await db.lifecycleStage.findMany({
      where,
      include: {
        _count: {
          select: { 
            animals: {
              where: { status: 'ACTIVE' }
            }
          }
        }
      },
      orderBy: [
        { species: 'asc' },
        { sequence: 'asc' }
      ],
      take: limit,
      skip: offset
    })

    // Get stages grouped by species with animal counts
    const stagesBySpecies = await db.lifecycleStage.groupBy({
      by: ['species'],
      where: { farmId: farm.id },
      _count: { id: true }
    })

    // Get animal distribution across stages for each species
    const animalDistribution = await db.animalUnit.groupBy({
      by: ['species', 'lifecycleStageId'],
      where: { 
        farmId: farm.id,
        status: 'ACTIVE'
      },
      _count: { id: true }
    })

    // Calculate distribution percentages
    const distributionWithPercentages = animalDistribution.map(d => ({
      species: d.species,
      lifecycleStageId: d.lifecycleStageId,
      count: d._count.id
    }))

    return NextResponse.json({ 
      success: true,
      stages: stages.map(stage => ({
        id: stage.id,
        species: stage.species,
        name: stage.name,
        sequence: stage.sequence,
        minAgeDays: stage.minAgeDays,
        minWeight: stage.minWeight,
        autoTransition: stage.autoTransition,
        typicalDuration: stage.typicalDuration,
        animalCount: stage._count.animals
      })),
      total,
      stagesBySpecies: stagesBySpecies.map(s => ({
        species: s.species,
        count: s._count.id
      })),
      animalDistribution: distributionWithPercentages
    })
  } catch (error) {
    console.error('Error fetching lifecycle stages:', error)
    return NextResponse.json({ 
      success: false,
      stages: [], 
      total: 0,
      error: 'Failed to fetch lifecycle stages',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// POST /api/merchant-os/agriculture/lifecycle-stages - Create lifecycle stage
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
        error: 'Stage name is required' 
      }, { status: 400 })
    }

    if (!body.species) {
      return NextResponse.json({ 
        success: false, 
        error: 'Species is required' 
      }, { status: 400 })
    }

    // Determine sequence if not provided
    let sequence = body.sequence
    if (sequence === undefined || sequence === null) {
      // Get the highest sequence for this species
      const lastStage = await db.lifecycleStage.findFirst({
        where: { 
          farmId: farm.id,
          species: body.species as Species
        },
        orderBy: { sequence: 'desc' },
        select: { sequence: true }
      })
      sequence = lastStage ? lastStage.sequence + 1 : 1
    }

    // Check if stage with same name already exists for this species
    const existingStage = await db.lifecycleStage.findFirst({
      where: { 
        farmId: farm.id,
        species: body.species as Species,
        name: body.name
      }
    })
    
    if (existingStage) {
      return NextResponse.json({ 
        success: false, 
        error: 'Lifecycle stage with this name already exists for this species' 
      }, { status: 400 })
    }

    // Check if sequence already exists for this species
    const existingSequence = await db.lifecycleStage.findFirst({
      where: { 
        farmId: farm.id,
        species: body.species as Species,
        sequence
      }
    })
    
    if (existingSequence) {
      return NextResponse.json({ 
        success: false, 
        error: 'Lifecycle stage with this sequence already exists for this species' 
      }, { status: 400 })
    }

    // Create the lifecycle stage
    const stage = await db.lifecycleStage.create({
      data: {
        species: body.species as Species,
        name: body.name,
        sequence,
        minAgeDays: body.minAgeDays ? parseInt(body.minAgeDays, 10) : null,
        minWeight: body.minWeight ? parseFloat(body.minWeight) : null,
        autoTransition: body.autoTransition || false,
        typicalDuration: body.typicalDuration ? parseInt(body.typicalDuration, 10) : null,
        farmId: farm.id
      },
      include: {
        _count: {
          select: { animals: true }
        }
      }
    })

    return NextResponse.json({ 
      success: true, 
      stage
    })
  } catch (error) {
    console.error('Error creating lifecycle stage:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to create lifecycle stage',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
