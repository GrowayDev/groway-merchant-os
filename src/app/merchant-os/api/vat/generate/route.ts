import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { startDate, endDate } = body
    
    const totalSales = 348933.33
    const totalPurchases = 191733.33
    const outputVAT = Math.round(totalSales * 0.15)
    const inputVAT = Math.round(totalPurchases * 0.15)
    
    const start = new Date(startDate)
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    const period = `${months[start.getMonth()]} ${start.getFullYear()}`
    const dueDate = new Date(start.getFullYear(), start.getMonth() + 2, 0).toISOString().split('T')[0]
    
    return NextResponse.json({
      period, startDate, endDate, dueDate,
      boxes: {
        box1_OutputVAT: outputVAT,
        box2_InputVAT: inputVAT,
        box3_NetVAT: outputVAT - inputVAT,
        box4_TotalSales: totalSales,
        box5_TotalPurchases: totalPurchases,
        box6_Exports: 0,
        box7_ZeroRated: 12500,
        box8_CapitalAssets: 0
      },
      generatedAt: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate VAT return' }, { status: 500 })
  }
}
