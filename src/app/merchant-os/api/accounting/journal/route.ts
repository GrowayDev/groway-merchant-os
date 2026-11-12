import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { randomUUID } from 'crypto'
import { getMerchantIdWithDevFallback, requireAuth } from '@/lib/auth-context'

// Helper to generate entry number
async function generateEntryNumber(): Promise<string> {
  const today = new Date()
  const prefix = `JE-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`
  
  // Get count of entries today
  const todayStart = new Date(today.setHours(0, 0, 0, 0))
  const todayEnd = new Date(today.setHours(23, 59, 59, 999))
  
  const count = await db.journalEntry.count({
    where: {
      createdAt: {
        gte: todayStart,
        lte: todayEnd,
      },
    },
  })
  
  return `${prefix}-${String(count + 1).padStart(4, '0')}`
}

// GET /api/accounting/journal - List all journal entries
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
    const status = searchParams.get('status')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: any = { merchantId }
    
    if (status) {
      where.status = status
    }
    
    if (startDate && endDate) {
      where.entryDate = {
        gte: startDate,
        lte: endDate
      }
    }

    const entries = await db.journalEntry.findMany({
      where,
      include: {
        JournalEntryLine: {
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Format response
    const formattedEntries = entries.map(entry => ({
      id: entry.id,
      entryNumber: entry.entryNumber,
      date: entry.entryDate,
      reference: entry.reference,
      description: entry.description,
      lines: entry.JournalEntryLine.map(line => ({
        id: line.id,
        accountId: line.accountCode,
        accountName: line.accountName,
        accountCode: line.accountCode,
        debit: line.debit,
        credit: line.credit,
        description: line.lineDescription
      })),
      totalDebit: entry.totalDebit,
      totalCredit: entry.totalCredit,
      status: entry.status,
      createdBy: entry.createdBy,
      createdAt: entry.createdAt.toISOString(),
      updatedAt: entry.updatedAt.toISOString(),
      merchantId: entry.merchantId
    }))

    return NextResponse.json({ 
      success: true,
      journalEntries: formattedEntries 
    })
  } catch (error) {
    console.error('Error fetching journal entries:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Failed to fetch journal entries' 
    }, { status: 500 })
  }
}

// POST /api/accounting/journal - Create a new journal entry
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const auth = requireAuth(request)
    if (auth.error) return auth.error
    const merchantId = auth.context.merchantId
    
    const body = await request.json()

    // Validate that debits equal credits
    const lines = body.lines || []
    const totalDebit = lines.reduce((s: number, l: { debit: number }) => s + (l.debit || 0), 0)
    const totalCredit = lines.reduce((s: number, l: { credit: number }) => s + (l.credit || 0), 0)

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return NextResponse.json({ 
        success: false,
        error: 'Journal entry must balance (Debits must equal Credits)' 
      }, { status: 400 })
    }

    // Generate entry number
    const entryNumber = await generateEntryNumber()

    // Create journal entry with lines
    const entry = await db.journalEntry.create({
      data: {
        id: randomUUID(),
        entryNumber,
        merchantId,
        entryDate: body.date || new Date().toISOString().split('T')[0],
        description: body.description || '',
        reference: body.reference || null,
        sourceType: body.sourceType || null,
        sourceId: body.sourceId || null,
        totalDebit,
        totalCredit,
        status: body.status || 'draft',
        createdBy: body.createdBy || 'System',
        notes: body.notes || null,
        updatedAt: new Date(),
        JournalEntryLine: {
          create: lines.map((line: { accountId: string; accountName: string; accountCode: string; debit: number; credit: number; description?: string }) => ({
            id: randomUUID(),
            accountCode: line.accountCode || line.accountId,
            accountName: line.accountName,
            debit: line.debit || 0,
            credit: line.credit || 0,
            lineDescription: line.description || null
          }))
        }
      },
      include: {
        JournalEntryLine: true
      }
    })

    // Format response
    const formattedEntry = {
      id: entry.id,
      entryNumber: entry.entryNumber,
      date: entry.entryDate,
      reference: entry.reference,
      description: entry.description,
      lines: entry.JournalEntryLine.map(line => ({
        id: line.id,
        accountId: line.accountCode,
        accountName: line.accountName,
        accountCode: line.accountCode,
        debit: line.debit,
        credit: line.credit,
        description: line.lineDescription
      })),
      totalDebit: entry.totalDebit,
      totalCredit: entry.totalCredit,
      status: entry.status,
      createdBy: entry.createdBy,
      createdAt: entry.createdAt.toISOString(),
      updatedAt: entry.updatedAt.toISOString(),
      merchantId: entry.merchantId
    }

    return NextResponse.json({ 
      success: true,
      journalEntry: formattedEntry 
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating journal entry:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Failed to create journal entry' 
    }, { status: 500 })
  }
}
