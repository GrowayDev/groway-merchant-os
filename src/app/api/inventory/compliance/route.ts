/**
 * Inventory Compliance Report API
 * 
 * Phase 11: Compliance & Reporting
 * Generates compliance reports for regulatory requirements
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface ComplianceCheck {
  category: string
  name: string
  status: 'compliant' | 'warning' | 'violation'
  message: string
  details?: Record<string, unknown>
  severity: 'low' | 'medium' | 'high' | 'critical'
}

// GET /api/inventory/compliance - Get compliance report
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const merchantId = searchParams.get('merchantId')

    if (!merchantId) {
      return NextResponse.json({ error: 'merchantId required' }, { status: 400 })
    }

    const checks: ComplianceCheck[] = []
    let overallScore = 100

    // 1. Negative Stock Check
    const negativeStockProducts = await db.product.count({
      where: {
        merchantId,
        currentStock: { lt: 0 },
        trackInventory: true,
      },
    })

    checks.push({
      category: 'Stock Integrity',
      name: 'Negative Stock',
      status: negativeStockProducts === 0 ? 'compliant' : 'violation',
      message: negativeStockProducts === 0
        ? 'No products have negative stock'
        : `${negativeStockProducts} products have negative stock`,
      details: { count: negativeStockProducts },
      severity: 'critical',
    })
    if (negativeStockProducts > 0) overallScore -= 20

    // 2. Stock Movement Consistency
    const unexplainedMovements = await db.stockMovement.count({
      where: {
        merchantId,
        reason: null,
        type: 'adjustment',
      },
    })

    checks.push({
      category: 'Stock Integrity',
      name: 'Unexplained Adjustments',
      status: unexplainedMovements === 0 ? 'compliant' : 'warning',
      message: unexplainedMovements === 0
        ? 'All stock adjustments have documented reasons'
        : `${unexplainedMovements} adjustments lack documented reasons`,
      details: { count: unexplainedMovements },
      severity: 'medium',
    })
    if (unexplainedMovements > 0) overallScore -= 5

    // 3. Expiry Tracking Compliance
    const expiringBatches = await db.inventoryBatch.count({
      where: {
        product: { merchantId },
        status: 'active',
        expiryDate: { lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
      },
    })

    checks.push({
      category: 'Expiry Management',
      name: 'Expiring Batches',
      status: expiringBatches === 0 ? 'compliant' : 'warning',
      message: expiringBatches === 0
        ? 'No batches expiring within 7 days'
        : `${expiringBatches} batches expiring within 7 days`,
      details: { count: expiringBatches },
      severity: 'high',
    })
    if (expiringBatches > 0) overallScore -= 10

    // 4. Supplier Documentation
    const productsWithoutSupplier = await db.product.count({
      where: {
        merchantId,
        trackInventory: true,
        supplierId: null,
      },
    })

    checks.push({
      category: 'Supplier Management',
      name: 'Supplier Assignment',
      status: productsWithoutSupplier === 0 ? 'compliant' : 'warning',
      message: productsWithoutSupplier === 0
        ? 'All products have assigned suppliers'
        : `${productsWithoutSupplier} products lack supplier assignment`,
      details: { count: productsWithoutSupplier },
      severity: 'low',
    })
    if (productsWithoutSupplier > 0) overallScore -= 3

    // 5. Reorder Point Configuration
    const productsWithoutReorderPoint = await db.product.count({
      where: {
        merchantId,
        trackInventory: true,
        reorderPoint: { lte: 0 },
      },
    })

    checks.push({
      category: 'Inventory Planning',
      name: 'Reorder Configuration',
      status: productsWithoutReorderPoint === 0 ? 'compliant' : 'warning',
      message: productsWithoutReorderPoint === 0
        ? 'All products have configured reorder points'
        : `${productsWithoutReorderPoint} products lack reorder configuration`,
      details: { count: productsWithoutReorderPoint },
      severity: 'low',
    })
    if (productsWithoutReorderPoint > 0) overallScore -= 2

    // Group checks by category
    const groupedChecks = checks.reduce((acc, check) => {
      if (!acc[check.category]) {
        acc[check.category] = []
      }
      acc[check.category].push(check)
      return acc
    }, {} as Record<string, ComplianceCheck[]>)

    // Determine overall status
    let overallStatus: 'compliant' | 'warning' | 'violation' = 'compliant'
    if (checks.some(c => c.status === 'violation')) {
      overallStatus = 'violation'
    } else if (checks.some(c => c.status === 'warning')) {
      overallStatus = 'warning'
    }

    return NextResponse.json({
      reportDate: new Date().toISOString(),
      merchantId,
      overallStatus,
      overallScore: Math.max(0, overallScore),
      summary: {
        totalChecks: checks.length,
        compliant: checks.filter(c => c.status === 'compliant').length,
        warnings: checks.filter(c => c.status === 'warning').length,
        violations: checks.filter(c => c.status === 'violation').length,
      },
      checks: groupedChecks,
      recommendations: generateRecommendations(checks),
    })
  } catch (error) {
    console.error('Error generating compliance report:', error)
    return NextResponse.json({ error: 'Failed to generate compliance report' }, { status: 500 })
  }
}

function generateRecommendations(checks: ComplianceCheck[]): string[] {
  const recommendations: string[] = []

  for (const check of checks) {
    if (check.status === 'violation' || check.status === 'warning') {
      switch (check.name) {
        case 'Negative Stock':
          recommendations.push('Investigate and correct negative stock counts immediately. Review recent stock movements for discrepancies.')
          break
        case 'Unexplained Adjustments':
          recommendations.push('Ensure all stock adjustments include documented reasons for audit compliance.')
          break
        case 'Expiring Batches':
          recommendations.push('Review expiring batches and consider discounting or donating items close to expiry.')
          break
        case 'Supplier Assignment':
          recommendations.push('Assign preferred suppliers to all products to enable automated reordering.')
          break
        case 'Reorder Configuration':
          recommendations.push('Configure reorder points and quantities for all products to prevent stockouts.')
          break
      }
    }
  }

  return recommendations
}
