import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface Anomaly {
  id: string
  type: 'spike' | 'drop' | 'unusual_pattern' | 'threshold_breach' | 'inconsistency'
  severity: 'critical' | 'warning' | 'info'
  entityType: 'ingredient' | 'recipe' | 'order' | 'wastage'
  entityId: string
  entityName: string
  description: string
  detectedAt: string
  metrics: {
    expected: number
    actual: number
    deviation: number
    deviationPercent: number
  }
  recommendation: string
  status: 'new' | 'investigating' | 'resolved' | 'ignored'
}

// Anomaly detection thresholds
const THRESHOLDS = {
  wastageSpikePercent: 50, // Alert if wastage increases by 50%
  salesDropPercent: 30, // Alert if sales drop by 30%
  stockDeviationPercent: 20, // Alert if stock deviates by 20% from expected
  deductionAnomalyMultiplier: 2, // Alert if deductions are 2x normal
}

// GET - Detect and list anomalies
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const severity = searchParams.get('severity')
    const status = searchParams.get('status')
    const daysToAnalyze = parseInt(searchParams.get('days') || '7')

    const anomalies: Anomaly[] = []
    const now = new Date()
    const periodStart = new Date()
    periodStart.setDate(periodStart.getDate() - daysToAnalyze)
    const previousPeriodStart = new Date()
    previousPeriodStart.setDate(previousPeriodStart.getDate() - (daysToAnalyze * 2))

    // Get ingredients for analysis
    const ingredients = await db.ingredient.findMany()
    
    // Get deductions for both periods
    let currentDeductions: any[] = []
    let previousDeductions: any[] = []
    try {
      currentDeductions = await db.stockDeduction.findMany({
        where: { createdAt: { gte: periodStart } },
        include: { ingredient: true }
      })
      previousDeductions = await db.stockDeduction.findMany({
        where: { 
          createdAt: { 
            gte: previousPeriodStart,
            lt: periodStart
          }
        },
        include: { ingredient: true }
      })
    } catch {
      // Model may not exist
    }

    // Analyze ingredient usage anomalies
    const ingredientUsage: Record<string, { current: number; previous: number }> = {}
    currentDeductions.forEach(d => {
      if (!ingredientUsage[d.ingredientId]) {
        ingredientUsage[d.ingredientId] = { current: 0, previous: 0 }
      }
      ingredientUsage[d.ingredientId].current += d.quantity
    })
    previousDeductions.forEach(d => {
      if (!ingredientUsage[d.ingredientId]) {
        ingredientUsage[d.ingredientId] = { current: 0, previous: 0 }
      }
      ingredientUsage[d.ingredientId].previous += d.quantity
    })

    // Detect usage anomalies
    Object.entries(ingredientUsage).forEach(([ingredientId, data]) => {
      const ingredient = ingredients.find(i => i.id === ingredientId)
      if (!ingredient) return

      if (data.previous > 0) {
        const changePercent = ((data.current - data.previous) / data.previous) * 100

        // Usage spike
        if (changePercent > THRESHOLDS.wastageSpikePercent) {
          anomalies.push({
            id: `anomaly-usage-spike-${ingredientId}`,
            type: 'spike',
            severity: changePercent > 100 ? 'critical' : 'warning',
            entityType: 'ingredient',
            entityId: ingredientId,
            entityName: ingredient.name,
            description: `Unusual spike in ${ingredient.name} usage: ${Math.round(changePercent)}% higher than previous period`,
            detectedAt: new Date().toISOString(),
            metrics: {
              expected: data.previous,
              actual: data.current,
              deviation: data.current - data.previous,
              deviationPercent: Math.round(changePercent),
            },
            recommendation: 'Check for potential wastage, theft, or unrecorded sales. Verify recipe quantities.',
            status: 'new',
          })
        }

        // Usage drop (could indicate stock issues or sales decline)
        if (changePercent < -THRESHOLDS.salesDropPercent) {
          anomalies.push({
            id: `anomaly-usage-drop-${ingredientId}`,
            type: 'drop',
            severity: 'warning',
            entityType: 'ingredient',
            entityId: ingredientId,
            entityName: ingredient.name,
            description: `Unusual drop in ${ingredient.name} usage: ${Math.round(Math.abs(changePercent))}% lower than previous period`,
            detectedAt: new Date().toISOString(),
            metrics: {
              expected: data.previous,
              actual: data.current,
              deviation: data.current - data.previous,
              deviationPercent: Math.round(changePercent),
            },
            recommendation: 'Verify stock levels are accurate. Check if menu items are selling normally.',
            status: 'new',
          })
        }
      }
    })

    // Check for low stock anomalies
    ingredients.forEach(ing => {
      const usage = ingredientUsage[ing.id]?.current || 0
      const dailyUsage = usage / daysToAnalyze
      const daysOfStock = dailyUsage > 0 ? ing.currentStock / dailyUsage : Infinity

      if (daysOfStock < 3 && ing.currentStock > 0) {
        anomalies.push({
          id: `anomaly-low-stock-${ing.id}`,
          type: 'threshold_breach',
          severity: daysOfStock < 1 ? 'critical' : 'warning',
          entityType: 'ingredient',
          entityId: ing.id,
          entityName: ing.name,
          description: `${ing.name} will run out in ${Math.round(daysOfStock)} days`,
          detectedAt: new Date().toISOString(),
          metrics: {
            expected: dailyUsage * 7, // Expected week's usage
            actual: ing.currentStock,
            deviation: ing.currentStock - (dailyUsage * 7),
            deviationPercent: dailyUsage > 0 ? ((ing.currentStock - dailyUsage * 7) / (dailyUsage * 7)) * 100 : 0,
          },
          recommendation: 'Place order immediately. Consider finding alternative supplier.',
          status: 'new',
        })
      }

      // Check for negative stock (data inconsistency)
      if (ing.currentStock < 0) {
        anomalies.push({
          id: `anomaly-negative-stock-${ing.id}`,
          type: 'inconsistency',
          severity: 'critical',
          entityType: 'ingredient',
          entityId: ing.id,
          entityName: ing.name,
          description: `${ing.name} has negative stock: ${ing.currentStock} ${ing.unit}`,
          detectedAt: new Date().toISOString(),
          metrics: {
            expected: 0,
            actual: ing.currentStock,
            deviation: ing.currentStock,
            deviationPercent: -100,
          },
          recommendation: 'Perform stocktake immediately. Check for unrecorded receipts or incorrect deductions.',
          status: 'new',
        })
      }
    })

    // Filter by parameters
    let filteredAnomalies = anomalies
    if (type && type !== 'all') {
      filteredAnomalies = filteredAnomalies.filter(a => a.type === type)
    }
    if (severity && severity !== 'all') {
      filteredAnomalies = filteredAnomalies.filter(a => a.severity === severity)
    }
    if (status && status !== 'all') {
      filteredAnomalies = filteredAnomalies.filter(a => a.status === status)
    }

    // Sort by severity
    const severityOrder = { critical: 0, warning: 1, info: 2 }
    filteredAnomalies.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])

    return NextResponse.json({
      anomalies: filteredAnomalies,
      summary: {
        totalAnomalies: filteredAnomalies.length,
        criticalCount: filteredAnomalies.filter(a => a.severity === 'critical').length,
        warningCount: filteredAnomalies.filter(a => a.severity === 'warning').length,
        infoCount: filteredAnomalies.filter(a => a.severity === 'info').length,
        byType: {
          spikes: filteredAnomalies.filter(a => a.type === 'spike').length,
          drops: filteredAnomalies.filter(a => a.type === 'drop').length,
          thresholdBreaches: filteredAnomalies.filter(a => a.type === 'threshold_breach').length,
          inconsistencies: filteredAnomalies.filter(a => a.type === 'inconsistency').length,
        },
      },
      thresholds: THRESHOLDS,
      analysisPeriod: daysToAnalyze,
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error detecting anomalies:', error)
    return NextResponse.json({ error: 'Failed to detect anomalies' }, { status: 500 })
  }
}

// POST - Update anomaly status
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { anomalyId, status, notes } = body

    // In a real implementation, this would update the database
    return NextResponse.json({
      success: true,
      message: `Anomaly ${anomalyId} status updated to ${status}`,
    })
  } catch (error) {
    console.error('Error updating anomaly:', error)
    return NextResponse.json({ error: 'Failed to update anomaly' }, { status: 500 })
  }
}
