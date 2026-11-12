import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  return NextResponse.json({
    summary: {
      totalLocations: 2,
      totalRevenue: 3630000,
      totalCosts: 2359500,
      grossProfit: 1270500,
      netProfit: 850000,
      totalStaff: 30,
      pendingTransfers: 1
    },
    breakdown: {
      byLocation: [
        { name: 'Main Store', revenue: 1285000, costs: 835250, profit: 449750 },
        { name: 'Sandton Branch', revenue: 2345000, costs: 1524250, profit: 820750 }
      ]
    },
    generatedAt: new Date().toISOString()
  })
}
