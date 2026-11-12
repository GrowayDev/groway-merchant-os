import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Fetch all kitchen stations
export async function GET() {
  try {
    const stations = await db.kitchenStation.findMany({
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(stations)
  } catch (error) {
    console.error('Error fetching kitchen stations:', error)
    return NextResponse.json({ error: 'Failed to fetch kitchen stations' }, { status: 500 })
  }
}

// POST - Create a new kitchen station
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, icon, color, active } = body

    if (!name) {
      return NextResponse.json({ error: 'Station name is required' }, { status: 400 })
    }

    const station = await db.kitchenStation.create({
      data: {
        name,
        icon: icon || 'Flame',
        color: color || '#EF4444',
        active: active ?? true,
      },
    })
    return NextResponse.json(station, { status: 201 })
  } catch (error) {
    console.error('Error creating kitchen station:', error)
    return NextResponse.json({ error: 'Failed to create kitchen station' }, { status: 500 })
  }
}
