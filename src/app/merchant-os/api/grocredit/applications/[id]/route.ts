import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const application = await db.creditApplication.findUnique({ where: { id } })
  return NextResponse.json(application)
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()
  const updateData: any = { ...body, updatedAt: new Date() }
  if (body.status === 'submitted') updateData.submittedAt = new Date()
  if (body.status === 'approved') updateData.approvedAt = new Date()
  if (body.status === 'rejected') updateData.rejectedAt = new Date()
  const application = await db.creditApplication.update({ where: { id }, data: updateData })
  return NextResponse.json(application)
}
