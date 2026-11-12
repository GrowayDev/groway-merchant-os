import { NextRequest, NextResponse } from 'next/server'

// Types
interface AccountMapping {
  id: string
  eventType: string
  eventTypeName: string
  debitAccountCode: string
  debitAccountName: string
  creditAccountCode: string
  creditAccountName: string
  vatApplicable: boolean
  vatCode?: string
  costCenter?: string
  isActive: boolean
}

interface Account {
  code: string
  name: string
  type: 'asset' | 'liability' | 'equity' | 'income' | 'expense'
  subType: string
}

// Standard SA Chart of Accounts
const standardAccounts: Account[] = [
  // Assets
  { code: '1100', name: 'Inventory Asset', type: 'asset', subType: 'Current Asset' },
  { code: '1120', name: 'Work in Progress', type: 'asset', subType: 'Current Asset' },
  { code: '1400', name: 'VAT Input', type: 'asset', subType: 'Current Asset' },
  // Liabilities
  { code: '2100', name: 'Accounts Payable', type: 'liability', subType: 'Current Liability' },
  { code: '2120', name: 'GRN Clearing', type: 'liability', subType: 'Current Liability' },
  { code: '2400', name: 'VAT Payable', type: 'liability', subType: 'Current Liability' },
  { code: '2410', name: 'VAT Input', type: 'liability', subType: 'Current Liability' },
  { code: '2420', name: 'VAT Output', type: 'liability', subType: 'Current Liability' },
  // Income
  { code: '4000', name: 'Sales Revenue', type: 'income', subType: 'Operating Income' },
  { code: '4200', name: 'Inventory Adjustment Income', type: 'income', subType: 'Other Income' },
  // Expenses
  { code: '5000', name: 'Cost of Goods Sold', type: 'expense', subType: 'Cost of Sales' },
  { code: '5100', name: 'Inventory Adjustment', type: 'expense', subType: 'Operating Expense' },
  { code: '5110', name: 'Shrinkage Expense', type: 'expense', subType: 'Operating Expense' },
  { code: '5120', name: 'Inventory Loss', type: 'expense', subType: 'Operating Expense' },
  { code: '5200', name: 'Inventory Write-off', type: 'expense', subType: 'Operating Expense' },
]

// Default mappings
let accountMappings: AccountMapping[] = [
  {
    id: 'MAP-001',
    eventType: 'stock_receipt',
    eventTypeName: 'Stock Receipt (GRN)',
    debitAccountCode: '1100',
    debitAccountName: 'Inventory Asset',
    creditAccountCode: '2120',
    creditAccountName: 'GRN Clearing',
    vatApplicable: true,
    vatCode: 'INPUT',
    isActive: true,
  },
  {
    id: 'MAP-002',
    eventType: 'stock_sale',
    eventTypeName: 'Stock Sale',
    debitAccountCode: '5000',
    debitAccountName: 'Cost of Goods Sold',
    creditAccountCode: '1100',
    creditAccountName: 'Inventory Asset',
    vatApplicable: false,
    isActive: true,
  },
  {
    id: 'MAP-003',
    eventType: 'stock_adjustment_pos',
    eventTypeName: 'Stock Adjustment (Positive)',
    debitAccountCode: '1100',
    debitAccountName: 'Inventory Asset',
    creditAccountCode: '4200',
    creditAccountName: 'Inventory Adjustment Income',
    vatApplicable: false,
    isActive: true,
  },
  {
    id: 'MAP-004',
    eventType: 'stock_adjustment_neg',
    eventTypeName: 'Stock Adjustment (Negative)',
    debitAccountCode: '5110',
    debitAccountName: 'Shrinkage Expense',
    creditAccountCode: '1100',
    creditAccountName: 'Inventory Asset',
    vatApplicable: false,
    isActive: true,
  },
  {
    id: 'MAP-005',
    eventType: 'stocktake_variance_pos',
    eventTypeName: 'Stocktake Variance (Positive)',
    debitAccountCode: '1100',
    debitAccountName: 'Inventory Asset',
    creditAccountCode: '4200',
    creditAccountName: 'Inventory Adjustment Income',
    vatApplicable: false,
    isActive: true,
  },
  {
    id: 'MAP-006',
    eventType: 'stocktake_variance_neg',
    eventTypeName: 'Stocktake Variance (Negative)',
    debitAccountCode: '5120',
    debitAccountName: 'Inventory Loss',
    creditAccountCode: '1100',
    creditAccountName: 'Inventory Asset',
    vatApplicable: false,
    isActive: true,
  },
  {
    id: 'MAP-007',
    eventType: 'stock_transfer',
    eventTypeName: 'Stock Transfer',
    debitAccountCode: '1100',
    debitAccountName: 'Inventory Asset (Destination)',
    creditAccountCode: '1100',
    creditAccountName: 'Inventory Asset (Source)',
    vatApplicable: false,
    isActive: true,
  },
]

// GET /api/merchant-os/accounting/account-mapping - Get account mappings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const includeAccounts = searchParams.get('includeAccounts') === 'true'

    return NextResponse.json({
      mappings: accountMappings,
      accounts: includeAccounts ? standardAccounts : undefined
    })
  } catch (error) {
    console.error('Error fetching account mappings:', error)
    return NextResponse.json({ error: 'Failed to fetch account mappings' }, { status: 500 })
  }
}

// POST /api/merchant-os/accounting/account-mapping - Update account mapping
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.id) {
      return NextResponse.json({ error: 'Mapping ID is required' }, { status: 400 })
    }

    const mappingIndex = accountMappings.findIndex(m => m.id === body.id)
    
    if (mappingIndex === -1) {
      return NextResponse.json({ error: 'Mapping not found' }, { status: 404 })
    }

    // Update mapping
    const debitAccount = standardAccounts.find(a => a.code === body.debitAccountCode)
    const creditAccount = standardAccounts.find(a => a.code === body.creditAccountCode)

    accountMappings[mappingIndex] = {
      ...accountMappings[mappingIndex],
      debitAccountCode: body.debitAccountCode || accountMappings[mappingIndex].debitAccountCode,
      debitAccountName: debitAccount?.name || accountMappings[mappingIndex].debitAccountName,
      creditAccountCode: body.creditAccountCode || accountMappings[mappingIndex].creditAccountCode,
      creditAccountName: creditAccount?.name || accountMappings[mappingIndex].creditAccountName,
      vatApplicable: body.vatApplicable ?? accountMappings[mappingIndex].vatApplicable,
      vatCode: body.vatCode ?? accountMappings[mappingIndex].vatCode,
      costCenter: body.costCenter ?? accountMappings[mappingIndex].costCenter,
      isActive: body.isActive ?? accountMappings[mappingIndex].isActive,
    }

    return NextResponse.json({ 
      mapping: accountMappings[mappingIndex],
      message: 'Account mapping updated successfully'
    })
  } catch (error) {
    console.error('Error updating account mapping:', error)
    return NextResponse.json({ error: 'Failed to update account mapping' }, { status: 500 })
  }
}
