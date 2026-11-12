import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { getAuthContext, unauthorizedResponse, forbiddenResponse } from '@/lib/auth-context';

/**
 * GET /api/inventory/movements
 * List stock movements with pagination and filters
 * 
 * Security: Requires authentication. merchantId must match authenticated user's merchant.
 * 
 * Query params:
 * - merchantId: required (validated against auth context)
 * - branchId: optional
 * - productId: optional
 * - type: optional - Filter by movement type (sale, purchase, adjustment, etc.)
 * - direction: optional - Filter by direction (in, out)
 * - startDate: optional - Filter from date (YYYY-MM-DD)
 * - endDate: optional - Filter to date (YYYY-MM-DD)
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
    const productId = searchParams.get('productId');
    const type = searchParams.get('type');
    const direction = searchParams.get('direction');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
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
    const where: Prisma.StockMovementWhereInput = {
      merchantId,
    };

    if (branchId) {
      where.branchId = branchId;
    }

    if (productId) {
      where.productId = productId;
    }

    if (type) {
      where.type = type;
    }

    if (direction) {
      where.direction = direction;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    // Get total count
    const total = await db.stockMovement.count({ where });

    // Get movements with pagination
    const movements = await db.stockMovement.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            barcode: true,
            unit: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        batch: {
          select: {
            id: true,
            batchNumber: true,
            expiryDate: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Calculate summary stats for the period
    const stats = await db.stockMovement.aggregate({
      where,
      _count: true,
      _sum: {
        quantity: true,
        totalCost: true,
      },
    });

    const inStats = await db.stockMovement.aggregate({
      where: { ...where, direction: 'in' },
      _sum: { quantity: true, totalCost: true },
    });

    const outStats = await db.stockMovement.aggregate({
      where: { ...where, direction: 'out' },
      _sum: { quantity: true, totalCost: true },
    });

    return NextResponse.json({
      success: true,
      data: movements,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        totalMovements: stats._count,
        totalQuantity: stats._sum.quantity || 0,
        totalValue: stats._sum.totalCost || 0,
        inQuantity: inStats._sum.quantity || 0,
        inValue: inStats._sum.totalCost || 0,
        outQuantity: outStats._sum.quantity || 0,
        outValue: outStats._sum.totalCost || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching stock movements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stock movements', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/inventory/movements
 * Create a new stock movement (adjustment, manual receipt, etc.)
 * 
 * Security: Requires authentication. merchantId must match authenticated user's merchant.
 * 
 * Body:
 * - merchantId: required (validated against auth context)
 * - branchId: required
 * - productId: required
 * - type: required - Movement type
 * - quantity: required - Always positive
 * - direction: required - 'in' or 'out'
 * - idempotencyKey: optional - For retry safety (auto-generated if not provided)
 * - batchId: optional - For batch-tracked products
 * - reason: optional
 * - notes: optional
 * - performedBy: optional
 * - performedByName: optional
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
    if (!body.branchId || !body.productId) {
      return NextResponse.json(
        { error: 'branchId and productId are required' },
        { status: 400 }
      );
    }

    if (!body.type) {
      return NextResponse.json(
        { error: 'Movement type is required' },
        { status: 400 }
      );
    }

    if (!body.quantity || body.quantity <= 0) {
      return NextResponse.json(
        { error: 'Quantity must be greater than 0' },
        { status: 400 }
      );
    }

    if (!body.direction || !['in', 'out'].includes(body.direction)) {
      return NextResponse.json(
        { error: 'Direction must be "in" or "out"' },
        { status: 400 }
      );
    }

    // Generate idempotency key if not provided
    const idempotencyKey = body.idempotencyKey || `mv-${randomUUID()}`;

    // Check for duplicate idempotency key
    const existingMovement = await db.stockMovement.findUnique({
      where: { idempotencyKey },
    });

    if (existingMovement) {
      return NextResponse.json({
        success: true,
        data: existingMovement,
        message: 'Movement already processed (idempotent)',
      });
    }

    // Get current product state
    const product = await db.product.findUnique({
      where: { id: body.productId },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    const currentStock = product.currentStock;
    const unitCost = body.unitCost || product.costPrice;
    const quantity = body.quantity;
    const direction = body.direction;

    // Calculate new stock
    const previousStock = currentStock;
    const newStock = direction === 'in' 
      ? currentStock + quantity 
      : currentStock - quantity;

    // Validate stock won't go negative if tracking inventory
    if (product.trackInventory && newStock < 0 && !product.allowNegativeStock) {
      return NextResponse.json(
        { error: `Insufficient stock. Current: ${currentStock}, Requested: ${quantity}` },
        { status: 400 }
      );
    }

    // Execute movement in transaction
    const result = await db.$transaction(async (tx) => {
      // Create the movement record
      const movement = await tx.stockMovement.create({
        data: {
          merchantId,
          branchId: body.branchId,
          productId: body.productId,
          batchId: body.batchId || null,
          idempotencyKey,
          type: body.type,
          direction,
          quantity,
          previousStock,
          newStock,
          unitCost,
          totalCost: quantity * unitCost,
          referenceType: body.referenceType || 'manual',
          referenceId: body.referenceId || null,
          referenceNumber: body.referenceNumber || null,
          reason: body.reason || null,
          notes: body.notes || null,
          performedBy: body.performedBy || null,
          performedByName: body.performedByName || null,
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
            },
          },
          branch: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // Update product stock
      await tx.product.update({
        where: { id: body.productId },
        data: {
          currentStock: newStock,
          lastSoldAt: direction === 'out' ? new Date() : product.lastSoldAt,
          updatedAt: new Date(),
        },
      });

      // If batch tracking, update batch
      if (body.batchId) {
        const batch = await tx.inventoryBatch.findUnique({
          where: { id: body.batchId },
        });

        if (batch) {
          const batchQtyChange = direction === 'in' ? quantity : -quantity;
          const newBatchQty = batch.currentQty + batchQtyChange;

          await tx.inventoryBatch.update({
            where: { id: body.batchId },
            data: {
              currentQty: newBatchQty,
              status: newBatchQty <= 0 ? 'depleted' : batch.status,
              updatedAt: new Date(),
            },
          });

          // Create batch transaction
          await tx.batchTransaction.create({
            data: {
              batchId: body.batchId,
              type: body.type,
              quantity: batchQtyChange,
              balanceAfter: newBatchQty,
              unitCost,
              totalCost: quantity * unitCost,
              referenceType: body.referenceType || 'adjustment',
              referenceId: body.referenceId || null,
              referenceNumber: body.referenceNumber || null,
              performedBy: body.performedBy || null,
              performedByName: body.performedByName || null,
              reason: body.reason || null,
              notes: body.notes || null,
            },
          });
        }
      }

      // Create stock alert if low stock
      if (newStock > 0 && newStock <= product.lowStockThreshold) {
        await tx.stockAlert.upsert({
          where: {
            id: `low-${body.productId}`,
          },
          create: {
            id: `low-${body.productId}`,
            merchantId,
            branchId: body.branchId,
            productId: body.productId,
            type: 'low_stock',
            severity: 'warning',
            message: `${product.name} is low on stock (${newStock} remaining)`,
            currentValue: newStock,
            thresholdValue: product.lowStockThreshold,
          },
          update: {
            currentValue: newStock,
            message: `${product.name} is low on stock (${newStock} remaining)`,
            status: 'active',
            updatedAt: new Date(),
          },
        });
      }

      // Create out of stock alert
      if (newStock <= 0) {
        await tx.stockAlert.upsert({
          where: {
            id: `oos-${body.productId}`,
          },
          create: {
            id: `oos-${body.productId}`,
            merchantId,
            branchId: body.branchId,
            productId: body.productId,
            type: 'out_of_stock',
            severity: 'critical',
            message: `${product.name} is out of stock`,
            currentValue: 0,
            thresholdValue: 0,
          },
          update: {
            currentValue: 0,
            message: `${product.name} is out of stock`,
            status: 'active',
            updatedAt: new Date(),
          },
        });
      }

      return movement;
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Stock movement recorded successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating stock movement:', error);
    return NextResponse.json(
      { error: 'Failed to create stock movement', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
