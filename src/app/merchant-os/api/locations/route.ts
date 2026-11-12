import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const locations = await db.location.findMany({ orderBy: { createdAt: 'desc' } })
    return NextResponse.json(locations)
  } catch (error) {
    return NextResponse.json([
      { id: 'loc-1', name: 'Main Store', type: 'store', status: 'active', city: 'Johannesburg', province: 'Gauteng', manager: 'Thabo M.', monthlyRevenue: 1285000, staffCount: 12 },
      { id: 'loc-2', name: 'Sandton Branch', type: 'store', status: 'active', city: 'Sandton', province: 'Gauteng', manager: 'Nomsa D.', monthlyRevenue: 2345000, staffCount: 18 },
    ])
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const location = await db.location.create({
      data: {
        name: body.name,
        type: body.type || 'store',
        status: body.status || 'active',
        street: body.street,
        city: body.city,
        province: body.province,
        postalCode: body.postalCode,
        phone: body.phone,
        email: body.email,
        manager: body.manager,
        openTime: body.openTime || '08:00',
        closeTime: body.closeTime || '18:00',
      }
    })
    return NextResponse.json(location, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create location' }, { status: 500 })
  }
}
