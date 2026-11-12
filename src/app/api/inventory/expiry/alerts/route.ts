import { NextRequest, NextResponse } from 'next/server';
import { ExpiryAlertService } from '@/services/inventory/expiry-alert-service';
import { getAuthContext, unauthorizedResponse, forbiddenResponse } from '@/lib/auth-context';

/**
 * GET /api/inventory/expiry/alerts
 * Get expiry alerts for batches
 * 
 * Security: Requires authentication. merchantId must match authenticated user's merchant.
 * 
 * Query params:
 * - merchantId: required (validated against auth context)
 * - branchId: optional
 * - severity: optional (info, warning, critical)
 * - daysThreshold: optional (default: 30)
 * - includeExpired: optional (default: true)
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
    const branchId = searchParams.get('branchId') || undefined;
    const severity = searchParams.get('severity') as 'info' | 'warning' | 'critical' | null;
    const daysThreshold = parseInt(searchParams.get('daysThreshold') || '30', 10);
    const includeExpired = searchParams.get('includeExpired') !== 'false';

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

    const alerts = await ExpiryAlertService.getExpiryAlerts(merchantId, {
      branchId,
      severity: severity || undefined,
      daysThreshold,
      includeExpired,
    });

    // Filter by severity if specified
    const filteredAlerts = severity 
      ? alerts.filter((a) => a.severity === severity)
      : alerts;

    // Get summary
    const summary = await ExpiryAlertService.getExpiryAlertSummary(merchantId);

    return NextResponse.json({
      success: true,
      data: filteredAlerts,
      summary,
      filters: {
        branchId,
        severity,
        daysThreshold,
        includeExpired,
      },
    });
  } catch (error) {
    console.error('Error getting expiry alerts:', error);
    return NextResponse.json(
      { error: 'Failed to get expiry alerts', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/inventory/expiry/alerts
 * Sync expiry alerts (create/update in database)
 * 
 * Security: Requires authentication. merchantId must match authenticated user's merchant.
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

    const result = await ExpiryAlertService.syncExpiryAlerts(merchantId);

    return NextResponse.json({
      success: true,
      data: result,
      message: `Synced expiry alerts: ${result.created} created, ${result.updated} updated, ${result.resolved} resolved`,
    });
  } catch (error) {
    console.error('Error syncing expiry alerts:', error);
    return NextResponse.json(
      { error: 'Failed to sync expiry alerts', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
