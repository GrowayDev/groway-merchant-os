import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, getMerchantId, unauthorizedResponse, badRequestResponse } from '@/lib/auth-context';

const WHATSAPP_SERVICE_URL = 'http://localhost:3005';

/**
 * GET /api/notifications
 * Get notification stats and recent notifications
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated context
    const context = await getAuthContext(request);
    if (!context) {
      return unauthorizedResponse();
    }
    
    const searchParams = request.nextUrl.searchParams;
    
    // Get merchantId from params or context
    const merchantIdResult = getMerchantId(searchParams, context as any);
    if (merchantIdResult instanceof NextResponse) {
      return merchantIdResult;
    }
    const merchantId = merchantIdResult;
    
    // Fetch stats from WhatsApp notification service
    const statsResponse = await fetch(`${WHATSAPP_SERVICE_URL}/stats?merchantId=${merchantId}&XTransformPort=3005`);
    const stats = statsResponse.ok ? await statsResponse.json() : { queue: {}, todaySent: 0 };

    // Mock recent notifications for demo
    const notifications = [
      {
        id: '1',
        recipientName: 'Thandi Nkosi',
        recipientPhone: '+27821234567',
        channel: 'whatsapp',
        status: 'delivered',
        body: '🧾 E-Receipt for R450.00 - Thank you for shopping with us!',
        cost: 0.35,
        createdAt: new Date().toISOString(),
        sentAt: new Date().toISOString(),
        deliveredAt: new Date().toISOString(),
      },
      {
        id: '2',
        recipientName: 'Johan van der Berg',
        recipientPhone: '+27829876543',
        channel: 'whatsapp',
        status: 'sent',
        body: '📅 Appointment Reminder: Your appointment is tomorrow at 14:00',
        cost: 0.35,
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        sentAt: new Date(Date.now() - 3600000).toISOString(),
      },
    ];

    return NextResponse.json({
      success: true,
      stats: {
        todaySent: stats.todaySent || 2,
        todayDelivered: 1,
        todayFailed: 0,
        pendingQueue: stats.queue?.queued || 0,
        todayCost: 0.70,
        eReceiptsSent: 1,
      },
      notifications,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/notifications
 * Queue a new notification
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated context
    const context = await getAuthContext(request);
    if (!context) {
      return unauthorizedResponse();
    }
    
    const body = await request.json();
    const { merchantId: bodyMerchantId, recipientPhone, recipientName, channel, message, templateCode, variables } = body;
    
    // Validate merchantId - use body param or context
    let merchantId = bodyMerchantId;
    if (!merchantId && 'merchantId' in context) {
      merchantId = context.merchantId;
    }
    
    if (!merchantId) {
      return badRequestResponse('merchantId is required');
    }
    
    // Security check: ensure user has access to this merchant
    if ('merchantId' in context && merchantId !== context.merchantId) {
      const allowedRoles = ['platform_admin', 'super_admin', 'admin'];
      if (!allowedRoles.includes(context.role)) {
        return NextResponse.json(
          { success: false, error: 'Access denied to this merchant' },
          { status: 403 }
        );
      }
    }

    // Queue notification via WhatsApp service
    const response = await fetch(`${WHATSAPP_SERVICE_URL}/queue?XTransformPort=3005`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        merchantId,
        recipientType: 'customer',
        recipientPhone,
        recipientName,
        channel: channel || 'whatsapp',
        body: message,
        templateCode,
        priority: 5,
      }),
    });

    const result = response.ok ? await response.json() : { success: false };

    return NextResponse.json({
      success: result.success,
      queueId: result.queueId,
      message: result.success ? 'Notification queued successfully' : 'Failed to queue notification',
    });
  } catch (error) {
    console.error('Error queuing notification:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to queue notification' },
      { status: 500 }
    );
  }
}
