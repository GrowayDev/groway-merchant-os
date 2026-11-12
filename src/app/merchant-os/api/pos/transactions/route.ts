import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getMerchantIdWithDevFallback, requireAuth } from '@/lib/auth-context'

// Ensure demo merchant and branch exist
async function ensureMerchantAndBranch(merchantId: string, branchId: string) {
  // Check if merchant exists
  let merchant = await db.merchant.findUnique({
    where: { id: merchantId }
  })

  if (!merchant) {
    // Create merchant
    merchant = await db.merchant.create({
      data: {
        id: merchantId,
        businessName: 'Demo Business',
        tradingName: 'Demo Store',
        tier: 'starter',
        status: 'active',
        vertical: 'retail',
        subVertical: 'general',
        contactName: 'Demo User',
        contactEmail: 'demo@example.com',
        contactPhone: '+27123456789',
        kycStatus: 'verified',
        kybStatus: 'verified',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    })
  }

  // Check if branch exists
  let branch = await db.branch.findUnique({
    where: { id: branchId }
  })

  if (!branch) {
    // Create branch
    branch = await db.branch.create({
      data: {
        id: branchId,
        merchantId: merchant.id,
        code: '001',
        name: 'Main Branch',
        type: 'store',
        isDefault: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    })
  }

  return { merchant, branch }
}

// Generate transaction number
async function generateTransactionNumber(merchantId: string): Promise<string> {
  const today = new Date()
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '')
  
  const count = await db.transaction.count({
    where: {
      merchantId,
      createdAt: {
        gte: new Date(today.setHours(0, 0, 0, 0))
      }
    }
  })
  
  return `TXN-${dateStr}-${String(count + 1).padStart(4, '0')}`
}

// GET /api/pos/transactions - List transactions
export async function GET(request: NextRequest) {
  try {
    // Get merchant ID from auth context with dev fallback
    const merchantId = getMerchantIdWithDevFallback(request)
    if (!merchantId) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      }, { status: 401 })
    }
    const { searchParams } = new URL(request.url)
    const branchId = searchParams.get('branchId')
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = { merchantId }
    if (branchId) where.branchId = branchId
    if (status) where.status = status
    if (type) where.type = type
    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) where.createdAt.gte = new Date(dateFrom)
      if (dateTo) where.createdAt.lte = new Date(dateTo + 'T23:59:59')
    }

    const [transactions, total] = await Promise.all([
      db.transaction.findMany({
        where,
        include: {
          TransactionItem: {
            include: {
              Product: true
            }
          },
          MerchantCustomer: true
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      db.transaction.count({ where })
    ])

    // Transform to expected format
    const transformedTransactions = transactions.map(t => ({
      ...t,
      items: t.TransactionItem,
      customer: t.MerchantCustomer
    }))

    return NextResponse.json({
      success: true,
      data: transformedTransactions,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    })
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch transactions' },
      { status: 500 }
    )
  }
}

// POST /api/pos/transactions - Create new transaction (complete sale)
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const auth = requireAuth(request)
    if (auth.error) return auth.error
    const merchantId = auth.context.merchantId
    
    const body = await request.json()
    const {
      branchId,
      items = [],
      subtotal: providedSubtotal,
      vatAmount,
      total: providedTotal,
      paymentMethod = 'cash',
      customerId,
      customerName,
      customerPhone,
      discount = 0,
      notes,
      staffId,
      staffName
    } = body

    // Validate items
    if (!items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No items in transaction' },
        { status: 400 }
      )
    }

    // Use provided totals or calculate from items
    let subtotal = providedSubtotal || 0
    const processedItems = []

    for (const item of items) {
      // Use the price from the item directly (POSLayout sends items with price)
      const lineTotal = (item.price || item.unitPrice || 0) * (item.quantity || 1)
      if (!providedSubtotal) {
        subtotal += lineTotal
      }
      
      processedItems.push({
        id: `ti-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        productId: item.productId || item.id || null,
        sku: item.sku || null,
        name: item.name || 'Unknown Item',
        quantity: item.quantity || 1,
        unitPrice: item.price || item.unitPrice || 0,
        discount: item.discount || 0,
        taxRate: 0.15,
        taxAmount: (item.price || item.unitPrice || 0) * (item.quantity || 1) * 0.15,
        total: lineTotal
      })
    }

    // Calculate tax and total if not provided
    const taxAmount = vatAmount || subtotal * 0.15
    const total = providedTotal || (subtotal + taxAmount)

    // Ensure merchant and branch exist
    const effectiveBranchId = branchId || 'branch-001'
    await ensureMerchantAndBranch(merchantId, effectiveBranchId)

    // Generate transaction number
    const number = await generateTransactionNumber(merchantId)

    // Create transaction with items
    const transaction = await db.transaction.create({
      data: {
        id: `txn-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        merchantId,
        branchId: effectiveBranchId,
        number,
        type: 'sale',
        status: 'completed',
        customerId,
        customerName,
        customerPhone,
        subtotal,
        discount,
        taxAmount,
        total,
        paymentMethod,
        notes,
        staffId,
        staffName,
        completedAt: new Date(),
        updatedAt: new Date(),
      }
    })

    // Create transaction items
    for (const item of processedItems) {
      await db.transactionItem.create({
        data: {
          ...item,
          transactionId: transaction.id
        }
      })
    }

    // Update stock if productId exists
    for (const item of processedItems) {
      if (item.productId) {
        const product = await db.product.findUnique({
          where: { id: item.productId }
        })

        if (product) {
          const previousStock = product.currentStock
          const newStock = previousStock - item.quantity

          await db.product.update({
            where: { id: item.productId },
            data: { currentStock: newStock }
          })

          await db.stockMovement.create({
            data: {
              id: `sm-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
              merchantId,
              branchId: effectiveBranchId,
              productId: item.productId,
              type: 'sale',
              quantity: -item.quantity,
              previousStock,
              newStock,
              unitCost: product.costPrice,
              totalValue: item.quantity * product.costPrice,
              referenceType: 'transaction',
              referenceId: transaction.id,
              reason: `Sale: ${number}`
            }
          })
        }
      }
    }

    // Fetch the complete transaction with items
    const completeTransaction = await db.transaction.findUnique({
      where: { id: transaction.id },
      include: { TransactionItem: true }
    })

    // Record sale event for Grosupply intelligence
    try {
      await db.saleEvent.create({
        data: {
          id: `sale-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          merchantId,
          transactionId: transaction.id,
          totalAmount: total,
          itemCount: processedItems.length,
          paymentMethod,
          category: processedItems[0]?.category || 'General',
          customerId,
          branchId: effectiveBranchId,
          createdAt: new Date(),
        }
      })
    } catch (e) {
      // Non-critical, continue
      console.log('Could not create sale event:', e)
    }

    // Create inventory alert if stock is low
    for (const item of processedItems) {
      if (item.productId) {
        const product = await db.product.findUnique({
          where: { id: item.productId }
        })
        
        if (product && product.currentStock <= (product.lowStockThreshold || 10)) {
          try {
            await db.inventoryAlert.create({
              data: {
                id: `alert-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
                merchantId,
                productId: item.productId,
                type: 'low_stock',
                message: `${product.name} is running low (${product.currentStock} remaining)`,
                currentStock: product.currentStock,
                threshold: product.lowStockThreshold || 10,
                status: 'active',
                createdAt: new Date(),
              }
            })
          } catch (e) {
            // Non-critical
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...completeTransaction,
        items: completeTransaction?.TransactionItem
      },
      message: 'Transaction completed successfully',
      inventoryUpdated: processedItems.some(i => i.productId)
    })
  } catch (error) {
    console.error('Error creating transaction:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create transaction', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
