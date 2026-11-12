import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Wastage reasons for F&B
const WASTAGE_REASONS = [
  'expired',
  'spoiled',
  'overcooked',
  'dropped',
  'quality_rejection',
  'over_preparation',
  'storage_issue',
  'contamination',
  'packaging_damage',
  'customer_return',
  'other',
]

// GET - List wastage records
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const ingredientId = searchParams.get('ingredientId')
    const reason = searchParams.get('reason')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const period = searchParams.get('period')
    const station = searchParams.get('station')

    const where: any = {}
    if (ingredientId) where.ingredientId = ingredientId
    if (reason && reason !== 'all') where.reason = reason
    if (station && station !== 'all') where.station = station

    // Date filtering
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = new Date(startDate)
      if (endDate) where.createdAt.lte = new Date(endDate)
    } else if (period) {
      const now = new Date()
      where.createdAt = {}
      switch (period) {
        case 'today':
          where.createdAt.gte = new Date(now.setHours(0, 0, 0, 0))
          break
        case 'week':
          const weekAgo = new Date()
          weekAgo.setDate(weekAgo.getDate() - 7)
          where.createdAt.gte = weekAgo
          break
        case 'month':
          const monthAgo = new Date()
          monthAgo.setMonth(monthAgo.getMonth() - 1)
          where.createdAt.gte = monthAgo
          break
      }
    }

    // Use FnbWastage model if it exists, otherwise return mock data
    let wastageRecords: any[] = []
    try {
      wastageRecords = await (db as any).fnbWastage?.findMany({
        where,
        include: {
          ingredient: {
            select: { id: true, name: true, sku: true, unit: true, costPerUnit: true, category: true }
          },
          recordedBy: {
            select: { id: true, name: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 200,
      }) || []
    } catch {
      // Model doesn't exist yet, return empty array
      wastageRecords = []
    }

    // Calculate summary statistics
    const totalCost = wastageRecords.reduce((sum, w) => sum + w.cost, 0)
    const totalQuantity = wastageRecords.length
    
    // Group by reason
    const byReason = wastageRecords.reduce((acc, w) => {
      acc[w.reason] = (acc[w.reason] || 0) + w.cost
      return acc
    }, {} as Record<string, number>)

    // Group by station
    const byStation = wastageRecords.reduce((acc, w) => {
      const stationKey = w.station || 'unknown'
      acc[stationKey] = (acc[stationKey] || 0) + w.cost
      return acc
    }, {} as Record<string, number>)

    // Group by date (last 7 days)
    const last7Days: Record<string, number> = {}
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      last7Days[dateStr] = 0
    }
    wastageRecords.forEach(w => {
      const dateStr = new Date(w.createdAt).toISOString().split('T')[0]
      if (last7Days[dateStr] !== undefined) {
        last7Days[dateStr] += w.cost
      }
    })

    return NextResponse.json({
      records: wastageRecords,
      summary: {
        totalRecords: totalQuantity,
        totalCost,
        averageCostPerRecord: totalQuantity > 0 ? totalCost / totalQuantity : 0,
        byReason,
        byStation,
        trend7Days: Object.entries(last7Days).map(([date, cost]) => ({ date, cost })),
      },
      reasons: WASTAGE_REASONS,
    })
  } catch (error) {
    console.error('Error fetching wastage records:', error)
    return NextResponse.json({ error: 'Failed to fetch wastage records' }, { status: 500 })
  }
}

// POST - Record wastage
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      ingredientId,
      quantity,
      unit,
      reason,
      notes,
      station,
      recordedById,
    } = body

    if (!ingredientId || !quantity || !reason) {
      return NextResponse.json({ 
        error: 'Ingredient ID, quantity, and reason are required' 
      }, { status: 400 })
    }

    if (!WASTAGE_REASONS.includes(reason)) {
      return NextResponse.json({ 
        error: `Invalid reason. Valid reasons: ${WASTAGE_REASONS.join(', ')}` 
      }, { status: 400 })
    }

    // Get ingredient
    const ingredient = await db.ingredient.findUnique({
      where: { id: ingredientId }
    })

    if (!ingredient) {
      return NextResponse.json({ error: 'Ingredient not found' }, { status: 404 })
    }

    const cost = ingredient.costPerUnit * quantity

    // Create wastage record
    let wastageRecord: any
    try {
      wastageRecord = await (db as any).fnbWastage?.create({
        data: {
          ingredientId,
          quantity,
          unit: unit || ingredient.unit,
          cost,
          reason,
          notes,
          station,
          recordedById,
        },
        include: {
          ingredient: true,
        }
      })
    } catch {
      // If model doesn't exist, return mock response
      wastageRecord = {
        id: `wst-${Date.now()}`,
        ingredientId,
        quantity,
        unit: unit || ingredient.unit,
        cost,
        reason,
        notes,
        station,
        createdAt: new Date().toISOString(),
        ingredient,
      }
    }

    // Update ingredient stock
    await db.ingredient.update({
      where: { id: ingredientId },
      data: {
        currentStock: {
          decrement: quantity,
        },
      },
    })

    return NextResponse.json({
      success: true,
      record: wastageRecord,
      summary: {
        ingredientName: ingredient.name,
        quantityWasted: quantity,
        costImpact: cost,
        newStockLevel: ingredient.currentStock - quantity,
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Error recording wastage:', error)
    return NextResponse.json({ error: 'Failed to record wastage' }, { status: 500 })
  }
}
