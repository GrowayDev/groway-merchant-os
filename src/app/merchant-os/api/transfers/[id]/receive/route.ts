import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface ReceivedItem {
  productId: string
  quantityReceived: number
  quantityRejected?: number
  rejectReason?: string
  batchNumber?: string
  expiryDate?: string
  notes?: string
}

// POST /api/merchant-os/transfers/[id]/receive - Mark transfer as received with reconciliation
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
        fromBranch: true,
        toBranch: true
      }
    })

    if (!existingTransfer) {
      return NextResponse.json({ error: 'Transfer not found' }, { status: 404 })
    }

    // Validate status - can only receive in_transit transfers
    if (existingTransfer.status !== 'in_transit') {
      return NextResponse.json({
        error: `Cannot receive transfer with status: ${existingTransfer.status}`,
        hint: 'Transfer must be in transit before receiving'
      }, { status: 400 })
    }

    // Get received quantities from request
    const receivedItems: ReceivedItem[] = body.items || []
    const today = new Date().toISOString().split('T')[0]

    // Track reconciliation results
    const reconciliationResults = []
    let hasDiscrepancies = false

    // Process each item
    for (const item of existingTransfer.items) {
      const receivedData = receivedItems.find((i) => i.productId === item.productId) || {
        productId: item.productId,
        quantityReceived: item.quantityShipped, // Default to shipped quantity
        quantityRejected: 0
      }

      const quantityReceived = receivedData.quantityReceived ?? item.quantityShipped
      const quantityRejected = receivedData.quantityRejected ?? 0
      const discrepancy = item.quantityShipped - quantityReceived - quantityRejected

      // Check for discrepancies
      if (discrepancy !== 0 || quantityRejected > 0) {
        hasDiscrepancies = true
      }

      // Update transfer item
      await db.stockTransferItem.update({
        where: { id: item.id },
        data: {
          quantityReceived,
          quantityRejected,
          rejectReason: receivedData.rejectReason,
          notes: receivedData.notes,
          updatedAt: new Date()
        }
      })

      reconciliationResults.push({
        productId: item.productId,
        productSku: item.productSku,
        productName: item.productName,
        quantityRequested: item.quantityRequested,
        quantityShipped: item.quantityShipped,
        quantityReceived,
        quantityRejected,
        discrepancy,
        rejectReason: receivedData.rejectReason
      })

      // Create stock movement for inbound transfer (only for received quantity)
      if (quantityReceived > 0) {
        await db.stockMovement.create({
          data: {
            productId: item.productId,
            branchId: existingTransfer.toBranchId,
            type: 'transfer_in',
            direction: 'in',
            quantity: quantityReceived,
            unit: item.unit,
            unitCost: 0, // Would need to fetch from product/inventory
            totalCost: 0,
            referenceType: 'transfer',
            referenceId: id,
            referenceNumber: existingTransfer.transferNumber,
            batchNumber: receivedData.batchNumber,
            expiryDate: receivedData.expiryDate,
            notes: `Transfer from ${existingTransfer.fromBranch.name}${quantityRejected > 0 ? ` (${quantityRejected} rejected)` : ''}`,
            userId: body.receivedBy,
            userName: body.receivedByName,
          }
        })

        // Update or create branch inventory (increase stock at destination)
        const existingInventory = await db.branchInventory.findFirst({
          where: {
            branchId: existingTransfer.toBranchId,
            productId: item.productId
          }
        })

        if (existingInventory) {
          await db.branchInventory.update({
            where: { id: existingInventory.id },
            data: {
              quantityOnHand: { increment: quantityReceived },
              quantityAvailable: { increment: quantityReceived },
              currentBatch: receivedData.batchNumber || existingInventory.currentBatch,
              batchExpiry: receivedData.expiryDate || existingInventory.batchExpiry,
              lastAdjustedAt: new Date(),
              updatedAt: new Date()
            }
          })
        } else {
          // Create new inventory record
          await db.branchInventory.create({
            data: {
              branchId: existingTransfer.toBranchId,
              productId: item.productId,
              quantityOnHand: quantityReceived,
              quantityReserved: 0,
              quantityAvailable: quantityReceived,
              quantityOnOrder: 0,
              averageCost: 0,
              totalValue: 0,
              currentBatch: receivedData.batchNumber,
              batchExpiry: receivedData.expiryDate,
            }
          })
        }
      }
    }

    // Determine final status
    const totalReceived = reconciliationResults.reduce((sum, r) => sum + r.quantityReceived, 0)
    const totalShipped = reconciliationResults.reduce((sum, r) => sum + r.quantityShipped, 0)
    const finalStatus = hasDiscrepancies ? 'partial' : 'received'

    // Update transfer status
    const transfer = await db.stockTransfer.update({
      where: { id },
      data: {
        status: finalStatus,
        receivedDate: body.receivedDate || today,
        receivedBy: body.receivedBy,
        receivedByName: body.receivedByName,
        notes: body.notes ? `${existingTransfer.notes || ''}\n${body.notes}`.trim() : existingTransfer.notes,
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

    // Generate reconciliation report
    const reconciliationReport = {
      transferNumber: existingTransfer.transferNumber,
      receivedAt: new Date().toISOString(),
      receivedBy: body.receivedByName,
      totalItems: reconciliationResults.length,
      totalQuantityShipped: totalShipped,
      totalQuantityReceived: totalReceived,
      totalQuantityRejected: reconciliationResults.reduce((sum, r) => sum + r.quantityRejected, 0),
      hasDiscrepancies,
      items: reconciliationResults,
      summary: {
        fullyReceived: reconciliationResults.filter(r => r.quantityReceived === r.quantityShipped).length,
        partiallyReceived: reconciliationResults.filter(r => r.quantityReceived > 0 && r.quantityReceived < r.quantityShipped).length,
        notReceived: reconciliationResults.filter(r => r.quantityReceived === 0).length,
        rejected: reconciliationResults.filter(r => r.quantityRejected > 0).length,
      }
    }

    return NextResponse.json({
      success: true,
      message: hasDiscrepancies 
        ? 'Transfer received with discrepancies' 
        : 'Transfer received successfully',
      transfer,
      reconciliation: reconciliationReport
    })
  } catch (error) {
    console.error('Error receiving transfer:', error)
    return NextResponse.json({ 
      error: 'Failed to receive transfer',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
