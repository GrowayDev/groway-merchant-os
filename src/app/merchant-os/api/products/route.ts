import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

// GET /api/merchant-os/products - List all products with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Query parameters
    const merchantId = searchParams.get('merchantId')
    const search = searchParams.get('search')
    const category = searchParams.get('category')
    const status = searchParams.get('status')
    const lowStock = searchParams.get('lowStock')
    const barcode = searchParams.get('barcode')
    const limit = searchParams.get('limit')
    const offset = searchParams.get('offset')

    // Build where clause
    const where: Prisma.ProductWhereInput = {}

    // Merchant filter (required for multi-tenant)
    if (merchantId) {
      where.merchantId = merchantId
    }

    // Barcode lookup (exact match)
    if (barcode) {
      where.barcode = barcode
    }

    // Search filter (name, SKU, or barcode)
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
        { barcode: { contains: search } },
        { description: { contains: search } }
      ]
    }

    // Category filter
    if (category) {
      where.categoryId = category
    }

    // Status filter
    if (status) {
      where.status = status
    }

    // Build query options
    const queryOptions: Prisma.ProductFindManyArgs = {
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true
          }
        },
        variants: {
          where: { status: 'active' },
          select: {
            id: true,
            sku: true,
            name: true,
            barcode: true,
            attributes: true,
            costPrice: true,
            sellingPrice: true,
            stockQuantity: true,
            status: true,
            imageUrl: true
          }
        },
        _count: {
          select: { variants: true, stockMovements: true }
        }
      },
      orderBy: [
        { name: 'asc' }
      ]
    }

    // Pagination
    if (limit) {
      queryOptions.take = parseInt(limit)
    }
    if (offset) {
      queryOptions.skip = parseInt(offset)
    }

    const products = await db.product.findMany(queryOptions)

    // Filter for low stock if requested (post-query filter for SQLite)
    let filteredProducts = products
    if (lowStock === 'true') {
      filteredProducts = products.filter(p => 
        p.trackInventory && p.stockQuantity <= p.minStockLevel
      )
    }

    // Get total count for pagination
    const totalCount = await db.product.count({ where })

    return NextResponse.json({ 
      products: filteredProducts,
      pagination: {
        total: totalCount,
        limit: limit ? parseInt(limit) : null,
        offset: offset ? parseInt(offset) : null
      }
    })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

// POST /api/merchant-os/products - Create a new product
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.merchantId) {
      return NextResponse.json({ error: 'merchantId is required' }, { status: 400 })
    }
    if (!body.sku) {
      return NextResponse.json({ error: 'sku is required' }, { status: 400 })
    }
    if (!body.name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }

    // Check for duplicate SKU within merchant
    const existingProduct = await db.product.findFirst({
      where: {
        merchantId: body.merchantId,
        sku: body.sku
      }
    })

    if (existingProduct) {
      return NextResponse.json({ 
        error: 'Product with this SKU already exists for this merchant' 
      }, { status: 409 })
    }

    // Check for duplicate barcode if provided
    if (body.barcode) {
      const existingBarcode = await db.product.findFirst({
        where: {
          merchantId: body.merchantId,
          barcode: body.barcode
        }
      })

      if (existingBarcode) {
        return NextResponse.json({ 
          error: 'Product with this barcode already exists for this merchant' 
        }, { status: 409 })
      }
    }

    // Calculate margin and markup if not provided
    const costPrice = body.costPrice || 0
    const sellingPrice = body.sellingPrice || 0
    let markupPercent = body.markupPercent || 0
    let marginPercent = body.marginPercent || 0

    if (costPrice > 0 && sellingPrice > 0) {
      markupPercent = ((sellingPrice - costPrice) / costPrice) * 100
      marginPercent = ((sellingPrice - costPrice) / sellingPrice) * 100
    }

    // Calculate stock value
    const stockQuantity = body.stockQuantity || 0
    const stockValue = costPrice * stockQuantity

    const product = await db.product.create({
      data: {
        merchantId: body.merchantId,
        sku: body.sku,
        barcode: body.barcode,
        name: body.name,
        description: body.description,
        categoryId: body.categoryId,
        subcategory: body.subcategory,
        tags: body.tags ? JSON.stringify(body.tags) : undefined,
        costPrice,
        sellingPrice,
        vatRate: body.vatRate ?? 15.0,
        vatIncluded: body.vatIncluded ?? true,
        markupPercent,
        marginPercent,
        trackInventory: body.trackInventory ?? true,
        stockQuantity,
        stockValue,
        minStockLevel: body.minStockLevel || 0,
        maxStockLevel: body.maxStockLevel,
        reorderPoint: body.reorderPoint || 0,
        reorderQuantity: body.reorderQuantity || 1,
        unit: body.unit || 'each',
        unitSize: body.unitSize,
        unitMeasure: body.unitMeasure,
        packSize: body.packSize,
        packUnit: body.packUnit,
        brand: body.brand,
        manufacturer: body.manufacturer,
        origin: body.origin,
        status: body.status || 'active',
        isSellable: body.isSellable ?? true,
        isPurchasable: body.isPurchasable ?? true,
        isDigital: body.isDigital ?? false,
        isService: body.isService ?? false,
        batchTracking: body.batchTracking ?? false,
        expiryTracking: body.expiryTracking ?? false,
        shelfLife: body.shelfLife,
        hasVariants: body.hasVariants ?? false,
        variantAttributes: body.variantAttributes ? JSON.stringify(body.variantAttributes) : undefined,
        imageUrl: body.imageUrl,
        thumbnailUrl: body.thumbnailUrl,
        additionalImages: body.additionalImages ? JSON.stringify(body.additionalImages) : undefined,
        supplierId: body.supplierId,
        supplierCode: body.supplierCode,
        leadTimeDays: body.leadTimeDays
      },
      include: {
        category: true,
        variants: true
      }
    })

    return NextResponse.json({ product }, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json({ 
          error: 'Product with this SKU already exists' 
        }, { status: 409 })
      }
    }
    
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}
