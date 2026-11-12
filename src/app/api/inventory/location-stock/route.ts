import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/permissions'

/**
 * GET /api/inventory/location-stock
 * Get stock levels for products at a specific location or all locations
 * 
 * Query params:
 * - merchantId: required
 * - branchId: optional (if not provided, returns all locations)
 * - productId: optional (if not provided, returns all products)
 */
export async function GET(request: NextRequest) {
  const permissionCheck = await checkPermission(request, 'can_view_inventory')
  
  if (!permissionCheck.allowed) {
    return permissionCheck.error
  }

  try {
    const { searchParams } = new URL(request.url)
    const merchantId = searchParams.get('merchantId')
    const branchId = searchParams.get('branchId')
    const productId = searchParams.get('productId')
    const lowStockOnly = searchParams.get('lowStockOnly') === 'true'
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    if (!merchantId) {
      return NextResponse.json(
        { error: 'merchantId is required' },
        { status: 400 }
      )
    }

    // Get all active branches for this merchant
    const branches = await db.branch.findMany({
      where: {
        merchantId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        type: true,
        code: true,
      },
    })

    // If specific product requested
    if (productId) {
      const product = await db.product.findUnique({
        where: { id: productId },
        select: { id: true, name: true, sku: true, lowStockThreshold: true },
      })

      if (!product) {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        )
      }

      const locationStock = []

      for (const branch of branches) {
        // Get batches for this product at this branch
        const batches = await db.inventoryBatch.findMany({
          where: {
            merchantId,
            branchId: branch.id,
            productId,
            status: { not: 'depleted' },
          },
          select: {
            id: true,
            batchNumber: true,
            currentQty: true,
            reservedQty: true,
            availableQty: true,
            unitCost: true,
            totalValue: true,
            expiryDate: true,
            status: true,
          },
        })

        const currentStock = batches.reduce((sum, b) => sum + b.currentQty, 0)
        const reservedStock = batches.reduce((sum, b) => sum + b.reservedQty, 0)
        const availableStock = batches.reduce((sum, b) => sum + b.availableQty, 0)
        const stockValue = batches.reduce((sum, b) => sum + (b.totalValue || 0), 0)

        // Get in-transit quantity (transfers TO this branch)
        const inTransitItems = await db.stockTransferItem.findMany({
          where: {
            productId,
            transfer: {
              merchantId,
              toBranchId: branch.id,
              status: 'in_transit',
            },
          },
          select: { quantitySent: true },
        })

        const inTransitQty = inTransitItems.reduce((sum, i) => sum + (i.quantitySent || 0), 0)

        locationStock.push({
          branch: {
            id: branch.id,
            name: branch.name,
            type: branch.type,
            code: branch.code,
          },
          product: {
            id: product.id,
            name: product.name,
            sku: product.sku,
          },
          currentStock,
          reservedStock,
          availableStock,
          inTransitQty,
          stockValue,
          batches,
          stockStatus: currentStock <= 0 ? 'out_of_stock' :
                       currentStock <= (product.lowStockThreshold || 10) ? 'low_stock' : 'in_stock',
        })
      }

      return NextResponse.json({
        success: true,
        data: {
          product,
          locations: locationStock,
          totalStock: locationStock.reduce((sum, l) => sum + l.currentStock, 0),
          totalAvailable: locationStock.reduce((sum, l) => sum + l.availableStock, 0),
          totalInTransit: locationStock.reduce((sum, l) => sum + l.inTransitQty, 0),
        },
      })
    }

    // If specific branch requested
    if (branchId) {
      const branch = branches.find(b => b.id === branchId)

      if (!branch) {
        return NextResponse.json(
          { error: 'Branch not found' },
          { status: 404 }
        )
      }

      // Build product query
      const productWhere: any = {
        merchantId,
        trackInventory: true,
        isActive: true,
      }

      if (search) {
        productWhere.OR = [
          { name: { contains: search } },
          { sku: { contains: search } },
        ]
      }

      const products = await db.product.findMany({
        where: productWhere,
        select: {
          id: true,
          name: true,
          sku: true,
          lowStockThreshold: true,
          sellingPrice: true,
          costPrice: true,
        },
        skip: (page - 1) * limit,
        take: limit,
      })

      const items = []
      let totalValue = 0
      let lowStockCount = 0
      let outOfStockCount = 0

      for (const product of products) {
        const batches = await db.inventoryBatch.findMany({
          where: {
            merchantId,
            branchId,
            productId: product.id,
            status: { not: 'depleted' },
          },
          select: {
            id: true,
            batchNumber: true,
            currentQty: true,
            availableQty: true,
            unitCost: true,
            totalValue: true,
            expiryDate: true,
            status: true,
          },
        })

        const currentStock = batches.reduce((sum, b) => sum + b.currentQty, 0)
        const availableStock = batches.reduce((sum, b) => sum + b.availableQty, 0)
        const stockValue = batches.reduce((sum, b) => sum + (b.totalValue || 0), 0)

        // Skip if low stock filter and not low
        if (lowStockOnly && currentStock > (product.lowStockThreshold || 10)) {
          continue
        }

        const stockStatus = currentStock <= 0 ? 'out_of_stock' :
                           currentStock <= (product.lowStockThreshold || 10) ? 'low_stock' : 'in_stock'

        if (currentStock <= 0) outOfStockCount++
        else if (stockStatus === 'low_stock') lowStockCount++

        totalValue += stockValue

        items.push({
          product,
          currentStock,
          availableStock,
          stockValue,
          stockStatus,
          batches,
        })
      }

      const totalProducts = await db.product.count({ where: productWhere })

      return NextResponse.json({
        success: true,
        data: {
          branch,
          items,
          stats: {
            totalProducts,
            totalValue,
            lowStockCount,
            outOfStockCount,
          },
          pagination: {
            page,
            limit,
            total: totalProducts,
            totalPages: Math.ceil(totalProducts / limit),
          },
        },
      })
    }

    // Return consolidated view across all locations
    const productWhere: any = {
      merchantId,
      trackInventory: true,
      isActive: true,
    }

    if (search) {
      productWhere.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
      ]
    }

    const products = await db.product.findMany({
      where: productWhere,
      select: {
        id: true,
        name: true,
        sku: true,
        lowStockThreshold: true,
        costPrice: true,
      },
      skip: (page - 1) * limit,
      take: limit,
    })

    const items = []

    for (const product of products) {
      // Get all batches across all branches
      const batches = await db.inventoryBatch.findMany({
        where: {
          merchantId,
          productId: product.id,
          status: { not: 'depleted' },
        },
        select: {
          branchId: true,
          currentQty: true,
          availableQty: true,
          totalValue: true,
        },
      })

      // Aggregate by branch
      const branchStock = new Map<string, { stock: number; available: number; value: number }>()

      for (const batch of batches) {
        const existing = branchStock.get(batch.branchId) || { stock: 0, available: 0, value: 0 }
        existing.stock += batch.currentQty
        existing.available += batch.availableQty
        existing.value += batch.totalValue || 0
        branchStock.set(batch.branchId, existing)
      }

      const locations = Array.from(branchStock.entries()).map(([branchId, data]) => {
        const branch = branches.find(b => b.id === branchId)
        return {
          branchId,
          branchName: branch?.name || 'Unknown',
          branchType: branch?.type || 'store',
          stock: data.stock,
          available: data.available,
          value: data.value,
        }
      })

      const totalStock = locations.reduce((sum, l) => sum + l.stock, 0)
      const totalAvailable = locations.reduce((sum, l) => sum + l.available, 0)
      const totalValue = locations.reduce((sum, l) => sum + l.value, 0)

      // Get in-transit total
      const inTransitItems = await db.stockTransferItem.findMany({
        where: {
          productId: product.id,
          transfer: {
            merchantId,
            status: 'in_transit',
          },
        },
        select: { quantitySent: true },
      })

      const totalInTransit = inTransitItems.reduce((sum, i) => sum + (i.quantitySent || 0), 0)

      const stockStatus = totalStock <= 0 ? 'out_of_stock' :
                         totalStock <= (product.lowStockThreshold || 10) ? 'low_stock' : 'in_stock'

      items.push({
        product,
        totalStock,
        totalAvailable,
        totalInTransit,
        totalValue,
        stockStatus,
        locations,
      })
    }

    const totalProducts = await db.product.count({ where: productWhere })

    return NextResponse.json({
      success: true,
      data: {
        branches,
        items,
        pagination: {
          page,
          limit,
          total: totalProducts,
          totalPages: Math.ceil(totalProducts / limit),
        },
      },
    })
  } catch (error) {
    console.error('Get location stock error:', error)
    return NextResponse.json(
      { error: 'Failed to get location stock', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
