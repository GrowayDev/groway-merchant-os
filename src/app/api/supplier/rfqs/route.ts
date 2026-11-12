import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Generate unique quote number
async function generateQuoteNumber() {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  
  const lastQuote = await db.supplierQuote.findFirst({
    where: { number: { startsWith: `QT-${year}${month}` } },
    orderBy: { number: 'desc' }
  })
  
  if (lastQuote) {
    const lastNum = parseInt(lastQuote.number.split('-').pop() || '0')
    return `QT-${year}${month}-${String(lastNum + 1).padStart(4, '0')}`
  }
  
  return `QT-${year}${month}-0001`
}

// GET /api/supplier/rfqs - Get RFQs for supplier
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const supplierId = searchParams.get('supplierId')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!supplierId) {
      return NextResponse.json({ error: 'Supplier ID is required' }, { status: 400 })
    }

    const where: any = { supplierId }

    if (status) {
      where.status = status
    }

    if (search) {
      where.OR = [
        { number: { contains: search } },
        { buyerName: { contains: search } }
      ]
    }

    // Get quotation requests sent to this supplier
    const [quotationRequests, qrTotal] = await Promise.all([
      db.quotationRequest.findMany({
        where: { supplierId, status: { in: ['sent', 'responded', 'accepted', 'rejected'] } },
        include: {
          items: true,
          response: {
            include: { items: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      db.quotationRequest.count({ 
        where: { supplierId, status: { in: ['sent', 'responded', 'accepted', 'rejected'] } } 
      })
    ])

    // Calculate stats
    const stats = {
      pending: await db.quotationRequest.count({ 
        where: { supplierId, status: 'sent' } 
      }),
      quoted: await db.quotationRequest.count({ 
        where: { supplierId, status: 'responded' } 
      }),
      accepted: await db.quotationRequest.count({ 
        where: { supplierId, status: 'accepted' } 
      }),
      rejected: await db.quotationRequest.count({ 
        where: { supplierId, status: 'rejected' } 
      })
    }

    return NextResponse.json({
      rfqs: quotationRequests,
      total: qrTotal,
      stats
    })
  } catch (error) {
    console.error('Error fetching RFQs:', error)
    return NextResponse.json({ error: 'Failed to fetch RFQs' }, { status: 500 })
  }
}

// POST /api/supplier/rfqs - Submit a quote for an RFQ
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { requestId, supplierId, items, validUntil, deliveryDays, paymentTerms, notes } = body

    // Check if request exists
    const rfq = await db.quotationRequest.findUnique({
      where: { id: requestId },
      include: { items: true }
    })

    if (!rfq) {
      return NextResponse.json({ error: 'RFQ not found' }, { status: 404 })
    }

    if (rfq.supplierId !== supplierId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // Check if already responded
    const existingResponse = await db.quotationResponse.findUnique({
      where: { requestId }
    })

    if (existingResponse) {
      return NextResponse.json({ error: 'Already submitted a quote for this RFQ' }, { status: 400 })
    }

    // Calculate totals
    const subtotal = items.reduce((sum: number, i: any) => sum + (i.totalPrice || i.quantity * i.unitPrice), 0)
    const vat = subtotal * 0.15
    const deliveryCost = body.deliveryCost || 0
    const total = subtotal + vat + deliveryCost

    // Create quote
    const quote = await db.supplierQuote.create({
      data: {
        number: await generateQuoteNumber(),
        rfqId: requestId,
        supplierId,
        status: 'submitted',
        subtotal,
        vat,
        deliveryCost,
        total,
        deliveryDays: deliveryDays || 3,
        paymentTerms,
        validUntil,
        notes,
        items: {
          create: items.map((i: any) => ({
            sku: i.sku,
            description: i.productName,
            unitPrice: i.unitPrice,
            quantity: i.quantity,
            totalPrice: i.totalPrice || i.quantity * i.unitPrice,
            inStock: i.inStock ?? true,
            leadTime: i.leadTime
          }))
        }
      },
      include: { items: true }
    })

    // Update RFQ status
    await db.quotationRequest.update({
      where: { id: requestId },
      data: { 
        status: 'responded',
        respondedAt: new Date()
      }
    })

    return NextResponse.json({ quote })
  } catch (error) {
    console.error('Error submitting quote:', error)
    return NextResponse.json({ error: 'Failed to submit quote' }, { status: 500 })
  }
}

// PUT /api/supplier/rfqs - Update a quote
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, action, ...updates } = body

    const quote = await db.supplierQuote.findUnique({
      where: { id },
      include: { items: true }
    })

    if (!quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
    }

    if (action === 'withdraw') {
      const updated = await db.supplierQuote.update({
        where: { id },
        data: { status: 'withdrawn' }
      })

      // Update RFQ status back
      await db.quotationRequest.updateMany({
        where: { id: quote.rfqId },
        data: { status: 'sent' }
      })

      return NextResponse.json({ quote: updated })
    }

    // Update items and recalculate
    if (updates.items) {
      const subtotal = updates.items.reduce((sum: number, i: any) => sum + i.totalPrice, 0)
      const vat = subtotal * 0.15
      const total = subtotal + vat + (updates.deliveryCost || quote.deliveryCost)

      // Delete existing items and create new
      await db.supplierQuoteItem.deleteMany({
        where: { quoteId: id }
      })

      const updated = await db.supplierQuote.update({
        where: { id },
        data: {
          subtotal,
          vat,
          total,
          deliveryCost: updates.deliveryCost || quote.deliveryCost,
          deliveryDays: updates.deliveryDays || quote.deliveryDays,
          paymentTerms: updates.paymentTerms,
          validUntil: updates.validUntil,
          notes: updates.notes,
          items: {
            create: updates.items.map((i: any) => ({
              sku: i.sku,
              description: i.productName || i.description,
              unitPrice: i.unitPrice,
              quantity: i.quantity,
              totalPrice: i.totalPrice,
              inStock: i.inStock ?? true,
              leadTime: i.leadTime
            }))
          }
        },
        include: { items: true }
      })

      return NextResponse.json({ quote: updated })
    }

    return NextResponse.json({ quote })
  } catch (error) {
    console.error('Error updating quote:', error)
    return NextResponse.json({ error: 'Failed to update quote' }, { status: 500 })
  }
}
