import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET vaccination schedules
export async function GET(request: NextRequest) {
  try {
    const merchantId = request.nextUrl.searchParams.get('merchantId')
    const farmId = request.nextUrl.searchParams.get('farmId')

    if (!merchantId) {
      return NextResponse.json({ schedules: [] })
    }

    const where: Record<string, unknown> = {}
    if (farmId) where.farmId = farmId

    const schedules = await db.vaccinationSchedule.findMany({
      where,
      include: {
        _count: {
          select: { records: true }
        }
      },
      orderBy: { name: 'asc' }
    })

    // Get animal counts for each schedule
    const schedulesWithCounts = schedules.map(schedule => ({
      ...schedule,
      animalCount: schedule._count.records
    }))

    return NextResponse.json({ schedules: schedulesWithCounts })
  } catch (error) {
    console.error('Error fetching vaccination schedules:', error)
    return NextResponse.json({ schedules: [] })
  }
}

// POST create vaccination schedule
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    const schedule = await db.vaccinationSchedule.create({
      data: {
        name: data.name,
        species: data.species,
        disease: data.disease,
        firstDoseAge: data.firstDoseAge,
        boosterInterval: data.boosterInterval,
        numberOfDoses: data.numberOfDoses || 1,
        route: data.route,
        dosage: data.dosage,
        unit: data.unit,
        description: data.description,
        reminderDaysBefore: data.reminderDaysBefore || 7,
        farmId: data.farmId
      }
    })

    return NextResponse.json({ schedule })
  } catch (error) {
    console.error('Error creating vaccination schedule:', error)
    return NextResponse.json({ error: 'Failed to create schedule' }, { status: 500 })
  }
}
