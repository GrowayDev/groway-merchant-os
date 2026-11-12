import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { randomUUID } from 'crypto';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/inventory/stocktake/[id]
 * Get a single stocktake session with full details
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const stocktake = await db.stocktakeSession.findUnique({
      where: { id },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        items: {
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
          },
          orderBy: { product: { name: 'asc' } },
        },
      },
    });

    if (!stocktake) {
      return NextResponse.json(
        { error: 'Stocktake not found' },
        { status: 404 }
      );
    }

    // Calculate progress
    const progressPercent = stocktake.totalItems > 0 
      ? Math.round((stocktake.countedItems / stocktake.totalItems) * 100) 
      : 0;

    // Group items by status
    const countedItems = stocktake.items.filter((item) => item.isCounted);
    const uncountedItems = stocktake.items.filter((item) => !item.isCounted);
    const varianceItems = stocktake.items.filter((item) => item.varianceQty !== 0);

    return NextResponse.json({
      success: true,
      data: {
        ...stocktake,
        progressPercent,
        summary: {
          total: stocktake.totalItems,
          counted: countedItems.length,
          uncounted: uncountedItems.length,
          variance: varianceItems.length,
          positiveVariance: varianceItems.filter((i) => i.varianceQty > 0).length,
          negativeVariance: varianceItems.filter((i) => i.varianceQty < 0).length,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching stocktake:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stocktake', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/inventory/stocktake/[id]
 * Perform actions on stocktake session
 * 
 * Body:
 * - action: required (start, count, complete, approve, cancel)
 * - itemId: optional (for count action)
 * - countedQty: optional (for count action)
 * - notes: optional
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    const stocktake = await db.stocktakeSession.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!stocktake) {
      return NextResponse.json(
        { error: 'Stocktake not found' },
        { status: 404 }
      );
    }

    switch (body.action) {
      case 'start':
        // Start the stocktake
        return await startStocktake(stocktake, body);

      case 'count':
        // Record a count for an item
        return await countItem(id, body);

      case 'complete':
        // Complete the stocktake
        return await completeStocktake(id, body);

      case 'approve':
        // Approve and post variances
        return await approveStocktake(id, body);

      case 'cancel':
        // Cancel the stocktake
        return await cancelStocktake(id, body);

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error processing stocktake action:', error);
    return NextResponse.json(
      { error: 'Failed to process action', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Helper: Start stocktake
async function startStocktake(stocktake: { id: string; status: string }, body: Record<string, unknown>) {
  if (stocktake.status !== 'draft') {
    return NextResponse.json(
      { error: 'Stocktake can only be started from draft status' },
      { status: 400 }
    );
  }

  const result = await db.stocktakeSession.update({
    where: { id: stocktake.id },
    data: {
      status: 'in_progress',
      startedAt: new Date(),
      startedBy: body.performedBy || null,
      startedByName: body.performedByName || null,
    },
  });

  return NextResponse.json({
    success: true,
    data: result,
    message: 'Stocktake started',
  });
}

// Helper: Count an item
async function countItem(sessionId: string, body: Record<string, unknown>) {
  if (!body.itemId) {
    return NextResponse.json(
      { error: 'itemId is required for count action' },
      { status: 400 }
    );
  }

  const countedQty = parseFloat(String(body.countedQty ?? 0));

  // Get the item
  const item = await db.stocktakeItem.findUnique({
    where: { id: body.itemId as string },
    include: {
      session: true,
      product: true,
    },
  });

  if (!item || item.sessionId !== sessionId) {
    return NextResponse.json(
      { error: 'Stocktake item not found' },
      { status: 404 }
    );
  }

  const varianceQty = countedQty - item.systemQty;
  const varianceValue = varianceQty * item.unitCost;

  // Update the item
  const updatedItem = await db.stocktakeItem.update({
    where: { id: body.itemId as string },
    data: {
      countedQty,
      varianceQty,
      varianceValue,
      isCounted: true,
      isRecount: item.isCounted,
      countedBy: body.performedBy || null,
      countedByName: body.performedByName || null,
      countedAt: new Date(),
      notes: body.notes || null,
    },
  });

  // Update session counts
  const session = await db.stocktakeSession.findUnique({
    where: { id: sessionId },
    include: {
      items: true,
    },
  });

  if (session) {
    const countedItems = session.items.filter((i) => i.isCounted).length;
    const varianceItems = session.items.filter((i) => i.varianceQty !== 0).length;
    const totalVarianceValue = session.items.reduce((sum, i) => sum + i.varianceValue, 0);

    await db.stocktakeSession.update({
      where: { id: sessionId },
      data: {
        countedItems,
        varianceItems,
        varianceValue: totalVarianceValue,
      },
    });
  }

  return NextResponse.json({
    success: true,
    data: updatedItem,
    message: 'Count recorded',
  });
}

// Helper: Complete stocktake
async function completeStocktake(sessionId: string, body: Record<string, unknown>) {
  const session = await db.stocktakeSession.findUnique({
    where: { id: sessionId },
    include: {
      items: true,
    },
  });

  if (!session) {
    return NextResponse.json(
      { error: 'Stocktake not found' },
      { status: 404 }
    );
  }

  if (session.status !== 'in_progress') {
    return NextResponse.json(
      { error: 'Stocktake must be in progress to complete' },
      { status: 400 }
    );
  }

  const result = await db.stocktakeSession.update({
    where: { id: sessionId },
    data: {
      status: 'pending_review',
      completedAt: new Date(),
      completedBy: body.performedBy || null,
      completedByName: body.performedByName || null,
    },
  });

  return NextResponse.json({
    success: true,
    data: result,
    message: 'Stocktake completed and pending review',
  });
}

// Helper: Approve and post variances
async function approveStocktake(sessionId: string, body: Record<string, unknown>) {
  const session = await db.stocktakeSession.findUnique({
    where: { id: sessionId },
    include: {
      items: {
        where: {
          varianceQty: { not: 0 },
        },
        include: {
          product: true,
        },
      },
      branch: true,
    },
  });

  if (!session) {
    return NextResponse.json(
      { error: 'Stocktake not found' },
      { status: 404 }
    );
  }

  if (session.status !== 'pending_review') {
    return NextResponse.json(
      { error: 'Stocktake must be pending review to approve' },
      { status: 400 }
    );
  }

  // Process variances in transaction
  const result = await db.$transaction(async (tx) => {
    // Create stock movements for each variance
    for (const item of session.items) {
      const direction = item.varianceQty > 0 ? 'in' : 'out';
      const quantity = Math.abs(item.varianceQty);
      const reason = item.varianceQty > 0 ? 'found' : 'shrinkage';

      // Create stock movement
      await tx.stockMovement.create({
        data: {
          merchantId: session.merchantId,
          branchId: session.branchId,
          productId: item.productId,
          idempotencyKey: `stocktake-${sessionId}-item-${item.id}`,
          type: 'stocktake',
          direction,
          quantity,
          previousStock: item.systemQty,
          newStock: item.countedQty || 0,
          unitCost: item.unitCost,
          totalCost: Math.abs(item.varianceValue),
          referenceType: 'stocktake',
          referenceId: sessionId,
          referenceNumber: session.sessionNumber,
          reason: `Stocktake variance - ${reason}`,
          performedBy: body.performedBy || null,
          performedByName: body.performedByName || null,
        },
      });

      // Update product stock
      await tx.product.update({
        where: { id: item.productId },
        data: {
          currentStock: item.countedQty || 0,
          updatedAt: new Date(),
        },
      });
    }

    // Mark stocktake as completed
    return await tx.stocktakeSession.update({
      where: { id: sessionId },
      data: {
        status: 'completed',
        approvedAt: new Date(),
        approvedBy: body.performedBy || null,
        approvedByName: body.performedByName || null,
      },
    });
  });

  return NextResponse.json({
    success: true,
    data: result,
    message: `Stocktake approved. ${session.items.length} variance(s) posted.`,
  });
}

// Helper: Cancel stocktake
async function cancelStocktake(sessionId: string, body: Record<string, unknown>) {
  const session = await db.stocktakeSession.findUnique({
    where: { id: sessionId },
  });

  if (!session) {
    return NextResponse.json(
      { error: 'Stocktake not found' },
      { status: 404 }
    );
  }

  if (session.status === 'completed') {
    return NextResponse.json(
      { error: 'Cannot cancel a completed stocktake' },
      { status: 400 }
    );
  }

  const result = await db.stocktakeSession.update({
    where: { id: sessionId },
    data: {
      status: 'cancelled',
      notes: body.notes || session.notes,
    },
  });

  return NextResponse.json({
    success: true,
    data: result,
    message: 'Stocktake cancelled',
  });
}
