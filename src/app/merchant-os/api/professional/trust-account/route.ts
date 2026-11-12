import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Helper to get session
async function getSession(request: NextRequest) {
  const sessionToken = request.cookies.get('groway_session')?.value
  if (!sessionToken) return null
  
  try {
    return await db.merchantSession.findFirst({
      where: { 
        token: sessionToken,
        expiresAt: { gt: new Date() }
      },
      include: { user: true, merchant: true },
    })
  } catch {
    return null
  }
}

// GET /api/merchant-os/professional/trust-account - Get trust account entries for merchant
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const accountType = searchParams.get('accountType')
    const transactionType = searchParams.get('transactionType')
    const reconciled = searchParams.get('reconciled')
    const matterReference = searchParams.get('matterReference')

    const where: any = {
      merchantId: session.merchantId,
    }

    if (accountType && accountType !== 'all') {
      where.accountType = accountType
    }

    if (transactionType && transactionType !== 'all') {
      where.transactionType = transactionType
    }

    if (reconciled !== null && reconciled !== 'all') {
      where.reconciled = reconciled === 'true'
    }

    if (matterReference) {
      where.matterReference = matterReference
    }

    const entries = await db.trustAccountEntry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    // Calculate balance and stats
    const currentBalance = entries.length > 0 
      ? entries.reduce((sum, entry) => {
          if (entry.transactionType === 'deposit') {
            return sum + entry.amount
          } else if (entry.transactionType === 'withdrawal') {
            return sum - entry.amount
          }
          return sum
        }, 0)
      : 0

    const stats = {
      totalEntries: entries.length,
      deposits: entries.filter(e => e.transactionType === 'deposit').length,
      withdrawals: entries.filter(e => e.transactionType === 'withdrawal').length,
      transfers: entries.filter(e => e.transactionType === 'transfer').length,
      unreconciled: entries.filter(e => !e.reconciled).length,
      currentBalance,
      totalDeposited: entries
        .filter(e => e.transactionType === 'deposit')
        .reduce((sum, e) => sum + e.amount, 0),
      totalWithdrawn: entries
        .filter(e => e.transactionType === 'withdrawal')
        .reduce((sum, e) => sum + e.amount, 0),
    }

    return NextResponse.json({
      success: true,
      entries,
      stats,
    })
  } catch (error) {
    console.error('Get trust account entries error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch trust account entries' },
      { status: 500 }
    )
  }
}

// POST /api/merchant-os/professional/trust-account - Create new trust account transaction
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      accountName,
      accountType,
      matterReference,
      clientName,
      transactionType,
      amount,
      description,
      reference,
      reconciled = false,
      reconciledDate,
      reconciledBy,
      notes,
    } = body

    // Validation
    if (!accountName || !accountType || !clientName || !transactionType || amount === undefined || !reference) {
      return NextResponse.json(
        { error: 'Account name, account type, client name, transaction type, amount, and reference are required' },
        { status: 400 }
      )
    }

    // Get current balance for this account
    const existingEntries = await db.trustAccountEntry.findMany({
      where: {
        merchantId: session.merchantId,
        accountName,
      },
      orderBy: { createdAt: 'desc' },
    })

    const currentBalance = existingEntries.length > 0
      ? existingEntries[0].balance
      : 0

    // Calculate new balance
    let newBalance = currentBalance
    if (transactionType === 'deposit') {
      newBalance += parseFloat(amount)
    } else if (transactionType === 'withdrawal' || transactionType === 'transfer') {
      newBalance -= parseFloat(amount)
    }

    // Generate unique ID
    const id = `trust_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Create trust account entry
    const entry = await db.trustAccountEntry.create({
      data: {
        id,
        merchantId: session.merchantId,
        accountName,
        accountType,
        matterReference,
        clientName,
        transactionType,
        amount: parseFloat(amount),
        balance: newBalance,
        description,
        reference,
        reconciled,
        reconciledDate,
        reconciledBy: reconciledBy || (reconciled ? session.user.id : null),
        reconciledByName: reconciled ? session.user.name : null,
        createdBy: session.user.id,
        createdByName: session.user.name,
        notes,
      },
    })

    return NextResponse.json({
      success: true,
      entry,
    })
  } catch (error) {
    console.error('Create trust account entry error:', error)
    return NextResponse.json(
      { error: 'Failed to create trust account entry' },
      { status: 500 }
    )
  }
}
