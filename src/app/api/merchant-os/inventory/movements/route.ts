import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

/**
 * GET /api/merchant-os/inventory/movements
 * List stock movements with filtering and pagination
 * 
 * Query Parameters:
 * - merchantId: Filter by merchant
 * - productId: Filter by product
 * - branchId: Filter by branch
 * - type: Filter by movement type (sale, return, grn, adjustment, transfer_in, transfer_out, stocktake, recipe)
 * - direction: Filter by direction (in, out)
 * - startDate: Filter from date (YYYY-MM-DD)
 * - endDate: Filter to date (YYYY-MM-DD)
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 50)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const merchantId = searchParams.get('merchantId')
    const productId = searchParams.get('productId')
    const branchId = searchParams.get('branchId')
    const type = searchParams.get('type')
    const direction = searchParams.get('direction')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    // Build where clause
    const where: Prisma.StockMovementWhereInput = {}
    
    if (productId) where.productId = productId
    if (branchId) where.branchId = branchId
    if (type) where.type = type
    if (direction) where.direction = direction
    
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = new Date(startDate)
      if (endDate) {
        const endDateTime = new Date(endDate)
        endDateTime.setHours(23, 59, 59, 999)
        where.createdAt.lte = endDateTime
      }
    }

    // If merchantId is provided, filter by products belonging to that merchant
    let productFilter: Prisma.ProductWhereInput = {}
    if (merchantId) {
      productFilter = { merchantId }
    }

    // Get movements with product info
    const movements = await db.stockMovement.findMany({
      where: {
        ...where,
        product: productFilter.merchantId ? { merchantId: productFilter.merchantId } : undefined
      },
      include: {
        product: {
          select: { 
            id: true, 
            name: true, 
            sku: true,
            merchantId: true 
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip
    })

    const total = await db.stockMovement.count({
      where: {
        ...where,
        product: productFilter.merchantId ? { merchantId: productFilter.merchantId } : undefined
      }
    })

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      data: movements.map(m => ({
        id: m.id,
        type: m.type,
        direction: m.direction,
        productId: m.productId,
        productName: m.product?.name,
        sku: m.product?.sku || m.referenceNumber,
        quantity: m.quantity,
        unit: m.unit,
        unitCost: m.unitCost,
        totalCost: m.totalCost,
        referenceType: m.referenceType,
        referenceId: m.referenceId,
        referenceNumber: m.referenceNumber,
        batchNumber: m.batchNumber,
        expiryDate: m.expiryDate,
        reason: m.reason,
        notes: m.notes,
        userId: m.userId,
        userName: m.userName,
        branchId: m.branchId,
        createdAt: m.createdAt
      })),
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    })
  } catch (error) {
    console.error('Error fetching stock movements:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch stock movements',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * POST /api/merchant-os/inventory/movements
 * Create a new stock movement
 * 
 * Request Body:
 * - productId: (required) Product ID
 * - branchId: Branch ID
 * - type: (required) Movement type (sale, return, grn, adjustment, transfer_in, transfer_out, stocktake, recipe)
 * - direction: (required) Direction (in, out)
 * - quantity: (required) Quantity moved
 * - unit: Unit of measurement (default: each)
 * - unitCost: Cost per unit
 * - totalCost: Total cost (calculated if not provided)
 * - referenceType: Reference type (sale, po, transfer, stocktake)
 * - referenceId: Reference ID
 * - referenceNumber: Reference number
 * - batchNumber: Batch number
 * - expiryDate: Expiry date (YYYY-MM-DD)
 * - reason: Reason for movement
 * - notes: Additional notes
 * - userId: User ID who created the movement
 * - userName: User name
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.productId) {
      return NextResponse.json({ error: 'productId is required' }, { status: 400 })
    }
    if (!body.type) {
      return NextResponse.json({ error: 'type is required' }, { status: 400 })
    }
    if (!body.direction) {
      return NextResponse.json({ error: 'direction is required' }, { status: 400 })
    }
    if (body.quantity === undefined || body.quantity === null) {
      return NextResponse.json({ error: 'quantity is required' }, { status: 400 })
    }

    // Validate direction
    if (!['in', 'out'].includes(body.direction)) {
      return NextResponse.json({ error: 'direction must be "in" or "out"' }, { status: 400 })
    }

    // Validate type
    const validTypes = ['sale', 'return', 'grn', 'adjustment', 'transfer_in', 'transfer_out', 'stocktake', 'recipe']
    if (!validTypes.includes(body.type)) {
      return NextResponse.json({ error: `type must be one of: ${validTypes.join(', ')}` }, { status: 400 })
    }

    // Get product to verify it exists and get cost price
    const product = await db.product.findUnique({
      where: { id: body.productId }
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const unitCost = body.unitCost ?? product.costPrice
    const totalCost = body.totalCost ?? (body.quantity * unitCost)

    // Create movement
    const movement = await db.stockMovement.create({
      data: {
        productId: body.productId,
        branchId: body.branchId,
        type: body.type,
        direction: body.direction,
        quantity: body.quantity,
        unit: body.unit || 'each',
        unitCost,
        totalCost,
        referenceType: body.referenceType,
        referenceId: body.referenceId,
        referenceNumber: body.referenceNumber,
        batchNumber: body.batchNumber,
        expiryDate: body.expiryDate,
        reason: body.reason,
        notes: body.notes,
        userId: body.userId,
        userName: body.userName
      },
      include: {
        product: {
          select: { id: true, name: true, sku: true }
        }
      }
    })

    // Update product stock if inventory is tracked
    if (product.trackInventory) {
      const quantityChange = body.direction === 'in' ? body.quantity : -body.quantity
      const newQuantity = Math.max(0, product.stockQuantity + quantityChange)
      
      await db.product.update({
        where: { id: body.productId },
        data: {
          stockQuantity: newQuantity,
          stockValue: newQuantity * product.costPrice,
          lastRestockedAt: body.direction === 'in' ? new Date() : product.lastRestockedAt
        }
      })

      // Update branch inventory if branchId is provided
      if (body.branchId) {
        const branchInv = await db.branchInventory.findUnique({
          where: {
            branchId_productId: {
              branchId: body.branchId,
              productId: body.productId
            }
          }
        })

        if (branchInv) {
          const newBranchQty = Math.max(0, branchInv.quantityOnHand + quantityChange)
          await db.branchInventory.update({
            where: { id: branchInv.id },
            data: {
              quantityOnHand: newBranchQty,
              quantityAvailable: Math.max(0, newBranchQty - branchInv.quantityReserved),
              lastAdjustedAt: new Date()
            }
          })
        }
      }
    }

    return NextResponse.json({ 
      data: movement,
      message: 'Stock movement created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating stock movement:', error)
    return NextResponse.json({ 
      error: 'Failed to create stock movement',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
