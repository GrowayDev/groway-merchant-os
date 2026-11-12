import { NextRequest, NextResponse } from 'next/server';
import { FIFOService } from '@/services/inventory/fifo-service';

/**
 * GET /api/inventory/fifo/cost
 * Get FIFO cost for a product (average of available batches)
 * 
 * Query params:
 * - productId: required
 * - branchId: required
 * - merchantId: required
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const productId = searchParams.get('productId');
    const branchId = searchParams.get('branchId');
    const merchantId = searchParams.get('merchantId');

    if (!productId || !branchId || !merchantId) {
      return NextResponse.json(
        { error: 'productId, branchId, and merchantId are required' },
        { status: 400 }
      );
    }

    const fifoCost = await FIFOService.getFIFOCost(productId, branchId, merchantId);

    return NextResponse.json({
      success: true,
      data: {
        productId,
        branchId,
        fifoCost,
        currency: 'ZAR',
      },
    });
  } catch (error) {
    console.error('Error getting FIFO cost:', error);
    return NextResponse.json(
      { error: 'Failed to get FIFO cost', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
