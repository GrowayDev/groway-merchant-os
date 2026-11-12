import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/merchant-os/inventory/products/[id]
 * Get detailed product information including inventory, batches, and movements
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const product = await db.product.findUnique({
      where: { id },
      include: {
        category: true,
        variants: {
          include: {
            _count: {
              select: { stockMovements: false }
            }
          }
        },
        batches: {
          where: { status: 'active' },
          orderBy: { expiryDate: 'asc' },
          take: 10
        },
        inventory: {
          include: {
            branch: {
              select: { id: true, name: true }
            }
          }
        },
        reorderRules: {
          include: {
            branch: {
              select: { id: true, name: true }
            }
          }
        },
        supplierProducts: {
          include: {
            supplier: {
              select: { id: true, name: true, code: true }
            }
          }
        },
        _count: {
          select: {
            stockMovements: true,
            expiryAlerts: true
          }
        }
      }
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Get recent movements
    const recentMovements = await db.stockMovement.findMany({
      where: { productId: id },
      orderBy: { createdAt: 'desc' },
      take: 20
    })

    // Get active expiry alerts
    const activeAlerts = await db.expiryAlert.findMany({
      where: { 
        productId: id,
        status: 'active'
      },
      include: {
        batch: {
          select: { batchNumber: true, quantityRemaining: true }
        }
      }
    })

    // Calculate stock status
    let stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock' = 'in_stock'
    if (product.stockQuantity === 0) {
      stockStatus = 'out_of_stock'
    } else if (product.stockQuantity <= product.reorderPoint) {
      stockStatus = 'low_stock'
    }

    // Calculate margin
    const margin = product.costPrice > 0 
      ? ((product.sellingPrice - product.costPrice) / product.sellingPrice) * 100 
      : 0

    // Calculate days of stock (assuming average daily sales)
    const last30DaysSales = recentMovements
      .filter(m => m.type === 'sale' && m.createdAt >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
      .reduce((sum, m) => sum + m.quantity, 0)
    const avgDailySales = last30DaysSales / 30
    const daysOfStock = avgDailySales > 0 ? Math.round(product.stockQuantity / avgDailySales) : null

    return NextResponse.json({
      data: {
        // Basic info
        id: product.id,
        sku: product.sku,
        barcode: product.barcode,
        name: product.name,
        description: product.description,
        
        // Categorization
        category: product.category ? {
          id: product.category.id,
          name: product.category.name,
          parentId: product.category.parentId
        } : null,
        subcategory: product.subcategory,
        tags: product.tags ? JSON.parse(product.tags) : [],
        
        // Pricing
        pricing: {
          costPrice: product.costPrice,
          sellingPrice: product.sellingPrice,
          vatRate: product.vatRate,
          vatIncluded: product.vatIncluded,
          markupPercent: product.markupPercent,
          marginPercent: product.marginPercent,
          calculatedMargin: Math.round(margin * 100) / 100
        },
        
        // Unit & Measurement
        unit: {
          unit: product.unit,
          unitSize: product.unitSize,
          unitMeasure: product.unitMeasure,
          packSize: product.packSize,
          packUnit: product.packUnit
        },
        
        // Product Attributes
        attributes: {
          brand: product.brand,
          manufacturer: product.manufacturer,
          origin: product.origin
        },
        
        // Status
        status: product.status,
        flags: {
          isSellable: product.isSellable,
          isPurchasable: product.isPurchasable,
          isDigital: product.isDigital,
          isService: product.isService
        },
        
        // Inventory
        inventory: {
          trackInventory: product.trackInventory,
          batchTracking: product.batchTracking,
          expiryTracking: product.expiryTracking,
          shelfLife: product.shelfLife,
          stockQuantity: product.stockQuantity,
          stockValue: product.stockValue,
          stockStatus,
          minStockLevel: product.minStockLevel,
          maxStockLevel: product.maxStockLevel,
          reorderPoint: product.reorderPoint,
          reorderQuantity: product.reorderQuantity,
          daysOfStock
        },
        
        // Branch inventory
        branchInventory: product.inventory?.map(inv => ({
          branchId: inv.branchId,
          branchName: inv.branch?.name,
          quantityOnHand: inv.quantityOnHand,
          quantityReserved: inv.quantityReserved,
          quantityAvailable: inv.quantityAvailable,
          quantityOnOrder: inv.quantityOnOrder,
          averageCost: inv.averageCost,
          totalValue: inv.totalValue,
          location: inv.location,
          reorderPoint: inv.reorderPoint,
          reorderQuantity: inv.reorderQuantity,
          currentBatch: inv.currentBatch,
          batchExpiry: inv.batchExpiry,
          lastCountedAt: inv.lastCountedAt,
          lastAdjustedAt: inv.lastAdjustedAt
        })),
        
        // Variants
        variants: product.variants?.map(v => ({
          id: v.id,
          sku: v.sku,
          name: v.name,
          barcode: v.barcode,
          attributes: v.attributes ? JSON.parse(v.attributes) : {},
          costPrice: v.costPrice,
          sellingPrice: v.sellingPrice,
          stockQuantity: v.stockQuantity,
          minStockLevel: v.minStockLevel,
          reorderPoint: v.reorderPoint,
          status: v.status,
          imageUrl: v.imageUrl,
          timesSold: v.timesSold,
          lastSoldAt: v.lastSoldAt
        })),
        
        // Active batches
        batches: product.batches?.map(b => ({
          id: b.id,
          batchNumber: b.batchNumber,
          expiryDate: b.expiryDate,
          quantityRemaining: b.quantityRemaining,
          quantityReceived: b.quantityReceived,
          unitCost: b.unitCost,
          status: b.status,
          location: {
            aisle: b.locationAisle,
            shelf: b.locationShelf,
            bin: b.locationBin
          }
        })),
        
        // Active expiry alerts
        expiryAlerts: activeAlerts.map(a => ({
          id: a.id,
          alertType: a.alertType,
          expiryDate: a.expiryDate,
          daysUntilExpiry: a.daysUntilExpiry,
          quantityAtRisk: a.quantityAtRisk,
          valueAtRisk: a.valueAtRisk,
          status: a.status,
          batchNumber: a.batch?.batchNumber
        })),
        
        // Reorder rules
        reorderRules: product.reorderRules?.map(r => ({
          id: r.id,
          branchId: r.branchId,
          branchName: r.branch?.name,
          reorderPoint: r.reorderPoint,
          reorderQuantity: r.reorderQuantity,
          maximumStock: r.maximumStock,
          leadTimeDays: r.leadTimeDays,
          safetyStock: r.safetyStock,
          preferredSupplierId: r.preferredSupplierId,
          preferredSupplierName: r.preferredSupplierName,
          autoGenerateRFQ: r.autoGenerateRFQ,
          autoGeneratePO: r.autoGeneratePO,
          reviewCycle: r.reviewCycle,
          status: r.status
        })),
        
        // Supplier info
        suppliers: product.supplierProducts?.map(sp => ({
          id: sp.id,
          supplierId: sp.supplierId,
          supplierName: sp.supplier?.name,
          supplierCode: sp.supplier?.code,
          supplierSku: sp.supplierSku,
          unitCost: sp.unitCost,
          minOrderQty: sp.minOrderQty,
          leadTimeDays: sp.leadTimeDays,
          isPreferred: sp.isPreferred
        })),
        
        // Images
        images: {
          main: product.imageUrl,
          thumbnail: product.thumbnailUrl,
          additional: product.additionalImages ? JSON.parse(product.additionalImages) : []
        },
        
        // Stats
        stats: {
          timesSold: product.timesSold,
          totalRevenue: product.totalRevenue,
          lastSoldAt: product.lastSoldAt,
          lastRestockedAt: product.lastRestockedAt,
          movementsCount: product._count?.stockMovements || 0,
          alertsCount: product._count?.expiryAlerts || 0
        },
        
        // Recent movements
        recentMovements: recentMovements.map(m => ({
          id: m.id,
          type: m.type,
          direction: m.direction,
          quantity: m.quantity,
          unit: m.unit,
          unitCost: m.unitCost,
          totalCost: m.totalCost,
          referenceType: m.referenceType,
          referenceNumber: m.referenceNumber,
          batchNumber: m.batchNumber,
          reason: m.reason,
          userName: m.userName,
          branchId: m.branchId,
          createdAt: m.createdAt
        })),
        
        // Timestamps
        createdAt: product.createdAt,
        updatedAt: product.updatedAt
      }
    })
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch product',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
