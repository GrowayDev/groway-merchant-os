import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

/**
 * GET /api/merchant-os/inventory/batches
 * List product batches with filtering and pagination
 * 
 * Query Parameters:
 * - merchantId: Filter by merchant (via product)
 * - productId: Filter by product
 * - branchId: Filter by branch
 * - status: Filter by status (active, expired, recalled, depleted)
 * - expiringWithin: Filter batches expiring within N days
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 50)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const merchantId = searchParams.get('merchantId')
    const productId = searchParams.get('productId')
    const branchId = searchParams.get('branchId')
    const status = searchParams.get('status')
    const expiringWithin = searchParams.get('expiringWithin')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    // Build where clause
    const where: Prisma.ProductBatchWhereInput = {}
    
    if (productId) where.productId = productId
    if (branchId) where.branchId = branchId
    if (status) where.status = status

    // Filter by expiring within N days
    if (expiringWithin) {
      const days = parseInt(expiringWithin)
      const today = new Date()
      const futureDate = new Date(today)
      futureDate.setDate(futureDate.getDate() + days)
      
      where.expiryDate = {
        gte: today.toISOString().split('T')[0],
        lte: futureDate.toISOString().split('T')[0]
      }
    }

    // Get batches with product info
    const batches = await db.productBatch.findMany({
      where: {
        ...where,
        product: merchantId ? { merchantId } : undefined
      },
      include: {
        product: {
          select: { 
            id: true, 
            name: true, 
            sku: true,
            merchantId: true,
            batchTracking: true,
            expiryTracking: true
          }
        }
      },
      orderBy: [
        { expiryDate: 'asc' }, // Show expiring first
        { createdAt: 'desc' }
      ],
      take: limit,
      skip
    })

    const total = await db.productBatch.count({
      where: {
        ...where,
        product: merchantId ? { merchantId } : undefined
      }
    })

    const totalPages = Math.ceil(total / limit)

    // Calculate days until expiry for each batch
    const today = new Date()
    const formattedBatches = batches.map(b => {
      let daysUntilExpiry: number | null = null
      if (b.expiryDate) {
        const expiry = new Date(b.expiryDate)
        daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      }

      return {
        id: b.id,
        batchNumber: b.batchNumber,
        productId: b.productId,
        productName: b.product?.name,
        sku: b.product?.sku,
        variantId: b.variantId,
        branchId: b.branchId,
        manufacturingDate: b.manufacturingDate,
        expiryDate: b.expiryDate,
        daysUntilExpiry,
        quantityReceived: b.quantityReceived,
        quantityRemaining: b.quantityRemaining,
        quantitySold: b.quantitySold,
        quantityWasted: b.quantityWasted,
        unitCost: b.unitCost,
        totalCost: b.totalCost,
        supplierId: b.supplierId,
        supplierName: b.supplierName,
        poNumber: b.poNumber,
        grnNumber: b.grnNumber,
        status: b.status,
        locationAisle: b.locationAisle,
        locationShelf: b.locationShelf,
        locationBin: b.locationBin,
        createdAt: b.createdAt,
        updatedAt: b.updatedAt
      }
    })

    return NextResponse.json({
      data: formattedBatches,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    })
  } catch (error) {
    console.error('Error fetching batches:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch batches',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * POST /api/merchant-os/inventory/batches
 * Create a new product batch
 * 
 * Request Body:
 * - batchNumber: (required) Unique batch identifier
 * - productId: (required) Product ID
 * - variantId: Product variant ID
 * - branchId: (required) Branch ID
 * - manufacturingDate: Manufacturing date (YYYY-MM-DD)
 * - expiryDate: Expiry date (YYYY-MM-DD)
 * - receivedDate: (required) Date received (YYYY-MM-DD)
 * - quantityReceived: (required) Quantity received
 * - unitCost: Cost per unit
 * - supplierId: Supplier ID
 * - supplierName: Supplier name
 * - poNumber: Purchase order number
 * - grnNumber: Goods received note number
 * - locationAisle: Aisle location
 * - locationShelf: Shelf location
 * - locationBin: Bin location
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.batchNumber) {
      return NextResponse.json({ error: 'batchNumber is required' }, { status: 400 })
    }
    if (!body.productId) {
      return NextResponse.json({ error: 'productId is required' }, { status: 400 })
    }
    if (!body.branchId) {
      return NextResponse.json({ error: 'branchId is required' }, { status: 400 })
    }
    if (!body.receivedDate) {
      return NextResponse.json({ error: 'receivedDate is required' }, { status: 400 })
    }
    if (body.quantityReceived === undefined || body.quantityReceived === null) {
      return NextResponse.json({ error: 'quantityReceived is required' }, { status: 400 })
    }

    // Verify product exists
    const product = await db.product.findUnique({
      where: { id: body.productId }
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Verify branch exists
    const branch = await db.branch.findUnique({
      where: { id: body.branchId }
    })

    if (!branch) {
      return NextResponse.json({ error: 'Branch not found' }, { status: 404 })
    }

    // Check for duplicate batch number
    const existingBatch = await db.productBatch.findFirst({
      where: {
        batchNumber: body.batchNumber,
        productId: body.productId,
        branchId: body.branchId
      }
    })

    if (existingBatch) {
      return NextResponse.json({ 
        error: 'Batch with this number already exists for this product and branch' 
      }, { status: 400 })
    }

    const unitCost = body.unitCost ?? product.costPrice
    const totalCost = body.quantityReceived * unitCost

    // Determine initial status based on expiry
    let status = 'active'
    if (body.expiryDate) {
      const expiry = new Date(body.expiryDate)
      const today = new Date()
      if (expiry < today) {
        status = 'expired'
      }
    }

    // Create batch
    const batch = await db.productBatch.create({
      data: {
        batchNumber: body.batchNumber,
        productId: body.productId,
        variantId: body.variantId,
        branchId: body.branchId,
        manufacturingDate: body.manufacturingDate,
        expiryDate: body.expiryDate,
        receivedDate: body.receivedDate,
        quantityReceived: body.quantityReceived,
        quantityRemaining: body.quantityReceived,
        quantitySold: 0,
        quantityWasted: 0,
        unitCost,
        totalCost,
        supplierId: body.supplierId,
        supplierName: body.supplierName,
        poNumber: body.poNumber,
        grnNumber: body.grnNumber,
        status,
        locationAisle: body.locationAisle,
        locationShelf: body.locationShelf,
        locationBin: body.locationBin
      },
      include: {
        product: {
          select: { id: true, name: true, sku: true }
        }
      }
    })

    // Update product to enable batch tracking
    if (!product.batchTracking) {
      await db.product.update({
        where: { id: body.productId },
        data: { batchTracking: true }
      })
    }

    // Create stock movement for the batch receipt
    await db.stockMovement.create({
      data: {
        productId: body.productId,
        branchId: body.branchId,
        type: 'grn',
        direction: 'in',
        quantity: body.quantityReceived,
        unit: product.unit || 'each',
        unitCost,
        totalCost,
        referenceType: 'grn',
        referenceNumber: body.grnNumber,
        batchNumber: body.batchNumber,
        expiryDate: body.expiryDate,
        reason: 'Batch received',
        notes: `Batch ${body.batchNumber} received`
      }
    })

    // Update product stock
    if (product.trackInventory) {
      await db.product.update({
        where: { id: body.productId },
        data: {
          stockQuantity: { increment: body.quantityReceived },
          stockValue: { increment: totalCost },
          lastRestockedAt: new Date()
        }
      })
    }

    return NextResponse.json({ 
      data: batch,
      message: 'Batch created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating batch:', error)
    return NextResponse.json({ 
      error: 'Failed to create batch',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
