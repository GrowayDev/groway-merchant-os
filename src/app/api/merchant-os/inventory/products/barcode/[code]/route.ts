import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface RouteParams {
  params: Promise<{ code: string }>
}

/**
 * GET /api/merchant-os/inventory/products/barcode/[code]
 * Find a product by barcode
 * 
 * Query Parameters:
 * - merchantId: Filter by merchant (optional but recommended)
 * - includeVariants: Also search in variant barcodes (default: true)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { code } = await params
    const { searchParams } = new URL(request.url)
    
    const merchantId = searchParams.get('merchantId')
    const includeVariants = searchParams.get('includeVariants') !== 'false'

    if (!code) {
      return NextResponse.json({ error: 'Barcode is required' }, { status: 400 })
    }

    // Search for product by barcode
    const product = await db.product.findFirst({
      where: {
        barcode: code,
        merchantId: merchantId || undefined
      },
      include: {
        category: {
          select: { id: true, name: true }
        },
        variants: includeVariants ? {
          where: {
            OR: [
              { barcode: code }
            ]
          }
        } : false
      }
    })

    if (product) {
      // Calculate stock status
      let stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock' = 'in_stock'
      if (product.stockQuantity === 0) {
        stockStatus = 'out_of_stock'
      } else if (product.stockQuantity <= product.reorderPoint) {
        stockStatus = 'low_stock'
      }

      return NextResponse.json({
        data: {
          id: product.id,
          sku: product.sku,
          barcode: product.barcode,
          name: product.name,
          description: product.description,
          categoryId: product.categoryId,
          categoryName: product.category?.name,
          costPrice: product.costPrice,
          sellingPrice: product.sellingPrice,
          vatRate: product.vatRate,
          vatIncluded: product.vatIncluded,
          unit: product.unit,
          brand: product.brand,
          status: product.status,
          trackInventory: product.trackInventory,
          batchTracking: product.batchTracking,
          expiryTracking: product.expiryTracking,
          stockQuantity: product.stockQuantity,
          stockStatus,
          reorderPoint: product.reorderPoint,
          hasVariants: product.hasVariants,
          imageUrl: product.imageUrl,
          thumbnailUrl: product.thumbnailUrl
        },
        matchType: 'product'
      })
    }

    // If not found in products, search in variants
    if (includeVariants) {
      const variant = await db.productVariant.findFirst({
        where: {
          barcode: code,
          product: {
            merchantId: merchantId || undefined
          }
        },
        include: {
          product: {
            include: {
              category: {
                select: { id: true, name: true }
              }
            }
          }
        }
      })

      if (variant) {
        const parentProduct = variant.product
        
        // Calculate stock status
        let stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock' = 'in_stock'
        const stockQty = variant.stockQuantity ?? parentProduct.stockQuantity
        const reorderPt = variant.reorderPoint ?? parentProduct.reorderPoint
        
        if (stockQty === 0) {
          stockStatus = 'out_of_stock'
        } else if (stockQty <= reorderPt) {
          stockStatus = 'low_stock'
        }

        return NextResponse.json({
          data: {
            id: variant.id,
            productId: parentProduct.id,
            parentSku: parentProduct.sku,
            sku: variant.sku,
            barcode: variant.barcode,
            name: variant.name,
            parentName: parentProduct.name,
            fullName: `${parentProduct.name} - ${variant.name}`,
            description: parentProduct.description,
            categoryId: parentProduct.categoryId,
            categoryName: parentProduct.category?.name,
            costPrice: variant.costPrice ?? parentProduct.costPrice,
            sellingPrice: variant.sellingPrice ?? parentProduct.sellingPrice,
            vatRate: parentProduct.vatRate,
            vatIncluded: parentProduct.vatIncluded,
            unit: parentProduct.unit,
            brand: parentProduct.brand,
            status: variant.status,
            trackInventory: parentProduct.trackInventory,
            batchTracking: parentProduct.batchTracking,
            expiryTracking: parentProduct.expiryTracking,
            stockQuantity: stockQty,
            stockStatus,
            reorderPoint: reorderPt,
            attributes: variant.attributes ? JSON.parse(variant.attributes) : {},
            imageUrl: variant.imageUrl || parentProduct.imageUrl,
            thumbnailUrl: parentProduct.thumbnailUrl
          },
          matchType: 'variant'
        })
      }
    }

    return NextResponse.json({ 
      error: 'Product not found',
      barcode: code,
      message: 'No product or variant found with this barcode'
    }, { status: 404 })
  } catch (error) {
    console.error('Error looking up barcode:', error)
    return NextResponse.json({ 
      error: 'Failed to lookup barcode',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
