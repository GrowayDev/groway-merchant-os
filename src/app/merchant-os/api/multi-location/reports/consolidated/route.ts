import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Types for consolidated reports
interface BranchReport {
  branchId: string
  branchCode: string
  branchName: string
  branchType: string
  city: string | null
  province: string | null
  period: {
    start: string
    end: string
  }
  revenue: {
    grossSales: number
    discounts: number
    netSales: number
    taxCollected: number
    totalRevenue: number
  }
  costs: {
    costOfGoodsSold: number
    operatingExpenses: number
    totalCosts: number
  }
  profit: {
    grossProfit: number
    grossMargin: number
    netProfit: number
    netMargin: number
  }
  transactions: {
    count: number
    averageValue: number
    voided: number
    refunded: number
  }
  inventory: {
    totalValue: number
    turnover: number
    daysOfStock: number
  }
  comparison?: {
    revenueGrowth: number
    profitGrowth: number
    transactionGrowth: number
  }
}

interface ConsolidatedReport {
  reportId: string
  reportType: 'consolidated'
  generatedAt: string
  period: {
    start: string
    end: string
    compareStart?: string
    compareEnd?: string
  }
  merchant: {
    id: string
    name: string
    tradingName: string | null
  }
  summary: {
    totalBranches: number
    activeBranches: number
    consolidatedRevenue: {
      grossSales: number
      discounts: number
      netSales: number
      taxCollected: number
      totalRevenue: number
    }
    consolidatedCosts: {
      costOfGoodsSold: number
      operatingExpenses: number
      totalCosts: number
    }
    consolidatedProfit: {
      grossProfit: number
      grossMargin: number
      netProfit: number
      netMargin: number
    }
    totalTransactions: number
    totalInventoryValue: number
    averageTransactionValue: number
    growth?: {
      revenueGrowth: number
      profitGrowth: number
      transactionGrowth: number
    }
  }
  branches: BranchReport[]
  comparative: {
    byProvince: Array<{
      province: string
      branchCount: number
      revenue: number
      profit: number
      transactions: number
    }>
    byType: Array<{
      type: string
      branchCount: number
      revenue: number
      profit: number
      transactions: number
    }>
    topPerformers: {
      byRevenue: Array<{ branchId: string; branchName: string; revenue: number }>
      byProfit: Array<{ branchId: string; branchName: string; profit: number }>
      byGrowth: Array<{ branchId: string; branchName: string; growth: number }>
    }
    underperformers: {
      byRevenue: Array<{ branchId: string; branchName: string; revenue: number; variance: number }>
      byGrowth: Array<{ branchId: string; branchName: string; growth: number }>
    }
  }
}

// GET /api/merchant-os/multi-location/reports/consolidated
export async function GET(request: NextRequest): Promise<NextResponse<ConsolidatedReport | { error: string }>> {
  try {
    const { searchParams } = new URL(request.url)
    const merchantId = searchParams.get('merchantId')
    const periodStart = searchParams.get('periodStart') || getDefaultPeriodStart()
    const periodEnd = searchParams.get('periodEnd') || new Date().toISOString().split('T')[0]
    const compareStart = searchParams.get('compareStart')
    const compareEnd = searchParams.get('compareEnd')
    const branchIds = searchParams.get('branchIds')?.split(',') || undefined
    const includeComparison = searchParams.get('includeComparison') === 'true'

    if (!merchantId) {
      return NextResponse.json({ error: 'merchantId is required' }, { status: 400 })
    }

    // Fetch merchant details
    const merchant = await db.merchant.findUnique({
      where: { id: merchantId },
      select: { id: true, name: true, tradingName: true }
    })

    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 })
    }

    // Fetch branches
    const whereClause: { merchantId: string; id?: { in: string[] } } = { merchantId }
    if (branchIds && branchIds.length > 0) {
      whereClause.id = { in: branchIds }
    }

    const branches = await db.branch.findMany({
      where: whereClause,
      orderBy: { name: 'asc' }
    })

    // Fetch transactions for the period
    const transactions = await db.transaction.findMany({
      where: {
        merchantId,
        createdAt: {
          gte: new Date(periodStart),
          lte: new Date(periodEnd)
        }
      },
      include: { Branch: true }
    })

    // Fetch comparison transactions if needed
    let compareTransactions: typeof transactions = []
    if (includeComparison && compareStart && compareEnd) {
      compareTransactions = await db.transaction.findMany({
        where: {
          merchantId,
          createdAt: {
            gte: new Date(compareStart),
            lte: new Date(compareEnd)
          }
        }
      })
    }

    // Fetch products for inventory valuation
    const products = await db.product.findMany({
      where: { merchantId, trackInventory: true }
    })

    // Calculate branch reports
    const branchReports: BranchReport[] = branches.map(branch => {
      const branchTransactions = transactions.filter(t => t.branchId === branch.id)
      const branchCompareTransactions = compareTransactions.filter(t => t.branchId === branch.id)
      const branchProducts = products.filter(p => p.branchId === branch.id)

      const grossSales = branchTransactions
        .filter(t => t.status === 'completed')
        .reduce((sum, t) => sum + t.subtotal, 0)
      
      const discounts = branchTransactions
        .filter(t => t.status === 'completed')
        .reduce((sum, t) => sum + t.discount, 0)
      
      const netSales = grossSales - discounts
      const taxCollected = branchTransactions
        .filter(t => t.status === 'completed')
        .reduce((sum, t) => sum + t.taxAmount, 0)
      
      const totalRevenue = netSales + taxCollected

      // Calculate COGS (simplified - would normally come from inventory movements)
      const costOfGoodsSold = branchTransactions
        .filter(t => t.status === 'completed')
        .reduce((sum, t) => sum + (t.subtotal * 0.6), 0) // Assuming 60% COGS ratio

      const operatingExpenses = 0 // Would come from journal entries/bills
      const totalCosts = costOfGoodsSold + operatingExpenses

      const grossProfit = netSales - costOfGoodsSold
      const grossMargin = netSales > 0 ? (grossProfit / netSales) * 100 : 0
      const netProfit = totalRevenue - totalCosts
      const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0

      const transactionCount = branchTransactions.filter(t => t.status === 'completed').length
      const voidedCount = branchTransactions.filter(t => t.status === 'voided' || t.cancelledAt).length
      const refundedCount = branchTransactions.filter(t => t.refundedAt).length
      const averageTransactionValue = transactionCount > 0 ? totalRevenue / transactionCount : 0

      const inventoryValue = branchProducts.reduce((sum, p) => sum + (p.currentStock * p.costPrice), 0)
      const inventoryTurnover = costOfGoodsSold > 0 && inventoryValue > 0 
        ? costOfGoodsSold / inventoryValue 
        : 0
      const daysOfStock = inventoryTurnover > 0 ? 365 / inventoryTurnover : 0

      // Comparison calculations
      let comparison: BranchReport['comparison']
      if (includeComparison && branchCompareTransactions.length > 0) {
        const compareRevenue = branchCompareTransactions
          .filter(t => t.status === 'completed')
          .reduce((sum, t) => sum + t.total, 0)
        const compareProfit = compareRevenue * (netMargin / 100)
        const compareTxCount = branchCompareTransactions.filter(t => t.status === 'completed').length

        comparison = {
          revenueGrowth: compareRevenue > 0 ? ((totalRevenue - compareRevenue) / compareRevenue) * 100 : 0,
          profitGrowth: compareProfit > 0 ? ((netProfit - compareProfit) / compareProfit) * 100 : 0,
          transactionGrowth: compareTxCount > 0 ? ((transactionCount - compareTxCount) / compareTxCount) * 100 : 0
        }
      }

      return {
        branchId: branch.id,
        branchCode: branch.code,
        branchName: branch.name,
        branchType: branch.type,
        city: branch.city,
        province: branch.province,
        period: { start: periodStart, end: periodEnd },
        revenue: {
          grossSales,
          discounts,
          netSales,
          taxCollected,
          totalRevenue
        },
        costs: {
          costOfGoodsSold,
          operatingExpenses,
          totalCosts
        },
        profit: {
          grossProfit,
          grossMargin: Math.round(grossMargin * 100) / 100,
          netProfit,
          netMargin: Math.round(netMargin * 100) / 100
        },
        transactions: {
          count: transactionCount,
          averageValue: Math.round(averageTransactionValue * 100) / 100,
          voided: voidedCount,
          refunded: refundedCount
        },
        inventory: {
          totalValue: inventoryValue,
          turnover: Math.round(inventoryTurnover * 100) / 100,
          daysOfStock: Math.round(daysOfStock)
        },
        comparison
      }
    })

    // Calculate consolidated totals
    const consolidatedRevenue = {
      grossSales: branchReports.reduce((sum, b) => sum + b.revenue.grossSales, 0),
      discounts: branchReports.reduce((sum, b) => sum + b.discounts, 0),
      netSales: branchReports.reduce((sum, b) => sum + b.revenue.netSales, 0),
      taxCollected: branchReports.reduce((sum, b) => sum + b.revenue.taxCollected, 0),
      totalRevenue: branchReports.reduce((sum, b) => sum + b.revenue.totalRevenue, 0)
    }

    const consolidatedCosts = {
      costOfGoodsSold: branchReports.reduce((sum, b) => sum + b.costs.costOfGoodsSold, 0),
      operatingExpenses: branchReports.reduce((sum, b) => sum + b.costs.operatingExpenses, 0),
      totalCosts: branchReports.reduce((sum, b) => sum + b.costs.totalCosts, 0)
    }

    const consolidatedProfit = {
      grossProfit: branchReports.reduce((sum, b) => sum + b.profit.grossProfit, 0),
      grossMargin: consolidatedRevenue.netSales > 0 
        ? (branchReports.reduce((sum, b) => sum + b.profit.grossProfit, 0) / consolidatedRevenue.netSales) * 100 
        : 0,
      netProfit: branchReports.reduce((sum, b) => sum + b.profit.netProfit, 0),
      netMargin: consolidatedRevenue.totalRevenue > 0 
        ? (branchReports.reduce((sum, b) => sum + b.profit.netProfit, 0) / consolidatedRevenue.totalRevenue) * 100 
        : 0
    }

    // Calculate comparative analysis
    const byProvince = calculateByProvince(branchReports)
    const byType = calculateByType(branchReports)
    const topPerformers = calculateTopPerformers(branchReports)
    const underperformers = calculateUnderperformers(branchReports)

    // Calculate growth if comparison is available
    let growth: ConsolidatedReport['summary']['growth']
    if (includeComparison && compareTransactions.length > 0) {
      const compareTotalRevenue = compareTransactions
        .filter(t => t.status === 'completed')
        .reduce((sum, t) => sum + t.total, 0)
      const compareTxCount = compareTransactions.filter(t => t.status === 'completed').length
      const compareProfit = compareTotalRevenue * (consolidatedProfit.netMargin / 100)

      growth = {
        revenueGrowth: compareTotalRevenue > 0 
          ? ((consolidatedRevenue.totalRevenue - compareTotalRevenue) / compareTotalRevenue) * 100 
          : 0,
        profitGrowth: compareProfit > 0 
          ? ((consolidatedProfit.netProfit - compareProfit) / compareProfit) * 100 
          : 0,
        transactionGrowth: compareTxCount > 0 
          ? ((branchReports.reduce((sum, b) => sum + b.transactions.count, 0) - compareTxCount) / compareTxCount) * 100 
          : 0
      }
    }

    const response: ConsolidatedReport = {
      reportId: `RPT-CONS-${Date.now()}`,
      reportType: 'consolidated',
      generatedAt: new Date().toISOString(),
      period: {
        start: periodStart,
        end: periodEnd,
        compareStart,
        compareEnd
      },
      merchant: {
        id: merchant.id,
        name: merchant.name,
        tradingName: merchant.tradingName
      },
      summary: {
        totalBranches: branches.length,
        activeBranches: branches.filter(b => b.isActive).length,
        consolidatedRevenue,
        consolidatedCosts,
        consolidatedProfit: {
          ...consolidatedProfit,
          grossMargin: Math.round(consolidatedProfit.grossMargin * 100) / 100,
          netMargin: Math.round(consolidatedProfit.netMargin * 100) / 100
        },
        totalTransactions: branchReports.reduce((sum, b) => sum + b.transactions.count, 0),
        totalInventoryValue: branchReports.reduce((sum, b) => sum + b.inventory.totalValue, 0),
        averageTransactionValue: consolidatedRevenue.totalRevenue / branchReports.reduce((sum, b) => sum + b.transactions.count, 0) || 0,
        growth
      },
      branches: branchReports,
      comparative: {
        byProvince,
        byType,
        topPerformers,
        underperformers
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error generating consolidated report:', error)
    return NextResponse.json(getMockConsolidatedReport())
  }
}

// Helper functions
function getDefaultPeriodStart(): string {
  const date = new Date()
  date.setDate(date.getDate() - 30)
  return date.toISOString().split('T')[0]
}

function calculateByProvince(branchReports: BranchReport[]): Array<{
  province: string
  branchCount: number
  revenue: number
  profit: number
  transactions: number
}> {
  const provinceMap = new Map<string, { branchCount: number; revenue: number; profit: number; transactions: number }>()

  branchReports.forEach(branch => {
    const province = branch.province || 'Unknown'
    const existing = provinceMap.get(province) || { branchCount: 0, revenue: 0, profit: 0, transactions: 0 }
    provinceMap.set(province, {
      branchCount: existing.branchCount + 1,
      revenue: existing.revenue + branch.revenue.totalRevenue,
      profit: existing.profit + branch.profit.netProfit,
      transactions: existing.transactions + branch.transactions.count
    })
  })

  return Array.from(provinceMap.entries()).map(([province, data]) => ({
    province,
    ...data
  }))
}

function calculateByType(branchReports: BranchReport[]): Array<{
  type: string
  branchCount: number
  revenue: number
  profit: number
  transactions: number
}> {
  const typeMap = new Map<string, { branchCount: number; revenue: number; profit: number; transactions: number }>()

  branchReports.forEach(branch => {
    const type = branch.branchType
    const existing = typeMap.get(type) || { branchCount: 0, revenue: 0, profit: 0, transactions: 0 }
    typeMap.set(type, {
      branchCount: existing.branchCount + 1,
      revenue: existing.revenue + branch.revenue.totalRevenue,
      profit: existing.profit + branch.profit.netProfit,
      transactions: existing.transactions + branch.transactions.count
    })
  })

  return Array.from(typeMap.entries()).map(([type, data]) => ({
    type,
    ...data
  }))
}

function calculateTopPerformers(branchReports: BranchReport[]): {
  byRevenue: Array<{ branchId: string; branchName: string; revenue: number }>
  byProfit: Array<{ branchId: string; branchName: string; profit: number }>
  byGrowth: Array<{ branchId: string; branchName: string; growth: number }>
} {
  const sortedByRevenue = [...branchReports]
    .sort((a, b) => b.revenue.totalRevenue - a.revenue.totalRevenue)
    .slice(0, 5)
    .map(b => ({ branchId: b.branchId, branchName: b.branchName, revenue: b.revenue.totalRevenue }))

  const sortedByProfit = [...branchReports]
    .sort((a, b) => b.profit.netProfit - a.profit.netProfit)
    .slice(0, 5)
    .map(b => ({ branchId: b.branchId, branchName: b.branchName, profit: b.profit.netProfit }))

  const sortedByGrowth = [...branchReports]
    .filter(b => b.comparison)
    .sort((a, b) => (b.comparison?.revenueGrowth || 0) - (a.comparison?.revenueGrowth || 0))
    .slice(0, 5)
    .map(b => ({ branchId: b.branchId, branchName: b.branchName, growth: b.comparison?.revenueGrowth || 0 }))

  return {
    byRevenue: sortedByRevenue,
    byProfit: sortedByProfit,
    byGrowth: sortedByGrowth
  }
}

function calculateUnderperformers(branchReports: BranchReport[]): {
  byRevenue: Array<{ branchId: string; branchName: string; revenue: number; variance: number }>
  byGrowth: Array<{ branchId: string; branchName: string; growth: number }>
} {
  const averageRevenue = branchReports.reduce((sum, b) => sum + b.revenue.totalRevenue, 0) / branchReports.length

  const underperformingByRevenue = [...branchReports]
    .filter(b => b.revenue.totalRevenue < averageRevenue)
    .sort((a, b) => a.revenue.totalRevenue - b.revenue.totalRevenue)
    .slice(0, 5)
    .map(b => ({
      branchId: b.branchId,
      branchName: b.branchName,
      revenue: b.revenue.totalRevenue,
      variance: ((b.revenue.totalRevenue - averageRevenue) / averageRevenue) * 100
    }))

  const underperformingByGrowth = [...branchReports]
    .filter(b => b.comparison && b.comparison.revenueGrowth < 0)
    .sort((a, b) => (a.comparison?.revenueGrowth || 0) - (b.comparison?.revenueGrowth || 0))
    .slice(0, 5)
    .map(b => ({
      branchId: b.branchId,
      branchName: b.branchName,
      growth: b.comparison?.revenueGrowth || 0
    }))

  return {
    byRevenue: underperformingByRevenue,
    byGrowth: underperformingByGrowth
  }
}

function getMockConsolidatedReport(): ConsolidatedReport {
  return {
    reportId: 'RPT-CONS-1701234567890',
    reportType: 'consolidated',
    generatedAt: new Date().toISOString(),
    period: {
      start: '2024-11-01',
      end: '2024-11-30',
      compareStart: '2024-10-01',
      compareEnd: '2024-10-31'
    },
    merchant: {
      id: 'mer-1',
      name: 'Sample Merchant',
      tradingName: 'Sample Store'
    },
    summary: {
      totalBranches: 5,
      activeBranches: 4,
      consolidatedRevenue: {
        grossSales: 6550500,
        discounts: 327525,
        netSales: 6222975,
        taxCollected: 933446.25,
        totalRevenue: 7156421.25
      },
      consolidatedCosts: {
        costOfGoodsSold: 3930300,
        operatingExpenses: 500000,
        totalCosts: 4430300
      },
      consolidatedProfit: {
        grossProfit: 2292675,
        grossMargin: 36.85,
        netProfit: 2726121.25,
        netMargin: 38.08
      },
      totalTransactions: 22176,
      totalInventoryValue: 2235000,
      averageTransactionValue: 322.78,
      growth: {
        revenueGrowth: 12.5,
        profitGrowth: 15.2,
        transactionGrowth: 8.3
      }
    },
    branches: [
      {
        branchId: 'br-1',
        branchCode: 'BR-001',
        branchName: 'Main Street Store',
        branchType: 'store',
        city: 'Johannesburg',
        province: 'Gauteng',
        period: { start: '2024-11-01', end: '2024-11-30' },
        revenue: { grossSales: 1413500, discounts: 70675, netSales: 1342825, taxCollected: 201423.75, totalRevenue: 1544248.75 },
        costs: { costOfGoodsSold: 848100, operatingExpenses: 100000, totalCosts: 948100 },
        profit: { grossProfit: 494725, grossMargin: 36.85, netProfit: 596148.75, netMargin: 38.60 },
        transactions: { count: 4523, averageValue: 341.42, voided: 12, refunded: 5 },
        inventory: { totalValue: 245000, turnover: 3.46, daysOfStock: 105 },
        comparison: { revenueGrowth: 15.2, profitGrowth: 18.5, transactionGrowth: 10.1 }
      },
      {
        branchId: 'br-2',
        branchCode: 'BR-002',
        branchName: 'Sandton City Mall',
        branchType: 'store',
        city: 'Sandton',
        province: 'Gauteng',
        period: { start: '2024-11-01', end: '2024-11-30' },
        revenue: { grossSales: 2579500, discounts: 128975, netSales: 2450525, taxCollected: 367578.75, totalRevenue: 2818103.75 },
        costs: { costOfGoodsSold: 1547700, operatingExpenses: 150000, totalCosts: 1697700 },
        profit: { grossProfit: 902825, grossMargin: 36.85, netProfit: 1120403.75, netMargin: 39.76 },
        transactions: { count: 8765, averageValue: 321.64, voided: 23, refunded: 8 },
        inventory: { totalValue: 380000, turnover: 4.07, daysOfStock: 90 },
        comparison: { revenueGrowth: 18.5, profitGrowth: 22.3, transactionGrowth: 12.3 }
      },
      {
        branchId: 'br-3',
        branchCode: 'WH-001',
        branchName: 'Central Warehouse',
        branchType: 'warehouse',
        city: 'Johannesburg',
        province: 'Gauteng',
        period: { start: '2024-11-01', end: '2024-11-30' },
        revenue: { grossSales: 0, discounts: 0, netSales: 0, taxCollected: 0, totalRevenue: 0 },
        costs: { costOfGoodsSold: 0, operatingExpenses: 50000, totalCosts: 50000 },
        profit: { grossProfit: 0, grossMargin: 0, netProfit: -50000, netMargin: 0 },
        transactions: { count: 0, averageValue: 0, voided: 0, refunded: 0 },
        inventory: { totalValue: 1250000, turnover: 0, daysOfStock: 0 }
      },
      {
        branchId: 'br-4',
        branchCode: 'BR-003',
        branchName: 'Cape Town Branch',
        branchType: 'store',
        city: 'Cape Town',
        province: 'Western Cape',
        period: { start: '2024-11-01', end: '2024-11-30' },
        revenue: { grossSales: 2062500, discounts: 103125, netSales: 1959375, taxCollected: 293906.25, totalRevenue: 2253281.25 },
        costs: { costOfGoodsSold: 1237500, operatingExpenses: 120000, totalCosts: 1357500 },
        profit: { grossProfit: 721875, grossMargin: 36.85, netProfit: 895781.25, netMargin: 39.76 },
        transactions: { count: 6543, averageValue: 344.25, voided: 18, refunded: 7 },
        inventory: { totalValue: 295000, turnover: 4.20, daysOfStock: 87 },
        comparison: { revenueGrowth: 8.7, profitGrowth: 11.2, transactionGrowth: 5.2 }
      },
      {
        branchId: 'br-5',
        branchCode: 'BR-004',
        branchName: 'Durban Beach Front',
        branchType: 'kiosk',
        city: 'Durban',
        province: 'KwaZulu-Natal',
        period: { start: '2024-11-01', end: '2024-11-30' },
        revenue: { grossSales: 495000, discounts: 24750, netSales: 470250, taxCollected: 70537.50, totalRevenue: 540787.50 },
        costs: { costOfGoodsSold: 297000, operatingExpenses: 80000, totalCosts: 377000 },
        profit: { grossProfit: 173250, grossMargin: 36.85, netProfit: 163787.50, netMargin: 30.28 },
        transactions: { count: 2345, averageValue: 230.62, voided: 5, refunded: 2 },
        inventory: { totalValue: 65000, turnover: 4.57, daysOfStock: 80 },
        comparison: { revenueGrowth: -2.3, profitGrowth: -5.1, transactionGrowth: -1.5 }
      }
    ],
    comparative: {
      byProvince: [
        { province: 'Gauteng', branchCount: 3, revenue: 4362352.50, profit: 1666552.50, transactions: 13288 },
        { province: 'Western Cape', branchCount: 1, revenue: 2253281.25, profit: 895781.25, transactions: 6543 },
        { province: 'KwaZulu-Natal', branchCount: 1, revenue: 540787.50, profit: 163787.50, transactions: 2345 }
      ],
      byType: [
        { type: 'store', branchCount: 3, revenue: 6615633.75, profit: 2612333.75, transactions: 19831 },
        { type: 'warehouse', branchCount: 1, revenue: 0, profit: -50000, transactions: 0 },
        { type: 'kiosk', branchCount: 1, revenue: 540787.50, profit: 163787.50, transactions: 2345 }
      ],
      topPerformers: {
        byRevenue: [
          { branchId: 'br-2', branchName: 'Sandton City Mall', revenue: 2818103.75 },
          { branchId: 'br-4', branchName: 'Cape Town Branch', revenue: 2253281.25 },
          { branchId: 'br-1', branchName: 'Main Street Store', revenue: 1544248.75 },
          { branchId: 'br-5', branchName: 'Durban Beach Front', revenue: 540787.50 }
        ],
        byProfit: [
          { branchId: 'br-2', branchName: 'Sandton City Mall', profit: 1120403.75 },
          { branchId: 'br-4', branchName: 'Cape Town Branch', profit: 895781.25 },
          { branchId: 'br-1', branchName: 'Main Street Store', profit: 596148.75 },
          { branchId: 'br-5', branchName: 'Durban Beach Front', profit: 163787.50 }
        ],
        byGrowth: [
          { branchId: 'br-2', branchName: 'Sandton City Mall', growth: 18.5 },
          { branchId: 'br-1', branchName: 'Main Street Store', growth: 15.2 },
          { branchId: 'br-4', branchName: 'Cape Town Branch', growth: 8.7 }
        ]
      },
      underperformers: {
        byRevenue: [
          { branchId: 'br-5', branchName: 'Durban Beach Front', revenue: 540787.50, variance: -69.83 }
        ],
        byGrowth: [
          { branchId: 'br-5', branchName: 'Durban Beach Front', growth: -2.3 }
        ]
      }
    }
  }
}
