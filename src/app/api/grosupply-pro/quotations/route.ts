import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Generate unique quote number
async function generateQuoteNumber() {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  
  const lastQuote = await db.quotationRequest.findFirst({
    where: { number: { startsWith: `QT-${year}${month}` } },
    orderBy: { number: 'desc' }
  })
  
  if (lastQuote) {
    const lastNum = parseInt(lastQuote.number.split('-').pop() || '0')
    return `QT-${year}${month}-${String(lastNum + 1).padStart(4, '0')}`
  }
  
  return `QT-${year}${month}-0001`
}

// GET /api/grosupply-pro/quotations - Get quotations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const supplierId = searchParams.get('supplierId')
    
    const where: any = {}
    
    if (status) {
      where.status = status
    }
    
    if (supplierId) {
      where.supplierId = supplierId
    }
    
    const quotations = await db.quotationRequest.findMany({
      where,
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            tier: true,
            contactPerson: true,
            email: true,
            phone: true
          }
        },
        items: true,
        response: {
          include: {
            items: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json({ quotations })
  } catch (error) {
    console.error('Error fetching quotations:', error)
    return NextResponse.json({ error: 'Failed to fetch quotations' }, { status: 500 })
  }
}

// POST /api/grosupply-pro/quotations - Create quotation request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const number = await generateQuoteNumber()
    
    // Calculate totals
    const totalItems = body.items?.length || 0
    const estimatedValue = body.items?.reduce((sum: number, item: any) => 
      sum + (item.currentPrice || 0) * item.quantity, 0) || 0
    
    const quotation = await db.quotationRequest.create({
      data: {
        number,
        status: 'draft',
        supplierId: body.supplierId,
        deliveryAddress: body.deliveryAddress,
        requiredBy: body.requiredBy,
        notes: body.notes,
        internalNotes: body.internalNotes,
        validUntil: body.validUntil,
        totalItems,
        estimatedValue,
        createdBy: body.createdBy,
        items: {
          create: body.items?.map((item: any) => ({
            sku: item.sku,
            productName: item.productName,
            quantity: item.quantity || 1,
            unit: item.unit || 'each',
            currentPrice: item.currentPrice,
            notes: item.notes
          })) || []
        }
      },
      include: {
        supplier: true,
        items: true
      }
    })
    
    return NextResponse.json({ quotation })
  } catch (error) {
    console.error('Error creating quotation:', error)
    return NextResponse.json({ error: 'Failed to create quotation' }, { status: 500 })
  }
}

// PUT /api/grosupply-pro/quotations - Send quotation request
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, action } = body
    
    if (action === 'send') {
      const quotation = await db.quotationRequest.update({
        where: { id },
        data: {
          status: 'sent',
          sentAt: new Date()
        }
      })
      
      // TODO: Send email notification to supplier
      
      return NextResponse.json({ quotation })
    }
    
    if (action === 'accept') {
      const quotation = await db.quotationRequest.update({
        where: { id },
        data: {
          status: 'accepted',
          acceptedAt: new Date()
        }
      })
      
      // Create PO from quotation if there's a response
      const response = await db.quotationResponse.findUnique({
        where: { requestId: id },
        include: { items: true }
      })
      
      if (response) {
        const poNumber = `PO-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`
        
        const po = await db.purchaseOrder.create({
          data: {
            number: poNumber,
            supplierId: quotation.supplierId,
            status: 'pending_approval',
            subtotal: response.subtotal,
            vat: response.vat,
            deliveryCost: response.deliveryCost,
            total: response.total,
            deliveryAddress: quotation.deliveryAddress || '',
            requestedDate: quotation.requiredBy,
            notes: `Created from quotation ${quotation.number}`,
            items: {
              create: response.items.map(item => ({
                sku: item.sku,
                description: item.productName,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.totalPrice
              }))
            }
          }
        })
        
        return NextResponse.json({ quotation, purchaseOrder: po })
      }
      
      return NextResponse.json({ quotation })
    }
    
    if (action === 'reject') {
      const quotation = await db.quotationRequest.update({
        where: { id },
        data: {
          status: 'rejected',
          rejectedAt: new Date()
        }
      })
      
      return NextResponse.json({ quotation })
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error updating quotation:', error)
    return NextResponse.json({ error: 'Failed to update quotation' }, { status: 500 })
  }
}
