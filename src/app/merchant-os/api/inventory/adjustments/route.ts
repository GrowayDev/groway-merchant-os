import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/merchant-os/inventory/adjustments - List adjustments
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Return mock adjustments for demo
    const adjustments = [
      {
        id: 'ADJ-0001',
        type: 'count_adjustment',
        productName: 'Cheddar Cheese Slices',
        sku: 'ING-CS-001',
        systemQty: 15,
        countedQty: 12,
        variance: -3,
        reason: 'Stocktake variance',
        status: 'approved',
        approvedBy: 'Sipho K.',
        notes: 'Weekly stocktake found discrepancy',
        createdAt: new Date(Date.now() - 86400000)
      },
      {
        id: 'ADJ-0002',
        type: 'damaged',
        productName: 'Burger Buns (6-pack)',
        sku: 'ING-BB-001',
        systemQty: 24,
        countedQty: 20,
        variance: -4,
        reason: 'Water damage in storage',
        status: 'approved',
        approvedBy: 'Thandi M.',
        notes: 'Pipe leak in dry storage area',
        createdAt: new Date(Date.now() - 172800000)
      },
      {
        id: 'ADJ-0003',
        type: 'expired',
        productName: 'Milk 2L',
        sku: 'BEV-ML-001',
        systemQty: 8,
        countedQty: 5,
        variance: -3,
        reason: 'Expired products removed',
        status: 'approved',
        approvedBy: 'Johan P.',
        notes: 'Products past use-by date',
        createdAt: new Date(Date.now() - 259200000)
      },
      {
        id: 'ADJ-0004',
        type: 'theft',
        productName: 'Coca-Cola 500ml',
        sku: 'BEV-CC-001',
        systemQty: 50,
        countedQty: 42,
        variance: -8,
        reason: 'Suspected theft',
        status: 'pending_review',
        approvedBy: null,
        notes: 'Discrepancy found during shift change',
        createdAt: new Date(Date.now() - 345600000)
      },
      {
        id: 'ADJ-0005',
        type: 'return_to_supplier',
        productName: 'Chicken Wings (Frozen)',
        sku: 'CHK-WI-001',
        systemQty: 30,
        countedQty: 25,
        variance: -5,
        reason: 'Quality issue - wrong size',
        status: 'approved',
        approvedBy: 'Maria L.',
        notes: 'Supplier collected - credit note pending',
        createdAt: new Date(Date.now() - 432000000)
      }
    ]

    return NextResponse.json({
      adjustments: adjustments.slice(offset, offset + limit),
      pagination: {
        total: adjustments.length,
        limit,
        offset
      }
    })
  } catch (error) {
    console.error('Error fetching adjustments:', error)
    return NextResponse.json({ error: 'Failed to fetch adjustments' }, { status: 500 })
  }
}

// POST /api/merchant-os/inventory/adjustments - Create adjustment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.productId || body.variance === undefined || !body.reason) {
      return NextResponse.json({
        error: 'productId, variance, and reason are required'
      }, { status: 400 })
    }

    // Create adjustment record
    const adjustment = {
      id: `ADJ-${Date.now()}`,
      type: body.type || 'count_adjustment',
      productId: body.productId,
      productName: body.productName || 'Unknown Product',
      sku: body.sku,
      systemQty: body.systemQty || 0,
      countedQty: body.countedQty || 0,
      variance: body.variance,
      reason: body.reason,
      status: 'pending_approval',
      notes: body.notes,
      createdAt: new Date()
    }

    // In production, this would:
    // 1. Create a StockMovement record
    // 2. Update Product.stockQuantity
    // 3. Create an audit trail entry
    // 4. Trigger approval workflow if needed

    return NextResponse.json({ adjustment }, { status: 201 })
  } catch (error) {
    console.error('Error creating adjustment:', error)
    return NextResponse.json({ error: 'Failed to create adjustment' }, { status: 500 })
  }
}
