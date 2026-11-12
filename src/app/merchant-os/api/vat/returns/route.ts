import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  return NextResponse.json([
    { id: 'vat-1', period: 'January 2026', box1_OutputVAT: 45670, box2_InputVAT: 32450, box3_NetVAT: 13220, status: 'paid', dueDate: '2026-02-28' },
    { id: 'vat-2', period: 'February 2026', box1_OutputVAT: 52340, box2_InputVAT: 28760, box3_NetVAT: 23580, status: 'ready', dueDate: '2026-03-28' }
  ])
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    // In real implementation, save to database
    return NextResponse.json({ ...body, id: `vat-${Date.now()}`, status: 'draft' }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create VAT return' }, { status: 500 })
  }
}
