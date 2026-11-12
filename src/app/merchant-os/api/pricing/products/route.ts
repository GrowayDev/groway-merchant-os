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

// GET /api/merchant-os/pricing/products - Get all products with pricing
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const status = searchParams.get('status') || 'all'
    const lowMargin = searchParams.get('lowMargin') === 'true'

    const where: any = {
      merchantId: session.merchantId,
    }

    if (category && category !== 'all') {
      where.category = { name: category }
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
        { barcode: { contains: search } },
      ]
    }

    if (status === 'active') {
      where.isActive = true
    } else if (status === 'inactive') {
      where.isActive = false
    }

    const products = await db.product.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: { name: 'asc' },
    })

    // Calculate margins and filter if needed
    let productsWithMetrics = products.map(product => {
      const costPrice = product.costPrice || 0
      const sellingPrice = product.sellingPrice || 0
      const margin = sellingPrice > 0 
        ? ((sellingPrice - costPrice) / sellingPrice) * 100 
        : 0
      
      return {
        ...product,
        margin: Math.round(margin * 10) / 10,
        marginAmount: sellingPrice - costPrice,
      }
    })

    // Filter by low margin if requested
    if (lowMargin) {
      productsWithMetrics = productsWithMetrics.filter(p => p.margin < 30)
    }

    // Get categories for filter
    const categories = await db.productCategory.findMany({
      where: { merchantId: session.merchantId },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({
      success: true,
      products: productsWithMetrics,
      categories,
      stats: {
        total: products.length,
        avgMargin: productsWithMetrics.length > 0 
          ? productsWithMetrics.reduce((sum, p) => sum + p.margin, 0) / productsWithMetrics.length 
          : 0,
        lowMargin: productsWithMetrics.filter(p => p.margin < 30).length,
        highMargin: productsWithMetrics.filter(p => p.margin >= 50).length,
        active: products.filter(p => p.isActive).length,
      },
    })
  } catch (error) {
    console.error('Get pricing products error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

// POST /api/merchant-os/pricing/products - Create new product with pricing
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
      compareAtPrice,
      unit,
      isActive = true,
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

    // Calculate margin
    const margin = sellingPrice > 0 
      ? ((sellingPrice - (costPrice || 0)) / sellingPrice) * 100 
      : 0

    // Create product
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
        compareAtPrice,
        margin,
        unit: unit || 'each',
        isActive,
      },
      include: {
        category: true,
      },
    })

    // Create price history entry
    if (sellingPrice > 0) {
      await db.priceHistory.create({
        data: {
          merchantId: session.merchantId,
          productId: product.id,
          previousPrice: 0,
          newPrice: sellingPrice,
          priceChange: sellingPrice,
          priceChangePercent: 100,
          costAtChange: costPrice || 0,
          previousMargin: 0,
          newMargin: margin,
          reason: 'initial',
          changedBy: session.userId,
          changedByName: session.user.name || 'System',
        },
      })
    }

    return NextResponse.json({
      success: true,
      product: {
        ...product,
        margin: Math.round(margin * 10) / 10,
        marginAmount: sellingPrice - (costPrice || 0),
      },
    })
  } catch (error) {
    console.error('Create product error:', error)
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    )
  }
}
