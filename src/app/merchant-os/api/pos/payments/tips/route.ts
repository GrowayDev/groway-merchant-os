import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET tip options
export async function GET(request: NextRequest) {
  try {
    let tips = await db.tipOption.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' }
    })

    // If no tips exist, return defaults
    if (tips.length === 0) {
      tips = [
        { id: '1', percentage: 10, label: 'Good' },
        { id: '2', percentage: 15, label: 'Great' },
        { id: '3', percentage: 18, label: 'Excellent' },
        { id: '4', percentage: 20, label: 'Outstanding' },
      ] as any
    }

    return NextResponse.json({
      success: true,
      data: tips
    })
  } catch (error) {
    console.error('Error fetching tip options:', error)
    // Return defaults on error
    return NextResponse.json({
      success: true,
      data: [
        { id: '1', percentage: 10, label: 'Good' },
        { id: '2', percentage: 15, label: 'Great' },
        { id: '3', percentage: 18, label: 'Excellent' },
        { id: '4', percentage: 20, label: 'Outstanding' },
      ]
    })
  }
}
