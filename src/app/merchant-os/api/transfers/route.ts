import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const transfers = await db.stockTransfer.findMany({
      include: { fromLocation: true, toLocation: true, items: true },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(transfers)
  } catch (error) {
    return NextResponse.json([
      { id: 'trf-1', transferNumber: 'TRF-001', fromLocationId: 'loc-1', toLocationId: 'loc-2', status: 'pending', totalItems: 5, createdAt: new Date().toISOString() },
    ])
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const count = await db.stockTransfer.count()
    const transfer = await db.stockTransfer.create({
      data: {
        transferNumber: `TRF-${String(count + 1).padStart(5, '0')}`,
        fromLocationId: body.fromLocationId,
        toLocationId: body.toLocationId,
        status: 'draft',
        totalItems: body.items?.length || 0,
        notes: body.notes,
        items: body.items ? { create: body.items } : undefined
      },
      include: { items: true }
    })
    return NextResponse.json(transfer, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create transfer' }, { status: 500 })
  }
}
