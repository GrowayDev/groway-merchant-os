import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/grosupply/rfq/[id] - Get RFQ details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const rfq = await db.rFQ.findUnique({
      where: { id },
      include: {
        supplier: true,
        items: {
          orderBy: { createdAt: 'asc' }
        },
        quotes: {
          include: {
            supplier: true,
            items: true
          },
          orderBy: { submittedAt: 'desc' }
        },
        purchaseOrder: {
          include: {
            supplier: true,
            items: true
          }
        }
      }
    })

    if (!rfq) {
      return NextResponse.json({ error: 'RFQ not found' }, { status: 404 })
    }

    // Calculate comparison matrix for quotes
    const comparisonMatrix = rfq.items.map(item => {
      const quotePrices: Record<string, { price: number; inStock: boolean; leadTime?: number }> = {}
      
      rfq.quotes.forEach(quote => {
        const quoteItem = quote.items.find(qi => qi.sku === item.sku)
        if (quoteItem) {
          quotePrices[quote.supplierId] = {
            price: quoteItem.unitPrice,
            inStock: quoteItem.inStock,
            leadTime: quoteItem.leadTime || undefined
          }
        }
      })

      return {
        sku: item.sku,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        prices: quotePrices
      }
    })

    return NextResponse.json({ 
      rfq,
      comparisonMatrix
    })
  } catch (error) {
    console.error('Error fetching RFQ:', error)
    return NextResponse.json({ error: 'Failed to fetch RFQ' }, { status: 500 })
  }
}

// PUT /api/grosupply/rfq/[id] - Update RFQ
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Handle awarding a quote (create PO)
    if (body.action === 'award') {
      const quoteId = body.quoteId
      if (!quoteId) {
        return NextResponse.json({ error: 'Quote ID is required' }, { status: 400 })
      }

      // Get the RFQ with quote details
      const rfq = await db.rFQ.findUnique({
        where: { id },
        include: {
          items: true,
          quotes: {
            where: { id: quoteId },
            include: {
              supplier: true,
              items: true
            }
          }
        }
      })

      if (!rfq || rfq.quotes.length === 0) {
        return NextResponse.json({ error: 'RFQ or quote not found' }, { status: 404 })
      }

      const selectedQuote = rfq.quotes[0]

      // Generate PO number
      const date = new Date()
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const random = Math.random().toString(36).substring(2, 6).toUpperCase()
      const poNumber = `PO-${year}${month}-${random}`

      // Create Purchase Order from quote
      const purchaseOrder = await db.purchaseOrder.create({
        data: {
          number: poNumber,
          rfqId: id,
          quoteId: quoteId,
          supplierId: selectedQuote.supplierId,
          status: 'draft',
          subtotal: selectedQuote.subtotal,
          vat: selectedQuote.vat,
          deliveryCost: selectedQuote.deliveryCost,
          total: selectedQuote.total,
          deliveryAddress: rfq.deliveryAddress || '',
          requestedDate: rfq.requiredBy,
          notes: selectedQuote.notes,
          createdBy: body.userId,
          items: {
            create: selectedQuote.items.map(quoteItem => {
              const rfqItem = rfq.items.find(ri => ri.sku === quoteItem.sku)
              return {
                sku: quoteItem.sku,
                description: rfqItem?.description || quoteItem.description || '',
                quantity: quoteItem.quantity,
                unitPrice: quoteItem.unitPrice,
                totalPrice: quoteItem.totalPrice,
                unit: rfqItem?.unit || 'each'
              }
            })
          }
        },
        include: {
          items: true,
          supplier: true
        }
      })

      // Update RFQ status
      await db.rFQ.update({
        where: { id },
        data: {
          status: 'awarded',
          selectedQuoteId: quoteId
        }
      })

      // Update quote status
      await db.supplierQuote.update({
        where: { id: quoteId },
        data: { status: 'accepted' }
      })

      // Reject other quotes
      await db.supplierQuote.updateMany({
        where: {
          rfqId: id,
          id: { not: quoteId }
        },
        data: { status: 'rejected' }
      })

      return NextResponse.json({ 
        message: 'Quote awarded and PO created',
        purchaseOrder 
      })
    }

    // Handle adding a quote (from supplier)
    if (body.action === 'addQuote') {
      const quote = await db.supplierQuote.create({
        data: {
          rfqId: id,
          supplierId: body.supplierId,
          status: 'submitted',
          subtotal: body.subtotal || 0,
          vat: body.vat || 0,
          deliveryCost: body.deliveryCost || 0,
          total: body.total || 0,
          deliveryDays: body.deliveryDays || 3,
          paymentTerms: body.paymentTerms,
          validUntil: body.validUntil,
          notes: body.notes,
          items: {
            create: body.items?.map((item: { sku: string; description?: string; unitPrice: number; quantity: number; totalPrice: number; inStock?: boolean; leadTime?: number }) => ({
              sku: item.sku,
              description: item.description,
              unitPrice: item.unitPrice,
              quantity: item.quantity,
              totalPrice: item.totalPrice,
              inStock: item.inStock ?? true,
              leadTime: item.leadTime
            })) || []
          }
        },
        include: {
          items: true,
          supplier: true
        }
      })

      // Update RFQ status and quote count
      await db.rFQ.update({
        where: { id },
        data: {
          status: 'quoted',
          totalQuotes: { increment: 1 }
        }
      })

      return NextResponse.json({ quote }, { status: 201 })
    }

    // Default update
    const rfq = await db.rFQ.update({
      where: { id },
      data: {
        supplierId: body.supplierId,
        status: body.status,
        requiredBy: body.requiredBy,
        deliveryAddress: body.deliveryAddress,
        notes: body.notes,
        internalNotes: body.internalNotes
      },
      include: {
        items: true,
        supplier: true,
        quotes: {
          include: { supplier: true }
        }
      }
    })

    return NextResponse.json({ rfq })
  } catch (error) {
    console.error('Error updating RFQ:', error)
    return NextResponse.json({ error: 'Failed to update RFQ' }, { status: 500 })
  }
}

// DELETE /api/grosupply/rfq/[id] - Delete RFQ
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const rfq = await db.rFQ.findUnique({
      where: { id },
      include: {
        _count: {
          select: { quotes: true, purchaseOrder: true }
        }
      }
    })

    if (!rfq) {
      return NextResponse.json({ error: 'RFQ not found' }, { status: 404 })
    }

    // Only allow deletion if no quotes or PO
    if (rfq._count.quotes > 0 || rfq._count.purchaseOrder > 0) {
      // Soft delete
      await db.rFQ.update({
        where: { id },
        data: { status: 'cancelled' }
      })
      return NextResponse.json({ message: 'RFQ cancelled (has related records)' })
    }

    // Hard delete
    await db.rFQ.delete({ where: { id } })
    return NextResponse.json({ message: 'RFQ deleted successfully' })
  } catch (error) {
    console.error('Error deleting RFQ:', error)
    return NextResponse.json({ error: 'Failed to delete RFQ' }, { status: 500 })
  }
}
