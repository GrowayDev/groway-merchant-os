import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - List all trading hours
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const licenseType = searchParams.get('licenseType')
    
    const where: any = { isActive: true }
    if (licenseType) where.licenseType = licenseType
    
    const hours = await db.tradingHours.findMany({
      where,
      orderBy: { dayOfWeek: 'asc' },
    })
    
    // Get exceptions
    const today = new Date().toISOString().split('T')[0]
    const exceptions = await db.tradingHoursException.findMany({
      where: {
        date: { gte: today },
      },
      orderBy: { date: 'asc' },
      take: 10,
    })
    
    return NextResponse.json({
      tradingHours: hours,
      exceptions,
    })
  } catch (error) {
    console.error('Error fetching trading hours:', error)
    return NextResponse.json({ error: 'Failed to fetch trading hours' }, { status: 500 })
  }
}

// POST - Create trading hours entry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const hours = await db.tradingHours.create({
      data: {
        dayOfWeek: body.dayOfWeek,
        openTime: body.openTime,
        closeTime: body.closeTime,
        licenseType: body.licenseType || 'standard',
        isActive: body.isActive ?? true,
        notes: body.notes,
      },
    })
    
    return NextResponse.json(hours, { status: 201 })
  } catch (error) {
    console.error('Error creating trading hours:', error)
    return NextResponse.json({ error: 'Failed to create trading hours' }, { status: 500 })
  }
}

// PUT - Update trading hours
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    const hours = await db.tradingHours.update({
      where: { id: body.id },
      data: {
        openTime: body.openTime,
        closeTime: body.closeTime,
        isActive: body.isActive,
        notes: body.notes,
        updatedAt: new Date(),
      },
    })
    
    return NextResponse.json(hours)
  } catch (error) {
    console.error('Error updating trading hours:', error)
    return NextResponse.json({ error: 'Failed to update trading hours' }, { status: 500 })
  }
}
