import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { BreedingStatus, AnimalGender } from '@prisma/client'

// GET /api/merchant-os/agriculture/breeding - List breeding records with filtering
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
    const status = request.nextUrl.searchParams.get('status') as BreedingStatus | null
    const damId = request.nextUrl.searchParams.get('damId')
    const sireId = request.nextUrl.searchParams.get('sireId')
    const startDate = request.nextUrl.searchParams.get('startDate')
    const endDate = request.nextUrl.searchParams.get('endDate')
    const aiUsed = request.nextUrl.searchParams.get('aiUsed')
    const limitParam = request.nextUrl.searchParams.get('limit')
    const offsetParam = request.nextUrl.searchParams.get('offset')
    
    const limit = limitParam ? parseInt(limitParam, 10) : 100
    const offset = offsetParam ? parseInt(offsetParam, 10) : 0

    // Build where clause
    const where: Record<string, unknown> = { farmId: farm.id }
    if (status) where.status = status
    if (damId) where.damId = damId
    if (sireId) where.sireId = sireId
    if (aiUsed !== null) where.aiUsed = aiUsed === 'true'
    
    // Date range filter
    if (startDate || endDate) {
      where.matingDate = {}
      if (startDate) (where.matingDate as Record<string, unknown>).gte = new Date(startDate)
      if (endDate) (where.matingDate as Record<string, unknown>).lte = new Date(endDate)
    }

    // Get total count
    const total = await db.breedingRecord.count({ where })

    // Get breeding records with relations
    const records = await db.breedingRecord.findMany({
      where,
      include: {
        dam: {
          select: {
            id: true,
            unitCode: true,
            identificationNumber: true,
            species: true,
            breed: {
              select: {
                id: true,
                name: true
              }
            },
            currentWeight: true
          }
        },
        sire: {
          select: {
            id: true,
            unitCode: true,
            identificationNumber: true,
            species: true,
            breed: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        offspring: {
          select: {
            id: true,
            birthOrder: true,
            birthWeight: true,
            gender: true,
            status: true,
            animal: {
              select: {
                id: true,
                unitCode: true,
                identificationNumber: true
              }
            }
          }
        }
      },
      orderBy: { matingDate: 'desc' },
      take: limit,
      skip: offset
    })

    // Get summary statistics
    const statusSummary = await db.breedingRecord.groupBy({
      by: ['status'],
      where: { farmId: farm.id },
      _count: { id: true }
    })

    // Get success rate for pregnant/birthed vs total
    const totalBreeding = await db.breedingRecord.count({
      where: { farmId: farm.id }
    })
    const successfulBreeding = await db.breedingRecord.count({
      where: { 
        farmId: farm.id,
        status: { in: ['PREGNANT', 'BIRTHED'] }
      }
    })

    // Get expected births in next 30 days
    const now = new Date()
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    const expectedBirths = await db.breedingRecord.count({
      where: {
        farmId: farm.id,
        status: 'PREGNANT',
        expectedBirthDate: {
          gte: now,
          lte: thirtyDaysLater
        }
      }
    })

    return NextResponse.json({ 
      success: true,
      records,
      total,
      summary: {
        byStatus: statusSummary.map(s => ({
          status: s.status,
          count: s._count.id
        })),
        successRate: totalBreeding > 0 ? (successfulBreeding / totalBreeding * 100).toFixed(1) : 0,
        expectedBirthsNext30Days: expectedBirths
      }
    })
  } catch (error) {
    console.error('Error fetching breeding records:', error)
    return NextResponse.json({ 
      success: false,
      records: [], 
      total: 0,
      error: 'Failed to fetch breeding records',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// POST /api/merchant-os/agriculture/breeding - Create breeding record
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
    
    // Validate dam
    if (!body.damId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Dam ID is required' 
      }, { status: 400 })
    }

    const dam = await db.animalUnit.findFirst({
      where: { 
        id: body.damId,
        farmId: farm.id,
        gender: 'FEMALE'
      }
    })

    if (!dam) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid dam ID or animal is not female' 
      }, { status: 400 })
    }

    // Check if dam already has an active breeding record
    const activeBreeding = await db.breedingRecord.findFirst({
      where: {
        damId: body.damId,
        status: { in: ['MATED', 'PREGNANT'] }
      }
    })

    if (activeBreeding) {
      return NextResponse.json({ 
        success: false, 
        error: 'Dam already has an active breeding record',
        existingRecord: {
          id: activeBreeding.id,
          status: activeBreeding.status,
          matingDate: activeBreeding.matingDate
        }
      }, { status: 400 })
    }

    // Validate sire if provided
    let sire = null
    if (body.sireId) {
      sire = await db.animalUnit.findFirst({
        where: { 
          id: body.sireId,
          farmId: farm.id,
          gender: { in: ['MALE', 'CASTRATED_MALE'] }
        }
      })

      if (!sire) {
        return NextResponse.json({ 
          success: false, 
          error: 'Invalid sire ID or animal is not male' 
        }, { status: 400 })
      }
    }

    // Validate mating date
    if (!body.matingDate) {
      return NextResponse.json({ 
        success: false, 
        error: 'Mating date is required' 
      }, { status: 400 })
    }

    const matingDate = new Date(body.matingDate)

    // Calculate expected birth date based on species
    // Default gestation periods (in days)
    const gestationPeriods: Record<string, number> = {
      CATTLE: 283,
      PIG: 114,
      SHEEP: 147,
      GOAT: 150,
      HORSE: 335,
      GAME: 280 // Approximate for game animals
    }

    const species = dam.species as keyof typeof gestationPeriods
    const gestationPeriod = gestationPeriods[species] || 280
    const expectedBirthDate = body.expectedBirthDate 
      ? new Date(body.expectedBirthDate)
      : new Date(matingDate.getTime() + gestationPeriod * 24 * 60 * 60 * 1000)

    // Create the breeding record
    const record = await db.breedingRecord.create({
      data: {
        damId: body.damId,
        sireId: body.sireId || null,
        aiUsed: body.aiUsed || false,
        status: body.status as BreedingStatus || 'MATED',
        matingDate,
        pregnancyCheckDate: body.pregnancyCheckDate ? new Date(body.pregnancyCheckDate) : null,
        pregnancyResult: body.pregnancyResult ?? null,
        expectedBirthDate,
        actualBirthDate: body.actualBirthDate ? new Date(body.actualBirthDate) : null,
        birthComplications: body.birthComplications || null,
        offspringBorn: body.offspringBorn || null,
        offspringAlive: body.offspringAlive || null,
        notes: body.notes || null,
        farmId: farm.id
      },
      include: {
        dam: {
          select: {
            id: true,
            unitCode: true,
            identificationNumber: true,
            species: true,
            breed: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        sire: {
          select: {
            id: true,
            unitCode: true,
            identificationNumber: true,
            species: true,
            breed: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json({ 
      success: true, 
      record,
      calculatedGestation: {
        days: gestationPeriod,
        expectedBirthDate
      }
    })
  } catch (error) {
    console.error('Error creating breeding record:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to create breeding record',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
