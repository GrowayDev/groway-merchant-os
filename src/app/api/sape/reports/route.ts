/**
 * SAPE Layer 5 — Consumer suspicion reports.
 * POST /api/sape/reports   (PUBLIC — anonymous submission allowed)
 * GET  /api/sape/reports   (merchant auth — list reports for own products)
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSapeAuth, isNextResponse } from '@/lib/sape/auth'
import { parseGs1Payload } from '@/lib/sape/engine'
import { randomUUID } from 'crypto'

export async function GET(request: NextRequest) {
  const auth = requireSapeAuth(request)
  if (isNextResponse(auth)) return auth

  try {
    const reports = await db.consumerReport.findMany({
      where: { merchantId: auth.merchantId },
      orderBy: { reportedAt: 'desc' },
      take: 200,
    })
    return NextResponse.json({ success: true, data: reports, count: reports.length })
  } catch (error) {
    console.error('SAPE reports GET error:', error)
    return NextResponse.json({ success: false, error: 'Failed to load reports' }, { status: 500 })
  }
}

const ALLOWED_TYPES = ['counterfeit-suspected', 'tampering', 'wrong-product', 'adverse-reaction']
const MAX_DESC = 2000

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { payload, reportType, description, contact } = body

    if (!reportType || !ALLOWED_TYPES.includes(String(reportType))) {
      return NextResponse.json(
        { success: false, error: `reportType must be one of: ${ALLOWED_TYPES.join(', ')}` },
        { status: 400 }
      )
    }
    if (!description || typeof description !== 'string' || description.length > MAX_DESC) {
      return NextResponse.json(
        { success: false, error: `Description is required (max ${MAX_DESC} chars)` },
        { status: 400 }
      )
    }

    let serialId: string | null = null
    let productIdentityId: string | null = null
    let merchantId: string | null = null

    if (payload) {
      const parsed = parseGs1Payload(String(payload))
      const serial = parsed.serial
        ? await db.productSerial.findUnique({ where: { serial: parsed.serial } })
        : null
      if (serial) {
        serialId = serial.id
        merchantId = serial.merchantId
        productIdentityId = serial.productIdentityId
      }
    }

    const report = await db.consumerReport.create({
      data: {
        id: randomUUID(),
        serialId,
        productIdentityId,
        merchantId,
        reportType: String(reportType),
        description: String(description).slice(0, MAX_DESC),
        contactOptional: contact ? String(contact).slice(0, 200) : null,
      },
    })

    // Escalate to authority notification queue when a tracked serial is implicated
    if (merchantId) {
      await db.authorityNotification.create({
        data: {
          id: randomUUID(),
          merchantId,
          authority: 'NCC',
          notificationType: 'counterfeit-report',
          severity: 'high',
          subject: `Consumer counterfeit report (${report.type ?? reportType}) — ${report.id.slice(0, 8)}`,
          payload: JSON.stringify({ reportId: report.id, reportType, description }),
          slaDeadline: new Date(Date.now() + 60 * 60 * 1000), // 1-hour SLA
        },
      })
    }

    return NextResponse.json(
      { success: true, data: { reportId: report.id, status: report.status } },
      { status: 201 }
    )
  } catch (error) {
    console.error('SAPE reports POST error:', error)
    return NextResponse.json({ success: false, error: 'Failed to submit report' }, { status: 500 })
  }
}
