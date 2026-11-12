import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withDevModeBypass } from '@/lib/auth-middleware'

// GET /merchant-os/api/products/pos - Get products for POS terminal
export const GET = withDevModeBypass(async (request, { user, isDevBypass }) => {
  try {
    // Log warning if dev bypass is being used
    if (isDevBypass) {
      console.warn('[Auth] Using dev mode bypass for POS products - not recommended for production')
    }

    const { searchParams } = new URL(request.url)
    const merchantId = user?.merchantId || searchParams.get('merchantId')
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    
    if (!merchantId) {
      return NextResponse.json(
        { success: false, error: 'merchantId is required' },
        { status: 400 }
      )
    }

    // Build where clause
    const where: any = { 
      merchantId, 
      isActive: true 
    }
    
    if (category && category !== 'all') {
      where.categoryId = category
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
        { barcode: { contains: search } }
      ]
    }

    // Fetch products with categories
    const products = await db.product.findMany({
      where,
      include: {
        ProductCategory: {
          select: { id: true, name: true }
        }
      },
      orderBy: { name: 'asc' }
    })

    // Group by category for POS display
    const categories = [...new Set(products.map(p => p.ProductCategory?.name).filter(Boolean))]
    
    // Format for POS
    const formattedProducts = products.map(p => ({
      id: p.id,
      name: p.name,
      price: p.sellingPrice,
      category: p.ProductCategory?.name || 'Uncategorized',
      sku: p.sku,
      barcode: p.barcode,
      stock: p.currentStock,
      inStock: p.currentStock > 0
    }))

    return NextResponse.json({
      success: true,
      data: {
        products: formattedProducts,
        categories: ['all', ...categories],
        total: products.length
      }
    })
  } catch (error) {
    console.error('Error fetching POS products:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
})
