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

// Default account mappings for event types
const eventMappings: Record<string, { debitAccount: string; creditAccount: string }> = {
  stock_receipt: { debitAccount: '1100', creditAccount: '2120' },
  stock_sale: { debitAccount: '5000', creditAccount: '1100' },
  stock_adjustment_pos: { debitAccount: '1100', creditAccount: '4200' },
  stock_adjustment_neg: { debitAccount: '5110', creditAccount: '1100' },
  stocktake_variance_pos: { debitAccount: '1100', creditAccount: '4200' },
  stocktake_variance_neg: { debitAccount: '5120', creditAccount: '1100' },
  stock_transfer: { debitAccount: '1100', creditAccount: '1100' },
}

// In-memory store
const journalStore: JournalEntry[] = []

// POST /api/merchant-os/accounting/journal-entries/auto - Trigger auto-journal for event
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.eventType || !body.amount || !body.sourceReference) {
      return NextResponse.json({ 
        error: 'eventType, amount, and sourceReference are required' 
      }, { status: 400 })
    }

    const { eventType, amount, sourceReference, description, productName, quantity } = body

    let mapping = eventMappings[eventType]
    
    if (eventType === 'stock_adjustment') {
      mapping = amount >= 0 ? eventMappings.stock_adjustment_pos : eventMappings.stock_adjustment_neg
    } else if (eventType === 'stocktake_variance') {
      mapping = amount >= 0 ? eventMappings.stocktake_variance_pos : eventMappings.stocktake_variance_neg
    }

    if (!mapping) {
      return NextResponse.json({ error: `No mapping found for event type: ${eventType}` }, { status: 400 })
    }

    const absAmount = Math.abs(amount)
    const reference = `JE-2026-${String(Date.now()).slice(-6)}`

    let lines: JournalEntryLine[] = []

    switch (eventType) {
      case 'stock_receipt':
        lines = [
          {
            accountCode: mapping.debitAccount,
            accountName: accounts[mapping.debitAccount] || 'Inventory Asset',
            debit: absAmount,
            credit: 0,
            description: `Stock received - ${productName || 'Multiple items'}`
          },
          {
            accountCode: mapping.creditAccount,
            accountName: accounts[mapping.creditAccount] || 'GRN Clearing',
            debit: 0,
            credit: absAmount,
            description: `Amount owed - ${sourceReference}`
          }
        ]
        break

      case 'stock_sale':
        lines = [
          {
            accountCode: mapping.debitAccount,
            accountName: accounts[mapping.debitAccount] || 'Cost of Goods Sold',
            debit: absAmount,
            credit: 0,
            description: `COGS for sales`
          },
          {
            accountCode: mapping.creditAccount,
            accountName: accounts[mapping.creditAccount] || 'Inventory Asset',
            debit: 0,
            credit: absAmount,
            description: `Inventory reduction - ${quantity || 0} units`
          }
        ]
        break

      case 'stock_adjustment':
      case 'stocktake_variance':
        if (amount >= 0) {
          lines = [
            {
              accountCode: '1100',
              accountName: 'Inventory Asset',
              debit: absAmount,
              credit: 0,
              description: `${eventType === 'stocktake_variance' ? 'Stocktake' : 'Stock'} variance gain`
            },
            {
              accountCode: '4200',
              accountName: 'Inventory Adjustment Income',
              debit: 0,
              credit: absAmount,
              description: `From ${sourceReference}`
            }
          ]
        } else {
          lines = [
            {
              accountCode: eventType === 'stocktake_variance' ? '5120' : '5110',
              accountName: eventType === 'stocktake_variance' ? 'Inventory Loss' : 'Shrinkage Expense',
              debit: absAmount,
              credit: 0,
              description: `${eventType === 'stocktake_variance' ? 'Stocktake' : 'Stock'} variance loss`
            },
            {
              accountCode: '1100',
              accountName: 'Inventory Asset',
              debit: 0,
              credit: absAmount,
              description: `From ${sourceReference}`
            }
          ]
        }
        break

      case 'stock_transfer':
        lines = [
          {
            accountCode: mapping.debitAccount,
            accountName: 'Inventory Asset (Destination)',
            debit: absAmount,
            credit: 0,
            description: `Stock transferred in`
          },
          {
            accountCode: mapping.creditAccount,
            accountName: 'Inventory Asset (Source)',
            debit: 0,
            credit: absAmount,
            description: `Stock transferred out`
          }
        ]
        break

      default:
        return NextResponse.json({ error: `Unknown event type: ${eventType}` }, { status: 400 })
    }

    const journalEntry: JournalEntry = {
      id: `JE-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      reference,
      description: description || `${eventType.replace('_', ' ')} - ${sourceReference}`,
      eventType,
      lines,
      totalDebit: absAmount,
      totalCredit: absAmount,
      status: 'pending',
      createdBy: 'Auto-Journal',
      createdAt: new Date().toISOString(),
      sourceReference
    }

    journalStore.unshift(journalEntry)

    return NextResponse.json({ 
      journalEntry,
      message: `Auto-journal entry created for ${eventType}` 
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating auto-journal entry:', error)
    return NextResponse.json({ error: 'Failed to create auto-journal entry' }, { status: 500 })
  }
}
