import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

// Generate GRN number
function generateGRNNumber(): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `GRN-${year}${month}-${random}`
}

// GET /api/grosupply/grn - List Goods Received Notes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const poId = searchParams.get('poId')
    const supplierId = searchParams.get('supplierId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: Prisma.GoodsReceivedNoteWhereInput = {}

    if (status) where.status = status
    if (poId) where.poId = poId
    if (startDate && endDate) {
      where.receivedAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }
    if (supplierId) {
      where.po = { supplierId }
    }

    const grns = await db.goodsReceivedNote.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        po: {
          include: {
            supplier: {
              select: {
                id: true,
                name: true,
                tier: true
              }
            }
          }
        },
        items: true,
        _count: {
          select: { items: true }
        }
      }
    })

    // Get pending GRNs (delivered POs without GRNs)
    const pendingPOs = await db.purchaseOrder.findMany({
      where: {
        status: 'delivered',
        grns: { none: {} }
      },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            tier: true
          }
        },
        items: true,
        _count: {
          select: { items: true }
        }
      }
    })

    const stats = {
      total: grns.length,
      draft: grns.filter(g => g.status === 'draft').length,
      completed: grns.filter(g => g.status === 'completed').length,
      disputed: grns.filter(g => g.status === 'disputed').length,
      pending: pendingPOs.length,
      totalValue: grns.reduce((sum, g) => 
        sum + g.items.reduce((s, i) => s + (i.receivedQty * i.unitPrice), 0), 0
      )
    }

    return NextResponse.json({ grns, pendingPOs, stats })
  } catch (error) {
    console.error('Error fetching GRNs:', error)
    return NextResponse.json({ error: 'Failed to fetch GRNs' }, { status: 500 })
  }
}

// POST /api/grosupply/grn - Create GRN
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate PO exists and is delivered
    const po = await db.purchaseOrder.findUnique({
      where: { id: body.poId },
      include: { items: true }
    })

    if (!po) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
    }

    if (po.status !== 'delivered' && po.status !== 'dispatched') {
      return NextResponse.json({ 
        error: 'PO must be delivered before creating GRN' 
      }, { status: 400 })
    }

    const number = body.number || generateGRNNumber()

    // Create GRN with items
    const grn = await db.goodsReceivedNote.create({
      data: {
        number,
        poId: body.poId,
        status: body.status || 'draft',
        receivedBy: body.receivedBy,
        receivedAt: body.receivedAt ? new Date(body.receivedAt) : undefined,
        notes: body.notes,
        items: {
          create: body.items?.map((item: {
            sku: string
            description?: string
            orderedQty: number
            receivedQty: number
            rejectedQty?: number
            rejectReason?: string
            batchNumber?: string
            expiryDate?: string
            unitPrice: number
          }) => ({
            sku: item.sku,
            description: item.description,
            orderedQty: item.orderedQty,
            receivedQty: item.receivedQty,
            rejectedQty: item.rejectedQty || 0,
            rejectReason: item.rejectReason,
            batchNumber: item.batchNumber,
            expiryDate: item.expiryDate,
            unitPrice: item.unitPrice
          })) || po.items.map(item => ({
            sku: item.sku,
            description: item.description,
            orderedQty: item.quantity,
            receivedQty: item.quantity, // Default to full receipt
            rejectedQty: 0,
            unitPrice: item.unitPrice
          }))
        }
      },
      include: {
        items: true,
        po: {
          include: {
            supplier: true
          }
        }
      }
    })

    return NextResponse.json({ grn }, { status: 201 })
  } catch (error) {
    console.error('Error creating GRN:', error)
    return NextResponse.json({ error: 'Failed to create GRN' }, { status: 500 })
  }
}

// PUT /api/grosupply/grn - Complete GRN
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()

    // Complete GRN and update inventory
    if (body.action === 'complete') {
      const grn = await db.goodsReceivedNote.findUnique({
        where: { id: body.id },
        include: {
          items: true,
          po: {
            include: { items: true, supplier: true }
          }
        }
      })

      if (!grn) {
        return NextResponse.json({ error: 'GRN not found' }, { status: 404 })
      }

      // Get merchant ID from PO
      const merchantId = grn.po.supplierId // This should be from merchant, using as fallback
      
      // Update inventory stock for each received item
      const stockUpdates: { sku: string; qty: number; success: boolean }[] = []
      
      for (const item of grn.items) {
        try {
          // Find product by SKU
          const product = await db.product.findFirst({
            where: { 
              sku: item.sku
            }
          })

          if (product && item.receivedQty > 0) {
            // Update product stock
            await db.product.update({
              where: { id: product.id },
              data: {
                currentStock: { increment: item.receivedQty },
                updatedAt: new Date()
              }
            })

            // Create stock movement record
            await db.stockMovement.create({
              data: {
                type: 'grn',
                quantity: item.receivedQty,
                reason: `GRN ${grn.number}`,
                reference: grn.id,
                productId: product.id,
                merchantId: product.merchantId
              }
            })

            stockUpdates.push({ sku: item.sku, qty: item.receivedQty, success: true })
          } else {
            stockUpdates.push({ sku: item.sku, qty: item.receivedQty, success: false })
          }
        } catch (err) {
          console.error(`Failed to update stock for SKU ${item.sku}:`, err)
          stockUpdates.push({ sku: item.sku, qty: item.receivedQty, success: false })
        }
      }

      // Update PO item received quantities
      for (const item of grn.items) {
        await db.purchaseOrderItem.updateMany({
          where: {
            poId: grn.poId,
            sku: item.sku
          },
          data: {
            receivedQty: { increment: item.receivedQty },
            rejectedQty: { increment: item.rejectedQty }
          }
        })
      }

      // Update GRN status
      const updatedGrn = await db.goodsReceivedNote.update({
        where: { id: body.id },
        data: {
          status: 'completed',
          receivedBy: body.receivedBy,
          receivedAt: new Date(),
          notes: body.notes,
          discrepancyNotes: body.discrepancyNotes
        },
        include: {
          items: true,
          po: {
            include: { supplier: true }
          }
        }
      })

      // Check if PO is fully received
      const poItems = await db.purchaseOrderItem.findMany({
        where: { poId: grn.poId }
      })

      const allReceived = poItems.every(
        item => item.receivedQty >= item.quantity
      )

      if (allReceived) {
        await db.purchaseOrder.update({
          where: { id: grn.poId },
          data: { status: 'completed' }
        })
      }

      return NextResponse.json({ 
        message: 'GRN completed',
        grn: updatedGrn,
        poCompleted: allReceived,
        stockUpdates,
        inventoryUpdated: stockUpdates.filter(s => s.success).length
      })
    }

    // Mark as disputed
    if (body.action === 'dispute') {
      const grn = await db.goodsReceivedNote.update({
        where: { id: body.id },
        data: {
          status: 'disputed',
          discrepancyNotes: body.discrepancyNotes
        }
      })

      return NextResponse.json({ 
        message: 'GRN marked as disputed',
        grn 
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error updating GRN:', error)
    return NextResponse.json({ error: 'Failed to update GRN' }, { status: 500 })
  }
}
