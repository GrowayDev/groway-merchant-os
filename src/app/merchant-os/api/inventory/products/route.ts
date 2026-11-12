import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Helper to get session
async function getSession(request: NextRequest) {
  const sessionToken = request.cookies.get('groway_session')?.value
  if (!sessionToken) return null
  
  try {
    return await db.merchantSession.findFirst({
      where: { 
        token: sessionToken,
        expiresAt: { gt: new Date() }
      },
      include: { user: true, merchant: true },
    })
  } catch {
    return null
  }
}

// GET /api/merchant-os/inventory/products - Get all products with stock levels
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const category = searchParams.get('category')
    const stockStatus = searchParams.get('stockStatus') // all, low, out
    const verticalId = searchParams.get('verticalId') // fnb, liquor, grocery, etc.
    const subVerticalId = searchParams.get('subVerticalId') // qsr, salon, pharmacy, etc.

    // Build where clause
    const where: Record<string, unknown> = {
      merchantId: session.merchantId,
      isActive: true,
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
        { barcode: { contains: search } },
      ]
    }

    if (category && category !== 'all') {
      where.category = { name: category }
    }

    // Filter by vertical context (CRITICAL for SKU catalog alignment)
    if (verticalId) {
      where.verticalId = verticalId
    }
    if (subVerticalId) {
      where.subVerticalId = subVerticalId
    }

    // Get products with stock info
    const products = await db.product.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: { name: 'asc' },
    })

    // Calculate stock metrics for each product
    const productsWithMetrics = products.map(product => {
      const totalStock = product.currentStock || 0
      
      // Stock status
      let status = 'in_stock'
      if (totalStock === 0) status = 'out_of_stock'
      else if (totalStock <= product.reorderPoint) status = 'low_stock'

      // Margin calculation
      const margin = product.sellingPrice > 0 
        ? ((product.sellingPrice - (product.costPrice || 0)) / product.sellingPrice) * 100 
        : 0

      return {
        ...product,
        totalStock,
        availableStock: totalStock,
        reservedStock: 0,
        status,
        margin: Math.round(margin * 10) / 10,
        stockValue: totalStock * (product.costPrice || 0),
      }
    })

    // Filter by stock status if requested
    let filteredProducts = productsWithMetrics
    if (stockStatus === 'low') {
      filteredProducts = productsWithMetrics.filter(p => p.status === 'low_stock')
    } else if (stockStatus === 'out') {
      filteredProducts = productsWithMetrics.filter(p => p.status === 'out_of_stock')
    }

    // Get categories for filtering
    const categories = await db.productCategory.findMany({
      where: { merchantId: session.merchantId, isActive: true },
      orderBy: { name: 'asc' },
    })

    // Calculate summary stats
    const stats = {
      total: productsWithMetrics.length,
      inStock: productsWithMetrics.filter(p => p.status === 'in_stock').length,
      lowStock: productsWithMetrics.filter(p => p.status === 'low_stock').length,
      outOfStock: productsWithMetrics.filter(p => p.status === 'out_of_stock').length,
      totalValue: productsWithMetrics.reduce((sum, p) => sum + p.stockValue, 0),
    }

    return NextResponse.json({
      success: true,
      products: filteredProducts,
      categories,
      stats,
    })
  } catch (error) {
    console.error('Get inventory products error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch inventory' },
      { status: 500 }
    )
  }
}

// POST /api/merchant-os/inventory/products - Create new product
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      sku,
      barcode,
      name,
      description,
      categoryId,
      costPrice,
      sellingPrice,
      unit,
      trackInventory,
      lowStockThreshold,
      reorderPoint,
      reorderQuantity,
      initialStock,
      verticalId,      // NEW: Vertical context
      subVerticalId,   // NEW: Sub-vertical context
    } = body

    // Validation
    if (!sku || !name) {
      return NextResponse.json(
        { error: 'SKU and name are required' },
        { status: 400 }
      )
    }

    // Check for duplicate SKU
    const existing = await db.product.findFirst({
      where: {
        merchantId: session.merchantId,
        sku,
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'A product with this SKU already exists' },
        { status: 400 }
      )
    }

    // Create product with vertical context
    const product = await db.product.create({
      data: {
        merchantId: session.merchantId,
        sku,
        barcode,
        name,
        description,
        categoryId,
        costPrice: costPrice || 0,
        sellingPrice: sellingPrice || 0,
        unit: unit || 'each',
        trackInventory: trackInventory ?? true,
        lowStockThreshold: lowStockThreshold || 10,
        reorderPoint: reorderPoint || 5,
        reorderQuantity: reorderQuantity || 10,
        currentStock: initialStock || 0,
        verticalId: verticalId || null,
        subVerticalId: subVerticalId || null,
      },
      include: { category: true },
    })

    return NextResponse.json({
      success: true,
      product,
    })
  } catch (error) {
    console.error('Create product error:', error)
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    )
  }
}
