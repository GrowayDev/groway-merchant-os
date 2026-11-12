import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { getAuthContext, unauthorizedResponse, forbiddenResponse } from '@/lib/auth-context';

/**
 * GET /api/inventory/stocktake
 * List stocktake sessions with pagination and filters
 * 
 * Security: Requires authentication. merchantId must match authenticated user's merchant.
 * 
 * Query params:
 * - merchantId: required (validated against auth context)
 * - branchId: optional
 * - status: optional - Filter by status (draft, in_progress, pending_review, completed, cancelled)
 * - type: optional - Filter by type (full, category, low_stock, blind, cycle)
 * - page: optional - Page number (default: 1)
 * - limit: optional - Items per page (default: 50)
 */
export async function GET(request: NextRequest) {
  // Authentication check
  const context = await getAuthContext(request);
  if (!context) {
    return unauthorizedResponse('Authentication required');
  }

  try {
    const { searchParams } = new URL(request.url);
    
    const queryMerchantId = searchParams.get('merchantId');
    const branchId = searchParams.get('branchId');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    // Security: Validate merchantId
    let merchantId: string;
    if ('merchantId' in context) {
      if (queryMerchantId && queryMerchantId !== context.merchantId) {
        if (context.role !== 'platform_admin' && context.role !== 'super_admin') {
          return forbiddenResponse('Access denied to this merchant');
        }
        merchantId = queryMerchantId;
      } else {
        merchantId = context.merchantId;
      }
    } else {
      if (!queryMerchantId) {
        return NextResponse.json(
          { error: 'merchantId is required' },
          { status: 400 }
        );
      }
      merchantId = queryMerchantId;
    }

    // Build where clause
    const where: Prisma.StocktakeSessionWhereInput = {
      merchantId,
    };

    if (branchId) {
      where.branchId = branchId;
    }

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    // Get total count
    const total = await db.stocktakeSession.count({ where });

    // Get stocktake sessions with pagination
    const stocktakes = await db.stocktakeSession.findMany({
      where,
      include: {
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        _count: {
          select: {
            items: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Calculate progress for each stocktake
    const stocktakesWithProgress = stocktakes.map((st) => {
      const progressPercent = st.totalItems > 0 
        ? Math.round((st.countedItems / st.totalItems) * 100) 
        : 0;

      return {
        ...st,
        progressPercent,
        variancePercent: st.systemValue > 0 
          ? ((st.varianceValue / st.systemValue) * 100).toFixed(2) 
          : '0',
      };
    });

    // Get summary stats
    const activeCount = await db.stocktakeSession.count({
      where: {
        merchantId,
        status: { in: ['draft', 'in_progress', 'pending_review'] },
      },
    });

    return NextResponse.json({
      success: true,
      data: stocktakesWithProgress,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        activeCount,
      },
    });
  } catch (error) {
    console.error('Error fetching stocktakes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stocktakes', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/inventory/stocktake
 * Create a new stocktake session
 * 
 * Security: Requires authentication. merchantId must match authenticated user's merchant.
 * 
 * Body:
 * - merchantId: required (validated against auth context)
 * - branchId: required
 * - name: required
 * - type: required (full, category, low_stock, blind, cycle)
 * - categoryId: optional (for category type)
 * - isBlind: optional (hide system quantities during count)
 * - freezeInventory: optional (prevent movements during count)
 */
export async function POST(request: NextRequest) {
  // Authentication check
  const context = await getAuthContext(request);
  if (!context) {
    return unauthorizedResponse('Authentication required');
  }

  try {
    const body = await request.json();

    // Security: Validate merchantId
    let merchantId: string;
    if ('merchantId' in context) {
      if (body.merchantId && body.merchantId !== context.merchantId) {
        if (context.role !== 'platform_admin' && context.role !== 'super_admin') {
          return forbiddenResponse('Access denied to this merchant');
        }
        merchantId = body.merchantId;
      } else {
        merchantId = context.merchantId;
      }
    } else {
      if (!body.merchantId) {
        return NextResponse.json(
          { error: 'merchantId is required' },
          { status: 400 }
        );
      }
      merchantId = body.merchantId;
    }

    // Validate required fields
    if (!body.branchId) {
      return NextResponse.json(
        { error: 'branchId is required' },
        { status: 400 }
      );
    }

    if (!body.name) {
      return NextResponse.json(
        { error: 'Stocktake name is required' },
        { status: 400 }
      );
    }

    // Generate session number
    const sessionCount = await db.stocktakeSession.count({
      where: { merchantId },
    });
    const sessionNumber = `ST-${String(sessionCount + 1).padStart(6, '0')}`;

    // Build product filter based on stocktake type
    const productWhere: Prisma.ProductWhereInput = {
      merchantId,
      branchId: body.branchId,
      parentId: null, // Only parent products
      isActive: true,
      trackInventory: true,
    };

    if (body.type === 'category' && body.categoryId) {
      productWhere.categoryId = body.categoryId;
    }

    if (body.type === 'low_stock') {
      // Products at or below reorder point
      productWhere.AND = [
        { currentStock: { lte: db.product.fields.reorderPoint } },
      ];
    }

    // Get products to include in stocktake
    const products = await db.product.findMany({
      where: productWhere,
      select: {
        id: true,
        name: true,
        sku: true,
        currentStock: true,
        costPrice: true,
        unit: true,
        categoryId: true,
      },
      orderBy: { name: 'asc' },
    });

    // Create stocktake with items in transaction
    const result = await db.$transaction(async (tx) => {
      // Create stocktake session
      const stocktake = await tx.stocktakeSession.create({
        data: {
          merchantId,
          branchId: body.branchId,
          sessionNumber,
          name: body.name,
          type: body.type || 'full',
          categoryId: body.categoryId || null,
          isBlind: body.isBlind || false,
          freezeInventory: body.freezeInventory || false,
          status: 'draft',
          totalItems: products.length,
          startedBy: body.startedBy || null,
          startedByName: body.startedByName || null,
        },
        include: {
          branch: true,
        },
      });

      // Create stocktake items
      if (products.length > 0) {
        await tx.stocktakeItem.createMany({
          data: products.map((product) => ({
            sessionId: stocktake.id,
            productId: product.id,
            systemQty: product.currentStock,
            unitCost: product.costPrice,
            varianceQty: 0,
            varianceValue: 0,
            isCounted: false,
          })),
        });
      }

      return stocktake;
    });

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        itemCount: products.length,
      },
      message: 'Stocktake session created successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating stocktake:', error);
    return NextResponse.json(
      { error: 'Failed to create stocktake', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
