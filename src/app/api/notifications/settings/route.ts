/**
 * Notification Settings API
 */

import { NextRequest, NextResponse } from 'next/server';
import { getNotificationSettings, updateNotificationSettings } from '@/lib/notifications';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get('merchantId');
    
    if (!merchantId) {
      return NextResponse.json(
        { error: 'merchantId required' },
        { status: 400 }
      );
    }
    
    const settings = await getNotificationSettings(merchantId);
    
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Get notification settings error:', error);
    return NextResponse.json(
      { error: 'Failed to get notification settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { merchantId, ...updates } = body;
    
    if (!merchantId) {
      return NextResponse.json(
        { error: 'merchantId required' },
        { status: 400 }
      );
    }
    
    const settings = await updateNotificationSettings(merchantId, updates);
    
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Update notification settings error:', error);
    return NextResponse.json(
      { error: 'Failed to update notification settings' },
      { status: 500 }
    );
  }
}
