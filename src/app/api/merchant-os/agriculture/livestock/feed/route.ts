import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET feed records and inventory
export async function GET(request: NextRequest) {
  try {
    const merchantId = request.nextUrl.searchParams.get('merchantId')
    const farmId = request.nextUrl.searchParams.get('farmId')

    if (!merchantId) {
      return NextResponse.json({ records: [], inventory: [], stats: null, trends: [] })
    }

    const where: Record<string, unknown> = {}
    if (farmId) where.farmId = farmId

    // Get feed records
    const records = await db.feedRecord.findMany({
      where,
      include: {
        animal: {
          select: { identificationNumber: true }
        },
        camp: {
          select: { name: true }
        }
      },
      orderBy: { fedAt: 'desc' },
      take: 100
    })

    const formattedRecords = records.map(record => ({
      ...record,
      animalTag: record.animal?.identificationNumber,
      campName: record.camp?.name
    }))

    // Calculate stats
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const todayRecords = records.filter(r => new Date(r.fedAt) >= todayStart)
    const monthRecords = records.filter(r => new Date(r.fedAt) >= monthStart)

    const totalFedToday = todayRecords.reduce((sum, r) => sum + r.quantity, 0)
    const totalFedThisMonth = monthRecords.reduce((sum, r) => sum + r.quantity, 0)
    const totalCostThisMonth = monthRecords.reduce((sum, r) => sum + (r.totalCost || 0), 0)

    // Get animal count for avg consumption
    const animalCount = await db.animalUnit.count({
      where: farmId ? { farmId } : {}
    })

    const avgConsumptionPerAnimal = animalCount > 0 ? totalFedThisMonth / (animalCount * 30) : 0

    // Mock inventory (in a real app, this would be a separate model)
    const inventory = [
      {
        id: '1',
        feedType: 'HAY',
        feedName: 'Lucerne Hay',
        currentStock: 2500,
        unit: 'kg',
        minStock: 500,
        avgConsumption: 150,
        daysRemaining: 17,
        lastRestocked: new Date().toISOString(),
        unitCost: 8.50,
        totalValue: 21250
      },
      {
        id: '2',
        feedType: 'GRAIN',
        feedName: 'Maize Mix',
        currentStock: 800,
        unit: 'kg',
        minStock: 300,
        avgConsumption: 100,
        daysRemaining: 8,
        lastRestocked: new Date().toISOString(),
        unitCost: 5.50,
        totalValue: 4400
      },
      {
        id: '3',
        feedType: 'PELLETS',
        feedName: 'Cattle Pellets',
        currentStock: 150,
        unit: 'kg',
        minStock: 200,
        avgConsumption: 50,
        daysRemaining: 3,
        lastRestocked: new Date().toISOString(),
        unitCost: 12.00,
        totalValue: 1800
      }
    ]

    // Generate trends for last 30 days
    const trends = []
    for (let i = 29; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      trends.push({
        date: date.toISOString(),
        quantity: 200 + Math.random() * 100,
        cost: 1500 + Math.random() * 500
      })
    }

    const stats = {
      totalFedToday,
      totalFedThisMonth,
      totalCostThisMonth,
      avgConsumptionPerAnimal,
      feedConversionRatio: 4.5, // Would be calculated from actual weight gain data
      lowStockItems: inventory.filter(i => i.currentStock <= i.minStock).length
    }

    return NextResponse.json({
      records: formattedRecords,
      inventory,
      stats,
      trends
    })
  } catch (error) {
    console.error('Error fetching feed data:', error)
    return NextResponse.json({ records: [], inventory: [], stats: null, trends: [] })
  }
}

// POST create feed record
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

    const totalCost = data.costPerUnit && data.quantity 
      ? data.costPerUnit * data.quantity 
      : null

    const record = await db.feedRecord.create({
      data: {
        animalId: animalId || null,
        batchId: data.batchId,
        feedType: data.feedType,
        feedName: data.feedName,
        quantity: data.quantity,
        unit: data.unit,
        costPerUnit: data.costPerUnit,
        totalCost,
        proteinContent: data.proteinContent,
        energyContent: data.energyContent,
        fedAt: new Date(),
        notes: data.notes,
        campId: data.campId,
        farmId: data.farmId
      }
    })

    return NextResponse.json({ record })
  } catch (error) {
    console.error('Error creating feed record:', error)
    return NextResponse.json({ error: 'Failed to create feed record' }, { status: 500 })
  }
}
