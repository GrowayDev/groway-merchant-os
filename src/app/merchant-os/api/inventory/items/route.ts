import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { randomUUID } from 'crypto'
import { getMerchantIdWithDevFallback, requireAuth } from '@/lib/auth-context'

// GET /api/inventory/items - List all inventory items
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
    const branchId = searchParams.get('branchId')
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const lowStock = searchParams.get('lowStock') === 'true'
    const outOfStock = searchParams.get('outOfStock') === 'true'

    const where: any = { merchantId }
    
    if (branchId) where.branchId = branchId
    if (category) where.categoryId = category
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    // Use correct Prisma field name: currentStock (not stock)
    if (outOfStock) {
      where.currentStock = { lte: 0 }
    } else if (lowStock) {
      where.AND = [
        { currentStock: { gt: 0 } },
        { currentStock: { lte: db.product.fields.reorderPoint.defaultValue || 10 } }
      ]
    }

    const items = await db.product.findMany({
      where,
      include: {
        ProductCategory: true,
        StockMovement: {
          take: 5,
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { name: 'asc' }
    })

    // Calculate additional fields with correct field names
    const itemsWithCalculated = items.map(item => ({
      ...item,
      margin: item.sellingPrice > 0 
        ? ((item.sellingPrice - item.costPrice) / item.sellingPrice) * 100 
        : 0,
      markup: item.costPrice > 0 
        ? ((item.sellingPrice - item.costPrice) / item.costPrice) * 100 
        : 0,
      stockValue: item.currentStock * item.costPrice,
      retailValue: item.currentStock * item.sellingPrice,
      status: item.currentStock <= 0 
        ? 'out_of_stock' 
        : item.currentStock <= (item.reorderPoint || 10) 
          ? 'low_stock' 
          : 'in_stock'
    }))

    return NextResponse.json({
      success: true,
      data: itemsWithCalculated,
      count: itemsWithCalculated.length
    })
  } catch (error) {
    console.error('Error fetching inventory items:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch inventory items' },
      { status: 500 }
    )
  }
}

// POST /api/inventory/items - Create new inventory item
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const auth = requireAuth(request)
    if (auth.error) return auth.error
    const merchantId = auth.context.merchantId
    
    const body = await request.json()
    const {
      branchId,
      sku,
      barcode,
      name,
      description,
      categoryId,
      costPrice = 0,
      sellingPrice = 0,
      currentStock = 0,
      reorderPoint = 10,
      lowStockThreshold = 5,
      reorderQuantity = 10,
      unit = 'each',
      vatRate = 15,
      vatExempt = false,
      supplier
    } = body

    // Validate required fields
    if (!sku || !name) {
      return NextResponse.json(
        { success: false, error: 'SKU and name are required' },
        { status: 400 }
      )
    }

    // Check for duplicate SKU
    const existing = await db.product.findFirst({
      where: { merchantId, sku }
    })
    
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'A product with this SKU already exists' },
        { status: 400 }
      )
    }

    // Create product with correct Prisma field names
    const product = await db.product.create({
      data: {
        id: randomUUID(),
        merchantId,
        branchId,
        sku,
        barcode,
        name,
        description,
        categoryId,
        costPrice,
        sellingPrice,
        compareAtPrice: sellingPrice,
        currentStock,
        reorderPoint,
        lowStockThreshold,
        reorderQuantity,
        unit,
        vatRate,
        vatExempt,
        type: 'standard',
        isActive: true,
        trackInventory: true,
        updatedAt: new Date()
      }
    })

    // Create initial stock movement if stock > 0
    if (currentStock > 0) {
      await db.stockMovement.create({
        data: {
          id: randomUUID(),
          merchantId,
          branchId,
          productId: product.id,
          type: 'purchase',
          quantity: currentStock,
          previousStock: 0,
          newStock: currentStock,
          unitCost: costPrice,
          totalValue: currentStock * costPrice,
          referenceType: 'opening_stock',
          reason: 'Initial stock on product creation',
          createdAt: new Date()
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: product,
      message: 'Product created successfully'
    })
  } catch (error) {
    console.error('Error creating inventory item:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create inventory item' },
      { status: 500 }
    )
  }
}
