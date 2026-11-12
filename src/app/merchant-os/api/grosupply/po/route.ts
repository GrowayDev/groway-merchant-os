import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

// Generate PO number
function generatePONumber(): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `PO-${year}${month}-${random}`
}

// GET /api/grosupply/po - List Purchase Orders
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const supplierId = searchParams.get('supplierId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const search = searchParams.get('search')

    const where: Prisma.PurchaseOrderWhereInput = {}

    if (status) where.status = status
    if (supplierId) where.supplierId = supplierId
    if (startDate && endDate) {
      where.AND = [
        { createdAt: { gte: new Date(startDate) } },
        { createdAt: { lte: new Date(endDate) } }
      ]
    }
    if (search) {
      where.OR = [
        { number: { contains: search } },
        { trackingNumber: { contains: search } },
        { Supplier: { name: { contains: search } } }
      ]
    }

    const purchaseOrders = await db.purchaseOrder.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        Supplier: {
          select: {
            id: true,
            name: true,
            tier: true,
            rating: true
          }
        },
        _count: {
          select: { PurchaseOrderItem: true, GoodsReceivedNote: true }
        }
      }
    })

    // Calculate stats
    const stats = {
      total: purchaseOrders.length,
      draft: purchaseOrders.filter(po => po.status === 'draft').length,
      sent: purchaseOrders.filter(po => po.status === 'sent').length,
      confirmed: purchaseOrders.filter(po => po.status === 'confirmed').length,
      dispatched: purchaseOrders.filter(po => po.status === 'dispatched').length,
      delivered: purchaseOrders.filter(po => po.status === 'delivered').length,
      totalValue: purchaseOrders.reduce((sum, po) => sum + po.total, 0),
      pendingValue: purchaseOrders
        .filter(po => po.status !== 'delivered' && po.status !== 'cancelled')
        .reduce((sum, po) => sum + po.total, 0)
    }

    // Transform for frontend compatibility
    const transformedPOs = purchaseOrders.map(po => ({
      ...po,
      supplier: po.Supplier,
      items: po.PurchaseOrderItem,
      _count: {
        items: po._count?.PurchaseOrderItem || 0,
        grns: po._count?.GoodsReceivedNote || 0
      }
    }))

    return NextResponse.json({ purchaseOrders: transformedPOs, stats })
  } catch (error) {
    console.error('Error fetching purchase orders:', error)
    return NextResponse.json({ error: 'Failed to fetch purchase orders' }, { status: 500 })
  }
}

// POST /api/grosupply/po - Create Purchase Order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const number = body.number || generatePONumber()

    // Calculate totals from items if not provided
    let subtotal = body.subtotal || 0
    let total = body.total || 0

    if (body.items && body.items.length > 0 && subtotal === 0) {
      subtotal = body.items.reduce((sum: number, item: { totalPrice: number }) => sum + item.totalPrice, 0)
      const vat = body.vat || subtotal * 0.15
      total = subtotal + vat + (body.deliveryCost || 0)
    }

    const purchaseOrder = await db.purchaseOrder.create({
      data: {
        number,
        rfqId: body.rfqId,
        quoteId: body.quoteId,
        supplierId: body.supplierId,
        status: body.status || 'draft',
        subtotal,
        vat: body.vat || subtotal * 0.15,
        deliveryCost: body.deliveryCost || 0,
        total,
        deliveryAddress: body.deliveryAddress,
        requestedDate: body.requestedDate,
        notes: body.notes,
        internalNotes: body.internalNotes,
        createdBy: body.createdBy,
        updatedAt: new Date(),
        PurchaseOrderItem: {
          create: body.items?.map((item: { sku: string; description: string; quantity: number; unitPrice: number; totalPrice: number; unit?: string }) => ({
            sku: item.sku,
            description: item.description,
            quantity: item.quantity || 1,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            unit: item.unit || 'each',
            updatedAt: new Date()
          })) || []
        }
      },
      include: {
        PurchaseOrderItem: true,
        Supplier: true
      }
    })

    // Transform for frontend
    const transformed = {
      ...purchaseOrder,
      items: purchaseOrder.PurchaseOrderItem,
      supplier: purchaseOrder.Supplier
    }

    return NextResponse.json({ purchaseOrder: transformed }, { status: 201 })
  } catch (error) {
    console.error('Error creating purchase order:', error)
    return NextResponse.json({ error: 'Failed to create purchase order' }, { status: 500 })
  }
}

// PUT /api/grosupply/po - Bulk operations
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()

    // Send PO to supplier
    if (body.action === 'send') {
      const po = await db.purchaseOrder.update({
        where: { id: body.id },
        data: {
          status: 'sent',
          sentAt: new Date(),
          updatedAt: new Date()
        },
        include: { Supplier: true, PurchaseOrderItem: true }
      })

      console.log(`PO ${po.number} sent to ${po.Supplier?.name}`)

      return NextResponse.json({ 
        message: 'PO sent to supplier',
        purchaseOrder: {
          ...po,
          supplier: po.Supplier,
          items: po.PurchaseOrderItem
        }
      })
    }

    // Confirm PO (supplier accepts)
    if (body.action === 'confirm') {
      const po = await db.purchaseOrder.update({
        where: { id: body.id },
        data: {
          status: 'confirmed',
          confirmedDate: body.confirmedDate,
          confirmedAt: new Date(),
          updatedAt: new Date()
        }
      })

      return NextResponse.json({ 
        message: 'PO confirmed',
        purchaseOrder: po 
      })
    }

    // Mark as dispatched
    if (body.action === 'dispatch') {
      const po = await db.purchaseOrder.update({
        where: { id: body.id },
        data: {
          status: 'dispatched',
          trackingNumber: body.trackingNumber,
          estimatedDelivery: body.estimatedDelivery,
          updatedAt: new Date()
        }
      })

      return NextResponse.json({ 
        message: 'PO marked as dispatched',
        purchaseOrder: po 
      })
    }

    // Mark as delivered
    if (body.action === 'deliver') {
      const po = await db.purchaseOrder.update({
        where: { id: body.id },
        data: {
          status: 'delivered',
          updatedAt: new Date()
        }
      })

      return NextResponse.json({ 
        message: 'PO marked as delivered',
        purchaseOrder: po 
      })
    }

    // Cancel PO
    if (body.action === 'cancel') {
      const po = await db.purchaseOrder.update({
        where: { id: body.id },
        data: {
          status: 'cancelled',
          internalNotes: body.reason 
            ? `CANCELLED: ${body.reason}` 
            : 'CANCELLED',
          updatedAt: new Date()
        }
      })

      return NextResponse.json({ 
        message: 'PO cancelled',
        purchaseOrder: po 
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error updating purchase order:', error)
    return NextResponse.json({ error: 'Failed to update purchase order' }, { status: 500 })
  }
}
