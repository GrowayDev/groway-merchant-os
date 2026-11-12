import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/merchant-os/inventory/grn - List Goods Received Notes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const supplierId = searchParams.get('supplierId')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Mock GRNs
    const grns = [
      {
        id: 'GRN-0001',
        grnNumber: 'GRN-2026-00001',
        poNumber: 'PO-2026-00156',
        supplierId: 'SUP-001',
        supplierName: 'Crown National',
        status: 'completed',
        totalItems: 12,
        totalValue: 15450.00,
        receivedBy: 'Thandi M.',
        receivedAt: new Date(Date.now() - 3600000),
        notes: 'All items in good condition',
        items: [
          { productName: 'Beef Patty (Frozen)', sku: 'ING-BP-001', ordered: 100, received: 100, unitCost: 12.00, batchNo: 'BP-2026-021', expiry: '2026-06-15' },
          { productName: 'Burger Buns', sku: 'ING-BB-001', ordered: 50, received: 50, unitCost: 14.00, batchNo: 'BB-2026-019', expiry: '2026-02-28' }
        ]
      },
      {
        id: 'GRN-0002',
        grnNumber: 'GRN-2026-00002',
        poNumber: 'PO-2026-00158',
        supplierId: 'SUP-002',
        supplierName: 'Clover SA',
        status: 'partial',
        totalItems: 8,
        totalValue: 8900.00,
        receivedBy: 'Sipho K.',
        receivedAt: new Date(Date.now() - 86400000),
        notes: 'Partial delivery - cheese delayed',
        items: [
          { productName: 'Milk 2L', sku: 'BEV-ML-001', ordered: 40, received: 40, unitCost: 28.00 },
          { productName: 'Cheddar Cheese', sku: 'ING-CS-001', ordered: 20, received: 12, unitCost: 52.00 }
        ]
      },
      {
        id: 'GRN-0003',
        grnNumber: 'GRN-2026-00003',
        poNumber: null,
        supplierId: 'SUP-003',
        supplierName: 'Coca-Cola Peninsula',
        status: 'completed',
        totalItems: 5,
        totalValue: 12600.00,
        receivedBy: 'Johan P.',
        receivedAt: new Date(Date.now() - 172800000),
        notes: 'Direct delivery - no PO',
        items: [
          { productName: 'Coca-Cola 500ml', sku: 'BEV-CC-001', ordered: 100, received: 100, unitCost: 9.50 },
          { productName: 'Fanta 500ml', sku: 'BEV-FA-001', ordered: 50, received: 50, unitCost: 9.50 }
        ]
      },
      {
        id: 'GRN-0004',
        grnNumber: 'GRN-2026-00004',
        poNumber: 'PO-2026-00162',
        supplierId: 'SUP-004',
        supplierName: 'McCain SA',
        status: 'disputed',
        totalItems: 4,
        totalValue: 3200.00,
        receivedBy: 'Maria L.',
        receivedAt: new Date(Date.now() - 259200000),
        notes: 'Wrong products delivered - awaiting replacement',
        items: [
          { productName: 'Frozen Chips 2kg', sku: 'ING-FC-001', ordered: 40, received: 20, unitCost: 28.00, rejected: 20, rejectReason: 'Thawed on arrival' }
        ]
      }
    ]

    let filtered = grns
    if (status) {
      filtered = grns.filter(g => g.status === status)
    }
    if (supplierId) {
      filtered = filtered.filter(g => g.supplierId === supplierId)
    }

    return NextResponse.json({
      grns: filtered.slice(offset, offset + limit),
      pagination: {
        total: filtered.length,
        limit,
        offset
      }
    })
  } catch (error) {
    console.error('Error fetching GRNs:', error)
    return NextResponse.json({ error: 'Failed to fetch GRNs' }, { status: 500 })
  }
}

// POST /api/merchant-os/inventory/grn - Create Goods Received Note
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.supplierId) {
      return NextResponse.json({ error: 'supplierId is required' }, { status: 400 })
    }
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: 'items array is required' }, { status: 400 })
    }

    // Create GRN
    const grn = {
      id: `GRN-${Date.now()}`,
      grnNumber: `GRN-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`,
      poNumber: body.poNumber,
      supplierId: body.supplierId,
      supplierName: body.supplierName,
      status: 'completed',
      totalItems: body.items.length,
      totalValue: body.items.reduce((sum: number, item: any) => sum + (item.received * item.unitCost), 0),
      receivedBy: body.receivedBy || 'System',
      receivedAt: new Date(),
      notes: body.notes,
      items: body.items.map((item: any) => ({
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        ordered: item.ordered || item.received,
        received: item.received,
        rejected: item.rejected || 0,
        rejectReason: item.rejectReason,
        unitCost: item.unitCost,
        batchNo: item.batchNo,
        expiry: item.expiry
      }))
    }

    // In production, this would:
    // 1. Create GRN record in database
    // 2. Update BranchInventory quantities
    // 3. Create StockMovement records for each item
    // 4. Update PO status if linked
    // 5. Create batch records if batch tracking enabled

    return NextResponse.json({ grn }, { status: 201 })
  } catch (error) {
    console.error('Error creating GRN:', error)
    return NextResponse.json({ error: 'Failed to create GRN' }, { status: 500 })
  }
}
