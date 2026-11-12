import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET: List trust transactions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const practiceId = searchParams.get('practiceId')
    const trustAccountId = searchParams.get('trustAccountId')
    const clientId = searchParams.get('clientId')
    const matterId = searchParams.get('matterId')
    const type = searchParams.get('type')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Build where clause for trust account
    let trustAccountWhere: Record<string, unknown> = {}
    if (practiceId) {
      trustAccountWhere.practiceId = practiceId
    }
    if (trustAccountId) {
      trustAccountWhere.id = trustAccountId
    }

    // Get trust account(s)
    const trustAccounts = await db.trustAccount.findMany({
      where: trustAccountWhere,
      include: {
        practice: {
          select: {
            id: true,
            name: true,
            council: true,
          }
        }
      }
    })

    if (trustAccounts.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        accounts: [],
        balance: 0,
        summary: {
          totalDeposits: 0,
          totalWithdrawals: 0,
          transactionCount: 0,
        }
      })
    }

    // Build transaction filter
    const transactionWhere: Record<string, unknown> = {
      trustAccountId: { in: trustAccounts.map(a => a.id) }
    }
    if (clientId) {
      transactionWhere.clientId = clientId
    }
    if (matterId) {
      transactionWhere.matterId = matterId
    }
    if (type) {
      transactionWhere.type = type
    }
    if (startDate || endDate) {
      transactionWhere.date = {}
      if (startDate) {
        transactionWhere.date = { ...transactionWhere.date as object, gte: new Date(startDate) }
      }
      if (endDate) {
        transactionWhere.date = { ...transactionWhere.date as object, lte: new Date(endDate) }
      }
    }

    // Get transactions
    const transactions = await db.trustTransaction.findMany({
      where: transactionWhere,
      include: {
        trustAccount: {
          select: {
            id: true,
            accountName: true,
            bankName: true,
            accountNumber: true,
          }
        }
      },
      orderBy: { date: 'desc' }
    })

    // Calculate balances and summary
    const totalDeposits = transactions
      .filter(t => t.type === 'deposit' || t.type === 'receipt')
      .reduce((sum, t) => sum + t.amount, 0)

    const totalWithdrawals = transactions
      .filter(t => t.type === 'withdrawal' || t.type === 'payment' || t.type === 'transfer')
      .reduce((sum, t) => sum + t.amount, 0)

    const calculatedBalance = totalDeposits - totalWithdrawals

    // Get recorded balance from trust account
    const recordedBalance = trustAccounts.reduce((sum, a) => sum + a.balance, 0)

    // Add running balance to transactions
    let runningBalance = recordedBalance
    const transactionsWithBalance = transactions.map(t => {
      if (t.type === 'deposit' || t.type === 'receipt') {
        runningBalance += t.amount
      } else {
        runningBalance -= t.amount
      }
      return {
        ...t,
        runningBalance,
      }
    }).reverse() // Reverse to show oldest first for running balance, then reverse again

    // Re-reverse for display (newest first)
    const finalTransactions = transactionsWithBalance.reverse()

    return NextResponse.json({
      success: true,
      data: finalTransactions,
      accounts: trustAccounts.map(a => ({
        id: a.id,
        accountName: a.accountName,
        bankName: a.bankName,
        accountNumber: a.accountNumber,
        balance: a.balance,
        lastReconciliation: a.lastReconciliation,
      })),
      balance: recordedBalance,
      calculatedBalance,
      summary: {
        totalDeposits,
        totalWithdrawals,
        netMovement: totalDeposits - totalWithdrawals,
        transactionCount: transactions.length,
        depositsCount: transactions.filter(t => t.type === 'deposit' || t.type === 'receipt').length,
        withdrawalsCount: transactions.filter(t => t.type === 'withdrawal' || t.type === 'payment' || t.type === 'transfer').length,
      }
    })
  } catch (error) {
    console.error('Error fetching trust transactions:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch trust transactions' },
      { status: 500 }
    )
  }
}

// POST: Add trust transaction
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    const requiredFields = ['trustAccountId', 'type', 'amount']
    for (const field of requiredFields) {
      if (body[field] === undefined || body[field] === null) {
        return NextResponse.json(
          { success: false, error: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
    }

    // Validate transaction type
    const validTypes = ['deposit', 'withdrawal', 'receipt', 'payment', 'transfer', 'adjustment']
    if (!validTypes.includes(body.type)) {
      return NextResponse.json(
        { success: false, error: `Invalid transaction type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Verify trust account exists
    const trustAccount = await db.trustAccount.findUnique({
      where: { id: body.trustAccountId },
      include: {
        practice: true,
      }
    })

    if (!trustAccount) {
      return NextResponse.json(
        { success: false, error: 'Trust account not found' },
        { status: 404 }
      )
    }

    // Validate client and matter if provided
    if (body.clientId) {
      const client = await db.professionalClient.findFirst({
        where: {
          id: body.clientId,
          practiceId: trustAccount.practiceId
        }
      })
      if (!client) {
        return NextResponse.json(
          { success: false, error: 'Client not found or does not belong to this practice' },
          { status: 404 }
        )
      }
    }

    if (body.matterId) {
      const matter = await db.professionalMatter.findFirst({
        where: {
          id: body.matterId,
          practiceId: trustAccount.practiceId
        }
      })
      if (!matter) {
        return NextResponse.json(
          { success: false, error: 'Matter not found or does not belong to this practice' },
          { status: 404 }
        )
      }
    }

    // Check for sufficient balance for withdrawals
    const isWithdrawal = ['withdrawal', 'payment', 'transfer'].includes(body.type)
    if (isWithdrawal && body.amount > trustAccount.balance) {
      return NextResponse.json(
        { success: false, error: 'Insufficient trust account balance for this withdrawal' },
        { status: 400 }
      )
    }

    // Create the transaction
    const transaction = await db.trustTransaction.create({
      data: {
        trustAccountId: body.trustAccountId,
        clientId: body.clientId || null,
        matterId: body.matterId || null,
        type: body.type,
        amount: parseFloat(body.amount),
        reference: body.reference || null,
        description: body.description || null,
        date: body.date ? new Date(body.date) : new Date(),
        runningBalance: null, // Will be calculated
      },
      include: {
        trustAccount: {
          select: {
            id: true,
            accountName: true,
            bankName: true,
            accountNumber: true,
          }
        }
      }
    })

    // Update trust account balance
    const balanceChange = isWithdrawal ? -body.amount : body.amount
    const newBalance = trustAccount.balance + balanceChange

    await db.trustAccount.update({
      where: { id: body.trustAccountId },
      data: {
        balance: newBalance,
        updatedAt: new Date()
      }
    })

    // Update client trust balance if client specified
    if (body.clientId) {
      const client = await db.professionalClient.findUnique({
        where: { id: body.clientId }
      })
      if (client) {
        await db.professionalClient.update({
          where: { id: body.clientId },
          data: {
            trustBalance: client.trustBalance + balanceChange,
            updatedAt: new Date()
          }
        })
      }
    }

    // Update transaction with running balance
    await db.trustTransaction.update({
      where: { id: transaction.id },
      data: { runningBalance: newBalance }
    })

    return NextResponse.json({
      success: true,
      data: {
        ...transaction,
        runningBalance: newBalance,
      },
      balance: newBalance,
      message: 'Trust transaction added successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating trust transaction:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create trust transaction' },
      { status: 500 }
    )
  }
}
