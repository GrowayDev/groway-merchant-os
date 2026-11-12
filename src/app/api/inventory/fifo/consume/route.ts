import { NextRequest, NextResponse } from 'next/server';
import { FIFOService } from '@/services/inventory/fifo-service';

/**
 * POST /api/inventory/fifo/consume
 * Execute FIFO consumption for a sale or adjustment
 * 
 * Body:
 * - productId: required
 * - branchId: required
 * - merchantId: required
 * - quantity: required
 * - type: required (sale, adjustment, recipe, transfer_out)
 * - referenceType: optional
 * - referenceId: optional
 * - referenceNumber: optional
 * - performedBy: optional
 * - performedByName: optional
 * - reason: optional
 * - notes: optional
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.productId) {
      return NextResponse.json(
        { error: 'productId is required' },
        { status: 400 }
      );
    }

    if (!body.branchId) {
      return NextResponse.json(
        { error: 'branchId is required' },
        { status: 400 }
      );
    }

    if (!body.merchantId) {
      return NextResponse.json(
        { error: 'merchantId is required' },
        { status: 400 }
      );
    }

    if (!body.quantity || body.quantity <= 0) {
      return NextResponse.json(
        { error: 'Quantity must be greater than 0' },
        { status: 400 }
      );
    }

    if (!body.type || !['sale', 'adjustment', 'recipe', 'transfer_out'].includes(body.type)) {
      return NextResponse.json(
        { error: 'Type must be one of: sale, adjustment, recipe, transfer_out' },
        { status: 400 }
      );
    }

    // Generate idempotency key if not provided
    const idempotencyKey = body.idempotencyKey || `fifo-${body.productId}-${body.branchId}-${Date.now()}`;

    // Execute FIFO consumption
    const result = await FIFOService.consumeFIFO({
      productId: body.productId,
      branchId: body.branchId,
      merchantId: body.merchantId,
      quantity: body.quantity,
      type: body.type,
      referenceType: body.referenceType,
      referenceId: body.referenceId,
      referenceNumber: body.referenceNumber,
      performedBy: body.performedBy,
      performedByName: body.performedByName,
      reason: body.reason,
      notes: body.notes,
      idempotencyKey,
    });

    return NextResponse.json({
      success: result.success,
      data: result,
      message: result.success 
        ? `Consumed ${result.totalQuantity} units at average cost ${result.averageUnitCost.toFixed(2)}`
        : result.error,
    }, { status: result.success ? 200 : 400 });
  } catch (error) {
    console.error('Error in FIFO consumption:', error);
    return NextResponse.json(
      { error: 'Failed to consume stock', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/inventory/fifo/consume
 * Preview FIFO consumption (dry run)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const productId = searchParams.get('productId');
    const branchId = searchParams.get('branchId');
    const merchantId = searchParams.get('merchantId');
    const quantity = parseFloat(searchParams.get('quantity') || '0');

    if (!productId || !branchId || !merchantId || quantity <= 0) {
      return NextResponse.json(
        { error: 'productId, branchId, merchantId, and quantity are required' },
        { status: 400 }
      );
    }

    // Calculate FIFO consumption (dry run)
    const result = await FIFOService.calculateFIFOConsumption(
      productId,
      branchId,
      merchantId,
      quantity
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error calculating FIFO consumption:', error);
    return NextResponse.json(
      { error: 'Failed to calculate FIFO consumption', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
