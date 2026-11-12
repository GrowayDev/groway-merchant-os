import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/merchant-os/transfers/[id]/ship - Mark transfer as shipped
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Check if transfer exists
    const existingTransfer = await db.stockTransfer.findUnique({
      where: { id },
      include: {
        items: true,
        fromBranch: true
      }
    })

    if (!existingTransfer) {
      return NextResponse.json({ error: 'Transfer not found' }, { status: 404 })
    }

    // Validate status - can only ship approved transfers
    if (existingTransfer.status !== 'approved') {
      return NextResponse.json({
        error: `Cannot ship transfer with status: ${existingTransfer.status}`,
        hint: 'Transfer must be approved before shipping'
      }, { status: 400 })
    }

    // Validate items
    if (existingTransfer.items.length === 0) {
      return NextResponse.json({
        error: 'Cannot ship transfer without items'
      }, { status: 400 })
    }

    // Get shipped quantities from request or default to requested quantities
    const shippedItems = body.items || []
    const today = new Date().toISOString().split('T')[0]

    // Update transfer items with shipped quantities
    for (const item of existingTransfer.items) {
      const shippedQty = shippedItems.find((i: { productId: string; quantityShipped: number }) => i.productId === item.productId)?.quantityShipped ?? item.quantityRequested
      
      await db.stockTransferItem.update({
        where: { id: item.id },
        data: {
          quantityShipped: shippedQty,
          updatedAt: new Date()
        }
      })

      // Create stock movement for outbound transfer
      await db.stockMovement.create({
        data: {
          productId: item.productId,
          branchId: existingTransfer.fromBranchId,
          type: 'transfer_out',
          direction: 'out',
          quantity: shippedQty,
          unit: item.unit,
          unitCost: 0, // Would need to fetch from product/inventory
          totalCost: 0,
          referenceType: 'transfer',
          referenceId: id,
          referenceNumber: existingTransfer.transferNumber,
          notes: `Transfer to ${existingTransfer.toBranchId}`,
          userId: body.shippedBy,
          userName: body.shippedByName,
        }
      })

      // Update branch inventory (reduce stock at source)
      const inventory = await db.branchInventory.findFirst({
        where: {
          branchId: existingTransfer.fromBranchId,
          productId: item.productId
        }
      })

      if (inventory) {
        await db.branchInventory.update({
          where: { id: inventory.id },
          data: {
            quantityOnHand: { decrement: shippedQty },
            quantityAvailable: { decrement: shippedQty },
            lastAdjustedAt: new Date(),
            updatedAt: new Date()
          }
        })
      }
    }

    // Update transfer status
    const transfer = await db.stockTransfer.update({
      where: { id },
      data: {
        status: 'in_transit',
        shippedDate: body.shippedDate || today,
        shippedBy: body.shippedBy,
        shippedByName: body.shippedByName,
        updatedAt: new Date()
      },
      include: {
        fromBranch: {
          select: { id: true, name: true, code: true }
        },
        toBranch: {
          select: { id: true, name: true, code: true }
        },
        items: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Transfer has been shipped',
      transfer
    })
  } catch (error) {
    console.error('Error shipping transfer:', error)
    return NextResponse.json({ 
      error: 'Failed to ship transfer',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
