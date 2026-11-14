import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// POST /merchant-os/api/products/bulk-import
// Accepts CSV or JSON array of products with GS1/EAN barcodes
// Merchants can upload their own price lists
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { merchantId, branchId, products } = body

    if (!merchantId) {
      return NextResponse.json({ error: 'merchantId is required' }, { status: 400 })
    }

    if (!products || !Array.isArray(products) || products.length === 0) {
      return NextResponse.json({ error: 'products array is required' }, { status: 400 })
    }

    const results = { imported: 0, skipped: 0, errors: [] as string[] }

    for (const item of products) {
      try {
        // Validate required fields
        if (!item.sku && !item.barcode) {
          results.skipped++
          results.errors.push(`Row skipped: no SKU or barcode provided`)
          continue
        }

        // Generate SKU from barcode if not provided
        const sku = item.sku || `SKU-${item.barcode}`
        
        // Check if product already exists for this merchant (by SKU or barcode)
        const existing = await db.product.findFirst({
          where: {
            merchantId,
            OR: [
              { sku },
              ...(item.barcode ? [{ barcode: item.barcode }] : []),
            ],
          },
        })

        if (existing) {
          // Update price/stock if product exists
          await db.product.update({
            where: { id: existing.id },
            data: {
              sellingPrice: item.sellingPrice ?? existing.sellingPrice,
              costPrice: item.costPrice ?? existing.costPrice,
              currentStock: item.stock ?? existing.currentStock,
              updatedAt: new Date(),
            },
          })
          results.imported++
          continue
        }

        // Find or create category
        let categoryId: string | null = null
        if (item.category) {
          let cat = await db.productCategory.findFirst({
            where: { merchantId, name: { equals: item.category, mode: 'insensitive' } },
          })
          if (!cat) {
            cat = await db.productCategory.create({
              data: {
                id: `cat-${merchantId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                merchantId,
                name: item.category,
                isActive: true,
                updatedAt: new Date(),
              },
            }).catch(() => null as any)
          }
          categoryId = cat?.id || null
        }

        // Create the product
        await db.product.create({
          data: {
            id: `prod-${merchantId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            merchantId,
            branchId: branchId || null,
            categoryId,
            sku,
            barcode: item.barcode || null,
            name: item.name || item.description || sku,
            description: item.description || null,
            type: item.type || 'standard',
            unit: item.unit || 'each',
            costPrice: parseFloat(item.costPrice) || 0,
            sellingPrice: parseFloat(item.sellingPrice) || 0,
            compareAtPrice: parseFloat(item.compareAtPrice) || null,
            margin: item.costPrice && item.sellingPrice 
              ? Math.round(((parseFloat(item.sellingPrice) - parseFloat(item.costPrice)) / parseFloat(item.sellingPrice)) * 100 * 100) / 100 
              : 0,
            vatRate: parseFloat(item.vatRate) || 15.0,
            vatExempt: item.vatExempt || false,
            zeroRated: item.zeroRated || false,
            trackInventory: item.trackInventory !== false,
            currentStock: parseFloat(item.stock) || 0,
            lowStockThreshold: parseFloat(item.lowStockThreshold) || 10,
            reorderPoint: parseFloat(item.reorderPoint) || 5,
            reorderQuantity: parseFloat(item.reorderQuantity) || 20,
            hasVariants: false,
            isActive: true,
            isAvailableOnline: true,
            updatedAt: new Date(),
          },
        })
        results.imported++
      } catch (e: any) {
        results.skipped++
        results.errors.push(`Error: ${e.message?.substring(0, 100)}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Imported ${results.imported} products, skipped ${results.skipped}`,
      ...results,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// GET /merchant-os/api/products/bulk-import?merchantId=xxx
// Returns a CSV template for merchants to download and fill in
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const format = searchParams.get('format') || 'csv'
  
  if (format === 'csv') {
    const csv = `sku,barcode,name,description,category,unit,costPrice,sellingPrice,compareAtPrice,vatRate,stock,lowStockThreshold,reorderPoint,reorderQuantity
SKU-001,6001234567890,Maize Meal 5kg,5kg maize meal bag,Staples,bag,45.00,65.00,75.00,15.0,100,10,5,20
SKU-002,6001234567891,White Bread Loaf,Fresh white bread,Bakery,each,8.00,14.00,16.00,15.0,50,10,5,20
SKU-003,6001234567892,Cooking Oil 2L,Sunflower cooking oil,Staples,bottle,35.00,55.00,62.00,15.0,80,10,5,30`
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="groway-product-template.csv"',
      },
    })
  }

  return NextResponse.json({
    template: {
      sku: 'SKU-001 (required if no barcode)',
      barcode: '6001234567890 (EAN-13, GS1 compliant)',
      name: 'Product Name (required)',
      description: 'Product description',
      category: 'Category name (auto-created if not exists)',
      unit: 'each | kg | L | pack | box | bag',
      costPrice: '45.00',
      sellingPrice: '65.00',
      compareAtPrice: '75.00 (optional, for showing discount)',
      vatRate: '15.0',
      stock: '100',
      lowStockThreshold: '10',
      reorderPoint: '5',
      reorderQuantity: '20',
    },
    example: [
      { sku: 'SKU-001', barcode: '6001234567890', name: 'Maize Meal 5kg', category: 'Staples', unit: 'bag', costPrice: '45.00', sellingPrice: '65.00', stock: '100' },
      { sku: 'SKU-002', barcode: '6001234567891', name: 'White Bread Loaf', category: 'Bakery', unit: 'each', costPrice: '8.00', sellingPrice: '14.00', stock: '50' },
    ],
  })
}
