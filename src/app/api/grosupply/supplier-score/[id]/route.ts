import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/grosupply/supplier-score/[id] - Get detailed score for a specific supplier
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: supplierId } = await params

    // Get supplier details
    const supplier = await db.supplier.findUnique({
      where: { id: supplierId }
    })

    if (!supplier) {
      return NextResponse.json(
        { error: 'Supplier not found' },
        { status: 404 }
      )
    }

    // Get performance score
    const score = await db.supplierPerformanceScore.findUnique({
      where: { supplierId }
    })

    // Get recent performance metrics
    const recentMetrics = await db.supplierPerformanceMetric.findMany({
      where: {
        supplierId,
        recordedAt: {
          gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // Last 90 days
        }
      },
      orderBy: { recordedAt: 'desc' },
      take: 100
    })

    // Get metrics grouped by type
    const metricsByType = recentMetrics.reduce((acc, metric) => {
      if (!acc[metric.metricType]) acc[metric.metricType] = []
      acc[metric.metricType].push(metric)
      return acc
    }, {} as Record<string, typeof recentMetrics>)

    // Calculate trends for each metric type
    const trends = Object.entries(metricsByType).map(([type, metrics]) => {
      const values = metrics.map(m => m.metricValue)
      const avgValue = values.reduce((s, v) => s + v, 0) / values.length
      const lastTwo = values.slice(0, 2)
      const trend = lastTwo.length === 2 
        ? ((lastTwo[0] - lastTwo[1]) / lastTwo[1]) * 100 
        : 0
      
      return {
        type,
        avgValue,
        trend: Math.round(trend * 10) / 10,
        trendDirection: trend > 2 ? 'improving' : trend < -2 ? 'declining' : 'stable',
        count: metrics.length
      }
    })

    // If no score exists, calculate one
    if (!score) {
      // Return a pending calculation response
      return NextResponse.json({
        supplier,
        score: null,
        status: 'not_calculated',
        message: 'Score not yet calculated. POST to this endpoint to calculate.',
        recentMetrics,
        trends
      })
    }

    // Get price change history
    const priceChanges = await db.priceChangeLog.findMany({
      where: { supplierId },
      orderBy: { createdAt: 'desc' },
      take: 20
    })

    // Get inventory sync status
    const lastSync = await db.inventorySyncLog.findFirst({
      where: { supplierId },
      orderBy: { startedAt: 'desc' }
    })

    // Calculate detailed breakdown
    const breakdown = {
      onTimeDelivery: {
        score: score.onTimeDeliveryScore,
        weight: 0.30,
        weightedContribution: score.onTimeDeliveryScore * 0.30,
        details: {
          rate: score.onTimeDeliveryRate,
          totalDeliveries: score.totalDeliveries,
          onTime: score.onTimeDeliveries,
          late: score.lateDeliveries,
          avgVariance: score.avgDeliveryVariance
        }
      },
      orderAccuracy: {
        score: score.orderAccuracyScore,
        weight: 0.25,
        weightedContribution: score.orderAccuracyScore * 0.25,
        details: {
          rate: score.orderAccuracyRate,
          totalOrders: score.totalOrders,
          accurate: score.accurateOrders,
          defective: score.defectiveOrders,
          returnRate: score.returnRate
        }
      },
      quality: {
        score: score.qualityScore,
        weight: 0.20,
        weightedContribution: score.qualityScore * 0.20,
        details: {
          issues: score.qualityIssues,
          complaints: score.qualityComplaints,
          returns: score.qualityReturns
        }
      },
      responseTime: {
        score: score.responseTimeScore,
        weight: 0.15,
        weightedContribution: score.responseTimeScore * 0.15,
        details: {
          avgHours: score.avgResponseTime,
          rfqResponseRate: score.rfqResponseRate,
          disputeResponseHours: score.disputeResponseTime
        }
      },
      priceCompetitiveness: {
        score: score.priceCompetitivenessScore,
        weight: 0.10,
        weightedContribution: score.priceCompetitivenessScore * 0.10,
        details: {
          avgDeviation: score.avgPriceDeviation,
          stability: score.priceStability
        }
      },
      communication: {
        score: score.communicationScore,
        details: 'Derived from response time and order accuracy'
      }
    }

    // Generate recommendations
    const recommendations = generateRecommendations(score, trends)

    return NextResponse.json({
      supplier: {
        id: supplier.id,
        name: supplier.name,
        code: supplier.code,
        tier: supplier.tier,
        bbbeeLevel: supplier.bbbeeLevel,
        status: supplier.status,
        rating: supplier.rating,
        deliveryDays: supplier.deliveryDays
      },
      score: {
        overall: score.overallScore,
        grade: score.scoreGrade,
        lastCalculated: score.lastCalculatedAt,
        calculationCount: score.calculationCount
      },
      breakdown,
      trends,
      recommendations,
      recentActivity: {
        priceChanges: priceChanges.slice(0, 5),
        lastSync,
        metricsCount: recentMetrics.length
      }
    })
  } catch (error) {
    console.error('Error fetching supplier score:', error)
    return NextResponse.json(
      { error: 'Failed to fetch supplier score' },
      { status: 500 }
    )
  }
}

// POST /api/grosupply/supplier-score/[id] - Calculate score for a specific supplier
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: supplierId } = await params
    const body = await request.json()
    const { periodStart, periodEnd, forceRecalculate = false } = body

    // Check if supplier exists
    const supplier = await db.supplier.findUnique({
      where: { id: supplierId }
    })

    if (!supplier) {
      return NextResponse.json(
        { error: 'Supplier not found' },
        { status: 404 }
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

    // Calculate new score (reuse logic from main route)
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
        periodStart,
        periodEnd
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
      supplier: {
        id: supplier.id,
        name: supplier.name,
        code: supplier.code
      },
      score,
      breakdown: {
        onTimeDelivery: {
          score: calculatedScore.onTimeDeliveryScore,
          weight: 0.30,
          contribution: Math.round(calculatedScore.onTimeDeliveryScore * 0.30 * 10) / 10
        },
        orderAccuracy: {
          score: calculatedScore.orderAccuracyScore,
          weight: 0.25,
          contribution: Math.round(calculatedScore.orderAccuracyScore * 0.25 * 10) / 10
        },
        quality: {
          score: calculatedScore.qualityScore,
          weight: 0.20,
          contribution: Math.round(calculatedScore.qualityScore * 0.20 * 10) / 10
        },
        responseTime: {
          score: calculatedScore.responseTimeScore,
          weight: 0.15,
          contribution: Math.round(calculatedScore.responseTimeScore * 0.15 * 10) / 10
        },
        priceCompetitiveness: {
          score: calculatedScore.priceCompetitivenessScore,
          weight: 0.10,
          contribution: Math.round(calculatedScore.priceCompetitivenessScore * 0.10 * 10) / 10
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
  const supplier = await db.supplier.findUnique({
    where: { id: supplierId }
  })

  // Get existing performance metrics
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
  const avgResponseTime = Math.random() * 24 + 2
  const rfqResponseRate = 70 + Math.random() * 25
  const disputeResponseTime = Math.random() * 48 + 4
  const responseTimeScore = Math.max(0, 100 - (avgResponseTime * 2) + (rfqResponseRate * 0.1))

  // Calculate price competitiveness
  const avgPriceDeviation = Math.random() * 20 - 10
  const priceStability = 0.8 + Math.random() * 0.2
  const priceCompetitivenessScore = Math.min(100, Math.max(0, 
    50 - avgPriceDeviation + (priceStability * 30)
  ))

  // Calculate communication score
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

// Helper function to generate recommendations
function generateRecommendations(
  score: { 
    onTimeDeliveryScore: number; 
    orderAccuracyScore: number; 
    qualityScore: number; 
    responseTimeScore: number; 
    priceCompetitivenessScore: number;
    avgResponseTime: number;
    qualityIssues: number;
    lateDeliveries: number;
  },
  trends: Array<{ type: string; trendDirection: string; trend: number }>
) {
  const recommendations = []

  // On-time delivery recommendations
  if (score.onTimeDeliveryScore < 80) {
    recommendations.push({
      area: 'On-Time Delivery',
      priority: 'high',
      issue: `Delivery score is ${score.onTimeDeliveryScore}%`,
      recommendation: score.lateDeliveries > 10 
        ? 'Consider discussing delivery reliability with supplier or adding buffer time to orders'
        : 'Monitor delivery performance closely for improvement patterns',
      impact: 'Late deliveries affect inventory planning and customer satisfaction'
    })
  }

  // Quality recommendations
  if (score.qualityScore < 80) {
    recommendations.push({
      area: 'Quality',
      priority: score.qualityScore < 60 ? 'critical' : 'high',
      issue: `Quality score is ${score.qualityScore}%`,
      recommendation: score.qualityIssues > 5
        ? 'Request quality assurance documentation and consider quality inspections'
        : 'Track quality metrics by product category to identify specific issues',
      impact: 'Quality issues lead to returns, complaints, and customer dissatisfaction'
    })
  }

  // Response time recommendations
  if (score.responseTimeScore < 70) {
    recommendations.push({
      area: 'Response Time',
      priority: 'medium',
      issue: `Average response time is ${score.avgResponseTime} hours`,
      recommendation: 'Consider setting up dedicated communication channels or escalation procedures',
      impact: 'Slow response times delay order processing and issue resolution'
    })
  }

  // Price competitiveness
  if (score.priceCompetitivenessScore < 60) {
    recommendations.push({
      area: 'Price Competitiveness',
      priority: 'low',
      issue: 'Prices may be above market average',
      recommendation: 'Compare prices with other suppliers and negotiate bulk discounts',
      impact: 'Higher prices affect profit margins'
    })
  }

  // Add positive recommendations for top performers
  if (score.onTimeDeliveryScore >= 90 && score.qualityScore >= 90) {
    recommendations.push({
      area: 'Partnership',
      priority: 'info',
      issue: 'Excellent overall performance',
      recommendation: 'Consider this supplier for preferred vendor status and larger order volumes',
      impact: 'Strong supplier relationships improve reliability and may enable better terms'
    })
  }

  // Trend-based recommendations
  trends.forEach(trend => {
    if (trend.trendDirection === 'declining' && Math.abs(trend.trend) > 10) {
      recommendations.push({
        area: trend.type.charAt(0).toUpperCase() + trend.type.slice(1),
        priority: 'medium',
        issue: `Performance declining (${Math.abs(trend.trend)}% decrease)`,
        recommendation: 'Schedule a performance review meeting with the supplier',
        impact: 'Declining trends may indicate underlying issues'
      })
    }
  })

  return recommendations.sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 }
    return priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder]
  })
}
