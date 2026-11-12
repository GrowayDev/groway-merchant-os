import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/merchant-os/agriculture/livestock/weight - Record weight measurement
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
    const { animalTag, weight, method, bodyConditionScore, notes, farmId } = body

    if (!animalTag || !weight) {
      return NextResponse.json({ 
        success: false, 
        error: 'Animal tag and weight are required' 
      }, { status: 400 })
    }

    // Find the animal by identification number
    const animal = await db.animalUnit.findFirst({
      where: {
        identificationNumber: animalTag
      }
    })

    // Get previous weight record for ADG calculation
    const previousRecord = animal ? await db.weightRecord.findFirst({
      where: { animalId: animal.id },
      orderBy: { weighedAt: 'desc' }
    }) : null

    const now = new Date()
    let daysSinceLast = null
    let weightGain = null
    let adg = null

    if (previousRecord) {
      daysSinceLast = Math.floor((now.getTime() - previousRecord.weighedAt.getTime()) / (1000 * 60 * 60 * 24))
      weightGain = weight - previousRecord.weight
      adg = daysSinceLast > 0 ? weightGain / daysSinceLast : null
    }

    // Create weight record
    const weightRecord = await db.weightRecord.create({
      data: {
        animalId: animal?.id,
        weight: parseFloat(weight),
        weightUnit: 'KG',
        method: method || 'MANUAL',
        bodyConditionScore: bodyConditionScore ? parseInt(bodyConditionScore) : null,
        daysSinceLast,
        weightGain,
        adg,
        weighedAt: now,
        notes
      }
    })

    // Update animal's current weight if found
    if (animal) {
      await db.animalUnit.update({
        where: { id: animal.id },
        data: {
          currentWeight: parseFloat(weight),
          updatedAt: now
        }
      })
    }

    return NextResponse.json({ 
      success: true, 
      record: {
        ...weightRecord,
        animalTag
      }
    })
  } catch (error) {
    console.error('Error recording weight:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to record weight',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET /api/merchant-os/agriculture/livestock/weight - Get weight data
export async function GET(request: NextRequest) {
  try {
    const merchantId = request.nextUrl.searchParams.get('merchantId')
    const farmId = request.nextUrl.searchParams.get('farmId')
    const animalId = request.nextUrl.searchParams.get('animalId')

    if (!merchantId) {
      return NextResponse.json({ records: [], histories: [], stats: null })
    }

    const where: Record<string, unknown> = {}
    if (farmId) where.farmId = farmId

    // Get recent weight records
    const weightRecords = await db.weightRecord.findMany({
      where: animalId ? { animalId } : {},
      orderBy: { weighedAt: 'desc' },
      take: 100,
      include: {
        animal: {
          select: {
            identificationNumber: true,
            species: true,
            currentWeight: true
          }
        }
      }
    })

    const records = weightRecords.map(r => ({
      id: r.id,
      animalId: r.animalId || '',
      animalTag: r.animal?.identificationNumber || r.animalId,
      weight: r.weight,
      weightUnit: r.weightUnit,
      method: r.method,
      bodyConditionScore: r.bodyConditionScore,
      daysSinceLast: r.daysSinceLast,
      weightGain: r.weightGain,
      adg: r.adg,
      weighedAt: r.weighedAt.toISOString(),
      notes: r.notes
    }))

    // Get animal weight histories
    const animals = await db.animalUnit.findMany({
      where: {
        ...where,
        currentWeight: { not: null }
      },
      include: {
        weightRecords: {
          orderBy: { weighedAt: 'asc' },
          take: 20
        }
      },
      take: 50
    })

    const histories = animals.map(animal => {
      const weightRecords = animal.weightRecords
      const lastRecord = weightRecords[weightRecords.length - 1]
      const firstRecord = weightRecords[0]
      
      let avgDailyGain = null
      if (firstRecord && lastRecord && weightRecords.length >= 2) {
        const daysDiff = Math.floor(
          (lastRecord.weighedAt.getTime() - firstRecord.weighedAt.getTime()) / (1000 * 60 * 60 * 24)
        )
        if (daysDiff > 0) {
          avgDailyGain = (lastRecord.weight - firstRecord.weight) / daysDiff
        }
      }

      return {
        animalId: animal.id,
        animalTag: animal.identificationNumber || animal.id,
        species: animal.species,
        currentWeight: animal.currentWeight || 0,
        birthWeight: undefined, // Would come from offspring record
        records: weightRecords.map(r => ({
          id: r.id,
          animalId: animal.id,
          weight: r.weight,
          weightUnit: r.weightUnit,
          method: r.method,
          bodyConditionScore: r.bodyConditionScore,
          daysSinceLast: r.daysSinceLast,
          weightGain: r.weightGain,
          adg: r.adg,
          weighedAt: r.weighedAt.toISOString(),
          notes: r.notes
        })),
        avgDailyGain
      }
    })

    // Calculate stats
    const totalWeighed = records.length
    const avgWeight = totalWeighed > 0 
      ? records.reduce((sum, r) => sum + r.weight, 0) / totalWeighed 
      : 0
    const avgADG = histories.filter(h => h.avgDailyGain !== null).length > 0
      ? histories.filter(h => h.avgDailyGain !== null).reduce((sum, h) => sum + (h.avgDailyGain || 0), 0) / histories.filter(h => h.avgDailyGain !== null).length
      : 0

    // Mock classification thresholds (would come from breed standards)
    const underweight = histories.filter(h => h.avgDailyGain !== null && h.avgDailyGain < 0.5).length
    const onTarget = histories.filter(h => h.avgDailyGain !== null && h.avgDailyGain >= 0.5 && h.avgDailyGain <= 1.5).length
    const overweight = histories.filter(h => h.avgDailyGain !== null && h.avgDailyGain > 1.5).length

    const stats = {
      totalWeighed,
      avgWeight,
      avgADG,
      underweight,
      onTarget,
      overweight
    }

    return NextResponse.json({ records, histories, stats })
  } catch (error) {
    console.error('Error fetching weight data:', error)
    return NextResponse.json({ records: [], histories: [], stats: null })
  }
}
