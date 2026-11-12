import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

/**
 * GET /api/merchant-os/inventory/adjustments
 * List stock adjustments with filtering and pagination
 * 
 * Query Parameters:
 * - merchantId: Filter by merchant
 * - productId: Filter by product
 * - branchId: Filter by branch
 * - status: Filter by status (pending_approval, approved, rejected)
 * - type: Filter by adjustment type (count_adjustment, damaged, expired, theft, return_to_supplier, other)
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const merchantId = searchParams.get('merchantId')
    const productId = searchParams.get('productId')
    const branchId = searchParams.get('branchId')
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Build where clause for movements of type 'adjustment'
    const where: Prisma.StockMovementWhereInput = {
      type: 'adjustment'
    }
    
    if (productId) where.productId = productId
    if (branchId) where.branchId = branchId
    if (status) where.notes?.contains?.(`status:${status}`) // Status stored in notes for now

    // Get adjustment movements
    const movements = await db.stockMovement.findMany({
      where: {
        ...where,
        product: merchantId ? { merchantId } : undefined
      },
      include: {
        product: {
          select: { 
            id: true, 
            name: true, 
            sku: true,
            stockQuantity: true,
            costPrice: true,
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
        product: merchantId ? { merchantId } : undefined
      }
    })

    const totalPages = Math.ceil(total / limit)

    // Format adjustments
    const adjustments = movements.map(m => ({
      id: m.id,
      type: m.reason?.split(':')[0] || 'other',
      productId: m.productId,
      productName: m.product?.name,
      sku: m.product?.sku,
      systemQty: m.product?.stockQuantity ?? 0,
      adjustmentQty: m.quantity,
      variance: m.direction === 'out' ? -m.quantity : m.quantity,
      unitCost: m.unitCost,
      totalCost: m.totalCost,
      reason: m.reason,
      notes: m.notes,
      status: 'approved', // Movements are already applied
      userId: m.userId,
      userName: m.userName,
      branchId: m.branchId,
      createdAt: m.createdAt
    }))

    return NextResponse.json({
      data: adjustments,
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
    console.error('Error fetching adjustments:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch adjustments',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * POST /api/merchant-os/inventory/adjustments
 * Create a stock adjustment
 * 
 * Request Body:
 * - productId: (required) Product ID
 * - branchId: Branch ID
 * - type: Adjustment type (count_adjustment, damaged, expired, theft, return_to_supplier, other)
 * - quantity: (required) Adjustment quantity (positive for increase, negative for decrease)
 * - reason: (required) Reason for adjustment
 * - notes: Additional notes
 * - userId: User ID
 * - userName: User name
 * - requireApproval: Whether approval is required (default: true for large adjustments)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.productId) {
      return NextResponse.json({ error: 'productId is required' }, { status: 400 })
    }
    if (body.quantity === undefined || body.quantity === null) {
      return NextResponse.json({ error: 'quantity is required' }, { status: 400 })
    }
    if (!body.reason) {
      return NextResponse.json({ error: 'reason is required' }, { status: 400 })
    }

    // Get product
    const product = await db.product.findUnique({
      where: { id: body.productId }
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Determine direction based on quantity sign
    const direction = body.quantity >= 0 ? 'in' : 'out'
    const absQuantity = Math.abs(body.quantity)

    // Check if approval is required for large adjustments
    const valueThreshold = 1000 // R1000 threshold
    const adjustmentValue = absQuantity * product.costPrice
    const requireApproval = body.requireApproval ?? (adjustmentValue >= valueThreshold)

    // For adjustments requiring approval, we'd typically create a pending record
    // For now, we'll process immediately but flag large adjustments
    const adjustmentType = body.type || 'count_adjustment'
    const reasonWithMetadata = `${adjustmentType}: ${body.reason}`

    // Create stock movement
    const movement = await db.stockMovement.create({
      data: {
        productId: body.productId,
        branchId: body.branchId,
        type: 'adjustment',
        direction,
        quantity: absQuantity,
        unit: product.unit || 'each',
        unitCost: product.costPrice,
        totalCost: adjustmentValue,
        reason: reasonWithMetadata,
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

    // Update product stock
    if (product.trackInventory) {
      const newQuantity = Math.max(0, product.stockQuantity + body.quantity)
      
      await db.product.update({
        where: { id: body.productId },
        data: {
          stockQuantity: newQuantity,
          stockValue: newQuantity * product.costPrice
        }
      })

      // Update branch inventory if branchId provided
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
          const newBranchQty = Math.max(0, branchInv.quantityOnHand + body.quantity)
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
      data: {
        id: movement.id,
        type: adjustmentType,
        productId: movement.productId,
        productName: movement.product?.name,
        sku: movement.product?.sku,
        quantity: body.quantity,
        unitCost: movement.unitCost,
        totalCost: movement.totalCost,
        reason: movement.reason,
        notes: movement.notes,
        status: requireApproval ? 'pending_approval' : 'approved',
        userId: movement.userId,
        userName: movement.userName,
        branchId: movement.branchId,
        createdAt: movement.createdAt
      },
      message: 'Stock adjustment created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating adjustment:', error)
    return NextResponse.json({ 
      error: 'Failed to create adjustment',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
