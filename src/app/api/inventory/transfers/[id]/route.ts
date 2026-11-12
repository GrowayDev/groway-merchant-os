import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/inventory/transfers/[id]
 * Get a single stock transfer with full details
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const transfer = await db.stockTransfer.findUnique({
      where: { id },
      include: {
        fromBranch: {
          select: {
            id: true,
            name: true,
            code: true,
            address: true,
            city: true,
            phone: true,
          },
        },
        toBranch: {
          select: {
            id: true,
            name: true,
            code: true,
            address: true,
            city: true,
            phone: true,
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
                currentStock: true,
              },
            },
          },
        },
      },
    });

    if (!transfer) {
      return NextResponse.json(
        { error: 'Transfer not found' },
        { status: 404 }
      );
    }

    // Calculate progress
    let progressPercent = 0;
    switch (transfer.status) {
      case 'draft':
        progressPercent = 0;
        break;
      case 'pending':
        progressPercent = 20;
        break;
      case 'approved':
        progressPercent = 40;
        break;
      case 'in_transit':
        progressPercent = 70;
        break;
      case 'received':
        progressPercent = 100;
        break;
      case 'cancelled':
        progressPercent = 0;
        break;
    }

    // Calculate variance if received
    let totalVariance = 0;
    if (transfer.status === 'received') {
      totalVariance = transfer.items.reduce((sum, item) => {
        const variance = (item.quantityReceived || 0) - (item.quantitySent || 0);
        return sum + variance;
      }, 0);
    }

    return NextResponse.json({
      success: true,
      data: {
        ...transfer,
        progressPercent,
        totalVariance,
        canApprove: transfer.status === 'pending',
        canShip: transfer.status === 'approved',
        canReceive: transfer.status === 'in_transit',
        canCancel: ['draft', 'pending', 'approved'].includes(transfer.status),
      },
    });
  } catch (error) {
    console.error('Error fetching transfer:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transfer', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/inventory/transfers/[id]
 * Perform actions on stock transfer
 * 
 * Body:
 * - action: required (submit, approve, ship, receive, cancel)
 * - items: optional (for receive action - array of { itemId, quantityReceived })
 * - notes: optional
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    const transfer = await db.stockTransfer.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!transfer) {
      return NextResponse.json(
        { error: 'Transfer not found' },
        { status: 404 }
      );
    }

    switch (body.action) {
      case 'submit':
        // Submit for approval
        return await submitTransfer(transfer, body);

      case 'approve':
        // Approve the transfer
        return await approveTransfer(transfer, body);

      case 'ship':
        // Ship the transfer
        return await shipTransfer(transfer, body);

      case 'receive':
        // Receive the transfer
        return await receiveTransfer(transfer, body);

      case 'cancel':
        // Cancel the transfer
        return await cancelTransfer(transfer, body);

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error processing transfer action:', error);
    return NextResponse.json(
      { error: 'Failed to process action', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Helper: Submit for approval
async function submitTransfer(transfer: { id: string; status: string }, body: Record<string, unknown>) {
  if (transfer.status !== 'draft') {
    return NextResponse.json(
      { error: 'Transfer can only be submitted from draft status' },
      { status: 400 }
    );
  }

  const result = await db.stockTransfer.update({
    where: { id: transfer.id },
    data: {
      status: 'pending',
      notes: body.notes as string || undefined,
    },
  });

  return NextResponse.json({
    success: true,
    data: result,
    message: 'Transfer submitted for approval',
  });
}

// Helper: Approve transfer
async function approveTransfer(transfer: { id: string; status: string }, body: Record<string, unknown>) {
  if (transfer.status !== 'pending') {
    return NextResponse.json(
      { error: 'Transfer can only be approved from pending status' },
      { status: 400 }
    );
  }

  const result = await db.stockTransfer.update({
    where: { id: transfer.id },
    data: {
      status: 'approved',
      approvedAt: new Date(),
      approvedBy: body.performedBy as string || null,
      approvedByName: body.performedByName as string || null,
    },
  });

  return NextResponse.json({
    success: true,
    data: result,
    message: 'Transfer approved',
  });
}

// Helper: Ship transfer
async function shipTransfer(
  transfer: {
    id: string;
    status: string;
    merchantId: string;
    fromBranchId: string;
    code: string;
    items: Array<{
      id: string;
      productId: string;
      productName: string;
      quantityRequested: number;
      unitCost: number;
    }>;
  },
  body: Record<string, unknown>
) {
  if (transfer.status !== 'approved') {
    return NextResponse.json(
      { error: 'Transfer can only be shipped from approved status' },
      { status: 400 }
    );
  }

  const result = await db.$transaction(async (tx) => {
    // Update transfer status
    const updated = await tx.stockTransfer.update({
      where: { id: transfer.id },
      data: {
        status: 'in_transit',
        dispatchedAt: new Date(),
        dispatchedBy: body.performedBy as string || null,
        dispatchedByName: body.performedByName as string || null,
        estimatedArrival: body.estimatedArrival ? new Date(body.estimatedArrival as string) : null,
      },
    });

    // Update items with sent quantities (use requested if not specified)
    for (const item of transfer.items) {
      await tx.stockTransferItem.update({
        where: { id: item.id },
        data: {
          quantitySent: item.quantityRequested,
        },
      });

      // Deduct stock from source branch
      const product = await tx.product.findFirst({
        where: {
          id: item.productId,
          branchId: transfer.fromBranchId,
        },
      });

      if (product) {
        await tx.stockMovement.create({
          data: {
            merchantId: transfer.merchantId,
            branchId: transfer.fromBranchId,
            productId: item.productId,
            idempotencyKey: `transfer-${transfer.id}-item-${item.id}-out`,
            type: 'transfer_out',
            direction: 'out',
            quantity: item.quantityRequested,
            previousStock: product.currentStock,
            newStock: product.currentStock - item.quantityRequested,
            unitCost: item.unitCost,
            totalCost: item.quantityRequested * item.unitCost,
            referenceType: 'transfer',
            referenceId: transfer.id,
            referenceNumber: transfer.code,
            reason: `Transfer to branch`,
            performedBy: body.performedBy as string || null,
            performedByName: body.performedByName as string || null,
          },
        });

        // Update product stock
        await tx.product.update({
          where: { id: item.productId },
          data: {
            currentStock: { decrement: item.quantityRequested },
            updatedAt: new Date(),
          },
        });
      }
    }

    return updated;
  });

  return NextResponse.json({
    success: true,
    data: result,
    message: 'Transfer shipped',
  });
}

// Helper: Receive transfer
async function receiveTransfer(
  transfer: {
    id: string;
    status: string;
    merchantId: string;
    fromBranchId: string;
    toBranchId: string;
    code: string;
    items: Array<{
      id: string;
      productId: string;
      productName: string;
      quantitySent: number | null;
      unitCost: number;
    }>;
  },
  body: Record<string, unknown>
) {
  if (transfer.status !== 'in_transit') {
    return NextResponse.json(
      { error: 'Transfer can only be received from in_transit status' },
      { status: 400 }
    );
  }

  const receivedItems = body.items as Array<{ itemId: string; quantityReceived: number }> | undefined;

  const result = await db.$transaction(async (tx) => {
    // Update transfer status
    const updated = await tx.stockTransfer.update({
      where: { id: transfer.id },
      data: {
        status: 'received',
        receivedAt: new Date(),
        receivedBy: body.performedBy as string || null,
        receivedByName: body.performedByName as string || null,
        discrepancyNotes: body.discrepancyNotes as string || null,
      },
    });

    // Process received items
    for (const item of transfer.items) {
      const receivedData = receivedItems?.find((ri) => ri.itemId === item.id);
      const quantityReceived = receivedData?.quantityReceived ?? item.quantitySent ?? 0;

      // Update item with received quantity
      await tx.stockTransferItem.update({
        where: { id: item.id },
        data: {
          quantityReceived,
          discrepancyNotes: quantityReceived !== item.quantitySent
            ? `Expected ${item.quantitySent}, received ${quantityReceived}`
            : null,
        },
      });

      // Add stock to destination branch
      const destProduct = await tx.product.findFirst({
        where: {
          id: item.productId,
          branchId: transfer.toBranchId,
        },
      });

      if (destProduct) {
        await tx.stockMovement.create({
          data: {
            merchantId: transfer.merchantId,
            branchId: transfer.toBranchId,
            productId: item.productId,
            idempotencyKey: `transfer-${transfer.id}-item-${item.id}-in`,
            type: 'transfer_in',
            direction: 'in',
            quantity: quantityReceived,
            previousStock: destProduct.currentStock,
            newStock: destProduct.currentStock + quantityReceived,
            unitCost: item.unitCost,
            totalCost: quantityReceived * item.unitCost,
            referenceType: 'transfer',
            referenceId: transfer.id,
            referenceNumber: transfer.code,
            reason: `Transfer from branch`,
            performedBy: body.performedBy as string || null,
            performedByName: body.performedByName as string || null,
          },
        });

        // Update product stock
        await tx.product.update({
          where: { id: item.productId },
          data: {
            currentStock: { increment: quantityReceived },
            updatedAt: new Date(),
          },
        });
      }
    }

    return updated;
  });

  return NextResponse.json({
    success: true,
    data: result,
    message: 'Transfer received',
  });
}

// Helper: Cancel transfer
async function cancelTransfer(transfer: { id: string; status: string }, body: Record<string, unknown>) {
  if (!['draft', 'pending', 'approved'].includes(transfer.status)) {
    return NextResponse.json(
      { error: 'Transfer can only be cancelled from draft, pending, or approved status' },
      { status: 400 }
    );
  }

  const result = await db.stockTransfer.update({
    where: { id: transfer.id },
    data: {
      status: 'cancelled',
      cancelledAt: new Date(),
      cancelledBy: body.performedBy as string || null,
      cancelledByName: body.performedByName as string || null,
      cancelledReason: body.reason as string || null,
    },
  });

  return NextResponse.json({
    success: true,
    data: result,
    message: 'Transfer cancelled',
  });
}
