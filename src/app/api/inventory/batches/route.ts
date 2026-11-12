import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { getAuthContext, unauthorizedResponse, forbiddenResponse } from '@/lib/auth-context';

/**
 * GET /api/inventory/batches
 * List inventory batches with pagination and filters
 * 
 * Security: Requires authentication. merchantId must match authenticated user's merchant.
 * 
 * Query params:
 * - merchantId: required (validated against auth context)
 * - branchId: optional
 * - productId: optional
 * - status: optional - Filter by status (active, expired, quarantined, recalled, depleted)
 * - expiringWithinDays: optional - Filter batches expiring within X days
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
    const status = searchParams.get('status');
    const expiringWithinDays = searchParams.get('expiringWithinDays');
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
    const where: Prisma.InventoryBatchWhereInput = {
      merchantId,
    };

    if (branchId) {
      where.branchId = branchId;
    }

    if (productId) {
      where.productId = productId;
    }

    if (status) {
      where.status = status;
    }

    if (expiringWithinDays) {
      const days = parseInt(expiringWithinDays, 10);
      const expiryThreshold = new Date();
      expiryThreshold.setDate(expiryThreshold.getDate() + days);
      where.expiryDate = { lte: expiryThreshold, gte: new Date() };
    }

    // Get total count
    const total = await db.inventoryBatch.count({ where });

    // Get batches with pagination
    const batches = await db.inventoryBatch.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            barcode: true,
            unit: true,
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        _count: {
          select: {
            batchTransactions: true,
            movements: true,
          },
        },
      },
      orderBy: [
        { expiryDate: 'asc' },
        { createdAt: 'desc' },
      ],
      skip: (page - 1) * limit,
      take: limit,
    });

    // Calculate days until expiry for each batch
    const now = new Date();
    const batchesWithExpiry = batches.map((batch) => {
      let daysUntilExpiry: number | null = null;
      let expiryStatus = 'no_expiry';

      if (batch.expiryDate) {
        const diffTime = batch.expiryDate.getTime() - now.getTime();
        daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (daysUntilExpiry <= 0) {
          expiryStatus = 'expired';
        } else if (daysUntilExpiry <= 7) {
          expiryStatus = 'critical';
        } else if (daysUntilExpiry <= 30) {
          expiryStatus = 'warning';
        } else {
          expiryStatus = 'ok';
        }
      }

      return {
        ...batch,
        daysUntilExpiry,
        expiryStatus,
        totalValue: batch.currentQty * batch.unitCost,
      };
    });

    // Get summary stats
    const stats = await db.inventoryBatch.aggregate({
      where: { merchantId },
      _count: true,
      _sum: {
        currentQty: true,
        totalValue: true,
      },
    });

    const expiringCount = await db.inventoryBatch.count({
      where: {
        merchantId,
        status: 'active',
        expiryDate: {
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          gte: new Date(),
        },
      },
    });

    const expiredCount = await db.inventoryBatch.count({
      where: {
        merchantId,
        status: 'expired',
      },
    });

    return NextResponse.json({
      success: true,
      data: batchesWithExpiry,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        totalBatches: stats._count,
        totalUnits: stats._sum.currentQty || 0,
        totalValue: stats._sum.totalValue || 0,
        expiringCount,
        expiredCount,
      },
    });
  } catch (error) {
    console.error('Error fetching batches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch batches', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/inventory/batches
 * Create a new inventory batch
 * 
 * Security: Requires authentication. merchantId must match authenticated user's merchant.
 * 
 * Body:
 * - merchantId: required (validated against auth context)
 * - branchId: required
 * - productId: required
 * - batchNumber: required
 * - initialQty: required
 * - unitCost: required
 * - expiryDate: optional
 * - productionDate: optional
 * - lotNumber: optional
 * - sourceType: optional (grn, transfer, production, adjustment)
 * - sourceId: optional
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

    if (!body.productId) {
      return NextResponse.json(
        { error: 'productId is required' },
        { status: 400 }
      );
    }

    if (!body.batchNumber) {
      return NextResponse.json(
        { error: 'batchNumber is required' },
        { status: 400 }
      );
    }

    // Check if batch number already exists for this product at this branch
    const existingBatch = await db.inventoryBatch.findFirst({
      where: {
        merchantId,
        branchId: body.branchId,
        productId: body.productId,
        batchNumber: body.batchNumber,
      },
    });

    if (existingBatch) {
      return NextResponse.json(
        { error: 'A batch with this number already exists for this product' },
        { status: 409 }
      );
    }

    // Check if product exists
    const product = await db.product.findUnique({
      where: { id: body.productId },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    const initialQty = body.initialQty || 0;
    const unitCost = body.unitCost || product.costPrice || 0;
    const totalValue = initialQty * unitCost;

    // Create batch with stock movement in transaction
    const result = await db.$transaction(async (tx) => {
      // Create the batch
      const batch = await tx.inventoryBatch.create({
        data: {
          merchantId,
          branchId: body.branchId,
          productId: body.productId,
          batchNumber: body.batchNumber,
          lotNumber: body.lotNumber || null,
          initialQty,
          currentQty: initialQty,
          reservedQty: 0,
          availableQty: initialQty,
          unitCost,
          totalValue,
          productionDate: body.productionDate ? new Date(body.productionDate) : null,
          expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
          shelfLifeDays: body.shelfLifeDays || null,
          status: 'active',
          sourceType: body.sourceType || 'adjustment',
          sourceId: body.sourceId || null,
          locationAisle: body.locationAisle || null,
          locationShelf: body.locationShelf || null,
          locationBin: body.locationBin || null,
          receivedBy: body.receivedBy || null,
          receivedByName: body.receivedByName || null,
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
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
        },
      });

      // Create batch transaction
      await tx.batchTransaction.create({
        data: {
          batchId: batch.id,
          type: 'received',
          quantity: initialQty,
          balanceAfter: initialQty,
          unitCost,
          totalCost: totalValue,
          referenceType: body.sourceType || 'adjustment',
          referenceId: body.sourceId || null,
          performedBy: body.receivedBy || null,
          performedByName: body.receivedByName || null,
          notes: body.notes || null,
        },
      });

      // Create stock movement
      const idempotencyKey = `batch-${batch.id}-init`;
      await tx.stockMovement.create({
        data: {
          merchantId,
          branchId: body.branchId,
          productId: body.productId,
          batchId: batch.id,
          idempotencyKey,
          type: body.sourceType === 'grn' ? 'grn' : 'purchase',
          direction: 'in',
          quantity: initialQty,
          previousStock: product.currentStock,
          newStock: product.currentStock + initialQty,
          unitCost,
          totalCost: totalValue,
          referenceType: body.sourceType || 'manual',
          referenceId: body.sourceId || null,
          referenceNumber: body.batchNumber,
          reason: `Batch ${body.batchNumber} received`,
          performedBy: body.receivedBy || null,
          performedByName: body.receivedByName || null,
        },
      });

      // Update product stock
      await tx.product.update({
        where: { id: body.productId },
        data: {
          currentStock: { increment: initialQty },
          updatedAt: new Date(),
        },
      });

      return batch;
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Batch created successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating batch:', error);
    return NextResponse.json(
      { error: 'Failed to create batch', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
