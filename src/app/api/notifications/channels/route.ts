/**
 * Notification Channels API
 */

import { NextRequest, NextResponse } from 'next/server';
import { createNotificationChannel, verifyWhatsAppChannel } from '@/lib/notifications';
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
    
    const channels = await db.notificationChannel.findMany({
      where: { merchantId },
    });
    
    return NextResponse.json({ channels });
  } catch (error) {
    console.error('Get channels error:', error);
    return NextResponse.json(
      { error: 'Failed to get channels' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { merchantId, channel, ...config } = body;
    
    if (!merchantId || !channel) {
      return NextResponse.json(
        { error: 'merchantId and channel required' },
        { status: 400 }
      );
    }
    
    const channelRecord = await createNotificationChannel(merchantId, channel, config);
    
    return NextResponse.json(channelRecord);
  } catch (error) {
    console.error('Create channel error:', error);
    return NextResponse.json(
      { error: 'Failed to create channel' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { channelId, ...updates } = body;
    
    if (!channelId) {
      return NextResponse.json(
        { error: 'channelId required' },
        { status: 400 }
      );
    }
    
    const channel = await db.notificationChannel.update({
      where: { id: channelId },
      data: updates,
    });
    
    return NextResponse.json(channel);
  } catch (error) {
    console.error('Update channel error:', error);
    return NextResponse.json(
      { error: 'Failed to update channel' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get('channelId');
    
    if (!channelId) {
      return NextResponse.json(
        { error: 'channelId required' },
        { status: 400 }
      );
    }
    
    await db.notificationChannel.delete({
      where: { id: channelId },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete channel error:', error);
    return NextResponse.json(
      { error: 'Failed to delete channel' },
      { status: 500 }
    );
  }
}
