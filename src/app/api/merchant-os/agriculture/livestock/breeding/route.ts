import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { nanoid } from 'nanoid'

// POST /api/merchant-os/agriculture/livestock/breeding - Record breeding/birth event
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
    const { 
      damId, 
      sireId, 
      offspringCount, 
      actualBirthDate, 
      complications,
      // For initial breeding record
      matingDate,
      expectedBirthDate,
      aiUsed,
      // For pregnancy check
      pregnancyCheckDate,
      pregnancyResult
    } = body

    // Handle different breeding event types
    if (actualBirthDate && damId) {
      // This is a birth event
      const dam = await db.livestock.findFirst({
        where: {
          OR: [
            { id: damId },
            { identificationNumber: damId }
          ],
          merchantId
        }
      })

      if (!dam) {
        return NextResponse.json({ 
          success: false, 
          error: 'Dam (mother) not found' 
        }, { status: 404 })
      }

      // Find or create breeding record
      let breedingRecord = await db.healthRecord.findFirst({
        where: {
          livestockId: dam.id,
          recordType: 'breeding',
          description: { contains: 'pregnant' }
        },
        orderBy: { recordDate: 'desc' }
      })

      // Create a health record for the birth
      const birthRecord = await db.healthRecord.create({
        data: {
          id: `BRTH-${nanoid(8).toUpperCase()}`,
          livestockId: dam.id,
          recordType: 'birth',
          recordDate: new Date(actualBirthDate),
          description: `Gave birth to ${offspringCount || 1} offspring${complications ? `. Complications: ${complications}` : ''}`,
          notes: `Offspring count: ${offspringCount || 1}, Complications: ${complications || 'None'}`
        }
      })

      // Create offspring records if offspring count provided
      const offspring: { id: string; identificationNumber: string }[] = []
      if (offspringCount && offspringCount > 0) {
        const damSpecies = dam.animalType
        
        for (let i = 0; i < offspringCount; i++) {
          const offspringId = `ANM-${nanoid(8).toUpperCase()}`
          const newOffspring = await db.livestock.create({
            data: {
              id: offspringId,
              merchantId,
              farmId: dam.farmId,
              animalType: damSpecies,
              breed: dam.breed,
              gender: 'unknown',
              dateOfBirth: new Date(actualBirthDate),
              identificationNumber: `${dam.identificationNumber || dam.id}-${i + 1}`,
              status: 'active',
              purpose: 'commercial',
              healthStatus: 'healthy',
              updatedAt: new Date()
            }
          })
          offspring.push({
            id: newOffspring.id,
            identificationNumber: newOffspring.identificationNumber || newOffspring.id
          })
        }
      }

      return NextResponse.json({ 
        success: true, 
        birthRecord,
        offspring,
        dam: {
          id: dam.id,
          identificationNumber: dam.identificationNumber
        }
      })
    }

    if (matingDate && damId) {
      // This is a breeding/mating event
      const dam = await db.livestock.findFirst({
        where: {
          OR: [
            { id: damId },
            { identificationNumber: damId }
          ],
          merchantId
        }
      })

      if (!dam) {
        return NextResponse.json({ 
          success: false, 
          error: 'Dam (mother) not found' 
        }, { status: 404 })
      }

      // Find sire if provided
      let sire = null
      if (sireId) {
        sire = await db.livestock.findFirst({
          where: {
            OR: [
              { id: sireId },
              { identificationNumber: sireId }
            ],
            merchantId
          }
        })
      }

      // Create breeding health record
      const breedingRecord = await db.healthRecord.create({
        data: {
          id: `BRD-${nanoid(8).toUpperCase()}`,
          livestockId: dam.id,
          recordType: 'breeding',
          recordDate: new Date(matingDate),
          description: `Bred${sire ? ` with ${sire.identificationNumber || sire.id}` : ''}${aiUsed ? ' (AI)' : ''}`,
          notes: `Expected birth: ${expectedBirthDate ? new Date(expectedBirthDate).toISOString().split('T')[0] : 'TBD'}, AI: ${aiUsed ? 'Yes' : 'No'}`
        }
      })

      // Update dam status
      await db.livestock.update({
        where: { id: dam.id },
        data: {
          purpose: 'breeding',
          updatedAt: new Date()
        }
      })

      return NextResponse.json({ 
        success: true, 
        breedingRecord,
        dam: {
          id: dam.id,
          identificationNumber: dam.identificationNumber
        },
        sire: sire ? {
          id: sire.id,
          identificationNumber: sire.identificationNumber
        } : null
      })
    }

    if (pregnancyCheckDate && damId) {
      // This is a pregnancy check event
      const dam = await db.livestock.findFirst({
        where: {
          OR: [
            { id: damId },
            { identificationNumber: damId }
          ],
          merchantId
        }
      })

      if (!dam) {
        return NextResponse.json({ 
          success: false, 
          error: 'Dam (mother) not found' 
        }, { status: 404 })
      }

      // Create pregnancy check health record
      const pregnancyRecord = await db.healthRecord.create({
        data: {
          id: `PREG-${nanoid(8).toUpperCase()}`,
          livestockId: dam.id,
          recordType: 'pregnancy_check',
          recordDate: new Date(pregnancyCheckDate),
          description: pregnancyResult ? 'Confirmed pregnant' : 'Not pregnant',
          notes: `Pregnancy check result: ${pregnancyResult ? 'Positive' : 'Negative'}`
        }
      })

      return NextResponse.json({ 
        success: true, 
        pregnancyRecord,
        dam: {
          id: dam.id,
          identificationNumber: dam.identificationNumber
        }
      })
    }

    return NextResponse.json({ 
      success: false, 
      error: 'Invalid request. Provide either matingDate, actualBirthDate, or pregnancyCheckDate' 
    }, { status: 400 })
  } catch (error) {
    console.error('Error recording breeding event:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to record breeding event',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET /api/merchant-os/agriculture/livestock/breeding - Get breeding records
export async function GET(request: NextRequest) {
  try {
    const merchantId = request.nextUrl.searchParams.get('merchantId')
    const animalId = request.nextUrl.searchParams.get('animalId')

    if (!merchantId) {
      return NextResponse.json({ 
        breedingRecords: [],
        message: 'No merchant ID provided' 
      })
    }

    const where: Record<string, unknown> = {
      recordType: { in: ['breeding', 'birth', 'pregnancy_check'] },
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

    const breedingRecords = await db.healthRecord.findMany({
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
            gender: true
          }
        }
      }
    })

    return NextResponse.json({ breedingRecords })
  } catch (error) {
    console.error('Error fetching breeding records:', error)
    return NextResponse.json({ breedingRecords: [] })
  }
}
