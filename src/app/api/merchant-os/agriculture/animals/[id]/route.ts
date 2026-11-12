import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { AnimalStatus, HealthStatus, AnimalGender, ProductionType, SystemType, AnimalClassification, WeightUnit } from '@prisma/client'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/merchant-os/agriculture/animals/[id] - Get single animal unit with all relations
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const merchantId = request.headers.get('x-merchant-id') || 
                       request.nextUrl.searchParams.get('merchantId')

    if (!merchantId) {
      return NextResponse.json({ 
        success: false,
        animal: null, 
        message: 'No merchant ID provided' 
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
        animal: null, 
        message: 'No farm found for this merchant' 
      }, { status: 404 })
    }

    // Find the animal unit by ID or unitCode or identificationNumber
    const animal = await db.animalUnit.findFirst({
      where: {
        OR: [
          { id },
          { unitCode: id },
          { identificationNumber: id }
        ],
        farmId: farm.id
      },
      include: {
        breed: {
          select: {
            id: true,
            name: true,
            species: true,
            avgBirthWeight: true,
            avgMatureWeight: true,
            avgADG: true
          }
        },
        lifecycleStage: {
          select: {
            id: true,
            name: true,
            sequence: true,
            minAgeDays: true,
            minWeight: true
          }
        },
        currentCamp: {
          select: {
            id: true,
            code: true,
            name: true,
            type: true,
            capacity: true,
            currentOccupancy: true
          }
        },
        weightRecords: {
          orderBy: { weighedAt: 'desc' },
          take: 10,
          select: {
            id: true,
            weight: true,
            weightUnit: true,
            method: true,
            bodyConditionScore: true,
            adg: true,
            weightGain: true,
            weighedAt: true,
            notes: true
          }
        },
        healthRecords: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            condition: true,
            treatment: true,
            diagnosis: true,
            startDate: true,
            endDate: true,
            status: true,
            veterinarian: true,
            notes: true
          }
        },
        breedingRecordsAsDam: {
          orderBy: { matingDate: 'desc' },
          take: 10,
          include: {
            sire: {
              select: {
                id: true,
                unitCode: true,
                identificationNumber: true
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
          }
        },
        breedingRecordsAsSire: {
          orderBy: { matingDate: 'desc' },
          take: 5,
          include: {
            dam: {
              select: {
                id: true,
                unitCode: true,
                identificationNumber: true
              }
            }
          }
        },
        offspringRecords: {
          select: {
            id: true,
            breedingRecordId: true,
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
        },
        movements: {
          orderBy: { movedAt: 'desc' },
          take: 10,
          include: {
            fromCamp: {
              select: {
                id: true,
                code: true,
                name: true
              }
            },
            toCamp: {
              select: {
                id: true,
                code: true,
                name: true
              }
            }
          }
        },
        vaccinationRecords: {
          orderBy: { administeredAt: 'desc' },
          take: 10,
          select: {
            id: true,
            vaccineName: true,
            batchNumber: true,
            administeredAt: true,
            nextDueAt: true,
            administeredBy: true,
            notes: true
          }
        },
        feedRecords: {
          orderBy: { fedAt: 'desc' },
          take: 10,
          select: {
            id: true,
            feedType: true,
            quantity: true,
            unit: true,
            fedAt: true,
            notes: true
          }
        },
        photos: {
          orderBy: { capturedAt: 'desc' },
          take: 5,
          select: {
            id: true,
            imageUrl: true,
            thumbnailUrl: true,
            capturedAt: true,
            estimatedWeight: true,
            bodyConditionScore: true,
            analysisStatus: true
          }
        },
        mortalityRecord: {
          select: {
            id: true,
            dateOfDeath: true,
            cause: true,
            disposalMethod: true,
            notes: true
          }
        },
        _count: {
          select: {
            weightRecords: true,
            healthRecords: true,
            breedingRecordsAsDam: true,
            breedingRecordsAsSire: true,
            movements: true,
            vaccinationRecords: true,
            feedRecords: true,
            photos: true
          }
        }
      }
    })

    if (!animal) {
      return NextResponse.json({ 
        success: false,
        animal: null, 
        message: 'Animal not found' 
      }, { status: 404 })
    }

    // Calculate age if birth date is available
    let ageDays = null
    let ageMonths = null
    if (animal.birthDate) {
      const now = new Date()
      const birthDate = new Date(animal.birthDate)
      const diffTime = Math.abs(now.getTime() - birthDate.getTime())
      ageDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
      ageMonths = Math.floor(ageDays / 30.44)
    }

    // Calculate weight gain trend from recent records
    const recentWeights = animal.weightRecords.slice(0, 2)
    let weightTrend = null
    if (recentWeights.length >= 2) {
      const latest = recentWeights[0].weight
      const previous = recentWeights[1].weight
      weightTrend = {
        gain: latest - previous,
        daysBetween: Math.ceil(
          (new Date(recentWeights[0].weighedAt).getTime() - 
           new Date(recentWeights[1].weighedAt).getTime()) / (1000 * 60 * 60 * 24)
        )
      }
    }

    return NextResponse.json({ 
      success: true,
      animal: {
        ...animal,
        calculatedAge: animal.birthDate ? { days: ageDays, months: ageMonths } : null,
        weightTrend
      }
    })
  } catch (error) {
    console.error('Error fetching animal unit:', error)
    return NextResponse.json({ 
      success: false,
      animal: null, 
      error: 'Failed to fetch animal unit',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// PATCH /api/merchant-os/agriculture/animals/[id] - Update animal unit
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
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
        error: 'No farm found for this merchant' 
      }, { status: 400 })
    }

    // Find the animal unit
    const existingAnimal = await db.animalUnit.findFirst({
      where: {
        OR: [
          { id },
          { unitCode: id },
          { identificationNumber: id }
        ],
        farmId: farm.id
      }
    })

    if (!existingAnimal) {
      return NextResponse.json({ 
        success: false, 
        error: 'Animal not found' 
      }, { status: 404 })
    }

    const body = await request.json()
    
    // Check if updating identification number and if it already exists
    if (body.identificationNumber && body.identificationNumber !== existingAnimal.identificationNumber) {
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

    // Validate breed if provided
    if (body.breedId !== undefined && body.breedId !== null) {
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
    if (body.lifecycleStageId !== undefined && body.lifecycleStageId !== null) {
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

    // Track camp change for occupancy update
    let oldCampId = existingAnimal.currentCampId
    let newCampId = body.currentCampId
    
    // Validate new camp if provided
    if (newCampId !== undefined && newCampId !== null) {
      const camp = await db.campPen.findFirst({
        where: { id: newCampId, farmId: farm.id }
      })
      if (!camp) {
        return NextResponse.json({ 
          success: false, 
          error: 'Invalid camp/pen ID for this farm' 
        }, { status: 400 })
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {}
    
    // Only include fields that are provided in the request
    if (body.breedId !== undefined) updateData.breedId = body.breedId || null
    if (body.productionType !== undefined) updateData.productionType = body.productionType as ProductionType
    if (body.systemType !== undefined) updateData.systemType = body.systemType as SystemType
    if (body.lifecycleStageId !== undefined) updateData.lifecycleStageId = body.lifecycleStageId || null
    if (body.classification !== undefined) updateData.classification = body.classification as AnimalClassification
    if (body.batchQuantity !== undefined) updateData.batchQuantity = parseInt(body.batchQuantity, 10)
    if (body.batchStartDate !== undefined) updateData.batchStartDate = body.batchStartDate ? new Date(body.batchStartDate) : null
    if (body.identificationNumber !== undefined) updateData.identificationNumber = body.identificationNumber
    if (body.gender !== undefined) updateData.gender = body.gender as AnimalGender
    if (body.birthDate !== undefined) updateData.birthDate = body.birthDate ? new Date(body.birthDate) : null
    if (body.damId !== undefined) updateData.damId = body.damId || null
    if (body.sireId !== undefined) updateData.sireId = body.sireId || null
    if (body.currentCampId !== undefined) updateData.currentCampId = body.currentCampId || null
    if (body.status !== undefined) updateData.status = body.status as AnimalStatus
    if (body.healthStatus !== undefined) updateData.healthStatus = body.healthStatus as HealthStatus
    if (body.currentWeight !== undefined) updateData.currentWeight = parseFloat(body.currentWeight)
    if (body.weightUnit !== undefined) updateData.weightUnit = body.weightUnit as WeightUnit
    if (body.acquiredAt !== undefined) updateData.acquiredAt = body.acquiredAt ? new Date(body.acquiredAt) : null

    // Update the animal unit
    const animal = await db.animalUnit.update({
      where: { id: existingAnimal.id },
      data: updateData,
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

    // Update camp occupancy if camp changed
    const quantity = existingAnimal.trackingType === 'BATCH' && existingAnimal.batchQuantity 
      ? existingAnimal.batchQuantity 
      : 1

    if (oldCampId && oldCampId !== newCampId) {
      // Decrement old camp occupancy
      await db.campPen.update({
        where: { id: oldCampId },
        data: { currentOccupancy: { decrement: quantity } }
      })
    }

    if (newCampId && oldCampId !== newCampId) {
      // Increment new camp occupancy
      await db.campPen.update({
        where: { id: newCampId },
        data: { currentOccupancy: { increment: quantity } }
      })
    }

    return NextResponse.json({ success: true, animal })
  } catch (error) {
    console.error('Error updating animal unit:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to update animal unit',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// DELETE /api/merchant-os/agriculture/animals/[id] - Soft delete (set status to DECEASED or SOLD)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
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
        error: 'No farm found for this merchant' 
      }, { status: 400 })
    }

    // Find the animal unit
    const existingAnimal = await db.animalUnit.findFirst({
      where: {
        OR: [
          { id },
          { unitCode: id },
          { identificationNumber: id }
        ],
        farmId: farm.id
      }
    })

    if (!existingAnimal) {
      return NextResponse.json({ 
        success: false, 
        error: 'Animal not found' 
      }, { status: 404 })
    }

    // Get deletion type from query params
    const deleteType = request.nextUrl.searchParams.get('type')?.toUpperCase() || 'SOLD'
    const validStatus = deleteType === 'DECEASED' ? 'DECEASED' : 'SOLD' as AnimalStatus
    
    // Get additional details from request body if provided
    let body = {}
    try {
      body = await request.json()
    } catch {
      // No body provided, use defaults
    }

    // Update the animal status (soft delete)
    const animal = await db.animalUnit.update({
      where: { id: existingAnimal.id },
      data: {
        status: validStatus,
        currentCampId: null // Remove from camp
      }
    })

    // Update camp occupancy if animal was in a camp
    if (existingAnimal.currentCampId) {
      const quantity = existingAnimal.trackingType === 'BATCH' && existingAnimal.batchQuantity 
        ? existingAnimal.batchQuantity 
        : 1
      
      await db.campPen.update({
        where: { id: existingAnimal.currentCampId },
        data: { currentOccupancy: { decrement: quantity } }
      })
    }

    // If deceased, create mortality record if details provided
    if (validStatus === 'DECEASED' && (body as Record<string, unknown>).dateOfDeath) {
      await db.mortalityRecord.create({
        data: {
          animalId: existingAnimal.id,
          farmId: farm.id,
          dateOfDeath: new Date((body as Record<string, unknown>).dateOfDeath as string),
          cause: (body as Record<string, unknown>).cause as string || 'Unknown',
          disposalMethod: (body as Record<string, unknown>).disposalMethod as string || 'Not specified',
          notes: (body as Record<string, unknown>).notes as string || null
        }
      })
    }

    return NextResponse.json({ 
      success: true, 
      animal,
      message: `Animal marked as ${validStatus.toLowerCase()}`
    })
  } catch (error) {
    console.error('Error deleting animal unit:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to delete animal unit',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
