import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

/**
 * GET /api/merchant-os/inventory/products
 * List products with filtering, search, and pagination
 * 
 * Query Parameters:
 * - merchantId: (required) Filter by merchant
 * - vertical: Filter by vertical
 * - categoryId: Filter by category
 * - status: Filter by status (active, inactive, discontinued, recalled)
 * - search: Search by name, SKU, or barcode
 * - lowStock: Filter for low stock items (true/false)
 * - outOfStock: Filter for out of stock items (true/false)
 * - trackInventory: Filter by inventory tracking status
 * - batchTracking: Filter by batch tracking status
 * - expiryTracking: Filter by expiry tracking status
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 50)
 * - sortBy: Sort field (name, sku, stockQuantity, sellingPrice, createdAt)
 * - sortOrder: Sort order (asc, desc)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const merchantId = searchParams.get('merchantId')
    const vertical = searchParams.get('vertical')
    const categoryId = searchParams.get('categoryId')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const lowStock = searchParams.get('lowStock') === 'true'
    const outOfStock = searchParams.get('outOfStock') === 'true'
    const trackInventory = searchParams.get('trackInventory')
    const batchTracking = searchParams.get('batchTracking')
    const expiryTracking = searchParams.get('expiryTracking')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const sortBy = searchParams.get('sortBy') || 'name'
    const sortOrder = searchParams.get('sortOrder') || 'asc'
    const skip = (page - 1) * limit

    // Build where clause
    const where: Prisma.ProductWhereInput = {}
    
    if (merchantId) where.merchantId = merchantId
    if (categoryId) where.categoryId = categoryId
    if (status) where.status = status
    if (trackInventory !== null) where.trackInventory = trackInventory === 'true'
    if (batchTracking !== null) where.batchTracking = batchTracking === 'true'
    if (expiryTracking !== null) where.expiryTracking = expiryTracking === 'true'

    // Stock filters
    if (outOfStock) {
      where.stockQuantity = 0
    } else if (lowStock) {
      // Low stock: quantity > 0 but <= reorder point
      where.AND = [
        { stockQuantity: { gt: 0 } },
        { stockQuantity: { lte: db.product.fields.reorderPoint } }
      ]
    }

    // Search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Vertical filter (via tags or category relationship)
    if (vertical) {
      where.OR = [
        { tags: { contains: vertical, mode: 'insensitive' } },
        { category: { name: { contains: vertical, mode: 'insensitive' } } }
      ]
    }

    // Build orderBy
    const orderBy: Prisma.ProductOrderByWithRelationInput = {}
    if (sortBy === 'name' || sortBy === 'sku' || sortBy === 'stockQuantity' || sortBy === 'sellingPrice' || sortBy === 'createdAt') {
      orderBy[sortBy] = sortOrder as 'asc' | 'desc'
    } else {
      orderBy.name = 'asc'
    }

    // Get products
    const products = await db.product.findMany({
      where,
      include: {
        category: {
          select: { id: true, name: true }
        },
        variants: {
          select: {
            id: true,
            sku: true,
            name: true,
            stockQuantity: true,
            status: true
          }
        }
      },
      orderBy,
      take: limit,
      skip
    })

    const total = await db.product.count({ where })
    const totalPages = Math.ceil(total / limit)

    // Get stock status summary
    const stockSummary = await db.product.groupBy({
      by: ['status'],
      where: { merchantId: merchantId || undefined },
      _count: { id: true },
      _sum: { 
        stockQuantity: true, 
        stockValue: true 
      }
    })

    return NextResponse.json({
      data: products.map(p => {
        // Calculate stock status
        let stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock' = 'in_stock'
        if (p.stockQuantity === 0) {
          stockStatus = 'out_of_stock'
        } else if (p.stockQuantity <= p.reorderPoint) {
          stockStatus = 'low_stock'
        }

        // Calculate margin
        const margin = p.costPrice > 0 
          ? ((p.sellingPrice - p.costPrice) / p.sellingPrice) * 100 
          : 0

        return {
          id: p.id,
          sku: p.sku,
          barcode: p.barcode,
          name: p.name,
          description: p.description,
          categoryId: p.categoryId,
          categoryName: p.category?.name,
          subcategory: p.subcategory,
          tags: p.tags ? JSON.parse(p.tags) : [],
          costPrice: p.costPrice,
          sellingPrice: p.sellingPrice,
          vatRate: p.vatRate,
          vatIncluded: p.vatIncluded,
          margin: Math.round(margin * 100) / 100,
          unit: p.unit,
          unitSize: p.unitSize,
          unitMeasure: p.unitMeasure,
          packSize: p.packSize,
          brand: p.brand,
          manufacturer: p.manufacturer,
          origin: p.origin,
          status: p.status,
          isSellable: p.isSellable,
          isPurchasable: p.isPurchasable,
          isDigital: p.isDigital,
          isService: p.isService,
          trackInventory: p.trackInventory,
          batchTracking: p.batchTracking,
          expiryTracking: p.expiryTracking,
          shelfLife: p.shelfLife,
          stockQuantity: p.stockQuantity,
          stockValue: p.stockValue,
          minStockLevel: p.minStockLevel,
          maxStockLevel: p.maxStockLevel,
          reorderPoint: p.reorderPoint,
          reorderQuantity: p.reorderQuantity,
          stockStatus,
          hasVariants: p.hasVariants,
          variantsCount: p.variants?.length || 0,
          imageUrl: p.imageUrl,
          thumbnailUrl: p.thumbnailUrl,
          supplierId: p.supplierId,
          leadTimeDays: p.leadTimeDays,
          timesSold: p.timesSold,
          totalRevenue: p.totalRevenue,
          lastSoldAt: p.lastSoldAt,
          lastRestockedAt: p.lastRestockedAt,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt
        }
      }),
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      summary: stockSummary.map(s => ({
        status: s.status,
        count: s._count.id,
        totalQuantity: s._sum.stockQuantity || 0,
        totalValue: s._sum.stockValue || 0
      }))
    })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch products',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
