import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { randomUUID } from 'crypto'
import { getMerchantIdWithDevFallback, requireAuth } from '@/lib/auth-context'

// GET /api/inventory/movements - List stock movements
export async function GET(request: NextRequest) {
  try {
    // Get merchant ID from auth context with dev fallback
    const merchantId = getMerchantIdWithDevFallback(request)
    if (!merchantId) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      }, { status: 401 })
    }
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    const type = searchParams.get('type')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = { merchantId }
    if (productId) where.productId = productId
    if (type) where.type = type

    const movements = await db.stockMovement.findMany({
      where,
      include: {
        Product: {
          select: {
            id: true,
            name: true,
            sku: true
          }
        },
        Branch: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    })

    const total = await db.stockMovement.count({ where })

    return NextResponse.json({
      success: true,
      data: movements,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    })
  } catch (error) {
    console.error('Error fetching stock movements:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stock movements' },
      { status: 500 }
    )
  }
}

// POST /api/inventory/movements - Create stock movement (adjustment, receive, etc.)
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const auth = requireAuth(request)
    if (auth.error) return auth.error
    const merchantId = auth.context.merchantId
    
    const body = await request.json()
    const {
      branchId,
      productId,
      type, // 'purchase', 'sale', 'adjustment', 'transfer_in', 'transfer_out', 'return', 'waste'
      quantity,
      reason,
      notes,
      referenceType,
      referenceId,
      unitCost,
      performedBy,
      performedByName
    } = body

    // Validate required fields
    if (!productId || !type || quantity === undefined) {
      return NextResponse.json(
        { success: false, error: 'Product ID, type, and quantity are required' },
        { status: 400 }
      )
    }

    // Get current product stock - use currentStock (Prisma field name)
    const product = await db.product.findUnique({
      where: { id: productId }
    })

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      )
    }

    const previousStock = product.currentStock // Use correct field name
    const adjustment = type === 'sale' || type === 'transfer_out' || type === 'waste' 
      ? -Math.abs(quantity) 
      : Math.abs(quantity)
    const newStock = Math.max(0, previousStock + adjustment)

    // Create stock movement
    const movement = await db.stockMovement.create({
      data: {
        id: randomUUID(),
        merchantId,
        branchId,
        productId,
        type,
        quantity: adjustment,
        previousStock,
        newStock,
        unitCost: unitCost || product.costPrice,
        totalValue: Math.abs(adjustment) * (unitCost || product.costPrice),
        reason,
        notes,
        referenceType,
        referenceId,
        performedBy,
        performedByName,
        createdAt: new Date()
      }
    })

    // Update product stock - use currentStock (Prisma field name)
    await db.product.update({
      where: { id: productId },
      data: { 
        currentStock: newStock, // Use correct field name
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        movement,
        previousStock,
        newStock,
        adjustment
      },
      message: 'Stock movement recorded successfully'
    })
  } catch (error) {
    console.error('Error creating stock movement:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create stock movement' },
      { status: 500 }
    )
  }
}
