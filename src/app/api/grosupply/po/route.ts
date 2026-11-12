import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/permissions'

// GET /api/grosupply/po - Get Purchase Orders
export async function GET(request: NextRequest) {
  const permissionCheck = await checkPermission(request, 'can_create_rfq')
  
  if (!permissionCheck.allowed) {
    return permissionCheck.error
  }

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const supplierId = searchParams.get('supplierId')

    const where: any = {}

    if (status && status !== 'all') {
      where.status = status
    }

    if (supplierId) {
      where.supplierId = supplierId
    }

    const purchaseOrders = await db.purchaseOrder.findMany({
      where,
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        items: true,
        grns: {
          select: {
            id: true,
            number: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    const stats = {
      total: purchaseOrders.length,
      draft: purchaseOrders.filter(po => po.status === 'draft').length,
      sent: purchaseOrders.filter(po => po.status === 'sent').length,
      delivered: purchaseOrders.filter(po => po.status === 'delivered').length,
      totalValue: purchaseOrders.reduce((sum, po) => sum + po.total, 0),
      pendingValue: purchaseOrders
        .filter(po => po.status !== 'delivered' && po.status !== 'cancelled')
        .reduce((sum, po) => sum + po.total, 0),
    }

    return NextResponse.json({
      success: true,
      purchaseOrders,
      stats,
    })
  } catch (error) {
    console.error('Get purchase orders error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch purchase orders' },
      { status: 500 }
    )
  }
}

// POST /api/grosupply/po - Create Purchase Order from RFQ/Quote
export async function POST(request: NextRequest) {
  const permissionCheck = await checkPermission(request, 'can_approve_purchase_orders')
  
  if (!permissionCheck.allowed) {
    return permissionCheck.error
  }

  const session = permissionCheck.session!

  try {
    const body = await request.json()
    const { quoteId, rfqId, supplierId, items, notes, requestedDate } = body

    // Must have either quote or items
    if (!quoteId && !items) {
      return NextResponse.json(
        { error: 'quoteId or items required' },
        { status: 400 }
      )
    }

    // Generate PO number
    const count = await db.purchaseOrder.count()
    const number = `PO-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`

    let poData: any = {
      number,
      status: 'draft',
      requestedDate: requestedDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes,
      createdBy: session.userId,
    }

    // If from quote
    if (quoteId) {
      const quote = await db.supplierQuote.findUnique({
        where: { id: quoteId },
        include: {
          items: true,
          supplier: true,
        },
      })

      if (!quote) {
        return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
      }

      poData.quoteId = quoteId
      poData.rfqId = quote.rfqId
      poData.supplierId = quote.supplierId
      poData.subtotal = quote.subtotal
      poData.vat = quote.vat
      poData.deliveryCost = quote.deliveryCost
      poData.total = quote.total
      poData.items = {
        create: quote.items.map(item => ({
          sku: item.sku,
          description: item.description || '',
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
        })),
      }
    } else {
      // From items
      poData.supplierId = supplierId
      poData.items = {
        create: items.map((item: any) => ({
          sku: item.sku,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.quantity * item.unitPrice,
        })),
      }
      poData.subtotal = items.reduce((sum: number, item: any) => sum + item.quantity * item.unitPrice, 0)
      poData.total = poData.subtotal
    }

    const purchaseOrder = await db.purchaseOrder.create({
      data: poData,
      include: {
        items: true,
        supplier: true,
      },
    })

    return NextResponse.json({
      success: true,
      purchaseOrder,
    })
  } catch (error) {
    console.error('Create purchase order error:', error)
    return NextResponse.json(
      { error: 'Failed to create purchase order' },
      { status: 500 }
    )
  }
}

// PUT /api/grosupply/po - Update PO status
export async function PUT(request: NextRequest) {
  const permissionCheck = await checkPermission(request, 'can_approve_purchase_orders')
  
  if (!permissionCheck.allowed) {
    return permissionCheck.error
  }

  try {
    const body = await request.json()
    const { poId, status, trackingNumber, estimatedDelivery, notes } = body

    if (!poId) {
      return NextResponse.json({ error: 'poId required' }, { status: 400 })
    }

    const updateData: any = { status }
    if (trackingNumber) updateData.trackingNumber = trackingNumber
    if (estimatedDelivery) updateData.estimatedDelivery = estimatedDelivery
    if (notes) updateData.notes = notes

    if (status === 'sent') {
      updateData.sentAt = new Date()
    } else if (status === 'confirmed') {
      updateData.confirmedAt = new Date()
    }

    const purchaseOrder = await db.purchaseOrder.update({
      where: { id: poId },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      purchaseOrder,
    })
  } catch (error) {
    console.error('Update purchase order error:', error)
    return NextResponse.json(
      { error: 'Failed to update purchase order' },
      { status: 500 }
    )
  }
}
