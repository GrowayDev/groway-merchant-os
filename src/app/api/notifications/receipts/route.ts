/**
 * E-Receipts API
 */

import { NextRequest, NextResponse } from 'next/server';
import { sendReceiptViaWhatsApp } from '@/lib/notifications';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;
    
    if (action === 'send_whatsapp') {
      const result = await sendReceiptViaWhatsApp(
        data.merchantId,
        data.transactionData
      );
      
      return NextResponse.json(result);
    }
    
    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('E-receipt error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process e-receipt' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get('merchantId');
    const receiptNumber = searchParams.get('receiptNumber');
    const customerPhone = searchParams.get('customerPhone');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // Public access by receipt number
    if (receiptNumber) {
      const receipt = await db.eReceipt.findUnique({
        where: { receiptNumber },
      });
      
      if (!receipt) {
        return NextResponse.json(
          { error: 'Receipt not found' },
          { status: 404 }
        );
      }
      
      // Update view count
      await db.eReceipt.update({
        where: { receiptNumber },
        data: {
          viewCount: { increment: 1 },
          lastViewedAt: new Date(),
        }
      });
      
      return NextResponse.json({
        ...receipt,
        receiptData: JSON.parse(receipt.receiptData),
      });
    }
    
    // Merchant access
    if (!merchantId) {
      return NextResponse.json(
        { error: 'merchantId or receiptNumber required' },
        { status: 400 }
      );
    }
    
    const where: any = { merchantId };
    if (customerPhone) where.customerPhone = customerPhone;
    
    const [receipts, total] = await Promise.all([
      db.eReceipt.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.eReceipt.count({ where }),
    ]);
    
    return NextResponse.json({
      receipts: receipts.map(r => ({
        ...r,
        receiptData: JSON.parse(r.receiptData),
      })),
      total,
    });
  } catch (error) {
    console.error('Get receipts error:', error);
    return NextResponse.json(
      { error: 'Failed to get receipts' },
      { status: 500 }
    );
  }
}
