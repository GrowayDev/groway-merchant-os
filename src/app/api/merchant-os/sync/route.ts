import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthContext, unauthorizedResponse, forbiddenResponse } from '@/lib/auth-context'



// GET /api/merchant-os/sync - Get sync status
// Security: Requires authentication. merchantId must match authenticated user's merchant.
export async function GET(request: NextRequest) {
  // Authentication check
  const context = await getAuthContext(request)
  if (!context) {
    return unauthorizedResponse('Authentication required')
  }

  try {
    const { searchParams } = new URL(request.url)
    const queryMerchantId = searchParams.get('merchantId')
    
    // Security: Validate merchantId
    let merchantId: string
    if ('merchantId' in context) {
      if (queryMerchantId && queryMerchantId !== context.merchantId) {
        if (context.role !== 'platform_admin' && context.role !== 'super_admin') {
          return forbiddenResponse('Access denied to this merchant')
        }
        merchantId = queryMerchantId
      } else {
        merchantId = context.merchantId
      }
    } else {
      if (!queryMerchantId) {
        return NextResponse.json({ error: 'merchantId is required' }, { status: 400 })
      }
      merchantId = queryMerchantId
    }
    
    // Get branches for this merchant
    const branches = await db.branch.findMany({
      where: { merchantId },
      include: {
        _count: {
          select: {
            inventory: true,
            sales: true,
          },
        },
      },
    })
    
    // Get pending transfers
    const pendingTransfers = await db.stockTransfer.findMany({
      where: {
        fromBranch: { merchantId },
        status: { in: ['pending', 'approved', 'in_transit'] },
      },
      include: {
        items: true,
        fromBranch: { select: { name: true } },
        toBranch: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })
    
    // Get sync queue status
    const syncQueue = await db.integrationConfig.findMany({
      where: { merchantId },
      select: {
        integrationType: true,
        status: true,
        lastSyncAt: true,
        lastError: true,
      },
    })
    
    return NextResponse.json({
      branches,
      pendingTransfers,
      syncQueue,
      lastSyncTime: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error getting sync status:', error)
    return NextResponse.json(
      { error: 'Failed to get sync status' },
      { status: 500 }
    )
  }
}

// POST /api/merchant-os/sync - Trigger sync
// Security: Requires authentication. merchantId must match authenticated user's merchant.
export async function POST(request: NextRequest) {
  // Authentication check
  const context = await getAuthContext(request)
  if (!context) {
    return unauthorizedResponse('Authentication required')
  }

  try {
    const body = await request.json()
    const { merchantId: bodyMerchantId, syncType, branchIds, integrationTypes } = body
    
    // Security: Validate merchantId
    let merchantId: string
    if ('merchantId' in context) {
      if (bodyMerchantId && bodyMerchantId !== context.merchantId) {
        if (context.role !== 'platform_admin' && context.role !== 'super_admin') {
          return forbiddenResponse('Access denied to this merchant')
        }
        merchantId = bodyMerchantId
      } else {
        merchantId = context.merchantId
      }
    } else {
      if (!bodyMerchantId) {
        return NextResponse.json({ error: 'merchantId is required' }, { status: 400 })
      }
      merchantId = bodyMerchantId
    }
    
    const results: any = {
      merchantId,
      syncType: syncType || 'full',
      startedAt: new Date().toISOString(),
      results: {},
    }
    
    // Sync inventory across branches
    if (syncType === 'inventory' || syncType === 'full') {
      results.results.inventory = await syncInventory(merchantId, branchIds)
    }
    
    // Sync sales data
    if (syncType === 'sales' || syncType === 'full') {
      results.results.sales = await syncSales(merchantId, branchIds)
    }
    
    // Sync with integrations
    if (syncType === 'integrations' || syncType === 'full') {
      results.results.integrations = await syncIntegrations(merchantId, integrationTypes)
    }
    
    // Sync stock transfers
    if (syncType === 'transfers' || syncType === 'full') {
      results.results.transfers = await syncTransfers(merchantId)
    }
    
    results.completedAt = new Date().toISOString()
    results.success = true
    
    // Update integration configs
    await db.integrationConfig.updateMany({
      where: { merchantId },
      data: { lastSyncAt: new Date() },
    })
    
    return NextResponse.json(results)
  } catch (error) {
    console.error('Error during sync:', error)
    return NextResponse.json(
      { error: 'Failed to sync', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Sync inventory across branches
async function syncInventory(merchantId: string, branchIds?: string[]) {
  const where: any = { merchantId }
  if (branchIds?.length) {
    where.id = { in: branchIds }
  }
  
  const branches = await db.branch.findMany({ where })
  
  const results = []
  for (const branch of branches) {
    // Get inventory for this branch
    const inventory = await db.branchInventory.findMany({
      where: { branchId: branch.id },
      include: { product: true },
    })
    
    // Calculate totals
    const totalValue = inventory.reduce((sum, item) => sum + item.totalValue, 0)
    const lowStockCount = inventory.filter(i => i.quantityAvailable <= i.reorderPoint).length
    
    // Update branch stats
    await db.branch.update({
      where: { id: branch.id },
      data: {
        inventoryValue: totalValue,
      },
    })
    
    results.push({
      branchId: branch.id,
      branchName: branch.name,
      itemCount: inventory.length,
      totalValue,
      lowStockCount,
      syncedAt: new Date().toISOString(),
    })
  }
  
  return { branches: results, totalBranches: branches.length }
}

// Sync sales data
async function syncSales(merchantId: string, branchIds?: string[]) {
  const today = new Date().toISOString().split('T')[0]
  
  const where: any = { 
    branch: { merchantId },
    saleDate: today,
  }
  if (branchIds?.length) {
    where.branchId = { in: branchIds }
  }
  
  const sales = await db.sale.findMany({
    where,
    include: {
      items: true,
      branch: { select: { name: true } },
    },
  })
  
  const byBranch = sales.reduce((acc, sale) => {
    if (!acc[sale.branchId]) {
      acc[sale.branchId] = {
        branchId: sale.branchId,
        branchName: sale.branch.name,
        totalSales: 0,
        totalRevenue: 0,
        transactionCount: 0,
      }
    }
    acc[sale.branchId].totalSales += 1
    acc[sale.branchId].totalRevenue += sale.total
    acc[sale.branchId].transactionCount += 1
    return acc
  }, {} as Record<string, any>)
  
  return {
    date: today,
    branches: Object.values(byBranch),
    totalSales: sales.length,
    totalRevenue: sales.reduce((sum, s) => sum + s.total, 0),
  }
}

// Sync with integrations
async function syncIntegrations(merchantId: string, integrationTypes?: string[]) {
  const where: any = { merchantId, status: 'connected' }
  if (integrationTypes?.length) {
    where.integrationType = { in: integrationTypes }
  }
  
  const integrations = await db.integrationConfig.findMany({ where })
  
  const results = []
  for (const integration of integrations) {
    try {
      // Simulate sync with each integration
      const syncResult = await simulateIntegrationSync(integration)
      results.push({
        type: integration.integrationType,
        name: integration.integrationName,
        status: 'success',
        recordsSynced: syncResult.recordsSynced,
        syncedAt: new Date().toISOString(),
      })
      
      // Update integration
      await db.integrationConfig.update({
        where: { id: integration.id },
        data: {
          lastSyncAt: new Date(),
          errorCount: 0,
          lastError: null,
        },
      })
    } catch (error) {
      results.push({
        type: integration.integrationType,
        name: integration.integrationName,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }
  
  return { integrations: results }
}

// Simulate integration sync
async function simulateIntegrationSync(integration: any) {
  await new Promise(resolve => setTimeout(resolve, 100))
  
  const recordsByType: Record<string, number> = {
    sars_efiling: 5,
    fnb: 45,
    capitec: 30,
    standard_bank: 35,
    absa: 28,
    whatsapp: 120,
    courier: 8,
  }
  
  return {
    recordsSynced: recordsByType[integration.integrationType] || 10,
  }
}

// Sync pending transfers
async function syncTransfers(merchantId: string) {
  const pendingTransfers = await db.stockTransfer.findMany({
    where: {
      fromBranch: { merchantId },
      status: { in: ['approved', 'in_transit'] },
    },
    include: { items: true },
  })
  
  const results = []
  for (const transfer of pendingTransfers) {
    // Check if transfer should be auto-completed
    if (transfer.status === 'in_transit' && transfer.shippedDate) {
      const shippedDate = new Date(transfer.shippedDate)
      const daysSinceShipped = Math.floor((Date.now() - shippedDate.getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysSinceShipped >= 2) {
        // Auto-complete transfer
        await db.stockTransfer.update({
          where: { id: transfer.id },
          data: {
            status: 'received',
            receivedDate: new Date().toISOString().split('T')[0],
            receivedAt: new Date(),
          },
        })
        
        // Update inventory
        for (const item of transfer.items) {
          // Increase stock at destination
          const destInventory = await db.branchInventory.findFirst({
            where: {
              branchId: transfer.toBranchId,
              productId: item.productId,
            },
          })
          
          if (destInventory) {
            await db.branchInventory.update({
              where: { id: destInventory.id },
              data: {
                quantityOnHand: { increment: item.quantityShipped },
                quantityAvailable: { increment: item.quantityShipped },
              },
            })
          }
        }
        
        results.push({
          transferId: transfer.id,
          transferNumber: transfer.transferNumber,
          status: 'auto_completed',
        })
      }
    }
  }
  
  return {
    checked: pendingTransfers.length,
    autoCompleted: results.length,
    details: results,
  }
}
