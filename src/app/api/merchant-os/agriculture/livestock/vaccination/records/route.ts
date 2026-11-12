import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET vaccination records
export async function GET(request: NextRequest) {
  try {
    const merchantId = request.nextUrl.searchParams.get('merchantId')
    const farmId = request.nextUrl.searchParams.get('farmId')

    if (!merchantId) {
      return NextResponse.json({ records: [] })
    }

    const where: Record<string, unknown> = {}
    if (farmId) where.farmId = farmId

    const records = await db.vaccinationRecord.findMany({
      where,
      include: {
        animal: {
          select: { identificationNumber: true }
        },
        schedule: {
          select: { name: true }
        }
      },
      orderBy: { administeredAt: 'desc' },
      take: 100
    })

    const formattedRecords = records.map(record => ({
      ...record,
      animalTag: record.animal?.identificationNumber || record.animalId,
      scheduleName: record.schedule?.name
    }))

    return NextResponse.json({ records: formattedRecords })
  } catch (error) {
    console.error('Error fetching vaccination records:', error)
    return NextResponse.json({ records: [] })
  }
}

// POST create vaccination record
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    // Find animal by tag if provided
    let animalId = data.animalId
    if (data.animalTag && !animalId) {
      const animal = await db.animalUnit.findFirst({
        where: { identificationNumber: data.animalTag }
      })
      if (animal) animalId = animal.id
    }

    const record = await db.vaccinationRecord.create({
      data: {
        animalId,
        batchId: data.batchId,
        scheduleId: data.scheduleId,
        vaccineName: data.vaccineName,
        batchNumber: data.batchNumber,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
        administeredAt: new Date(),
        administeredBy: data.administeredBy,
        nextDueDate: data.nextDueDate ? new Date(data.nextDueDate) : null,
        costPerDose: data.costPerDose,
        totalCost: data.totalCost,
        notes: data.notes,
        farmId: data.farmId
      }
    })

    return NextResponse.json({ record })
  } catch (error) {
    console.error('Error creating vaccination record:', error)
    return NextResponse.json({ error: 'Failed to create record' }, { status: 500 })
  }
}
