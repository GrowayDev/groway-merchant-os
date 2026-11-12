import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const applications = await db.creditApplication.findMany({ orderBy: { createdAt: 'desc' } })
    return NextResponse.json(applications)
  } catch (error) {
    return NextResponse.json([])
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const count = await db.creditApplication.count()
    const application = await db.creditApplication.create({
      data: {
        applicationNo: `GRC-${String(count + 1).padStart(6, '0')}`,
        businessName: body.businessName,
        contactName: body.contactName,
        email: body.email,
        phone: body.phone,
        tradingYears: body.tradingYears ? parseInt(body.tradingYears) : null,
        annualRevenue: body.annualRevenue ? parseFloat(body.annualRevenue) : null,
        requestedAmount: parseFloat(body.requestedAmount),
        purpose: body.purpose,
        status: 'draft'
      }
    })
    return NextResponse.json(application, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create application' }, { status: 500 })
  }
}
