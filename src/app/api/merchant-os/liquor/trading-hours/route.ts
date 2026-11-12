import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// South African Provincial Trading Hours Reference
// Note: Actual hours vary by province and license type
// Gauteng: On-consumption typically 10:00-02:00, Off-consumption 09:00-20:00
// Western Cape: On-consumption typically 11:00-02:00, Off-consumption 09:00-18:00 (Sundays 11:00-18:00)
// KZN: On-consumption typically 10:00-02:00, Off-consumption 08:00-20:00

const PROVINCIAL_DEFAULTS: Record<string, Record<string, { open: string; close: string }[]>> = {
  gauteng: {
    on_consumption: [
      { open: '10:00', close: '02:00' } // Mon-Sat
    ],
    off_consumption: [
      { open: '09:00', close: '20:00' } // Mon-Sat
    ]
  },
  western_cape: {
    on_consumption: [
      { open: '11:00', close: '02:00' }
    ],
    off_consumption: [
      { open: '09:00', close: '18:00' }
    ]
  }
}

// GET - Get trading hours
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const licenseType = searchParams.get('licenseType')
    const includeCheck = searchParams.get('includeCheck') === 'true'
    
    const where: Record<string, unknown> = { isActive: true }
    if (licenseType) where.licenseType = licenseType
    
    // Get regular trading hours
    const tradingHours = await db.tradingHours.findMany({
      where,
      orderBy: { dayOfWeek: 'asc' },
    })
    
    // Get upcoming exceptions (public holidays, special events)
    const today = new Date().toISOString().split('T')[0]
    const exceptions = await db.tradingHoursException.findMany({
      where: {
        date: { gte: today },
      },
      orderBy: { date: 'asc' },
      take: 10,
    })
    
    // Build response with current status
    const now = new Date()
    const currentTime = now.toTimeString().slice(0, 5)
    const currentDay = now.getDay()
    
    let tradingStatus = {
      canSell: false,
      reason: 'No trading hours configured',
      currentTime,
      currentDay,
      openTime: null as string | null,
      closeTime: null as string | null
    }
    
    // Check for exception first
    const todayException = exceptions.find(e => e.date === today)
    if (todayException) {
      if (todayException.isClosed) {
        tradingStatus.reason = `Closed: ${todayException.reason}`
      } else if (todayException.openTime && todayException.closeTime) {
        tradingStatus.openTime = todayException.openTime
        tradingStatus.closeTime = todayException.closeTime
        tradingStatus.canSell = currentTime >= todayException.openTime && currentTime <= todayException.closeTime
        tradingStatus.reason = tradingStatus.canSell 
          ? `Open (Exception: ${todayException.reason})` 
          : 'Outside trading hours'
      }
    } else {
      // Check regular hours
      const todayHours = tradingHours.find(h => h.dayOfWeek === currentDay)
      if (todayHours) {
        tradingStatus.openTime = todayHours.openTime
        tradingStatus.closeTime = todayHours.closeTime
        tradingStatus.canSell = currentTime >= todayHours.openTime && currentTime <= todayHours.closeTime
        tradingStatus.reason = tradingStatus.canSell ? 'Within trading hours' : 'Outside trading hours'
      }
    }
    
    // Calculate time until close if open
    let timeUntilClose = null
    if (tradingStatus.canSell && tradingStatus.closeTime) {
      const [closeH, closeM] = tradingStatus.closeTime.split(':').map(Number)
      const [currH, currM] = currentTime.split(':').map(Number)
      const closeMinutes = closeH * 60 + closeM
      const currMinutes = currH * 60 + currM
      const diffMinutes = closeMinutes - currMinutes
      if (diffMinutes > 0) {
        const hours = Math.floor(diffMinutes / 60)
        const mins = diffMinutes % 60
        timeUntilClose = `${hours}h ${mins}m`
      }
    }
    
    return NextResponse.json({
      success: true,
      tradingHours,
      exceptions,
      currentStatus: {
        ...tradingStatus,
        timeUntilClose
      },
      provincialDefaults: PROVINCIAL_DEFAULTS
    })
  } catch (error) {
    console.error('Error fetching trading hours:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch trading hours' },
      { status: 500 }
    )
  }
}

// POST - Update trading hours
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate
    if (body.dayOfWeek === undefined || !body.openTime || !body.closeTime) {
      return NextResponse.json(
        { success: false, error: 'Day of week, open time, and close time are required' },
        { status: 400 }
      )
    }
    
    // Check if trading hours exist for this day
    const existing = await db.tradingHours.findFirst({
      where: {
        dayOfWeek: body.dayOfWeek,
        licenseType: body.licenseType || 'standard'
      }
    })
    
    let hours
    if (existing) {
      // Update existing
      hours = await db.tradingHours.update({
        where: { id: existing.id },
        data: {
          openTime: body.openTime,
          closeTime: body.closeTime,
          isActive: body.isActive ?? true,
          notes: body.notes,
          updatedAt: new Date()
        }
      })
    } else {
      // Create new
      hours = await db.tradingHours.create({
        data: {
          dayOfWeek: body.dayOfWeek,
          openTime: body.openTime,
          closeTime: body.closeTime,
          licenseType: body.licenseType || 'standard',
          isActive: body.isActive ?? true,
          notes: body.notes,
        }
      })
    }
    
    return NextResponse.json({
      success: true,
      data: hours,
      message: existing ? 'Trading hours updated' : 'Trading hours created'
    })
  } catch (error) {
    console.error('Error updating trading hours:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update trading hours' },
      { status: 500 }
    )
  }
}

// PUT - Batch update trading hours
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { hours } = body // Array of trading hour updates
    
    if (!Array.isArray(hours)) {
      return NextResponse.json(
        { success: false, error: 'Hours must be an array' },
        { status: 400 }
      )
    }
    
    const results = []
    for (const hour of hours) {
      const existing = await db.tradingHours.findFirst({
        where: {
          dayOfWeek: hour.dayOfWeek,
          licenseType: hour.licenseType || 'standard'
        }
      })
      
      if (existing) {
        const updated = await db.tradingHours.update({
          where: { id: existing.id },
          data: {
            openTime: hour.openTime,
            closeTime: hour.closeTime,
            isActive: hour.isActive ?? true,
            notes: hour.notes,
            updatedAt: new Date()
          }
        })
        results.push(updated)
      } else {
        const created = await db.tradingHours.create({
          data: {
            dayOfWeek: hour.dayOfWeek,
            openTime: hour.openTime,
            closeTime: hour.closeTime,
            licenseType: hour.licenseType || 'standard',
            isActive: hour.isActive ?? true,
            notes: hour.notes,
          }
        })
        results.push(created)
      }
    }
    
    return NextResponse.json({
      success: true,
      data: results,
      message: `${results.length} trading hours updated`
    })
  } catch (error) {
    console.error('Error batch updating trading hours:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to batch update trading hours' },
      { status: 500 }
    )
  }
}
