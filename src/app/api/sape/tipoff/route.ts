/**
 * SAPE Layer 6 — Anonymous tip-off line (public) feeding authority workflows.
 * POST /api/sape/tipoff   (PUBLIC — no auth, no identity required)
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { randomUUID } from 'crypto'

const CATEGORIES = ['counterfeit-ring', 'illegal-import', 'tampered-stock', 'unregistered-seller', 'other']
const MAX = 4000

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { category, description, contact, payload } = body

    if (!category || !CATEGORIES.includes(String(category))) {
      return NextResponse.json(
        { success: false, error: `category must be one of: ${CATEGORIES.join(', ')}` },
        { status: 400 }
      )
    }
    if (!description || typeof description !== 'string' || description.length < 10 || description.length > MAX) {
      return NextResponse.json(
        { success: false, error: `Description required (10–${MAX} chars)` },
        { status: 400 }
      )
    }

    let serialId: string | null = null
    if (payload) {
      const parts = String(payload).match(/21(\S+)/)
      if (parts?.[1]) {
        const serial = await db.productSerial.findUnique({ where: { serial: parts[1] } })
        serialId = serial?.id ?? null
      }
    }

    const tip = await db.tipOff.create({
      data: {
        id: randomUUID(),
        serialId,
        category: String(category),
        description: String(description).slice(0, MAX),
        contactOptional: contact ? String(contact).slice(0, 200) : null,
      },
    })

    // Route to SAPS queue with 1-hour SLA per SAPE spec
    await db.authorityNotification.create({
      data: {
        id: randomUUID(),
        authority: 'SAPS',
        notificationType: 'tip-off',
        severity: 'medium',
        subject: `Anonymous tip-off (${tip.category}) — ${tip.id.slice(0, 8)}`,
        payload: JSON.stringify({ tipId: tip.id, category, description: tip.description }),
        slaDeadline: new Date(Date.now() + 60 * 60 * 1000),
      },
    })

    return NextResponse.json(
      { success: true, data: { tipId: tip.id, status: tip.status, anonymous: !contact } },
      { status: 201 }
    )
  } catch (error) {
    console.error('SAPE tipoff POST error:', error)
    return NextResponse.json({ success: false, error: 'Failed to submit tip-off' }, { status: 500 })
  }
}
