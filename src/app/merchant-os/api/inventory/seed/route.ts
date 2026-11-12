import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAllSKUs } from '../../../app/data/skuCatalog'

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

// POST /api/merchant-os/inventory/seed - Seed inventory from SKU catalog
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { verticalId, subVerticalId, clearExisting = false } = body

    if (!verticalId || !subVerticalId) {
      return NextResponse.json(
        { error: 'verticalId and subVerticalId are required' },
        { status: 400 }
      )
    }

    // Get SKUs from catalog
    const skus = getAllSKUs(verticalId, subVerticalId)
    
    if (!skus || skus.length === 0) {
      return NextResponse.json(
        { error: 'No SKUs found for this vertical/sub-vertical combination' },
        { status: 400 }
      )
    }

    // Optionally clear existing products for this sub-vertical
    if (clearExisting) {
      await db.product.deleteMany({
        where: {
          merchantId: session.merchantId,
          verticalId,
          subVerticalId,
        },
      })
    }

    // Generate SKU codes from names if not provided
    const skuCodes = skus.map(s => s.sku || s.name.substring(0, 20).toUpperCase().replace(/\s/g, '-'))

    // Check for existing products to avoid duplicates
    const existingProducts = await db.product.findMany({
      where: {
        merchantId: session.merchantId,
        sku: { in: skuCodes },
      },
      select: { sku: true },
    })
    const existingSkus = new Set(existingProducts.map(p => p.sku))

    // Filter out existing SKUs
    const newSkus = skus.filter(sku => {
      const skuCode = sku.sku || sku.name.substring(0, 20).toUpperCase().replace(/\s/g, '-')
      return !existingSkus.has(skuCode)
    })

    if (newSkus.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All products already exist',
        created: 0,
        skipped: skus.length,
      })
    }

    // Get or create a default category
    let defaultCategory = await db.productCategory.findFirst({
      where: {
        merchantId: session.merchantId,
        name: 'General',
      },
    })

    if (!defaultCategory) {
      defaultCategory = await db.productCategory.create({
        data: {
          merchantId: session.merchantId,
          name: 'General',
          description: 'Default category',
        },
      })
    }

    // Create products from SKU catalog
    const createdProducts = []
    const errors = []

    for (const sku of newSkus) {
      try {
        const skuCode = sku.sku || sku.name.substring(0, 20).toUpperCase().replace(/\s/g, '-')
        
        // Find or create category
        let category = await db.productCategory.findFirst({
          where: {
            merchantId: session.merchantId,
            name: sku.category,
          },
        })

        if (!category && sku.category) {
          category = await db.productCategory.create({
            data: {
              merchantId: session.merchantId,
              name: sku.category,
              description: `${sku.category} products`,
            },
          })
        }

        // Generate random initial stock for demo purposes
        const initialStock = Math.floor(Math.random() * 100) + 10
        
        // Calculate cost price (60-80% of selling price for demo)
        const costMultiplier = 0.6 + (Math.random() * 0.2)
        const costPrice = sku.price * costMultiplier

        const product = await db.product.create({
          data: {
            merchantId: session.merchantId,
            sku: skuCode,
            barcode: `600${Math.floor(Math.random() * 10000000000).toString().padStart(10, '0')}`,
            name: sku.name,
            description: `${sku.name} - ${sku.category}`,
            categoryId: category?.id || defaultCategory.id,
            costPrice: Math.round(costPrice * 100) / 100,
            sellingPrice: sku.price,
            unit: 'each',
            trackInventory: true,
            currentStock: initialStock,
            lowStockThreshold: 10,
            reorderPoint: 15,
            reorderQuantity: 50,
            verticalId,
            subVerticalId,
          },
        })

        createdProducts.push(product)
      } catch (error) {
        errors.push({
          sku: sku.name,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Seeded ${createdProducts.length} products from ${verticalId}/${subVerticalId}`,
      created: createdProducts.length,
      skipped: existingSkus.size,
      errors: errors.length,
      errorDetails: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('Seed inventory error:', error)
    return NextResponse.json(
      { error: 'Failed to seed inventory' },
      { status: 500 }
    )
  }
}

// GET /api/merchant-os/inventory/seed - Preview what would be seeded
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const verticalId = searchParams.get('verticalId')
    const subVerticalId = searchParams.get('subVerticalId')

    if (!verticalId || !subVerticalId) {
      return NextResponse.json(
        { error: 'verticalId and subVerticalId are required' },
        { status: 400 }
      )
    }

    // Get SKUs from catalog
    const skus = getAllSKUs(verticalId, subVerticalId)
    
    // Check for existing products
    const existingProducts = await db.product.findMany({
      where: {
        merchantId: session.merchantId,
        verticalId,
        subVerticalId,
      },
      select: { sku: true },
    })

    return NextResponse.json({
      success: true,
      verticalId,
      subVerticalId,
      totalInCatalog: skus.length,
      alreadySeeded: existingProducts.length,
      wouldSeed: Math.max(0, skus.length - existingProducts.length),
      categories: [...new Set(skus.map(s => s.category))],
      sampleProducts: skus.slice(0, 5).map(s => ({
        name: s.name,
        sku: s.sku,
        category: s.category,
        price: s.price,
      })),
    })
  } catch (error) {
    console.error('Preview seed error:', error)
    return NextResponse.json(
      { error: 'Failed to preview seed' },
      { status: 500 }
    )
  }
}
