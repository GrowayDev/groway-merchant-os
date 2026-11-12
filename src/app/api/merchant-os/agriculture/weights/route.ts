import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { WeightUnit, WeightMethod } from '@prisma/client'

// GET /api/merchant-os/agriculture/weights - List weight records for an animal
export async function GET(request: NextRequest) {
  try {
    const merchantId = request.headers.get('x-merchant-id') || 
                       request.nextUrl.searchParams.get('merchantId')

    if (!merchantId) {
      return NextResponse.json({ 
        success: false,
        records: [], 
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
        records: [], 
        total: 0,
        message: 'No farm found for this merchant' 
      })
    }

    // Parse query parameters
    const animalId = request.nextUrl.searchParams.get('animalId')
    const startDate = request.nextUrl.searchParams.get('startDate')
    const endDate = request.nextUrl.searchParams.get('endDate')
    const method = request.nextUrl.searchParams.get('method') as WeightMethod | null
    const limitParam = request.nextUrl.searchParams.get('limit')
    const offsetParam = request.nextUrl.searchParams.get('offset')
    
    const limit = limitParam ? parseInt(limitParam, 10) : 100
    const offset = offsetParam ? parseInt(offsetParam, 10) : 0

    // Build where clause
    const where: Record<string, unknown> = {}
    
    // Filter by animal (and verify it belongs to this farm)
    if (animalId) {
      const animal = await db.animalUnit.findFirst({
        where: {
          OR: [
            { id: animalId },
            { unitCode: animalId },
            { identificationNumber: animalId }
          ],
          farmId: farm.id
        }
      })
      
      if (!animal) {
        return NextResponse.json({ 
          success: false,
          records: [], 
          total: 0,
          message: 'Animal not found' 
        }, { status: 404 })
      }
      
      where.animalId = animal.id
    } else {
      // If no animal specified, get all weights for this farm
      where.animal = { farmId: farm.id }
    }
    
    // Date range filter
    if (startDate || endDate) {
      where.weighedAt = {}
      if (startDate) (where.weighedAt as Record<string, unknown>).gte = new Date(startDate)
      if (endDate) (where.weighedAt as Record<string, unknown>).lte = new Date(endDate)
    }
    
    // Method filter
    if (method) where.method = method

    // Get total count
    const total = await db.weightRecord.count({ where })

    // Get weight records with animal details
    const records = await db.weightRecord.findMany({
      where,
      include: {
        animal: {
          select: {
            id: true,
            unitCode: true,
            identificationNumber: true,
            species: true,
            trackingType: true,
            breed: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: { weighedAt: 'desc' },
      take: limit,
      skip: offset
    })

    // Get weight statistics for the animal(s)
    let statistics = null
    if (animalId && records.length > 0) {
      const animal = await db.animalUnit.findFirst({
        where: {
          OR: [
            { id: animalId },
            { unitCode: animalId },
            { identificationNumber: animalId }
          ],
          farmId: farm.id
        },
        include: {
          weightRecords: {
            orderBy: { weighedAt: 'asc' },
            select: {
              weight: true,
              weighedAt: true,
              adg: true
            }
          }
        }
      })

      if (animal && animal.weightRecords.length > 0) {
        const weights = animal.weightRecords
        const firstWeight = weights[0]
        const lastWeight = weights[weights.length - 1]
        
        // Calculate overall ADG (Average Daily Gain)
        const daysDiff = Math.ceil(
          (new Date(lastWeight.weighedAt).getTime() - new Date(firstWeight.weighedAt).getTime()) 
          / (1000 * 60 * 60 * 24)
        )
        const totalGain = lastWeight.weight - firstWeight.weight
        const overallADG = daysDiff > 0 ? totalGain / daysDiff : 0

        // Calculate min, max, avg
        const weightValues = weights.map(w => w.weight)
        const minWeight = Math.min(...weightValues)
        const maxWeight = Math.max(...weightValues)
        const avgWeight = weightValues.reduce((a, b) => a + b, 0) / weightValues.length

        statistics = {
          totalRecords: weights.length,
          firstWeight: {
            weight: firstWeight.weight,
            date: firstWeight.weighedAt
          },
          lastWeight: {
            weight: lastWeight.weight,
            date: lastWeight.weighedAt
          },
          totalGain,
          daysTracked: daysDiff,
          overallADG: parseFloat(overallADG.toFixed(3)),
          minWeight,
          maxWeight,
          avgWeight: parseFloat(avgWeight.toFixed(2))
        }
      }
    }

    return NextResponse.json({ 
      success: true,
      records,
      total,
      statistics
    })
  } catch (error) {
    console.error('Error fetching weight records:', error)
    return NextResponse.json({ 
      success: false,
      records: [], 
      total: 0,
      error: 'Failed to fetch weight records',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// POST /api/merchant-os/agriculture/weights - Record new weight
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
    
    // Validate animal
    if (!body.animalId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Animal ID is required' 
      }, { status: 400 })
    }

    const animal = await db.animalUnit.findFirst({
      where: {
        OR: [
          { id: body.animalId },
          { unitCode: body.animalId },
          { identificationNumber: body.animalId }
        ],
        farmId: farm.id
      }
    })

    if (!animal) {
      return NextResponse.json({ 
        success: false, 
        error: 'Animal not found' 
      }, { status: 404 })
    }

    // Validate weight
    if (!body.weight || body.weight <= 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Valid weight is required' 
      }, { status: 400 })
    }

    const weight = parseFloat(body.weight)
    const weightUnit = body.weightUnit as WeightUnit || 'KG'
    const method = body.method as WeightMethod || 'MANUAL'
    const weighedAt = body.weighedAt ? new Date(body.weighedAt) : new Date()

    // Get the last weight record for this animal to calculate weight gain and ADG
    const lastWeightRecord = await db.weightRecord.findFirst({
      where: { animalId: animal.id },
      orderBy: { weighedAt: 'desc' }
    })

    let daysSinceLast = null
    let weightGain = null
    let adg = null

    if (lastWeightRecord) {
      const lastDate = new Date(lastWeightRecord.weighedAt)
      daysSinceLast = Math.ceil(
        (weighedAt.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
      )
      
      // Convert weights to same unit if needed
      let lastWeight = lastWeightRecord.weight
      if (lastWeightRecord.weightUnit !== weightUnit) {
        // Simple conversion: 1 KG = 2.20462 LB
        if (lastWeightRecord.weightUnit === 'LB' && weightUnit === 'KG') {
          lastWeight = lastWeight / 2.20462
        } else if (lastWeightRecord.weightUnit === 'KG' && weightUnit === 'LB') {
          lastWeight = lastWeight * 2.20462
        }
      }
      
      weightGain = weight - lastWeight
      
      if (daysSinceLast > 0) {
        adg = weightGain / daysSinceLast
      }
    }

    // Create the weight record
    const record = await db.weightRecord.create({
      data: {
        animalId: animal.id,
        weight,
        weightUnit,
        method,
        imageId: body.imageId || null,
        confidenceLevel: body.confidenceLevel || null,
        estimatedRange: body.estimatedRange || null,
        bodyConditionScore: body.bodyConditionScore || null,
        daysSinceLast,
        weightGain: weightGain ? parseFloat(weightGain.toFixed(3)) : null,
        adg: adg ? parseFloat(adg.toFixed(4)) : null,
        weighedAt,
        notes: body.notes || null
      },
      include: {
        animal: {
          select: {
            id: true,
            unitCode: true,
            identificationNumber: true,
            species: true,
            currentWeight: true,
            breed: {
              select: {
                id: true,
                name: true,
                avgADG: true,
                avgMatureWeight: true
              }
            }
          }
        }
      }
    })

    // Update the animal's current weight
    await db.animalUnit.update({
      where: { id: animal.id },
      data: {
        currentWeight: weight,
        weightUnit
      }
    })

    // Check if lifecycle stage should be updated based on weight thresholds
    if (animal.lifecycleStageId && weightGain !== null) {
      const currentStage = await db.lifecycleStage.findUnique({
        where: { id: animal.lifecycleStageId }
      })
      
      if (currentStage) {
        // Check if animal qualifies for next stage
        const nextStage = await db.lifecycleStage.findFirst({
          where: {
            farmId: farm.id,
            species: animal.species,
            sequence: currentStage.sequence + 1
          }
        })
        
        if (nextStage && nextStage.minWeight && weight >= nextStage.minWeight) {
          // Auto-transition to next stage if conditions met
          await db.animalUnit.update({
            where: { id: animal.id },
            data: { lifecycleStageId: nextStage.id }
          })
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      record,
      calculations: {
        daysSinceLast,
        weightGain,
        adg,
        previousWeight: lastWeightRecord?.weight || null,
        previousWeighedAt: lastWeightRecord?.weighedAt || null
      }
    })
  } catch (error) {
    console.error('Error creating weight record:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to create weight record',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
