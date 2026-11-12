import { NextRequest, NextResponse } from 'next/server'

// Types
interface JournalEntryLine {
  accountCode: string
  accountName: string
  debit: number
  credit: number
  description: string
}

interface JournalEntry {
  id: string
  date: string
  reference: string
  description: string
  eventType: 'stock_receipt' | 'stock_sale' | 'stock_adjustment' | 'stock_transfer' | 'stocktake_variance' | 'manual'
  lines: JournalEntryLine[]
  totalDebit: number
  totalCredit: number
  status: 'draft' | 'pending' | 'posted' | 'reversed'
  createdBy: string
  createdAt: string
  postedAt?: string
  sourceReference?: string
}

// In-memory store (would be database in production)
let journalEntries: JournalEntry[] = generateInitialJournalEntries()

// Standard SA Chart of Accounts
const accounts: Record<string, string> = {
  '1100': 'Inventory Asset',
  '1120': 'Work in Progress',
  '1400': 'VAT Input',
  '2100': 'Accounts Payable',
  '2120': 'GRN Clearing',
  '2400': 'VAT Payable',
  '2410': 'VAT Input',
  '2420': 'VAT Output',
  '4000': 'Sales Revenue',
  '4200': 'Inventory Adjustment Income',
  '5000': 'Cost of Goods Sold',
  '5100': 'Inventory Adjustment',
  '5110': 'Shrinkage Expense',
  '5120': 'Inventory Loss',
  '5200': 'Inventory Write-off',
}

// GET /api/merchant-os/accounting/journal-entries - List journal entries
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const eventType = searchParams.get('eventType')
    const status = searchParams.get('status')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let filtered = [...journalEntries]

    if (eventType && eventType !== 'all') {
      filtered = filtered.filter(je => je.eventType === eventType)
    }
    if (status && status !== 'all') {
      filtered = filtered.filter(je => je.status === status)
    }
    if (startDate) {
      filtered = filtered.filter(je => je.date >= startDate)
    }
    if (endDate) {
      filtered = filtered.filter(je => je.date <= endDate)
    }

    // Sort by date descending
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    const paginated = filtered.slice(offset, offset + limit)

    return NextResponse.json({
      journalEntries: paginated,
      pagination: {
        total: filtered.length,
        limit,
        offset
      }
    })
  } catch (error) {
    console.error('Error fetching journal entries:', error)
    return NextResponse.json({ error: 'Failed to fetch journal entries' }, { status: 500 })
  }
}

// POST /api/merchant-os/accounting/journal-entries - Create manual journal entry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.date || !body.description || !body.lines || body.lines.length < 2) {
      return NextResponse.json({ 
        error: 'date, description, and at least 2 lines are required' 
      }, { status: 400 })
    }

    // Validate balanced entry
    const totalDebit = body.lines.reduce((sum: number, line: JournalEntryLine) => sum + (line.debit || 0), 0)
    const totalCredit = body.lines.reduce((sum: number, line: JournalEntryLine) => sum + (line.credit || 0), 0)

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return NextResponse.json({ 
        error: 'Journal entry must be balanced (debits must equal credits)' 
      }, { status: 400 })
    }

    const reference = `JE-2026-${String(journalEntries.length + 1).padStart(3, '0')}`

    const newEntry: JournalEntry = {
      id: `JE-${Date.now()}`,
      date: body.date,
      reference,
      description: body.description,
      eventType: body.eventType || 'manual',
      lines: body.lines.map((line: JournalEntryLine, i: number) => ({
        accountCode: line.accountCode,
        accountName: accounts[line.accountCode] || line.accountName || 'Unknown Account',
        debit: line.debit || 0,
        credit: line.credit || 0,
        description: line.description || ''
      })),
      totalDebit,
      totalCredit,
      status: body.status || 'draft',
      createdBy: body.createdBy || 'System',
      createdAt: new Date().toISOString(),
      sourceReference: body.sourceReference
    }

    journalEntries.unshift(newEntry)

    return NextResponse.json({ journalEntry: newEntry }, { status: 201 })
  } catch (error) {
    console.error('Error creating journal entry:', error)
    return NextResponse.json({ error: 'Failed to create journal entry' }, { status: 500 })
  }
}

// Helper: Generate initial journal entries
function generateInitialJournalEntries(): JournalEntry[] {
  return [
    {
      id: 'JE-001',
      date: '2026-02-20',
      reference: 'JE-2026-001',
      description: 'Stock Receipt - GRN-2026-042 (GroSupply)',
      eventType: 'stock_receipt',
      lines: [
        { accountCode: '1100', accountName: 'Inventory Asset', debit: 15670.00, credit: 0, description: 'Stock received from GroSupply' },
        { accountCode: '2120', accountName: 'GRN Clearing', debit: 0, credit: 15670.00, description: 'Amount owed to GroSupply' },
      ],
      totalDebit: 15670.00,
      totalCredit: 15670.00,
      status: 'posted',
      createdBy: 'System',
      createdAt: '2026-02-20T09:30:00',
      postedAt: '2026-02-20T09:30:00',
      sourceReference: 'GRN-2026-042',
    },
    {
      id: 'JE-002',
      date: '2026-02-20',
      reference: 'JE-2026-002',
      description: 'COGS - Daily Sales (15 Feb 2026)',
      eventType: 'stock_sale',
      lines: [
        { accountCode: '5000', accountName: 'Cost of Goods Sold', debit: 8450.00, credit: 0, description: 'Cost of goods sold' },
        { accountCode: '1100', accountName: 'Inventory Asset', debit: 0, credit: 8450.00, description: 'Inventory reduction' },
      ],
      totalDebit: 8450.00,
      totalCredit: 8450.00,
      status: 'posted',
      createdBy: 'System',
      createdAt: '2026-02-20T18:00:00',
      postedAt: '2026-02-20T18:00:00',
      sourceReference: 'SALES-2026-0215',
    },
    {
      id: 'JE-003',
      date: '2026-02-19',
      reference: 'JE-2026-003',
      description: 'Stock Adjustment - Damaged goods',
      eventType: 'stock_adjustment',
      lines: [
        { accountCode: '5110', accountName: 'Shrinkage Expense', debit: 450.00, credit: 0, description: 'Damaged stock write-off' },
        { accountCode: '1100', accountName: 'Inventory Asset', debit: 0, credit: 450.00, description: 'Inventory reduction' },
      ],
      totalDebit: 450.00,
      totalCredit: 450.00,
      status: 'posted',
      createdBy: 'Thandi M.',
      createdAt: '2026-02-19T14:20:00',
      postedAt: '2026-02-19T14:20:00',
      sourceReference: 'ADJ-2026-008',
    },
    {
      id: 'JE-004',
      date: '2026-02-18',
      reference: 'JE-2026-004',
      description: 'Stocktake Variance - Monthly count',
      eventType: 'stocktake_variance',
      lines: [
        { accountCode: '5120', accountName: 'Inventory Loss', debit: 1250.00, credit: 0, description: 'Stocktake shortage' },
        { accountCode: '1100', accountName: 'Inventory Asset', debit: 0, credit: 1250.00, description: 'Inventory adjustment' },
      ],
      totalDebit: 1250.00,
      totalCredit: 1250.00,
      status: 'posted',
      createdBy: 'Sipho K.',
      createdAt: '2026-02-18T16:45:00',
      postedAt: '2026-02-18T16:45:00',
      sourceReference: 'ST-2026-002',
    },
    {
      id: 'JE-005',
      date: '2026-02-20',
      reference: 'JE-2026-005',
      description: 'Stock Receipt - GRN-2026-043 (Clover SA)',
      eventType: 'stock_receipt',
      lines: [
        { accountCode: '1100', accountName: 'Inventory Asset', debit: 8900.00, credit: 0, description: 'Dairy products received' },
        { accountCode: '2120', accountName: 'GRN Clearing', debit: 0, credit: 8900.00, description: 'Amount owed to Clover' },
      ],
      totalDebit: 8900.00,
      totalCredit: 8900.00,
      status: 'pending',
      createdBy: 'System',
      createdAt: '2026-02-20T11:00:00',
      sourceReference: 'GRN-2026-043',
    },
    {
      id: 'JE-006',
      date: '2026-02-20',
      reference: 'JE-2026-006',
      description: 'Inter-Branch Transfer - JHB to CPT',
      eventType: 'stock_transfer',
      lines: [
        { accountCode: '1100', accountName: 'Inventory Asset (CPT)', debit: 3500.00, credit: 0, description: 'Stock transferred to Cape Town' },
        { accountCode: '1100', accountName: 'Inventory Asset (JHB)', debit: 0, credit: 3500.00, description: 'Stock transferred from Johannesburg' },
      ],
      totalDebit: 3500.00,
      totalCredit: 3500.00,
      status: 'pending',
      createdBy: 'Maria L.',
      createdAt: '2026-02-20T13:00:00',
      sourceReference: 'TRF-2026-015',
    },
  ]
}
