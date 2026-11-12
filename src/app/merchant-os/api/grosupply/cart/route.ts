import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/grosupply/cart - Get cart summary for a merchant
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const merchantId = searchParams.get('merchantId') || 'demo-merchant'

    // Get draft orders (cart) for this merchant
    const pendingOrders = await db.purchaseOrder.findMany({
      where: {
        createdBy: merchantId,
        status: 'draft'
      },
      include: {
        PurchaseOrderItem: true,
        Supplier: {
          select: {
            name: true,
            tier: true
          }
        }
      }
    })

    // Calculate totals
    let totalItems = 0
    let subtotal = 0
    
    for (const order of pendingOrders) {
      totalItems += order.PurchaseOrderItem.length
      subtotal += order.subtotal
    }

    const vat = subtotal * 0.15
    const total = subtotal + vat

    return NextResponse.json({
      cart: {
        merchantId,
        pendingOrders: pendingOrders.length,
        totalItems,
        subtotal,
        vat,
        total,
        orders: pendingOrders
      }
    })
  } catch (error) {
    console.error('Error fetching cart:', error)
    return NextResponse.json({ error: 'Failed to fetch cart' }, { status: 500 })
  }
}

// POST /api/grosupply/cart - Add item to cart (creates or updates draft PO)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { merchantId, items, supplierId, notes } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Items are required' }, { status: 400 })
  }

    const effectiveMerchantId = merchantId || 'demo-merchant'

    // Find or create draft PO for this supplier/merchant combination
    let purchaseOrder = await db.purchaseOrder.findFirst({
      where: {
        createdBy: effectiveMerchantId,
        supplierId: supplierId || null,
        status: 'draft'
      },
      include: { PurchaseOrderItem: true }
    })

    // Calculate totals for new items
    const subtotal = items.reduce((sum: number, item: { quantity: number; unitPrice: number }) => 
      sum + (item.quantity * item.unitPrice), 0)
    const vat = subtotal * 0.15
    const total = subtotal + vat

    if (purchaseOrder) {
      // Update existing PO - add/update items
      const existingItems = purchaseOrder.PurchaseOrderItem
      
      for (const item of items) {
        const existing = existingItems.find(e => e.sku === item.sku)
        if (existing) {
          // Update quantity
          await db.purchaseOrderItem.update({
            where: { id: existing.id },
            data: {
              quantity: existing.quantity + item.quantity,
              totalPrice: (existing.quantity + item.quantity) * item.unitPrice
            }
          })
        } else {
          // Create new item
          await db.purchaseOrderItem.create({
            data: {
              id: `poi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              poId: purchaseOrder.id,
              sku: item.sku,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.quantity * item.unitPrice,
              unit: item.unit || 'each',
              updatedAt: new Date()
            }
          })
        }
      }

      // Recalculate totals
      const allItems = await db.purchaseOrderItem.findMany({
        where: { poId: purchaseOrder.id }
      })
      const newSubtotal = allItems.reduce((sum, item) => sum + item.totalPrice, 0)
      const newVat = newSubtotal * 0.15
      const newTotal = newSubtotal + newVat

      // Update PO totals
      purchaseOrder = await db.purchaseOrder.update({
        where: { id: purchaseOrder.id },
        data: {
          subtotal: newSubtotal,
          vat: newVat,
          total: newTotal,
          notes,
          updatedAt: new Date()
        }
      })

      // Get the updated order with items
      const updatedOrder = await db.purchaseOrder.findUnique({
        where: { id: purchaseOrder.id },
        include: { PurchaseOrderItem: true, Supplier: true }
      })

      return NextResponse.json({ 
        message: 'Cart updated',
        purchaseOrder: updatedOrder
      })
    } else {
      // Create new draft PO
      const poNumber = `PO-${Date.now().toString(36).toUpperCase()}`
      const today = new Date().toISOString().split('T')[0]

      purchaseOrder = await db.purchaseOrder.create({
        data: {
          id: `po_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          number: poNumber,
          supplierId: supplierId || null,
          status: 'draft',
          subtotal,
          vat,
          total,
          notes,
          requestedDate: today,
          createdBy: effectiveMerchantId,
          PurchaseOrderItem: {
            create: items.map((item: { sku: string; description: string; quantity: number; unitPrice: number; unit?: string }) => ({
              id: `poi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              sku: item.sku,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.quantity * item.unitPrice,
              unit: item.unit || 'each',
              updatedAt: new Date()
            }))
          }
        },
        include: { PurchaseOrderItem: true, Supplier: true }
      })

      return NextResponse.json({ 
        message: 'Item added to cart',
        purchaseOrder,
        isNewOrder: true
      }, { status: 201 })
    }
  } catch (error) {
    console.error('Error adding to cart:', error)
    return NextResponse.json({ error: 'Failed to add to cart' }, { status: 500 })
  }
}

// PUT /api/grosupply/cart - Update cart item quantity
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, itemId, quantity } = body

    if (action === 'updateQuantity' && itemId && quantity !== undefined) {
      const item = await db.purchaseOrderItem.findUnique({
        where: { id: itemId }
      })

      if (!item) {
        return NextResponse.json({ error: 'Item not found' }, { status: 404 })
      }

      if (quantity <= 0) {
        // Remove item
        await db.purchaseOrderItem.delete({ where: { id: itemId } })
        
        // Check if PO is empty
        const remainingItems = await db.purchaseOrderItem.count({
          where: { poId: item.poId }
        })

        if (remainingItems === 0) {
          await db.purchaseOrder.delete({ where: { id: item.poId } })
          return NextResponse.json({ message: 'Item removed and empty order deleted' })
        }
      } else {
        // Update quantity
        await db.purchaseOrderItem.update({
          where: { id: itemId },
          data: {
            quantity,
            totalPrice: quantity * item.unitPrice
          }
        })
      }

      // Recalculate PO totals
      const allItems = await db.purchaseOrderItem.findMany({
        where: { poId: item.poId }
      })
      
      if (allItems.length > 0) {
        const subtotal = allItems.reduce((sum, i) => sum + i.totalPrice, 0)
        const vat = subtotal * 0.15
        const total = subtotal + vat

        await db.purchaseOrder.update({
          where: { id: item.poId },
          data: { subtotal, vat, total, updatedAt: new Date() }
        })
      }

      return NextResponse.json({ message: 'Cart updated' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error updating cart:', error)
    return NextResponse.json({ error: 'Failed to update cart' }, { status: 500 })
  }
}

// DELETE /api/grosupply/cart - Clear entire cart
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const merchantId = searchParams.get('merchantId') || 'demo-merchant'

    // Get all draft POs for this merchant
    const draftPOs = await db.purchaseOrder.findMany({
      where: { createdBy: merchantId, status: 'draft' },
      select: { id: true }
    })

    for (const po of draftPOs) {
      await db.purchaseOrderItem.deleteMany({ where: { poId: po.id } })
    }

    await db.purchaseOrder.deleteMany({
      where: { createdBy: merchantId, status: 'draft' }
    })

    return NextResponse.json({ 
      message: 'Cart cleared',
      deletedOrders: draftPOs.length
    })
  } catch (error) {
    console.error('Error clearing cart:', error)
    return NextResponse.json({ error: 'Failed to clear cart' }, { status: 500 })
  }
}
