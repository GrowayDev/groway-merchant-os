import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/grosupply/supplier-score - Get all supplier scores with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const minScore = parseFloat(searchParams.get('minScore') || '0')
    const maxScore = parseFloat(searchParams.get('maxScore') || '100')
    const grade = searchParams.get('grade')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const sortBy = searchParams.get('sortBy') || 'overallScore'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // Build where clause
    const where: Record<string, unknown> = {
      overallScore: { gte: minScore, lte: maxScore }
    }
    if (grade) where.scoreGrade = grade

    // Get supplier scores with pagination
    const scores = await db.supplierPerformanceScore.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      take: limit,
      skip: offset
    })

    const total = await db.supplierPerformanceScore.count({ where })

    // Get summary stats
    const stats = await db.supplierPerformanceScore.aggregate({
      _avg: {
        overallScore: true,
        onTimeDeliveryRate: true,
        orderAccuracyRate: true,
        qualityScore: true,
        responseTimeScore: true,
        priceCompetitivenessScore: true
      },
      _min: { overallScore: true },
      _max: { overallScore: true }
    })

    // Get grade distribution
    const gradeDistribution = await db.supplierPerformanceScore.groupBy({
      by: ['scoreGrade'],
      _count: { id: true }
    })

    // Get top performers
    const topPerformers = await db.supplierPerformanceScore.findMany({
      where: { overallScore: { gte: 80 } },
      orderBy: { overallScore: 'desc' },
      take: 10
    })

    // Get suppliers needing attention
    const needsAttention = await db.supplierPerformanceScore.findMany({
      where: { overallScore: { lt: 50 } },
      orderBy: { overallScore: 'asc' },
      take: 10
    })

    // Enrich scores with supplier info
    const enrichedScores = await Promise.all(
      scores.map(async (score) => {
        const supplier = await db.supplier.findUnique({
          where: { id: score.supplierId },
          select: {
            name: true,
            code: true,
            tier: true,
            status: true,
            bbbeeLevel: true
          }
        })
        return {
          ...score,
          supplier
        }
      })
    )

    return NextResponse.json({
      scores: enrichedScores,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      },
      stats: {
        avgOverallScore: stats._avg.overallScore || 0,
        avgOnTimeDelivery: stats._avg.onTimeDeliveryRate || 0,
        avgOrderAccuracy: stats._avg.orderAccuracyRate || 0,
        avgQuality: stats._avg.qualityScore || 0,
        avgResponseTime: stats._avg.responseTimeScore || 0,
        avgPriceCompetitiveness: stats._avg.priceCompetitivenessScore || 0,
        minScore: stats._min.overallScore || 0,
        maxScore: stats._max.overallScore || 100,
        gradeDistribution: gradeDistribution.map(g => ({
          grade: g.scoreGrade,
          count: g._count.id
        }))
      },
      topPerformers,
      needsAttention
    })
  } catch (error) {
    console.error('Error fetching supplier scores:', error)
    return NextResponse.json(
      { error: 'Failed to fetch supplier scores' },
      { status: 500 }
    )
  }
}

// POST /api/grosupply/supplier-score - Calculate/recalculate supplier scores
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { supplierId, periodStart, periodEnd, forceRecalculate = false } = body

    if (!supplierId) {
      return NextResponse.json(
        { error: 'Supplier ID is required' },
        { status: 400 }
      )
    }

    // Check if score exists and was recently calculated
    const existingScore = await db.supplierPerformanceScore.findUnique({
      where: { supplierId }
    })

    if (existingScore && !forceRecalculate) {
      const lastCalculation = existingScore.lastCalculatedAt
      const hoursSinceCalculation = lastCalculation 
        ? (Date.now() - new Date(lastCalculation).getTime()) / (1000 * 60 * 60)
        : Infinity

      if (hoursSinceCalculation < 24) {
        return NextResponse.json({
          success: true,
          message: 'Score recently calculated. Use forceRecalculate=true to override.',
          score: existingScore
        })
      }
    }

    // Calculate new score
    const calculatedScore = await calculateSupplierScore(supplierId, periodStart, periodEnd)

    // Upsert the score
    const score = await db.supplierPerformanceScore.upsert({
      where: { supplierId },
      create: {
        supplierId,
        overallScore: calculatedScore.overallScore,
        scoreGrade: calculatedScore.scoreGrade,
        onTimeDeliveryRate: calculatedScore.onTimeDeliveryRate,
        onTimeDeliveryScore: calculatedScore.onTimeDeliveryScore,
        totalDeliveries: calculatedScore.totalDeliveries,
        onTimeDeliveries: calculatedScore.onTimeDeliveries,
        lateDeliveries: calculatedScore.lateDeliveries,
        avgDeliveryVariance: calculatedScore.avgDeliveryVariance,
        orderAccuracyRate: calculatedScore.orderAccuracyRate,
        orderAccuracyScore: calculatedScore.orderAccuracyScore,
        totalOrders: calculatedScore.totalOrders,
        accurateOrders: calculatedScore.accurateOrders,
        defectiveOrders: calculatedScore.defectiveOrders,
        returnRate: calculatedScore.returnRate,
        qualityScore: calculatedScore.qualityScore,
        qualityIssues: calculatedScore.qualityIssues,
        qualityComplaints: calculatedScore.qualityComplaints,
        qualityReturns: calculatedScore.qualityReturns,
        avgResponseTime: calculatedScore.avgResponseTime,
        responseTimeScore: calculatedScore.responseTimeScore,
        rfqResponseRate: calculatedScore.rfqResponseRate,
        disputeResponseTime: calculatedScore.disputeResponseTime,
        priceCompetitivenessScore: calculatedScore.priceCompetitivenessScore,
        avgPriceDeviation: calculatedScore.avgPriceDeviation,
        priceStability: calculatedScore.priceStability,
        communicationScore: calculatedScore.communicationScore,
        lastCalculatedAt: new Date(),
        calculationCount: (existingScore?.calculationCount || 0) + 1,
        periodStart: periodStart || existingScore?.periodStart,
        periodEnd: periodEnd || existingScore?.periodEnd
      },
      update: {
        overallScore: calculatedScore.overallScore,
        scoreGrade: calculatedScore.scoreGrade,
        onTimeDeliveryRate: calculatedScore.onTimeDeliveryRate,
        onTimeDeliveryScore: calculatedScore.onTimeDeliveryScore,
        totalDeliveries: calculatedScore.totalDeliveries,
        onTimeDeliveries: calculatedScore.onTimeDeliveries,
        lateDeliveries: calculatedScore.lateDeliveries,
        avgDeliveryVariance: calculatedScore.avgDeliveryVariance,
        orderAccuracyRate: calculatedScore.orderAccuracyRate,
        orderAccuracyScore: calculatedScore.orderAccuracyScore,
        totalOrders: calculatedScore.totalOrders,
        accurateOrders: calculatedScore.accurateOrders,
        defectiveOrders: calculatedScore.defectiveOrders,
        returnRate: calculatedScore.returnRate,
        qualityScore: calculatedScore.qualityScore,
        qualityIssues: calculatedScore.qualityIssues,
        qualityComplaints: calculatedScore.qualityComplaints,
        qualityReturns: calculatedScore.qualityReturns,
        avgResponseTime: calculatedScore.avgResponseTime,
        responseTimeScore: calculatedScore.responseTimeScore,
        rfqResponseRate: calculatedScore.rfqResponseRate,
        disputeResponseTime: calculatedScore.disputeResponseTime,
        priceCompetitivenessScore: calculatedScore.priceCompetitivenessScore,
        avgPriceDeviation: calculatedScore.avgPriceDeviation,
        priceStability: calculatedScore.priceStability,
        communicationScore: calculatedScore.communicationScore,
        lastCalculatedAt: new Date(),
        calculationCount: (existingScore?.calculationCount || 0) + 1,
        periodStart: periodStart || existingScore?.periodStart,
        periodEnd: periodEnd || existingScore?.periodEnd
      }
    })

    // Log individual metrics
    await logSupplierMetrics(supplierId, calculatedScore)

    return NextResponse.json({
      success: true,
      score,
      breakdown: {
        onTimeDelivery: {
          score: calculatedScore.onTimeDeliveryScore,
          weight: 0.30,
          contribution: calculatedScore.onTimeDeliveryScore * 0.30
        },
        orderAccuracy: {
          score: calculatedScore.orderAccuracyScore,
          weight: 0.25,
          contribution: calculatedScore.orderAccuracyScore * 0.25
        },
        quality: {
          score: calculatedScore.qualityScore,
          weight: 0.20,
          contribution: calculatedScore.qualityScore * 0.20
        },
        responseTime: {
          score: calculatedScore.responseTimeScore,
          weight: 0.15,
          contribution: calculatedScore.responseTimeScore * 0.15
        },
        priceCompetitiveness: {
          score: calculatedScore.priceCompetitivenessScore,
          weight: 0.10,
          contribution: calculatedScore.priceCompetitivenessScore * 0.10
        }
      }
    })
  } catch (error) {
    console.error('Error calculating supplier score:', error)
    return NextResponse.json(
      { error: 'Failed to calculate supplier score' },
      { status: 500 }
    )
  }
}

// Helper function to calculate supplier score
async function calculateSupplierScore(
  supplierId: string, 
  periodStart?: string, 
  periodEnd?: string
) {
  // In a real implementation, this would query actual order, delivery, and quality data
  // For demo, we'll generate realistic mock data based on supplier characteristics
  
  const supplier = await db.supplier.findUnique({
    where: { id: supplierId }
  })

  // Get existing performance metrics if available
  const existingMetrics = await db.supplierPerformanceMetric.findMany({
    where: {
      supplierId,
      recordedAt: {
        gte: periodStart ? new Date(periodStart) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        lte: periodEnd ? new Date(periodEnd) : new Date()
      }
    }
  })

  // Calculate on-time delivery metrics
  const totalDeliveries = existingMetrics.filter(m => m.metricType === 'delivery').length || 
    Math.floor(Math.random() * 50) + 20
  const onTimeDeliveries = Math.floor(totalDeliveries * (0.7 + Math.random() * 0.25))
  const lateDeliveries = totalDeliveries - onTimeDeliveries
  const onTimeDeliveryRate = (onTimeDeliveries / totalDeliveries) * 100
  const avgDeliveryVariance = lateDeliveries > 0 ? (Math.random() * 3) : -(Math.random() * 1)
  const onTimeDeliveryScore = Math.min(100, onTimeDeliveryRate * 1.0)

  // Calculate order accuracy metrics
  const totalOrders = Math.floor(Math.random() * 100) + 50
  const defectiveOrders = Math.floor(totalOrders * (Math.random() * 0.1))
  const accurateOrders = totalOrders - defectiveOrders
  const orderAccuracyRate = (accurateOrders / totalOrders) * 100
  const returnRate = (defectiveOrders / totalOrders) * 100
  const orderAccuracyScore = Math.min(100, orderAccuracyRate * 1.0)

  // Calculate quality metrics
  const qualityIssues = Math.floor(Math.random() * 10)
  const qualityComplaints = Math.floor(Math.random() * 5)
  const qualityReturns = Math.floor(Math.random() * 8)
  const qualityScore = Math.max(0, 100 - (qualityIssues * 3) - (qualityComplaints * 5) - (qualityReturns * 4))

  // Calculate response time metrics
  const avgResponseTime = Math.random() * 24 + 2 // 2-26 hours
  const rfqResponseRate = 70 + Math.random() * 25 // 70-95%
  const disputeResponseTime = Math.random() * 48 + 4 // 4-52 hours
  const responseTimeScore = Math.max(0, 100 - (avgResponseTime * 2) + (rfqResponseRate * 0.1))

  // Calculate price competitiveness
  const avgPriceDeviation = Math.random() * 20 - 10 // -10% to +10%
  const priceStability = 0.8 + Math.random() * 0.2 // 80-100%
  const priceCompetitivenessScore = Math.min(100, Math.max(0, 
    50 - avgPriceDeviation + (priceStability * 30)
  ))

  // Calculate communication score (derived from other metrics)
  const communicationScore = (responseTimeScore * 0.5 + qualityScore * 0.3 + orderAccuracyScore * 0.2)

  // Calculate weighted overall score
  const overallScore = 
    (onTimeDeliveryScore * 0.30) +
    (orderAccuracyScore * 0.25) +
    (qualityScore * 0.20) +
    (responseTimeScore * 0.15) +
    (priceCompetitivenessScore * 0.10)

  // Determine grade
  const scoreGrade = getGradeFromScore(overallScore)

  return {
    overallScore: Math.round(overallScore * 10) / 10,
    scoreGrade,
    onTimeDeliveryRate: Math.round(onTimeDeliveryRate * 10) / 10,
    onTimeDeliveryScore: Math.round(onTimeDeliveryScore * 10) / 10,
    totalDeliveries,
    onTimeDeliveries,
    lateDeliveries,
    avgDeliveryVariance: Math.round(avgDeliveryVariance * 10) / 10,
    orderAccuracyRate: Math.round(orderAccuracyRate * 10) / 10,
    orderAccuracyScore: Math.round(orderAccuracyScore * 10) / 10,
    totalOrders,
    accurateOrders,
    defectiveOrders,
    returnRate: Math.round(returnRate * 10) / 10,
    qualityScore: Math.round(qualityScore * 10) / 10,
    qualityIssues,
    qualityComplaints,
    qualityReturns,
    avgResponseTime: Math.round(avgResponseTime * 10) / 10,
    responseTimeScore: Math.round(responseTimeScore * 10) / 10,
    rfqResponseRate: Math.round(rfqResponseRate * 10) / 10,
    disputeResponseTime: Math.round(disputeResponseTime * 10) / 10,
    priceCompetitivenessScore: Math.round(priceCompetitivenessScore * 10) / 10,
    avgPriceDeviation: Math.round(avgPriceDeviation * 10) / 10,
    priceStability: Math.round(priceStability * 100) / 100,
    communicationScore: Math.round(communicationScore * 10) / 10
  }
}

// Helper function to get grade from score
function getGradeFromScore(score: number): string {
  if (score >= 95) return 'A+'
  if (score >= 90) return 'A'
  if (score >= 85) return 'A-'
  if (score >= 80) return 'B+'
  if (score >= 75) return 'B'
  if (score >= 70) return 'B-'
  if (score >= 65) return 'C+'
  if (score >= 60) return 'C'
  if (score >= 55) return 'C-'
  if (score >= 50) return 'D'
  return 'F'
}

// Helper function to log supplier metrics
async function logSupplierMetrics(supplierId: string, metrics: Record<string, number>) {
  const metricTypes = [
    { type: 'delivery', name: 'On-Time Delivery', value: metrics.onTimeDeliveryScore },
    { type: 'quality', name: 'Quality Score', value: metrics.qualityScore },
    { type: 'response', name: 'Response Time', value: metrics.responseTimeScore },
    { type: 'price', name: 'Price Competitiveness', value: metrics.priceCompetitivenessScore },
    { type: 'communication', name: 'Communication Score', value: metrics.communicationScore }
  ]

  for (const metric of metricTypes) {
    await db.supplierPerformanceMetric.create({
      data: {
        id: `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        supplierId,
        metricType: metric.type,
        metricName: metric.name,
        metricValue: metric.value,
        targetValue: 85,
        variancePercent: ((metric.value - 85) / 85) * 100
      }
    })
  }
}
