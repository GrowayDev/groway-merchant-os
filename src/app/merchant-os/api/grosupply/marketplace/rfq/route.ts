import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/grosupply/marketplace/rfq - List RFQs for a merchant
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const merchantId = searchParams.get('merchantId') || 'demo-merchant'
    const status = searchParams.get('status')

    const where: {
      createdBy: string
      status?: string
    } = {
      createdBy: merchantId
    }

    if (status) {
      where.status = status
    }

    const rfqs = await db.rFQ.findMany({
      where,
      include: {
        RFQItem: true,
        Supplier: {
          select: {
            name: true,
            tier: true,
            email: true
          }
        },
        SupplierQuote: {
          include: {
            SupplierQuoteItem: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ rfqs })
  } catch (error) {
    console.error('Error fetching RFQs:', error)
    return NextResponse.json({ error: 'Failed to fetch RFQs' }, { status: 500 })
  }
}

// POST /api/grosupply/marketplace/rfq - Create new RFQ
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { merchantId, supplierId, items, deliveryAddress, requiredBy, notes } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Items are required' }, { status: 400 })
    }

    const effectiveMerchantId = merchantId || 'demo-merchant'
    const rfqNumber = `RFQ-${Date.now().toString(36).toUpperCase()}`

    const rfq = await db.rFQ.create({
      data: {
        id: `rfq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        number: rfqNumber,
        supplierId: supplierId || null,
        status: 'draft',
        requiredBy: requiredBy || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        deliveryAddress,
        notes,
        createdBy: effectiveMerchantId,
        RFQItem: {
          create: items.map((item: { sku: string; description: string; quantity: number; unit?: string; notes?: string }) => ({
            id: `rfqi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            sku: item.sku,
            description: item.description,
            quantity: item.quantity || 1,
            unit: item.unit || 'each',
            notes: item.notes
          }))
        }
      },
      include: {
        RFQItem: true,
        Supplier: true
      }
    })

    return NextResponse.json({ 
      message: 'RFQ created successfully',
      rfq 
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating RFQ:', error)
    return NextResponse.json({ error: 'Failed to create RFQ' }, { status: 500 })
  }
}

// PUT /api/grosupply/marketplace/rfq - Update RFQ (send, cancel, accept)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, rfqId, quoteId } = body

    if (!rfqId) {
      return NextResponse.json({ error: 'RFQ ID is required' }, { status: 400 })
    }

    if (action === 'send') {
      const rfq = await db.rFQ.update({
        where: { id: rfqId },
        data: {
          status: 'open',
          updatedAt: new Date()
        }
      })

      return NextResponse.json({ 
        message: 'RFQ sent to suppliers',
        rfq 
      })
    }

    if (action === 'cancel') {
      const rfq = await db.rFQ.update({
        where: { id: rfqId },
        data: {
          status: 'cancelled',
          updatedAt: new Date()
        }
      })

      return NextResponse.json({ 
        message: 'RFQ cancelled',
        rfq 
      })
    }

    if (action === 'acceptQuote') {
      if (!quoteId) {
        return NextResponse.json({ error: 'Quote ID is required' }, { status: 400 })
      }

      const quote = await db.supplierQuote.findUnique({
        where: { id: quoteId },
        include: {
          SupplierQuoteItem: true,
          RFQ: {
            include: { RFQItem: true }
          }
        }
      })

      if (!quote) {
        return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
      }

      // Create Purchase Order from accepted quote
      const poNumber = `PO-${Date.now().toString(36).toUpperCase()}`
      const today = new Date().toISOString().split('T')[0]

      const purchaseOrder = await db.purchaseOrder.create({
        data: {
          id: `po_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          number: poNumber,
          rfqId: quote.rfqId,
          quoteId: quote.id,
          supplierId: quote.supplierId || undefined,
          status: 'draft',
          subtotal: quote.subtotal,
          vat: quote.vat,
          deliveryCost: quote.deliveryCost || 0,
          total: quote.total,
          deliveryAddress: quote.RFQ?.deliveryAddress,
          requestedDate: today,
          createdBy: quote.RFQ?.createdBy,
          items: {
            create: quote.SupplierQuoteItem.map(item => ({
              id: `poi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              sku: item.sku,
              description: item.description || '',
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice
            }))
          }
        }
      })

      // Update RFQ with selected quote
      await db.rFQ.update({
        where: { id: quote.rfqId },
        data: {
          selectedQuoteId: quoteId,
          status: 'accepted',
          updatedAt: new Date()
        }
      })

      // Update quote status
      await db.supplierQuote.update({
        where: { id: quoteId },
        data: {
          status: 'accepted',
          updatedAt: new Date()
        }
      })

      return NextResponse.json({ 
        message: 'Quote accepted and PO created',
        purchaseOrder,
        rfqId: quote.rfqId
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error updating RFQ:', error)
    return NextResponse.json({ error: 'Failed to update RFQ' }, { status: 500 })
  }
}
