import { NextRequest, NextResponse } from 'next/server'
import { checkPermission } from '@/lib/permissions'
import { InventoryAccountingService } from '@/services/inventory/inventory-accounting-service'

/**
 * GET /api/inventory/journal-entries
 * Get inventory-related journal entries
 * 
 * Query params:
 * - merchantId: required
 * - startDate: optional
 * - endDate: optional
 * - type: optional (purchase, sale, adjustment, transfer, stocktake, write_off)
 */
export async function GET(request: NextRequest) {
  const permissionCheck = await checkPermission(request, 'can_view_accounting')
  
  if (!permissionCheck.allowed) {
    return permissionCheck.error
  }

  try {
    const { searchParams } = new URL(request.url)
    const merchantId = searchParams.get('merchantId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const type = searchParams.get('type')

    if (!merchantId) {
      return NextResponse.json(
        { error: 'merchantId is required' },
        { status: 400 }
      )
    }

    const entries = await InventoryAccountingService.getJournalEntries(
      merchantId,
      {
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        type: type || undefined,
      }
    )

    // Calculate summary metrics
    const metrics = {
      totalEntries: entries.length,
      totalAmount: entries.reduce((sum, e) => sum + e.amount, 0),
      byType: {
        purchase: entries.filter(e => e.type === 'purchase').reduce((sum, e) => sum + e.amount, 0),
        sale: entries.filter(e => e.type === 'sale').reduce((sum, e) => sum + e.amount, 0),
        adjustment: entries.filter(e => e.type === 'adjustment').reduce((sum, e) => sum + e.amount, 0),
        transfer: entries.filter(e => e.type === 'transfer').reduce((sum, e) => sum + e.amount, 0),
        stocktake: entries.filter(e => e.type === 'stocktake').reduce((sum, e) => sum + e.amount, 0),
        write_off: entries.filter(e => e.type === 'write_off').reduce((sum, e) => sum + e.amount, 0),
      },
      entriesByType: {
        purchase: entries.filter(e => e.type === 'purchase').length,
        sale: entries.filter(e => e.type === 'sale').length,
        adjustment: entries.filter(e => e.type === 'adjustment').length,
        transfer: entries.filter(e => e.type === 'transfer').length,
        stocktake: entries.filter(e => e.type === 'stocktake').length,
        write_off: entries.filter(e => e.type === 'write_off').length,
      },
    }

    return NextResponse.json({
      success: true,
      data: {
        entries,
        metrics,
      },
    })
  } catch (error) {
    console.error('Get journal entries error:', error)
    return NextResponse.json(
      { error: 'Failed to get journal entries', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/inventory/journal-entries
 * Create a manual journal entry for inventory
 * 
 * Body:
 * - merchantId: required
 * - type: required
 * - referenceType: required
 * - referenceId: required
 * - referenceNumber: required
 * - amount: required
 * - description: required
 */
export async function POST(request: NextRequest) {
  const permissionCheck = await checkPermission(request, 'can_create_journal_entry')
  
  if (!permissionCheck.allowed) {
    return permissionCheck.error
  }

  const session = permissionCheck.session!

  try {
    const body = await request.json()
    const {
      merchantId,
      type,
      referenceType,
      referenceId,
      referenceNumber,
      amount,
      description,
      customAccounts,
    } = body

    if (!merchantId || !type || !amount || !description) {
      return NextResponse.json(
        { error: 'merchantId, type, amount, and description are required' },
        { status: 400 }
      )
    }

    const result = await InventoryAccountingService.createJournalEntry({
      merchantId,
      type,
      referenceType: referenceType || 'manual',
      referenceId: referenceId || 'manual',
      referenceNumber: referenceNumber || `MAN-${Date.now()}`,
      amount,
      description,
      performedBy: session.userId,
      performedByName: session.user?.name || 'System',
      customAccounts,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to create journal entry' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Journal entry created',
      data: { entryId: result.entryId },
    }, { status: 201 })
  } catch (error) {
    console.error('Create journal entry error:', error)
    return NextResponse.json(
      { error: 'Failed to create journal entry', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
