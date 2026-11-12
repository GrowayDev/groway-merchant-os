import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Check if liquor can be sold now
export async function GET(request: NextRequest) {
  try {
    const now = new Date()
    const currentTime = now.toTimeString().slice(0, 5) // HH:mm
    const currentDay = now.getDay() // 0 = Sunday
    const currentDate = now.toISOString().split('T')[0] // YYYY-MM-DD
    
    // Check for exception first
    const exception = await db.tradingHoursException.findUnique({
      where: { date: currentDate },
    })
    
    if (exception) {
      if (exception.isClosed) {
        return NextResponse.json({
          canSell: false,
          reason: 'Closed',
          detail: exception.reason,
          type: 'exception',
        })
      }
      
      if (exception.openTime && exception.closeTime) {
        const canSell = currentTime >= exception.openTime && currentTime <= exception.closeTime
        return NextResponse.json({
          canSell,
          reason: canSell ? 'Within trading hours' : 'Outside trading hours',
          detail: `Exception: ${exception.reason}`,
          openTime: exception.openTime,
          closeTime: exception.closeTime,
          currentTime,
          type: 'exception',
        })
      }
    }
    
    // Check regular trading hours
    const tradingHours = await db.tradingHours.findFirst({
      where: {
        dayOfWeek: currentDay,
        isActive: true,
      },
    })
    
    if (!tradingHours) {
      return NextResponse.json({
        canSell: false,
        reason: 'No trading hours configured for today',
        type: 'no_config',
      })
    }
    
    const canSell = currentTime >= tradingHours.openTime && currentTime <= tradingHours.closeTime
    
    return NextResponse.json({
      canSell,
      reason: canSell ? 'Within trading hours' : 'Outside trading hours',
      openTime: tradingHours.openTime,
      closeTime: tradingHours.closeTime,
      currentTime,
      type: 'regular',
    })
  } catch (error) {
    console.error('Error checking trading hours:', error)
    return NextResponse.json({ error: 'Failed to check trading hours' }, { status: 500 })
  }
}
