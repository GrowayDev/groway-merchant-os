import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const transfer = await db.stockTransfer.findUnique({ where: { id }, include: { items: true } })
  return NextResponse.json(transfer)
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()
  const transfer = await db.stockTransfer.update({ where: { id }, data: { ...body, updatedAt: new Date() } })
  return NextResponse.json(transfer)
}
