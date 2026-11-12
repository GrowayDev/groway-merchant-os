import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { nanoid } from 'nanoid'
import { getAuthContext, getMerchantId, unauthorizedResponse, badRequestResponse } from '@/lib/auth-context'

// GET /api/grosell/products - List products
export async function GET(request: NextRequest) {
  try {
    // Get authenticated context
    const context = await getAuthContext(request)
    if (!context) {
      return unauthorizedResponse()
    }
    
    const { searchParams } = new URL(request.url)
    
    // Get merchantId from params or context
    const merchantIdResult = getMerchantId(searchParams, context as any)
    if (merchantIdResult instanceof NextResponse) {
      return merchantIdResult
    }
    const merchantId = merchantIdResult
    
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const search = searchParams.get('search')

    const where: any = { merchantId }
    if (status) where.status = status
    if (category) where.category = category
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ]
    }

    const products = await db.sellProduct.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    const categories = await db.sellProduct.groupBy({
      by: ['category'],
      where: { merchantId, category: { not: null } },
      _count: { id: true },
    })

    return NextResponse.json({
      success: true,
      data: products,
      categories: categories.filter(c => c.category).map(c => ({
        name: c.category,
        count: c._count.id
      }))
    })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

// POST /api/grosell/products - Create product
export async function POST(request: NextRequest) {
  try {
    // Get authenticated context
    const context = await getAuthContext(request)
    if (!context) {
      return unauthorizedResponse()
    }
    
    const body = await request.json()
    const {
      merchantId: bodyMerchantId,
      name,
      description,
      sku,
      category,
      price,
      costPrice,
      vatRate,
      vatInclusive,
      stock,
      trackStock,
      lowStockAlert,
      imageUrl,
      catalogProductId,
    } = body
    
    // Validate merchantId - use body param or context
    let merchantId = bodyMerchantId
    if (!merchantId && 'merchantId' in context) {
      merchantId = context.merchantId
    }
    
    if (!merchantId) {
      return badRequestResponse('merchantId is required')
    }
    
    // Security check: ensure user has access to this merchant
    if ('merchantId' in context && merchantId !== context.merchantId) {
      const allowedRoles = ['platform_admin', 'super_admin', 'admin']
      if (!allowedRoles.includes(context.role)) {
        return NextResponse.json(
          { success: false, error: 'Access denied to this merchant' },
          { status: 403 }
        )
      }
    }

    const product = await db.sellProduct.create({
      data: {
        merchantId,
        name,
        description,
        sku: sku || `SKU-${nanoid(8).toUpperCase()}`,
        category,
        price: parseFloat(price) || 0,
        costPrice: parseFloat(costPrice) || 0,
        vatRate: parseFloat(vatRate) || 15.0,
        vatInclusive: vatInclusive ?? true,
        stock: parseInt(stock) || 0,
        trackStock: trackStock ?? true,
        lowStockAlert: parseInt(lowStockAlert) || 5,
        imageUrl,
        catalogProductId,
      }
    })

    return NextResponse.json({
      success: true,
      data: product
    })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create product' },
      { status: 500 }
    )
  }
}
