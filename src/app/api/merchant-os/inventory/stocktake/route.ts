import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

/**
 * GET /api/merchant-os/inventory/stocktake
 * List stocktake sessions with filtering and pagination
 * 
 * Query Parameters:
 * - merchantId: Filter by merchant (via branch)
 * - branchId: Filter by branch
 * - status: Filter by status (draft, in_progress, completed, cancelled)
 * - sessionType: Filter by type (full, cycle, spot, category)
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const merchantId = searchParams.get('merchantId')
    const branchId = searchParams.get('branchId')
    const status = searchParams.get('status')
    const sessionType = searchParams.get('sessionType')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Build where clause
    const where: Prisma.StocktakeSessionWhereInput = {}
    
    if (branchId) where.branchId = branchId
    if (status) where.status = status
    if (sessionType) where.sessionType = sessionType

    // Get sessions
    const sessions = await db.stocktakeSession.findMany({
      where: {
        ...where,
        branch: merchantId ? { merchantId } : undefined
      },
      include: {
        branch: {
          select: { 
            id: true, 
            name: true,
            merchantId: true 
          }
        }
      },
      orderBy: [
        { createdAt: 'desc' }
      ],
      take: limit,
      skip
    })

    const total = await db.stocktakeSession.count({
      where: {
        ...where,
        branch: merchantId ? { merchantId } : undefined
      }
    })

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      data: sessions.map(s => ({
        id: s.id,
        sessionNumber: s.sessionNumber,
        branchId: s.branchId,
        branchName: s.branch?.name,
        sessionType: s.sessionType,
        status: s.status,
        scheduledDate: s.scheduledDate,
        startedAt: s.startedAt,
        completedAt: s.completedAt,
        totalItems: s.totalItems,
        countedItems: s.countedItems,
        varianceItems: s.varianceItems,
        systemValue: s.systemValue,
        countedValue: s.countedValue,
        varianceValue: s.varianceValue,
        createdBy: s.createdBy,
        supervisorId: s.supervisorId,
        counters: s.counters,
        notes: s.notes,
        varianceNotes: s.varianceNotes,
        progress: s.totalItems > 0 ? Math.round((s.countedItems / s.totalItems) * 100) : 0,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt
      })),
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
    console.error('Error fetching stocktake sessions:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch stocktake sessions',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * POST /api/merchant-os/inventory/stocktake
 * Create a new stocktake session
 * 
 * Request Body:
 * - branchId: (required) Branch ID
 * - sessionType: (required) Session type (full, cycle, spot, category)
 * - categoryId: Category ID for category-specific stocktake
 * - scheduledDate: Scheduled date (YYYY-MM-DD)
 * - notes: Notes
 * - createdBy: User ID creating the session
 * - supervisorId: Supervisor ID
 * - counters: JSON array of counter names/IDs
 * - autoPopulate: Whether to auto-populate items (default: true)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.branchId) {
      return NextResponse.json({ error: 'branchId is required' }, { status: 400 })
    }
    if (!body.sessionType) {
      return NextResponse.json({ error: 'sessionType is required' }, { status: 400 })
    }

    const validTypes = ['full', 'cycle', 'spot', 'category']
    if (!validTypes.includes(body.sessionType)) {
      return NextResponse.json({ 
        error: `sessionType must be one of: ${validTypes.join(', ')}` 
      }, { status: 400 })
    }

    if (body.sessionType === 'category' && !body.categoryId) {
      return NextResponse.json({ 
        error: 'categoryId is required for category stocktake' 
      }, { status: 400 })
    }

    // Verify branch exists
    const branch = await db.branch.findUnique({
      where: { id: body.branchId }
    })

    if (!branch) {
      return NextResponse.json({ error: 'Branch not found' }, { status: 404 })
    }

    // Generate session number
    const sessionCount = await db.stocktakeSession.count({
      where: { branchId: body.branchId }
    })
    const sessionNumber = `ST-${branch.id.slice(-4).toUpperCase()}-${String(sessionCount + 1).padStart(5, '0')}`

    // Get products to include in stocktake
    const productWhere: Prisma.ProductWhereInput = {
      merchantId: branch.merchantId,
      trackInventory: true,
      isSellable: true
    }

    if (body.sessionType === 'category' && body.categoryId) {
      productWhere.categoryId = body.categoryId
    }

    const products = await db.product.findMany({
      where: productWhere,
      include: {
        category: true,
        variants: true
      }
    })

    // Create session
    const session = await db.stocktakeSession.create({
      data: {
        sessionNumber,
        branchId: body.branchId,
        sessionType: body.sessionType,
        status: 'draft',
        scheduledDate: body.scheduledDate,
        createdBy: body.createdBy,
        supervisorId: body.supervisorId,
        counters: body.counters ? JSON.stringify(body.counters) : null,
        notes: body.notes,
        totalItems: products.length,
        systemValue: products.reduce((sum, p) => sum + (p.stockQuantity * p.costPrice), 0)
      }
    })

    // Create stocktake items for each product
    if (body.autoPopulate !== false) {
      for (const product of products) {
        // Create item for main product
        await db.stocktakeItem.create({
          data: {
            sessionId: session.id,
            productId: product.id,
            productSku: product.sku,
            productName: product.name,
            systemQuantity: product.stockQuantity,
            unitCost: product.costPrice,
            systemValue: product.stockQuantity * product.costPrice,
            status: 'pending'
          }
        })

        // Create items for variants if they exist
        for (const variant of product.variants || []) {
          await db.stocktakeItem.create({
            data: {
              sessionId: session.id,
              productId: product.id,
              variantId: variant.id,
              variantName: variant.name,
              productSku: variant.sku,
              productName: `${product.name} - ${variant.name}`,
              systemQuantity: variant.stockQuantity,
              unitCost: variant.costPrice || product.costPrice,
              systemValue: variant.stockQuantity * (variant.costPrice || product.costPrice),
              status: 'pending'
            }
          })
        }
      }
    }

    const createdSession = await db.stocktakeSession.findUnique({
      where: { id: session.id },
      include: {
        branch: { select: { id: true, name: true } },
        items: {
          take: 10,
          include: {
            product: { select: { id: true, name: true, sku: true } }
          }
        }
      }
    })

    return NextResponse.json({ 
      data: createdSession,
      message: 'Stocktake session created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating stocktake session:', error)
    return NextResponse.json({ 
      error: 'Failed to create stocktake session',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
