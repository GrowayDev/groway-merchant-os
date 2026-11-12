import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return NextResponse.json({ id, period: 'February 2026', box1_OutputVAT: 52340, box2_InputVAT: 28760, box3_NetVAT: 23580, status: 'ready' })
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()
  return NextResponse.json({ id, ...body })
}
