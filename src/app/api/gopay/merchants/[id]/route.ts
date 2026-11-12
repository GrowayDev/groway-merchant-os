import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Get merchant details with all related data
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const merchant = await db.GopayMerchant.findUnique({
      where: { id },
      include: {
        devices: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        },
        facilities: {
          where: { status: 'active' },
          take: 5
        },
        settlements: {
          take: 5,
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: { devices: true, facilities: true, settlements: true }
        }
      }
    })
    
    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 })
    }
    
    // Calculate stats
    const stats = {
      totalDevices: merchant._count.devices,
      activeDevices: merchant.devices.filter(d => d.status === 'active').length,
      totalFacilities: merchant._count.facilities,
      activeFacilities: merchant.facilities.filter(f => f.status === 'active').length,
      totalCreditAvailable: merchant.facilities.reduce((sum, f) => sum + f.availableAmount, 0),
      totalCreditUsed: merchant.facilities.reduce((sum, f) => sum + f.usedAmount, 0)
    }
    
    return NextResponse.json({ merchant, stats })
  } catch (error) {
    console.error('Error fetching merchant:', error)
    return NextResponse.json({ error: 'Failed to fetch merchant' }, { status: 500 })
  }
}

// PUT - Update merchant
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const merchant = await db.GopayMerchant.update({
      where: { id },
      data: {
        ...body,
        totalRevenue: body.totalRevenue ? parseFloat(body.totalRevenue) : undefined,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ merchant })
  } catch (error) {
    console.error('Error updating merchant:', error)
    return NextResponse.json({ error: 'Failed to update merchant' }, { status: 500 })
  }
}
