import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { nanoid } from 'nanoid'

// South African Excise Duty Rates (2024/2025)
// Reference: SARS Excise Duty Rates
const EXCISE_RATES = {
  spirits: 108.71,      // R per liter of absolute alcohol
  wine: 4.96,           // R per liter
  beer: 2.33,           // R per liter
  ciders: 2.33,         // R per liter
  other: 0              // Unknown category
} as const

type ProductCategory = keyof typeof EXCISE_RATES

// Calculate excise duty based on product category and alcohol content
function calculateExciseDuty(
  category: ProductCategory,
  volumeLiters: number,
  alcoholPercentage?: number
): { dutyRate: number; dutyAmount: number; alcoholLiters: number } {
  const dutyRate = EXCISE_RATES[category] || EXCISE_RATES.other
  
  let alcoholLiters = 0
  let dutyAmount = 0
  
  if (category === 'spirits') {
    // Spirits: duty based on absolute alcohol volume
    alcoholLiters = alcoholPercentage 
      ? (volumeLiters * alcoholPercentage / 100) 
      : 0
    dutyAmount = alcoholLiters * dutyRate
  } else {
    // Wine, beer, ciders: duty based on total volume
    alcoholLiters = alcoholPercentage 
      ? (volumeLiters * alcoholPercentage / 100) 
      : 0
    dutyAmount = volumeLiters * dutyRate
  }
  
  return { dutyRate, dutyAmount, alcoholLiters }
}

// GET - Excise register entries
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const entryType = searchParams.get('entryType') // receipt, sale, loss, transfer, adjustment
    const productCategory = searchParams.get('productCategory') // spirits, wine, beer, ciders
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const period = searchParams.get('period') // 'month', 'quarter', 'year'
    
    const where: Record<string, unknown> = {}
    if (entryType) where.entryType = entryType
    if (productCategory) where.productCategory = productCategory
    
    // Handle period-based queries
    if (period) {
      const now = new Date()
      let periodStart: Date
      switch (period) {
        case 'month':
          periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
          break
        case 'quarter':
          const quarterMonth = Math.floor(now.getMonth() / 3) * 3
          periodStart = new Date(now.getFullYear(), quarterMonth, 1)
          break
        case 'year':
          periodStart = new Date(now.getFullYear(), 0, 1)
          break
        default:
          periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
      }
      where.entryDate = { gte: periodStart.toISOString().split('T')[0] }
    } else if (startDate && endDate) {
      where.entryDate = { gte: startDate, lte: endDate }
    }
    
    const entries = await db.exciseRegister.findMany({
      where,
      orderBy: { entryDate: 'desc' },
      take: limit,
      skip: offset,
    })
    
    const total = await db.exciseRegister.count({ where })
    
    // Aggregate statistics for SARS reporting
    const stats = await db.exciseRegister.aggregate({
      where,
      _sum: {
        volumeLiters: true,
        alcoholLiters: true,
        dutyAmount: true,
        totalPrice: true,
      },
      _count: { id: true }
    })
    
    // Group by category
    const byCategory = await db.exciseRegister.groupBy({
      by: ['productCategory'],
      where,
      _sum: {
        volumeLiters: true,
        alcoholLiters: true,
        dutyAmount: true,
      }
    })
    
    // Today's liability
    const today = new Date().toISOString().split('T')[0]
    const todaySales = await db.exciseRegister.aggregate({
      where: {
        entryType: 'sale',
        entryDate: today
      },
      _sum: { dutyAmount: true }
    })
    
    return NextResponse.json({
      success: true,
      data: entries,
      pagination: { total, limit, offset },
      stats: {
        totalVolume: stats._sum.volumeLiters || 0,
        totalAlcohol: stats._sum.alcoholLiters || 0,
        totalDuty: stats._sum.dutyAmount || 0,
        totalValue: stats._sum.totalPrice || 0,
        entryCount: stats._count.id
      },
      byCategory: byCategory.map(c => ({
        category: c.productCategory,
        volume: c._sum.volumeLiters || 0,
        alcohol: c._sum.alcoholLiters || 0,
        duty: c._sum.dutyAmount || 0
      })),
      todayLiability: todaySales._sum.dutyAmount || 0,
      exciseRates: EXCISE_RATES
    })
  } catch (error) {
    console.error('Error fetching excise entries:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch excise entries' },
      { status: 500 }
    )
  }
}

// POST - Add excise entry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.entryType || !body.productName || !body.productCategory) {
      return NextResponse.json(
        { success: false, error: 'Entry type, product name, and category are required' },
        { status: 400 }
      )
    }
    
    const category = body.productCategory as ProductCategory
    const volumeLiters = parseFloat(body.volumeLiters) || 0
    const alcoholPercentage = body.alcoholPercentage ? parseFloat(body.alcoholPercentage) : undefined
    
    // Calculate excise duty
    const { dutyRate, dutyAmount, alcoholLiters } = calculateExciseDuty(
      category,
      volumeLiters,
      alcoholPercentage
    )
    
    const entry = await db.exciseRegister.create({
      data: {
        entryNumber: `EX-${Date.now()}-${nanoid(6)}`,
        entryType: body.entryType, // receipt, sale, loss, transfer, adjustment
        entryDate: body.entryDate || new Date().toISOString().split('T')[0],
        productId: body.productId,
        productName: body.productName,
        productCategory: body.productCategory,
        brandName: body.brandName,
        volumeLiters,
        alcoholPercentage: alcoholPercentage || null,
        alcoholLiters,
        tariffCode: body.tariffCode,
        dutyRate,
        dutyAmount,
        supplierId: body.supplierId,
        supplierName: body.supplierName,
        invoiceNumber: body.invoiceNumber,
        invoiceDate: body.invoiceDate,
        saleId: body.saleId,
        customerType: body.customerType, // on_consumption, off_consumption
        customerId: body.customerId,
        customerName: body.customerName,
        quantity: parseFloat(body.quantity) || 0,
        unitPrice: parseFloat(body.unitPrice) || 0,
        totalPrice: parseFloat(body.totalPrice) || 0,
        openingStock: parseFloat(body.openingStock) || 0,
        closingStock: parseFloat(body.closingStock) || 0,
        notes: body.notes,
        verified: false,
      },
    })
    
    return NextResponse.json({
      success: true,
      data: entry,
      dutyCalculation: {
        category,
        volumeLiters,
        alcoholPercentage,
        alcoholLiters,
        dutyRate,
        dutyAmount
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating excise entry:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create excise entry' },
      { status: 500 }
    )
  }
}
