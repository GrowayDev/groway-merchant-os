import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ============================================
// SAPE Community Tip-offs
// POST: submit a tip-off (public)
// GET: list tip-offs (status filter)
// PATCH: triage a tip-off (?id=)
// ============================================

// POST /merchant-os/api/sape/tipoff
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { reporterName, reporterContact, productGtin, productName, outletAddress, description, photoUrl } = body

    if (!description) {
      return NextResponse.json({ success: false, error: 'description is required' }, { status: 400 })
    }

    const tipOff = await db.sapeTipOff.create({
      data: {
        id: crypto.randomUUID(),
        reporterName: reporterName ? String(reporterName) : null,
        reporterContact: reporterContact ? String(reporterContact) : null,
        productGtin: productGtin ? String(productGtin) : null,
        productName: productName ? String(productName) : null,
        outletAddress: outletAddress ? String(outletAddress) : null,
        description: String(description),
        photoUrl: photoUrl ? String(photoUrl) : null,
        status: 'NEW',
      },
    })

    return NextResponse.json({
      success: true,
      tipOff: {
        id: tipOff.id,
        status: tipOff.status,
        createdAt: tipOff.createdAt,
      },
    })
  } catch (error) {
    console.error('SAPE tipoff POST error:', error)
    return NextResponse.json({ success: false, error: 'Failed to submit tip-off' }, { status: 500 })
  }
}

// GET /merchant-os/api/sape/tipoff?status=NEW
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const where: Record<string, unknown> = {}
    if (status && status !== 'ALL') where.status = status

    const [tipOffs, byStatus] = await Promise.all([
      db.sapeTipOff.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      db.sapeTipOff.groupBy({ by: ['status'], _count: { _all: true } }),
    ])

    const statusCounts: Record<string, number> = {}
    for (const g of byStatus) statusCounts[g.status] = g._count._all

    return NextResponse.json({
      success: true,
      tipOffs,
      statusCounts,
      total: tipOffs.length,
    })
  } catch (error) {
    console.error('SAPE tipoff GET error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch tip-offs' }, { status: 500 })
  }
}

// PATCH /merchant-os/api/sape/tipoff?id=...
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ success: false, error: 'id query param is required' }, { status: 400 })
    }

    const body = await request.json()
    const { status, triageNotes, authorityRouted } = body

    const existing = await db.sapeTipOff.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Tip-off not found' }, { status: 404 })
    }

    const updated = await db.sapeTipOff.update({
      where: { id },
      data: {
        ...(status !== undefined ? { status: String(status) } : {}),
        ...(triageNotes !== undefined ? { triageNotes: triageNotes ? String(triageNotes) : null } : {}),
        ...(authorityRouted !== undefined
          ? { authorityRouted: authorityRouted ? String(authorityRouted) : null }
          : {}),
      },
    })

    return NextResponse.json({ success: true, tipOff: updated })
  } catch (error) {
    console.error('SAPE tipoff PATCH error:', error)
    return NextResponse.json({ success: false, error: 'Failed to triage tip-off' }, { status: 500 })
  }
}
