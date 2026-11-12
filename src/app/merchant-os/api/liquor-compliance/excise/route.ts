import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { nanoid } from 'nanoid'

// GET - List excise register entries
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const entryType = searchParams.get('entryType')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    
    const where: any = {}
    if (entryType) where.entryType = entryType
    if (startDate && endDate) {
      where.entryDate = {
        gte: startDate,
        lte: endDate,
      }
    }
    
    const entries = await db.exciseRegister.findMany({
      where,
      orderBy: { entryDate: 'desc' },
      take: limit,
      skip: offset,
    })
    
    const total = await db.exciseRegister.count({ where })
    
    // Calculate totals
    const stats = await db.exciseRegister.aggregate({
      _sum: {
        volumeLiters: true,
        alcoholLiters: true,
        dutyAmount: true,
      },
      where,
    })
    
    return NextResponse.json({
      data: entries,
      total,
      stats: {
        totalVolume: stats._sum.volumeLiters || 0,
        totalAlcohol: stats._sum.alcoholLiters || 0,
        totalDuty: stats._sum.dutyAmount || 0,
      },
      limit,
      offset,
    })
  } catch (error) {
    console.error('Error fetching excise register:', error)
    return NextResponse.json({ error: 'Failed to fetch excise register' }, { status: 500 })
  }
}

// POST - Create excise register entry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const entry = await db.exciseRegister.create({
      data: {
        entryNumber: `EX-${Date.now()}-${nanoid(6)}`,
        entryType: body.entryType,
        entryDate: body.entryDate || new Date().toISOString().split('T')[0],
        productId: body.productId,
        productName: body.productName,
        productCategory: body.productCategory,
        brandName: body.brandName,
        volumeLiters: body.volumeLiters || 0,
        alcoholPercentage: body.alcoholPercentage,
        alcoholLiters: body.alcoholLiters || 0,
        tariffCode: body.tariffCode,
        dutyRate: body.dutyRate || 0,
        dutyAmount: body.dutyAmount || 0,
        supplierId: body.supplierId,
        supplierName: body.supplierName,
        invoiceNumber: body.invoiceNumber,
        invoiceDate: body.invoiceDate,
        saleId: body.saleId,
        customerType: body.customerType,
        customerId: body.customerId,
        customerName: body.customerName,
        quantity: body.quantity || 0,
        unitPrice: body.unitPrice || 0,
        totalPrice: body.totalPrice || 0,
        openingStock: body.openingStock || 0,
        closingStock: body.closingStock || 0,
        notes: body.notes,
      },
    })
    
    return NextResponse.json(entry, { status: 201 })
  } catch (error) {
    console.error('Error creating excise entry:', error)
    return NextResponse.json({ error: 'Failed to create excise entry' }, { status: 500 })
  }
}
