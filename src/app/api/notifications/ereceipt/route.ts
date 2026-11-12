import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, unauthorizedResponse, forbiddenResponse } from '@/lib/auth-context';

const WHATSAPP_SERVICE_URL = 'http://localhost:3005';

/**
 * POST /api/notifications/ereceipt
 * Generate and send E-Receipt via WhatsApp
 * 
 * Security: Requires authentication. merchantId must match authenticated user's merchant
 * or user must have platform_admin role.
 */
export async function POST(request: NextRequest) {
  // Authentication check
  const context = await getAuthContext(request);
  if (!context) {
    return unauthorizedResponse('Authentication required to send e-receipts');
  }

  try {
    const body = await request.json();
    const { 
      merchantId: bodyMerchantId, 
      transactionNumber,
      customerName,
      customerPhone,
      items,
      subtotal,
      vatAmount,
      total,
      paymentMethod,
      merchantName,
      merchantAddress,
      merchantPhone
    } = body;

    // Security: Validate merchantId
    let merchantId: string;
    
    if ('merchantId' in context) {
      // User has merchant context
      if (bodyMerchantId && bodyMerchantId !== context.merchantId) {
        // Cross-merchant access attempted
        if (context.role !== 'platform_admin' && context.role !== 'super_admin') {
          return forbiddenResponse('Access denied to this merchant');
        }
        merchantId = bodyMerchantId;
      } else {
        // Use authenticated merchant
        merchantId = context.merchantId;
      }
    } else {
      // Consumer or admin without merchant context
      if (!bodyMerchantId) {
        return NextResponse.json(
          { success: false, error: 'merchantId is required' },
          { status: 400 }
        );
      }
      merchantId = bodyMerchantId;
    }

    // Validate required fields
    if (!customerPhone) {
      return NextResponse.json(
        { success: false, error: 'customerPhone is required' },
        { status: 400 }
      );
    }

    // Generate receipt number
    const receiptNumber = `RCP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
    
    const now = new Date();
    const date = now.toLocaleDateString('en-ZA');
    const time = now.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });

    const receiptData = {
      receiptNumber,
      transactionNumber,
      merchantName: merchantName || 'Groway Merchant',
      merchantAddress,
      merchantPhone,
      customerName,
      items: items || [],
      subtotal: subtotal || 0,
      vatAmount: vatAmount || 0,
      total: total || 0,
      paymentMethod: paymentMethod || 'cash',
      date,
      time,
    };

    // Send E-Receipt via WhatsApp service
    const response = await fetch(`${WHATSAPP_SERVICE_URL}/ereceipt?XTransformPort=3005`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        merchantId,
        receiptData,
        customerPhone,
      }),
    });

    const result = response.ok ? await response.json() : { success: false };

    return NextResponse.json({
      success: result.success,
      receiptId: result.receiptId,
      receiptNumber,
      messageId: result.messageId,
      message: result.success ? 'E-Receipt sent successfully via WhatsApp' : 'Failed to send E-Receipt',
    });
  } catch (error) {
    console.error('Error sending e-receipt:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send e-receipt' },
      { status: 500 }
    );
  }
}
