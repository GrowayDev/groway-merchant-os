/**
 * Notifications API - Queue notifications
 */

import { NextRequest, NextResponse } from 'next/server';
import { queueNotification, sendNotificationImmediate } from '@/lib/notifications';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      merchantId,
      channel,
      recipient,
      templateCode,
      subject,
      body: messageBody,
      variables,
      referenceType,
      referenceId,
      scheduledAt,
      priority,
      immediate = false,
    } = body;
    
    if (!merchantId || !channel || !recipient) {
      return NextResponse.json(
        { error: 'Missing required fields: merchantId, channel, recipient' },
        { status: 400 }
      );
    }
    
    if (immediate) {
      const result = await sendNotificationImmediate({
        merchantId,
        channel,
        recipient,
        templateCode,
        subject,
        body: messageBody,
        variables,
        referenceType,
        referenceId,
        priority,
      });
      
      return NextResponse.json(result);
    } else {
      const notificationId = await queueNotification({
        merchantId,
        channel,
        recipient,
        templateCode,
        subject,
        body: messageBody,
        variables,
        referenceType,
        referenceId,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
        priority,
      });
      
      return NextResponse.json({
        success: true,
        notificationId,
      });
    }
  } catch (error) {
    console.error('Notification queue error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to queue notification' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get('merchantId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    if (!merchantId) {
      return NextResponse.json(
        { error: 'merchantId required' },
        { status: 400 }
      );
    }
    
    const { db } = await import('@/lib/db');
    
    const where: any = { merchantId };
    if (status) where.status = status;
    
    const [notifications, total] = await Promise.all([
      db.notificationQueue.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.notificationQueue.count({ where }),
    ]);
    
    return NextResponse.json({ notifications, total });
  } catch (error) {
    console.error('Get notifications error:', error);
    return NextResponse.json(
      { error: 'Failed to get notifications' },
      { status: 500 }
    );
  }
}
