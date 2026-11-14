import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { SAPE_AUTHORITIES } from '@/lib/sape'

// ============================================
// SAPE Layer 6 — Authority Sharing
// POST: send a notification to SAHPRA / NCC / SARS / SAPS / DTIC / SABS
// GET: list notifications + per-authority summary
// ============================================

// POST /merchant-os/api/sape/authority/notify
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { authority, notificationType, severity, payload } = body

    if (!authority || !SAPE_AUTHORITIES.includes(authority)) {
      return NextResponse.json(
        { success: false, error: `authority must be one of: ${SAPE_AUTHORITIES.join(', ')}` },
        { status: 400 }
      )
    }
    if (!notificationType) {
      return NextResponse.json({ success: false, error: 'notificationType is required' }, { status: 400 })
    }

    const referenceNumber = `AUTH-${authority}-${Date.now().toString(36).toUpperCase()}`

    const notification = await db.sapeAuthorityNotification.create({
      data: {
        id: crypto.randomUUID(),
        authority,
        notificationType: String(notificationType),
        severity: severity ? String(severity) : 'MEDIUM',
        dataPayload: payload ? (typeof payload === 'string' ? payload : JSON.stringify(payload)) : '{}',
        referenceNumber,
        status: 'SENT',
      },
    })

    return NextResponse.json({
      success: true,
      notification: {
        id: notification.id,
        authority: notification.authority,
        notificationType: notification.notificationType,
        severity: notification.severity,
        referenceNumber: notification.referenceNumber,
        status: notification.status,
        sentAt: notification.sentAt,
      },
    })
  } catch (error) {
    console.error('SAPE authority notify POST error:', error)
    return NextResponse.json({ success: false, error: 'Failed to send notification' }, { status: 500 })
  }
}

// GET /merchant-os/api/sape/authority/notify?authority=SAPS
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const authority = searchParams.get('authority')

    const where: Record<string, unknown> = {}
    if (authority && authority !== 'ALL') where.authority = authority

    const [notifications, byAuthority] = await Promise.all([
      db.sapeAuthorityNotification.findMany({
        where,
        orderBy: { sentAt: 'desc' },
        take: 100,
      }),
      db.sapeAuthorityNotification.groupBy({
        by: ['authority'],
        _count: { _all: true },
      }),
    ])

    const summary: Record<string, number> = {}
    for (const auth of SAPE_AUTHORITIES) summary[auth] = 0
    for (const g of byAuthority) summary[g.authority] = g._count._all

    return NextResponse.json({
      success: true,
      notifications: notifications.map((n) => ({
        id: n.id,
        authority: n.authority,
        notificationType: n.notificationType,
        severity: n.severity,
        referenceNumber: n.referenceNumber,
        status: n.status,
        sentAt: n.sentAt,
        acknowledgedAt: n.acknowledgedAt,
        payload: (() => {
          try {
            return n.dataPayload ? JSON.parse(n.dataPayload) : {}
          } catch {
            return n.dataPayload
          }
        })(),
      })),
      summary,
      total: notifications.length,
    })
  } catch (error) {
    console.error('SAPE authority notify GET error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch notifications' }, { status: 500 })
  }
}
