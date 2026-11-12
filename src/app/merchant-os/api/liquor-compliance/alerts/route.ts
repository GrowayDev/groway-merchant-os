import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - List customer alerts
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const alertType = searchParams.get('alertType')
    const active = searchParams.get('active')
    
    const where: any = {}
    if (alertType) where.alertType = alertType
    if (active !== null) where.isActive = active === 'true'
    
    const alerts = await db.customerAlert.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
    
    return NextResponse.json(alerts)
  } catch (error) {
    console.error('Error fetching customer alerts:', error)
    return NextResponse.json({ error: 'Failed to fetch customer alerts' }, { status: 500 })
  }
}

// POST - Create customer alert
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const alert = await db.customerAlert.create({
      data: {
        alertType: body.alertType,
        customerName: body.customerName,
        idNumber: body.idNumber,
        photoUrl: body.photoUrl,
        reason: body.reason,
        source: body.source,
        sourceReference: body.sourceReference,
        startDate: body.startDate || new Date().toISOString().split('T')[0],
        endDate: body.endDate,
        isActive: body.isActive ?? true,
        notes: body.notes,
      },
    })
    
    return NextResponse.json(alert, { status: 201 })
  } catch (error) {
    console.error('Error creating customer alert:', error)
    return NextResponse.json({ error: 'Failed to create customer alert' }, { status: 500 })
  }
}
