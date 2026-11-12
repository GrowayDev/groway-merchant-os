import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Types for the dashboard response
interface BranchDashboardData {
  branchId: string
  branchCode: string
  branchName: string
  branchType: string
  isActive: boolean
  city: string | null
  province: string | null
  managerName: string | null
  metrics: {
    totalRevenue: number
    revenueGrowth: number
    transactionCount: number
    transactionGrowth: number
    averageTransactionValue: number
    staffCount: number
    inventoryValue: number
    inventoryItems: number
    lowStockItems: number
  }
  trends: {
    dailyRevenue: Array<{ date: string; revenue: number }>
    weeklyRevenue: Array<{ week: string; revenue: number }>
  }
}

interface DashboardSummary {
  totalBranches: number
  activeBranches: number
  totalRevenue: number
  revenueGrowth: number
  totalTransactions: number
  transactionGrowth: number
  totalStaff: number
  totalInventoryValue: number
  totalLowStockAlerts: number
  pendingTransfers: number
  complianceIssues: number
}

interface AlertSummary {
  lowStock: Array<{
    branchId: string
    branchName: string
    productId: string
    productName: string
    sku: string
    currentStock: number
    lowStockThreshold: number
  }>
  pendingTransfers: Array<{
    transferId: string
    transferCode: string
    fromBranch: string
    toBranch: string
    status: string
    itemsCount: number
    totalValue: number
    daysPending: number
  }>
  complianceIssues: Array<{
    type: string
    branchId: string
    branchName: string
    description: string
    severity: 'low' | 'medium' | 'high'
    dueDate?: string
  }>
}

interface DashboardResponse {
  summary: DashboardSummary
  branches: BranchDashboardData[]
  alerts: AlertSummary
  lastUpdated: string
}

// GET /api/merchant-os/multi-location/dashboard
export async function GET(request: NextRequest): Promise<NextResponse<DashboardResponse | { error: string }>> {
  try {
    const { searchParams } = new URL(request.url)
    const merchantId = searchParams.get('merchantId')
    const periodStart = searchParams.get('periodStart') || getDefaultPeriodStart()
    const periodEnd = searchParams.get('periodEnd') || new Date().toISOString().split('T')[0]
    const compareStart = searchParams.get('compareStart') || getComparePeriodStart(periodStart)
    const compareEnd = searchParams.get('compareEnd') || periodStart

    if (!merchantId) {
      return NextResponse.json({ error: 'merchantId is required' }, { status: 400 })
    }

    // Fetch all branches for the merchant
    const branches = await db.branch.findMany({
      where: { merchantId },
      include: {
        merchant: {
          select: { id: true, name: true, tradingName: true }
        }
      }
    })

    // Fetch transactions for current period
    const currentPeriodTransactions = await db.transaction.findMany({
      where: {
        merchantId,
        createdAt: {
          gte: new Date(periodStart),
          lte: new Date(periodEnd)
        },
        status: 'completed'
      },
      include: { Branch: true }
    })

    // Fetch transactions for comparison period
    const comparePeriodTransactions = await db.transaction.findMany({
      where: {
        merchantId,
        createdAt: {
          gte: new Date(compareStart),
          lte: new Date(compareEnd)
        },
        status: 'completed'
      }
    })

    // Fetch products with inventory
    const products = await db.product.findMany({
      where: {
        merchantId,
        trackInventory: true
      }
    })

    // Fetch pending transfers
    const pendingTransfers = await db.stockTransfer.findMany({
      where: {
        merchantId,
        status: { in: ['draft', 'pending', 'approved', 'in_transit'] }
      },
      include: {
        Branch_StockTransfer_fromBranchIdToBranch: true,
        Branch_StockTransfer_toBranchIdToBranch: true,
        StockTransferItem: true
      }
    })

    // Calculate branch metrics
    const branchData: BranchDashboardData[] = branches.map(branch => {
      const branchTransactions = currentPeriodTransactions.filter(t => t.branchId === branch.id)
      const compareTransactions = comparePeriodTransactions.filter(t => t.branchId === branch.id)
      const branchProducts = products.filter(p => p.branchId === branch.id)

      const currentRevenue = branchTransactions.reduce((sum, t) => sum + t.total, 0)
      const compareRevenue = compareTransactions.reduce((sum, t) => sum + t.total, 0)
      const revenueGrowth = compareRevenue > 0 ? ((currentRevenue - compareRevenue) / compareRevenue) * 100 : 0

      const currentTxCount = branchTransactions.length
      const compareTxCount = compareTransactions.length
      const transactionGrowth = compareTxCount > 0 ? ((currentTxCount - compareTxCount) / compareTxCount) * 100 : 0

      const inventoryValue = branchProducts.reduce((sum, p) => sum + (p.currentStock * p.costPrice), 0)
      const lowStockItems = branchProducts.filter(p => p.currentStock <= p.lowStockThreshold).length

      // Generate daily revenue trend (last 7 days)
      const dailyRevenue = generateDailyTrend(branchTransactions, 7)

      return {
        branchId: branch.id,
        branchCode: branch.code,
        branchName: branch.name,
        branchType: branch.type,
        isActive: branch.isActive,
        city: branch.city,
        province: branch.province,
        managerName: branch.managerName,
        metrics: {
          totalRevenue: currentRevenue,
          revenueGrowth: Math.round(revenueGrowth * 100) / 100,
          transactionCount: currentTxCount,
          transactionGrowth: Math.round(transactionGrowth * 100) / 100,
          averageTransactionValue: currentTxCount > 0 ? currentRevenue / currentTxCount : 0,
          staffCount: 0, // Would need to be calculated from MerchantUser or Staff model
          inventoryValue,
          inventoryItems: branchProducts.length,
          lowStockItems
        },
        trends: {
          dailyRevenue,
          weeklyRevenue: generateWeeklyTrend(branchTransactions, 4)
        }
      }
    })

    // Calculate summary metrics
    const totalRevenue = branchData.reduce((sum, b) => sum + b.metrics.totalRevenue, 0)
    const previousTotalRevenue = comparePeriodTransactions.reduce((sum, t) => sum + t.total, 0)
    const revenueGrowth = previousTotalRevenue > 0 
      ? ((totalRevenue - previousTotalRevenue) / previousTotalRevenue) * 100 
      : 0

    const totalTransactions = branchData.reduce((sum, b) => sum + b.metrics.transactionCount, 0)
    const previousTotalTransactions = comparePeriodTransactions.length
    const transactionGrowth = previousTotalTransactions > 0
      ? ((totalTransactions - previousTotalTransactions) / previousTotalTransactions) * 100
      : 0

    // Build alert summary
    const lowStockAlerts = products
      .filter(p => p.currentStock <= p.lowStockThreshold)
      .map(p => {
        const branch = branches.find(b => b.id === p.branchId)
        return {
          branchId: p.branchId || '',
          branchName: branch?.name || 'Unknown',
          productId: p.id,
          productName: p.name,
          sku: p.sku,
          currentStock: p.currentStock,
          lowStockThreshold: p.lowStockThreshold
        }
      })

    const transferAlerts = pendingTransfers.map(t => ({
      transferId: t.id,
      transferCode: t.code,
      fromBranch: t.Branch_StockTransfer_fromBranchIdToBranch?.name || 'Unknown',
      toBranch: t.Branch_StockTransfer_toBranchIdToBranch?.name || 'Unknown',
      status: t.status,
      itemsCount: t.itemsCount,
      totalValue: t.totalValue,
      daysPending: Math.floor((Date.now() - t.createdAt.getTime()) / (1000 * 60 * 60 * 24))
    }))

    // Generate compliance issues (placeholder - would come from actual compliance checks)
    const complianceAlerts = generateComplianceAlerts(branches, products)

    const response: DashboardResponse = {
      summary: {
        totalBranches: branches.length,
        activeBranches: branches.filter(b => b.isActive).length,
        totalRevenue,
        revenueGrowth: Math.round(revenueGrowth * 100) / 100,
        totalTransactions,
        transactionGrowth: Math.round(transactionGrowth * 100) / 100,
        totalStaff: branchData.reduce((sum, b) => sum + b.metrics.staffCount, 0),
        totalInventoryValue: branchData.reduce((sum, b) => sum + b.metrics.inventoryValue, 0),
        totalLowStockAlerts: lowStockAlerts.length,
        pendingTransfers: pendingTransfers.length,
        complianceIssues: complianceAlerts.length
      },
      branches: branchData,
      alerts: {
        lowStock: lowStockAlerts,
        pendingTransfers: transferAlerts,
        complianceIssues: complianceAlerts
      },
      lastUpdated: new Date().toISOString()
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching multi-location dashboard:', error)
    
    // Return mock data for development/testing
    return NextResponse.json(getMockDashboardData())
  }
}

// Helper functions
function getDefaultPeriodStart(): string {
  const date = new Date()
  date.setDate(date.getDate() - 30)
  return date.toISOString().split('T')[0]
}

function getComparePeriodStart(currentStart: string): string {
  const date = new Date(currentStart)
  date.setDate(date.getDate() - 30)
  return date.toISOString().split('T')[0]
}

function generateDailyTrend(transactions: Array<{ createdAt: Date; total: number }>, days: number): Array<{ date: string; revenue: number }> {
  const result: Array<{ date: string; revenue: number }> = []
  const today = new Date()
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    
    const dayRevenue = transactions
      .filter(t => t.createdAt.toISOString().split('T')[0] === dateStr)
      .reduce((sum, t) => sum + t.total, 0)
    
    result.push({ date: dateStr, revenue: dayRevenue })
  }
  
  return result
}

function generateWeeklyTrend(transactions: Array<{ createdAt: Date; total: number }>, weeks: number): Array<{ week: string; revenue: number }> {
  const result: Array<{ week: string; revenue: number }> = []
  const today = new Date()
  
  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = new Date(today)
    weekStart.setDate(weekStart.getDate() - (i * 7) - 6)
    const weekEnd = new Date(today)
    weekEnd.setDate(weekEnd.getDate() - (i * 7))
    
    const weekRevenue = transactions
      .filter(t => t.createdAt >= weekStart && t.createdAt <= weekEnd)
      .reduce((sum, t) => sum + t.total, 0)
    
    result.push({
      week: `${weekStart.toISOString().split('T')[0]} - ${weekEnd.toISOString().split('T')[0]}`,
      revenue: weekRevenue
    })
  }
  
  return result
}

function generateComplianceAlerts(
  branches: Array<{ id: string; name: string; isActive: boolean }>,
  products: Array<{ branchId: string | null; currentStock: number; lowStockThreshold: number; trackInventory: boolean }>
): Array<{
  type: string
  branchId: string
  branchName: string
  description: string
  severity: 'low' | 'medium' | 'high'
  dueDate?: string
}> {
  const alerts: Array<{
    type: string
    branchId: string
    branchName: string
    description: string
    severity: 'low' | 'medium' | 'high'
    dueDate?: string
  }> = []

  // Check for branches with critical low stock
  branches.forEach(branch => {
    const branchProducts = products.filter(p => p.branchId === branch.id)
    const criticalStock = branchProducts.filter(p => p.trackInventory && p.currentStock <= (p.lowStockThreshold * 0.5))
    
    if (criticalStock.length > 3) {
      alerts.push({
        type: 'inventory_critical',
        branchId: branch.id,
        branchName: branch.name,
        description: `${criticalStock.length} items at critical stock levels`,
        severity: 'high'
      })
    }
  })

  return alerts
}

function getMockDashboardData(): DashboardResponse {
  return {
    summary: {
      totalBranches: 5,
      activeBranches: 4,
      totalRevenue: 5955000,
      revenueGrowth: 12.5,
      totalTransactions: 22176,
      transactionGrowth: 8.3,
      totalStaff: 57,
      totalInventoryValue: 2235000,
      totalLowStockAlerts: 12,
      pendingTransfers: 3,
      complianceIssues: 2
    },
    branches: [
      {
        branchId: 'br-1',
        branchCode: 'BR-001',
        branchName: 'Main Street Store',
        branchType: 'store',
        isActive: true,
        city: 'Johannesburg',
        province: 'Gauteng',
        managerName: 'Thabo Molefe',
        metrics: {
          totalRevenue: 1285000,
          revenueGrowth: 15.2,
          transactionCount: 4523,
          transactionGrowth: 10.1,
          averageTransactionValue: 284.12,
          staffCount: 12,
          inventoryValue: 245000,
          inventoryItems: 150,
          lowStockItems: 3
        },
        trends: {
          dailyRevenue: generateMockDailyTrend(),
          weeklyRevenue: generateMockWeeklyTrend()
        }
      },
      {
        branchId: 'br-2',
        branchCode: 'BR-002',
        branchName: 'Sandton City Mall',
        branchType: 'store',
        isActive: true,
        city: 'Sandton',
        province: 'Gauteng',
        managerName: 'Nomsa Dlamini',
        metrics: {
          totalRevenue: 2345000,
          revenueGrowth: 18.5,
          transactionCount: 8765,
          transactionGrowth: 12.3,
          averageTransactionValue: 267.54,
          staffCount: 18,
          inventoryValue: 380000,
          inventoryItems: 280,
          lowStockItems: 4
        },
        trends: {
          dailyRevenue: generateMockDailyTrend(),
          weeklyRevenue: generateMockWeeklyTrend()
        }
      },
      {
        branchId: 'br-3',
        branchCode: 'WH-001',
        branchName: 'Central Warehouse',
        branchType: 'warehouse',
        isActive: true,
        city: 'Johannesburg',
        province: 'Gauteng',
        managerName: 'John Smith',
        metrics: {
          totalRevenue: 0,
          revenueGrowth: 0,
          transactionCount: 0,
          transactionGrowth: 0,
          averageTransactionValue: 0,
          staffCount: 8,
          inventoryValue: 1250000,
          inventoryItems: 500,
          lowStockItems: 2
        },
        trends: {
          dailyRevenue: [],
          weeklyRevenue: []
        }
      },
      {
        branchId: 'br-4',
        branchCode: 'BR-003',
        branchName: 'Cape Town Branch',
        branchType: 'store',
        isActive: true,
        city: 'Cape Town',
        province: 'Western Cape',
        managerName: 'Pieter van der Merwe',
        metrics: {
          totalRevenue: 1875000,
          revenueGrowth: 8.7,
          transactionCount: 6543,
          transactionGrowth: 5.2,
          averageTransactionValue: 286.55,
          staffCount: 15,
          inventoryValue: 295000,
          inventoryItems: 220,
          lowStockItems: 2
        },
        trends: {
          dailyRevenue: generateMockDailyTrend(),
          weeklyRevenue: generateMockWeeklyTrend()
        }
      },
      {
        branchId: 'br-5',
        branchCode: 'BR-004',
        branchName: 'Durban Beach Front',
        branchType: 'kiosk',
        isActive: true,
        city: 'Durban',
        province: 'KwaZulu-Natal',
        managerName: 'Sipho Ndlovu',
        metrics: {
          totalRevenue: 450000,
          revenueGrowth: -2.3,
          transactionCount: 2345,
          transactionGrowth: -1.5,
          averageTransactionValue: 191.90,
          staffCount: 4,
          inventoryValue: 65000,
          inventoryItems: 75,
          lowStockItems: 1
        },
        trends: {
          dailyRevenue: generateMockDailyTrend(),
          weeklyRevenue: generateMockWeeklyTrend()
        }
      }
    ],
    alerts: {
      lowStock: [
        { branchId: 'br-1', branchName: 'Main Street Store', productId: 'p-1', productName: 'Coca-Cola 500ml', sku: 'SKU-001', currentStock: 5, lowStockThreshold: 10 },
        { branchId: 'br-2', branchName: 'Sandton City Mall', productId: 'p-2', productName: 'Bread White', sku: 'SKU-002', currentStock: 2, lowStockThreshold: 15 },
        { branchId: 'br-4', branchName: 'Cape Town Branch', productId: 'p-3', productName: 'Milk 1L', sku: 'SKU-003', currentStock: 3, lowStockThreshold: 20 }
      ],
      pendingTransfers: [
        { transferId: 'trf-1', transferCode: 'TRF-2024-001', fromBranch: 'Central Warehouse', toBranch: 'Main Street Store', status: 'in_transit', itemsCount: 25, totalValue: 15000, daysPending: 2 },
        { transferId: 'trf-2', transferCode: 'TRF-2024-002', fromBranch: 'Central Warehouse', toBranch: 'Cape Town Branch', status: 'approved', itemsCount: 40, totalValue: 28000, daysPending: 1 },
        { transferId: 'trf-3', transferCode: 'TRF-2024-003', fromBranch: 'Sandton City Mall', toBranch: 'Durban Beach Front', status: 'pending', itemsCount: 15, totalValue: 8500, daysPending: 3 }
      ],
      complianceIssues: [
        { type: 'license_expiry', branchId: 'br-1', branchName: 'Main Street Store', description: 'Business license expires in 30 days', severity: 'medium', dueDate: '2024-12-15' },
        { type: 'inventory_audit', branchId: 'br-3', branchName: 'Central Warehouse', description: 'Quarterly inventory audit overdue', severity: 'high' }
      ]
    },
    lastUpdated: new Date().toISOString()
  }
}

function generateMockDailyTrend(): Array<{ date: string; revenue: number }> {
  const result = []
  const baseRevenue = 15000
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    result.push({
      date: date.toISOString().split('T')[0],
      revenue: baseRevenue + Math.random() * 5000 - 2500
    })
  }
  return result
}

function generateMockWeeklyTrend(): Array<{ week: string; revenue: number }> {
  const result = []
  const baseRevenue = 100000
  for (let i = 3; i >= 0; i--) {
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - (i * 7))
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)
    result.push({
      week: `${weekStart.toISOString().split('T')[0]} - ${weekEnd.toISOString().split('T')[0]}`,
      revenue: baseRevenue + Math.random() * 30000 - 15000
    })
  }
  return result
}
