import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/merchant-os/inventory - Get inventory status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const merchantId = searchParams.get('merchantId')
    const branchId = searchParams.get('branchId')
    const category = searchParams.get('category')
    const lowStock = searchParams.get('lowStock') === 'true'
    const expiring = searchParams.get('expiring') === 'true'
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!merchantId) {
      return NextResponse.json({ error: 'merchantId is required' }, { status: 400 })
    }

    // Build query
    const productWhere: any = { merchantId, isSellable: true }
    if (category) {
      productWhere.category = { name: category }
    }
    if (search) {
      productWhere.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search } },
      ]
    }

    // Get products with inventory
    let products = await prisma.product.findMany({
      where: productWhere,
      include: {
        category: true,
        inventory: branchId ? {
          where: { branchId },
        } : true,
        batches: {
          where: { quantityRemaining: { gt: 0 } },
          orderBy: { expiryDate: 'asc' },
          take: 5,
        },
      },
      take: limit,
      skip: offset,
      orderBy: { name: 'asc' },
    })

    // Filter for low stock if requested
    if (lowStock) {
      products = products.filter(p => {
        const totalStock = p.inventory.reduce((sum, inv) => sum + inv.quantityOnHand, 0)
        return totalStock <= p.reorderPoint
      })
    }

    // Filter for expiring if requested
    if (expiring) {
      const thirtyDaysFromNow = new Date()
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
      
      products = products.filter(p => 
        p.batches.some(b => 
          b.expiryDate && new Date(b.expiryDate) <= thirtyDaysFromNow
        )
      )
    }

    // Calculate stats
    const stats = {
      totalProducts: products.length,
      totalValue: products.reduce((sum, p) => {
        const stock = p.inventory.reduce((s, inv) => s + inv.quantityOnHand, 0)
        return sum + (stock * p.costPrice)
      }, 0),
      lowStockCount: products.filter(p => {
        const stock = p.inventory.reduce((s, inv) => s + inv.quantityOnHand, 0)
        return stock <= p.reorderPoint
      }).length,
      outOfStockCount: products.filter(p => {
        const stock = p.inventory.reduce((s, inv) => s + inv.quantityOnHand, 0)
        return stock === 0
      }).length,
      expiringCount: products.filter(p => {
        const thirtyDaysFromNow = new Date()
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
        return p.batches.some(b => 
          b.expiryDate && new Date(b.expiryDate) <= thirtyDaysFromNow
        )
      }).length,
    }

    return NextResponse.json({
      products,
      stats,
      limit,
      offset,
    })
  } catch (error) {
    console.error('Error fetching inventory:', error)
    return NextResponse.json(
      { error: 'Failed to fetch inventory' },
      { status: 500 }
    )
  }
}

// POST /api/merchant-os/inventory - Update inventory
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      merchantId,
      branchId,
      productId,
      adjustmentType,
      quantity,
      reason,
      notes,
      batchNumber,
      expiryDate,
      userId,
      userName,
    } = body

    if (!merchantId || !branchId || !productId || !adjustmentType || quantity === undefined) {
      return NextResponse.json(
        { error: 'merchantId, branchId, productId, adjustmentType, and quantity are required' },
        { status: 400 }
      )
    }

    // Get current inventory
    let inventory = await prisma.branchInventory.findUnique({
      where: {
        branchId_productId: { branchId, productId },
      },
    })

    // Create inventory record if doesn't exist
    if (!inventory) {
      inventory = await prisma.branchInventory.create({
        data: {
          branchId,
          productId,
          quantityOnHand: 0,
          quantityReserved: 0,
          quantityAvailable: 0,
          quantityOnOrder: 0,
          averageCost: 0,
          totalValue: 0,
          reorderPoint: 0,
          reorderQuantity: 1,
        },
      })
    }

    // Get product for cost calculation
    const product = await prisma.product.findUnique({
      where: { id: productId },
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Calculate adjustment
    let quantityChange = 0
    let direction = 'out'
    
    switch (adjustmentType) {
      case 'grn':
      case 'return':
      case 'transfer_in':
      case 'stocktake_positive':
        quantityChange = Math.abs(quantity)
        direction = 'in'
        break
      case 'sale':
      case 'adjustment_negative':
      case 'transfer_out':
      case 'stocktake_negative':
      case 'waste':
      case 'damage':
        quantityChange = -Math.abs(quantity)
        direction = 'out'
        break
      case 'adjustment':
        quantityChange = quantity // Can be positive or negative
        direction = quantity > 0 ? 'in' : 'out'
        break
      default:
        return NextResponse.json(
          { error: 'Invalid adjustment type' },
          { status: 400 }
        )
    }

    const newQuantityOnHand = inventory.quantityOnHand + quantityChange
    const newQuantityAvailable = newQuantityOnHand - inventory.quantityReserved

    // Calculate unit cost
    const unitCost = product.costPrice || inventory.averageCost || 0
    const totalCost = Math.abs(quantityChange) * unitCost

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create stock movement
      const movement = await tx.stockMovement.create({
        data: {
          productId,
          branchId,
          type: adjustmentType,
          direction,
          quantity: Math.abs(quantityChange),
          unit: product.unit,
          unitCost,
          totalCost,
          reason,
          notes,
          batchNumber,
          expiryDate,
          userId,
          userName,
        },
      })

      // Update inventory
      const updatedInventory = await tx.branchInventory.update({
        where: { id: inventory!.id },
        data: {
          quantityOnHand: newQuantityOnHand,
          quantityAvailable: newQuantityAvailable,
          totalValue: newQuantityOnHand * unitCost,
          lastAdjustedAt: new Date(),
        },
      })

      // Update product stock
      await tx.product.update({
        where: { id: productId },
        data: {
          stockQuantity: { increment: quantityChange },
          stockValue: { increment: totalCost * (quantityChange > 0 ? 1 : -1) },
          lastRestockedAt: quantityChange > 0 ? new Date() : undefined,
        },
      })

      // Handle batch if provided
      if (batchNumber) {
        const existingBatch = await tx.productBatch.findFirst({
          where: { batchNumber, productId, branchId },
        })

        if (existingBatch) {
          await tx.productBatch.update({
            where: { id: existingBatch.id },
            data: {
              quantityRemaining: { increment: quantityChange },
              quantitySold: quantityChange < 0 ? { increment: Math.abs(quantityChange) } : undefined,
            },
          })
        } else if (quantityChange > 0) {
          await tx.productBatch.create({
            data: {
              batchNumber,
              productId,
              branchId,
              receivedDate: new Date().toISOString().split('T')[0],
              quantityReceived: quantityChange,
              quantityRemaining: quantityChange,
              unitCost,
              totalCost,
              expiryDate,
              status: 'active',
            },
          })
        }
      }

      // Create journal entry if significant
      if (Math.abs(totalCost) > 100) {
        await createJournalEntry(tx, {
          merchantId,
          adjustmentType,
          productId,
          productName: product.name,
          quantity: Math.abs(quantityChange),
          unitCost,
          totalCost,
          direction,
          branchId,
        })
      }

      return { movement, inventory: updatedInventory }
    })

    return NextResponse.json({
      success: true,
      movement: result.movement,
      inventory: result.inventory,
      previousQuantity: inventory.quantityOnHand,
      newQuantity: newQuantityOnHand,
    })
  } catch (error) {
    console.error('Error updating inventory:', error)
    return NextResponse.json(
      { error: 'Failed to update inventory' },
      { status: 500 }
    )
  }
}

// Create journal entry for inventory movement
async function createJournalEntry(tx: any, data: {
  merchantId: string
  adjustmentType: string
  productId: string
  productName: string
  quantity: number
  unitCost: number
  totalCost: number
  direction: string
  branchId: string
}) {
  const entryNumber = `JE-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`
  
  // Determine accounts based on movement type
  let debitAccount = '5000' // COGS
  let creditAccount = '1100' // Inventory Asset
  
  if (data.direction === 'in') {
    if (data.adjustmentType === 'grn') {
      debitAccount = '1100' // Inventory Asset
      creditAccount = '2120' // GRN Clearing
    } else {
      debitAccount = '1100' // Inventory Asset
      creditAccount = '4200' // Inventory Adjustment Income
    }
  }

  await tx.journalEntry.create({
    data: {
      entryNumber,
      merchantId: data.merchantId,
      entryDate: new Date().toISOString().split('T')[0],
      description: `${data.adjustmentType.replace('_', ' ')} - ${data.productName} (${data.quantity} units)`,
      sourceType: 'inventory_adjustment',
      sourceId: data.productId,
      totalDebit: data.totalCost,
      totalCredit: data.totalCost,
      status: 'posted',
      postedAt: new Date(),
      lines: {
        create: [
          {
            accountCode: debitAccount,
            accountName: debitAccount === '1100' ? 'Inventory Asset' : 
                         debitAccount === '5000' ? 'Cost of Goods Sold' :
                         debitAccount === '2120' ? 'GRN Clearing' : 'Account',
            debit: data.totalCost,
            credit: 0,
            lineDescription: `${data.direction === 'in' ? 'Increase' : 'Decrease'} - ${data.productName}`,
            branchId: data.branchId,
          },
          {
            accountCode: creditAccount,
            accountName: creditAccount === '1100' ? 'Inventory Asset' : 
                         creditAccount === '2120' ? 'GRN Clearing' :
                         creditAccount === '4200' ? 'Inventory Adjustment Income' : 'Account',
            debit: 0,
            credit: data.totalCost,
            lineDescription: `${data.direction === 'in' ? 'Increase' : 'Decrease'} - ${data.productName}`,
            branchId: data.branchId,
          },
        ],
      },
    },
  })
}
