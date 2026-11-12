import { NextRequest, NextResponse } from 'next/server'

// Types
interface VarianceRecord {
  id: string
  stocktakeId: string
  stocktakeDate: string
  productId: string
  productName: string
  sku: string
  category: string
  systemQty: number
  countedQty: number
  variance: number
  unitCost: number
  varianceValue: number
  status: 'pending' | 'approved' | 'rejected' | 'journal_created'
  approvedBy?: string
  approvedAt?: string
  journalEntryId?: string
  notes?: string
}

// In-memory store
let varianceRecords: VarianceRecord[] = generateInitialVariances()

// GET /api/merchant-os/accounting/variances - Get variance report
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const status = searchParams.get('status')
    const stocktakeId = searchParams.get('stocktakeId')
    const category = searchParams.get('category')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let filtered = [...varianceRecords]

    if (status && status !== 'all') {
      filtered = filtered.filter(v => v.status === status)
    }
    if (stocktakeId) {
      filtered = filtered.filter(v => v.stocktakeId === stocktakeId)
    }
    if (category && category !== 'all') {
      filtered = filtered.filter(v => v.category === category)
    }

    // Sort by date descending
    filtered.sort((a, b) => new Date(b.stocktakeDate).getTime() - new Date(a.stocktakeDate).getTime())

    const paginated = filtered.slice(offset, offset + limit)

    // Calculate summary
    const summary = {
      totalVarianceValue: filtered.reduce((sum, v) => sum + v.varianceValue, 0),
      positiveVariance: filtered.filter(v => v.varianceValue > 0).reduce((sum, v) => sum + v.varianceValue, 0),
      negativeVariance: Math.abs(filtered.filter(v => v.varianceValue < 0).reduce((sum, v) => sum + v.varianceValue, 0)),
      pendingCount: filtered.filter(v => v.status === 'pending').length,
      approvedCount: filtered.filter(v => v.status === 'approved').length,
      journalCreatedCount: filtered.filter(v => v.status === 'journal_created' || v.journalEntryId).length
    }

    return NextResponse.json({
      variances: paginated,
      summary,
      pagination: {
        total: filtered.length,
        limit,
        offset
      }
    })
  } catch (error) {
    console.error('Error fetching variances:', error)
    return NextResponse.json({ error: 'Failed to fetch variances' }, { status: 500 })
  }
}

// POST /api/merchant-os/accounting/variances/approve - Approve variance
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.varianceId) {
      return NextResponse.json({ error: 'varianceId is required' }, { status: 400 })
    }

    const varianceIndex = varianceRecords.findIndex(v => v.id === body.varianceId)
    
    if (varianceIndex === -1) {
      return NextResponse.json({ error: 'Variance not found' }, { status: 404 })
    }

    const variance = varianceRecords[varianceIndex]
    
    if (variance.status !== 'pending') {
      return NextResponse.json({ 
        error: `Cannot approve variance with status: ${variance.status}` 
      }, { status: 400 })
    }

    // Create journal entry reference
    const journalEntryId = `JE-${Date.now()}`

    // Update variance record
    varianceRecords[varianceIndex] = {
      ...variance,
      status: 'approved',
      approvedBy: body.approvedBy || 'Current User',
      approvedAt: new Date().toISOString(),
      journalEntryId,
      notes: body.notes || variance.notes
    }

    // In production, would also create the actual journal entry
    const journalEntry = {
      id: journalEntryId,
      date: new Date().toISOString().split('T')[0],
      reference: `JE-2026-${String(Date.now()).slice(-6)}`,
      description: `Stocktake Variance - ${variance.productName}`,
      eventType: 'stocktake_variance',
      lines: variance.variance > 0 ? [
        {
          accountCode: '1100',
          accountName: 'Inventory Asset',
          debit: Math.abs(variance.varianceValue),
          credit: 0,
          description: `Stocktake gain from ${variance.stocktakeId}`
        },
        {
          accountCode: '4200',
          accountName: 'Inventory Adjustment Income',
          debit: 0,
          credit: Math.abs(variance.varianceValue),
          description: `Variance from stocktake`
        }
      ] : [
        {
          accountCode: '5120',
          accountName: 'Inventory Loss',
          debit: Math.abs(variance.varianceValue),
          credit: 0,
          description: `Stocktake loss from ${variance.stocktakeId}`
        },
        {
          accountCode: '1100',
          accountName: 'Inventory Asset',
          debit: 0,
          credit: Math.abs(variance.varianceValue),
          description: `Variance from stocktake`
        }
      ],
      totalDebit: Math.abs(variance.varianceValue),
      totalCredit: Math.abs(variance.varianceValue),
      status: 'pending',
      createdBy: body.approvedBy || 'Current User',
      createdAt: new Date().toISOString(),
      sourceReference: variance.stocktakeId
    }

    return NextResponse.json({ 
      variance: varianceRecords[varianceIndex],
      journalEntry,
      message: 'Variance approved and journal entry created' 
    })
  } catch (error) {
    console.error('Error approving variance:', error)
    return NextResponse.json({ error: 'Failed to approve variance' }, { status: 500 })
  }
}

// Helper: Generate initial variance records
function generateInitialVariances(): VarianceRecord[] {
  return [
    {
      id: 'VAR-001',
      stocktakeId: 'ST-2026-002',
      stocktakeDate: '2026-02-18',
      productId: 'PROD-0003',
      productName: 'Cheddar Cheese Slices',
      sku: 'ING-CS-001',
      category: 'Ingredients',
      systemQty: 45,
      countedQty: 38,
      variance: -7,
      unitCost: 5.20,
      varianceValue: -36.40,
      status: 'journal_created',
      approvedBy: 'Sipho K.',
      approvedAt: '2026-02-18T16:30:00',
      journalEntryId: 'JE-004',
      notes: 'Possible theft - reviewed CCTV'
    },
    {
      id: 'VAR-002',
      stocktakeId: 'ST-2026-002',
      stocktakeDate: '2026-02-18',
      productId: 'PROD-0001',
      productName: 'Beef Patty (Frozen)',
      sku: 'ING-BP-001',
      category: 'Ingredients',
      systemQty: 145,
      countedQty: 142,
      variance: -3,
      unitCost: 12.00,
      varianceValue: -36.00,
      status: 'journal_created',
      approvedBy: 'Sipho K.',
      approvedAt: '2026-02-18T16:35:00',
      journalEntryId: 'JE-004'
    },
    {
      id: 'VAR-003',
      stocktakeId: 'ST-2026-002',
      stocktakeDate: '2026-02-18',
      productId: 'PROD-0004',
      productName: 'Coca-Cola 500ml',
      sku: 'BEV-CC-001',
      category: 'Beverages',
      systemQty: 320,
      countedQty: 335,
      variance: 15,
      unitCost: 9.50,
      varianceValue: 142.50,
      status: 'journal_created',
      approvedBy: 'Sipho K.',
      approvedAt: '2026-02-18T16:40:00',
      journalEntryId: 'JE-004',
      notes: 'Found in back storage'
    },
    {
      id: 'VAR-004',
      stocktakeId: 'ST-2026-003',
      stocktakeDate: '2026-02-20',
      productId: 'PROD-0008',
      productName: 'Chicken Wings (Frozen)',
      sku: 'CHK-WI-001',
      category: 'Chicken',
      systemQty: 38,
      countedQty: 32,
      variance: -6,
      unitCost: 42.00,
      varianceValue: -252.00,
      status: 'pending',
      notes: 'Awaiting manager approval'
    },
    {
      id: 'VAR-005',
      stocktakeId: 'ST-2026-003',
      stocktakeDate: '2026-02-20',
      productId: 'PROD-0002',
      productName: 'Burger Buns (6-pack)',
      sku: 'ING-BB-001',
      category: 'Ingredients',
      systemQty: 68,
      countedQty: 72,
      variance: 4,
      unitCost: 14.00,
      varianceValue: 56.00,
      status: 'pending'
    },
    {
      id: 'VAR-006',
      stocktakeId: 'ST-2026-003',
      stocktakeDate: '2026-02-20',
      productId: 'PROD-0007',
      productName: 'Cooking Oil 5L',
      sku: 'ING-CO-001',
      category: 'Ingredients',
      systemQty: 8,
      countedQty: 7,
      variance: -1,
      unitCost: 89.00,
      varianceValue: -89.00,
      status: 'pending',
      notes: 'Spillage during transfer'
    }
  ]
}
