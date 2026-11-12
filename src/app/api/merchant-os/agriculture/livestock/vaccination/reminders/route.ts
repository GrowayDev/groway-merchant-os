import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET vaccination reminders
export async function GET(request: NextRequest) {
  try {
    const merchantId = request.nextUrl.searchParams.get('merchantId')
    const farmId = request.nextUrl.searchParams.get('farmId')

    if (!merchantId) {
      return NextResponse.json({ reminders: [] })
    }

    const now = new Date()
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

    const where: Record<string, unknown> = {
      nextDueDate: { lte: thirtyDaysFromNow }
    }
    if (farmId) where.farmId = farmId

    // Get animals with upcoming vaccinations
    const records = await db.vaccinationRecord.findMany({
      where,
      include: {
        animal: {
          select: { identificationNumber: true, species: true }
        },
        schedule: {
          select: { name: true, reminderDaysBefore: true }
        }
      },
      orderBy: { nextDueDate: 'asc' },
      take: 50
    })

    const reminders = records.map(record => {
      const dueDate = record.nextDueDate || new Date()
      const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      
      let priority: 'high' | 'medium' | 'low' = 'low'
      if (daysUntilDue < 0) priority = 'high'
      else if (daysUntilDue <= 7) priority = 'medium'
      else priority = 'low'

      return {
        id: record.id,
        scheduleId: record.scheduleId || '',
        scheduleName: record.schedule?.name || record.vaccineName,
        animalId: record.animalId || '',
        animalTag: record.animal?.identificationNumber || record.animalId || '',
        species: record.animal?.species || 'unknown',
        dueDate: dueDate.toISOString(),
        daysUntilDue,
        priority
      }
    })

    return NextResponse.json({ reminders })
  } catch (error) {
    console.error('Error fetching vaccination reminders:', error)
    return NextResponse.json({ reminders: [] })
  }
}
