import { NextRequest, NextResponse } from 'next/server';
import { BatchRecallService, QuarantineReason } from '@/services/inventory/batch-recall-service';

/**
 * GET /api/inventory/recall
 * Get all recalled/quarantined batches
 * 
 * Query params:
 * - merchantId: required
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const merchantId = searchParams.get('merchantId');

    if (!merchantId) {
      return NextResponse.json(
        { error: 'merchantId is required' },
        { status: 400 }
      );
    }

    const recalledBatches = await BatchRecallService.getRecalledBatches(merchantId);

    return NextResponse.json({
      success: true,
      data: recalledBatches,
      count: recalledBatches.length,
    });
  } catch (error) {
    console.error('Error getting recalled batches:', error);
    return NextResponse.json(
      { error: 'Failed to get recalled batches', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/inventory/recall
 * Initiate recall, quarantine, clear, or dispose actions
 * 
 * Body:
 * - action: required (initiate, quarantine, clear, dispose)
 * - batchId: required
 * - reason: required for initiate/quarantine
 * - description: optional
 * - disposalMethod: required for dispose
 * - resolutionNotes: required for clear
 * - performedBy: optional
 * - performedByName: optional
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.action) {
      return NextResponse.json(
        { error: 'action is required (initiate, quarantine, clear, dispose)' },
        { status: 400 }
      );
    }

    if (!body.batchId) {
      return NextResponse.json(
        { error: 'batchId is required' },
        { status: 400 }
      );
    }

    switch (body.action) {
      case 'initiate': {
        if (!body.reason) {
          return NextResponse.json(
            { error: 'reason is required for recall initiation' },
            { status: 400 }
          );
        }

        const result = await BatchRecallService.initiateRecall({
          batchId: body.batchId,
          reason: body.reason as QuarantineReason,
          description: body.description || body.reason,
          initiatedBy: body.performedBy || 'system',
          initiatedByName: body.performedByName || 'System',
        });

        return NextResponse.json({
          success: result.success,
          data: result,
          message: result.message,
        }, { status: result.success ? 200 : 400 });
      }

      case 'quarantine': {
        if (!body.reason) {
          return NextResponse.json(
            { error: 'reason is required for quarantine' },
            { status: 400 }
          );
        }

        const result = await BatchRecallService.quarantineBatch(
          body.batchId,
          body.reason as QuarantineReason,
          body.description || body.reason,
          body.performedBy,
          body.performedByName
        );

        return NextResponse.json({
          success: result.success,
          data: result,
          message: result.message,
        }, { status: result.success ? 200 : 400 });
      }

      case 'clear': {
        if (!body.resolutionNotes) {
          return NextResponse.json(
            { error: 'resolutionNotes is required for clearing batch' },
            { status: 400 }
          );
        }

        const result = await BatchRecallService.clearBatch(
          body.batchId,
          body.resolutionNotes,
          body.performedBy,
          body.performedByName
        );

        return NextResponse.json({
          success: result.success,
          data: result,
          message: result.message,
        }, { status: result.success ? 200 : 400 });
      }

      case 'dispose': {
        if (!body.disposalMethod) {
          return NextResponse.json(
            { error: 'disposalMethod is required for disposal (destroyed, returned, donated, other)' },
            { status: 400 }
          );
        }

        const result = await BatchRecallService.disposeBatch(
          body.batchId,
          body.disposalMethod,
          body.notes || '',
          body.performedBy,
          body.performedByName
        );

        return NextResponse.json({
          success: result.success,
          data: result,
          message: result.message,
        }, { status: result.success ? 200 : 400 });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: initiate, quarantine, clear, dispose' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in recall action:', error);
    return NextResponse.json(
      { error: 'Failed to process recall action', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
