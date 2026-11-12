import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { nanoid } from 'nanoid'

// GET /api/merchant-os/childcare/notifications - Get notifications for a merchant
export async function GET(request: NextRequest) {
  try {
    const merchantId = request.headers.get('x-merchant-id') || 
                       request.nextUrl.searchParams.get('merchantId')

    if (!merchantId) {
      return NextResponse.json({ error: 'Merchant ID required' }, { status: 400 })
    }

    const notifications = await db.childcareNotification.findMany({
      where: { merchantId },
      orderBy: { sentAt: 'desc' },
      take: 50
    })

    const unreadCount = notifications.filter(n => !n.read).length

    return NextResponse.json({ 
      notifications,
      unreadCount
    })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}

// POST /api/merchant-os/childcare/notifications - Create a notification
export async function POST(request: NextRequest) {
  try {
    const merchantId = request.headers.get('x-merchant-id') ||
                       request.nextUrl.searchParams.get('merchantId')

    if (!merchantId) {
      return NextResponse.json({ error: 'Merchant ID required' }, { status: 400 })
    }

    const body = await request.json()
    const notificationId = `NOT-${nanoid(8).toUpperCase()}`

    const notification = await db.childcareNotification.create({
      data: {
        id: notificationId,
        merchantId,
        childId: body.childId,
        childName: body.childName,
        type: body.type,
        title: body.title,
        message: body.message,
        photoUrl: body.photoUrl,
        read: false
      }
    })

    return NextResponse.json({ success: true, notification })
  } catch (error) {
    console.error('Error creating notification:', error)
    return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 })
  }
}

// PATCH /api/merchant-os/childcare/notifications - Mark as read
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()

    if (body.markAllRead) {
      const merchantId = request.headers.get('x-merchant-id') ||
                         request.nextUrl.searchParams.get('merchantId')

      if (!merchantId) {
        return NextResponse.json({ error: 'Merchant ID required' }, { status: 400 })
      }

      await db.childcareNotification.updateMany({
        where: { merchantId, read: false },
        data: { read: true }
      })

      return NextResponse.json({ success: true })
    }

    if (body.notificationId) {
      await db.childcareNotification.update({
        where: { id: body.notificationId },
        data: { read: true }
      })

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  } catch (error) {
    console.error('Error updating notification:', error)
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 })
  }
}
