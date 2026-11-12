import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getAuthContext, unauthorizedResponse, forbiddenResponse } from '@/lib/auth-context'

const prisma = new PrismaClient()

// GET /api/merchant-os/banking - Get bank accounts and transactions
// Security: Requires authentication. merchantId must match authenticated user's merchant.
export async function GET(request: NextRequest) {
  // Authentication check
  const context = await getAuthContext(request)
  if (!context) {
    return unauthorizedResponse('Authentication required')
  }

  try {
    const { searchParams } = new URL(request.url)
    const queryMerchantId = searchParams.get('merchantId')
    const accountId = searchParams.get('accountId')
    const type = searchParams.get('type') || 'accounts'
    
    // Security: Validate merchantId
    let merchantId: string
    if ('merchantId' in context) {
      if (queryMerchantId && queryMerchantId !== context.merchantId) {
        if (context.role !== 'platform_admin' && context.role !== 'super_admin') {
          return forbiddenResponse('Access denied to this merchant')
        }
        merchantId = queryMerchantId
      } else {
        merchantId = context.merchantId
      }
    } else {
      // Consumer or admin without merchant context - require explicit merchantId
      if (!queryMerchantId) {
        return NextResponse.json({ error: 'merchantId is required' }, { status: 400 })
      }
      merchantId = queryMerchantId
    }
    
    switch (type) {
      case 'accounts':
        const accounts = await prisma.bankAccountIntegration.findMany({
          where: { merchantId },
          include: {
            _count: {
              select: { transactions: true },
            },
          },
        })
        return NextResponse.json({ accounts })
        
      case 'transactions':
        if (!accountId) {
          return NextResponse.json({ error: 'accountId is required' }, { status: 400 })
        }
        
        const transactions = await prisma.bankTransactionImport.findMany({
          where: { bankAccountId: accountId },
          orderBy: { transactionDate: 'desc' },
          take: 100,
        })
        
        return NextResponse.json({ transactions })
        
      case 'unreconciled':
        const unreconciled = await prisma.bankTransactionImport.findMany({
          where: {
            bankAccount: { merchantId },
            reconciled: false,
          },
          orderBy: { transactionDate: 'desc' },
          take: 50,
          include: {
            bankAccount: {
              select: { bankName: true, accountNumber: true },
            },
          },
        })
        
        return NextResponse.json({ unreconciled })
        
      case 'balance':
        const bankAccounts = await prisma.bankAccountIntegration.findMany({
          where: { merchantId, status: 'verified' },
        })
        
        // In production, fetch real balances from bank APIs
        const balances = bankAccounts.map(account => ({
          accountId: account.id,
          bankName: account.bankName,
          accountNumber: `****${account.accountNumber.slice(-4)}`,
          balance: Math.random() * 50000 + 5000, // Simulated balance
          lastUpdated: new Date().toISOString(),
        }))
        
        return NextResponse.json({ balances })
        
      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error fetching banking data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch banking data' },
      { status: 500 }
    )
  }
}

// POST /api/merchant-os/banking - Configure or sync bank accounts
// Security: Requires authentication. merchantId must match authenticated user's merchant.
export async function POST(request: NextRequest) {
  // Authentication check
  const context = await getAuthContext(request)
  if (!context) {
    return unauthorizedResponse('Authentication required')
  }

  try {
    const body = await request.json()
    const { action, merchantId: bodyMerchantId } = body
    
    // Security: Validate merchantId
    let merchantId: string
    if ('merchantId' in context) {
      if (bodyMerchantId && bodyMerchantId !== context.merchantId) {
        if (context.role !== 'platform_admin' && context.role !== 'super_admin') {
          return forbiddenResponse('Access denied to this merchant')
        }
        merchantId = bodyMerchantId
      } else {
        merchantId = context.merchantId
      }
    } else {
      if (!bodyMerchantId) {
        return NextResponse.json({ error: 'merchantId is required' }, { status: 400 })
      }
      merchantId = bodyMerchantId
    }
    
    switch (action) {
      case 'connect':
        return await connectBankAccount(body, merchantId)
      case 'sync':
        return await syncBankAccount(body, merchantId)
      case 'reconcile':
        return await reconcileTransaction(body)
      case 'import':
        return await importTransactions(body)
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error processing banking request:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}

// Connect bank account
async function connectBankAccount(body: any, merchantId: string) {
  const { bankName, bankCode, accountNumber, accountType, accountHolderName } = body
  
  // Check if already connected
  const existing = await prisma.bankAccountIntegration.findFirst({
    where: { merchantId, bankName, accountNumber },
  })
  
  if (existing) {
    return NextResponse.json({ 
      error: 'Bank account already connected',
      accountId: existing.id,
    }, { status: 400 })
  }
  
  // Create integration config
  const integration = await prisma.integrationConfig.create({
    data: {
      merchantId,
      integrationType: bankName.toLowerCase().replace(' ', '_'),
      integrationName: `${bankName} Bank Feed`,
      provider: bankName,
      status: 'pending',
    },
  })
  
  // Create bank account
  const account = await prisma.bankAccountIntegration.create({
    data: {
      merchantId,
      bankName,
      bankCode,
      accountNumber,
      accountType,
      accountHolderName,
      status: 'pending',
    },
  })
  
  // Simulate bank verification
  setTimeout(async () => {
    await prisma.bankAccountIntegration.update({
      where: { id: account.id },
      data: { status: 'verified' },
    })
    
    await prisma.integrationConfig.update({
      where: { id: integration.id },
      data: { status: 'connected' },
    })
  }, 5000)
  
  return NextResponse.json({
    success: true,
    account,
    integration,
    message: 'Bank account connection initiated. Verification typically takes 24-48 hours.',
  })
}

// Sync bank account transactions
async function syncBankAccount(body: any, merchantId: string) {
  const { accountId, forceSync } = body
  
  const account = await prisma.bankAccountIntegration.findFirst({
    where: { id: accountId, merchantId },
  })
  
  if (!account) {
    return NextResponse.json({ error: 'Account not found' }, { status: 404 })
  }
  
  // Check if recently synced
  if (!forceSync && account.lastSyncAt) {
    const hoursSinceSync = (Date.now() - account.lastSyncAt.getTime()) / (1000 * 60 * 60)
    if (hoursSinceSync < 1) {
      return NextResponse.json({
        success: true,
        message: 'Account synced recently',
        lastSync: account.lastSyncAt,
      })
    }
  }
  
  // Simulate fetching transactions from bank API
  const transactions = await fetchBankTransactions(account)
  
  // Import transactions
  let newCount = 0
  let duplicateCount = 0
  
  for (const tx of transactions) {
    // Check for duplicates
    const existing = await prisma.bankTransactionImport.findUnique({
      where: { uniqueId: tx.uniqueId },
    })
    
    if (!existing) {
      await prisma.bankTransactionImport.create({
        data: {
          bankAccountId: account.id,
          transactionDate: tx.date,
          valueDate: tx.valueDate,
          description: tx.description,
          amount: tx.amount,
          currency: 'ZAR',
          transactionType: tx.amount > 0 ? 'credit' : 'debit',
          reference: tx.reference,
          counterparty: tx.counterparty,
          uniqueId: tx.uniqueId,
          reconciled: false,
        },
      })
      newCount++
    } else {
      duplicateCount++
    }
  }
  
  // Update sync time
  await prisma.bankAccountIntegration.update({
    where: { id: account.id },
    data: { lastSyncAt: new Date() },
  })
  
  return NextResponse.json({
    success: true,
    newTransactions: newCount,
    duplicateTransactions: duplicateCount,
    totalFetched: transactions.length,
    syncedAt: new Date().toISOString(),
  })
}

// Simulate fetching transactions from bank
async function fetchBankTransactions(account: any) {
  // In production, this would call actual bank APIs:
  // - FNB: https://developer.fnb.co.za
  // - Capitec: Business Online Banking API
  // - Standard Bank: SBIB API
  // - Absa: Absa Business Online API
  
  await new Promise(resolve => setTimeout(resolve, 500))
  
  // Generate mock transactions
  const transactions = []
  const today = new Date()
  
  for (let i = 0; i < 20; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() - Math.floor(Math.random() * 30))
    
    const isCredit = Math.random() > 0.6
    const amount = isCredit 
      ? Math.floor(Math.random() * 5000) + 500
      : -(Math.floor(Math.random() * 2000) + 100)
    
    transactions.push({
      date: date.toISOString().split('T')[0],
      valueDate: date.toISOString().split('T')[0],
      description: isCredit 
        ? 'EFT Credit - Customer Payment'
        : 'Debit Order - Supplier Payment',
      amount,
      reference: `REF${Date.now()}${i}`,
      counterparty: isCredit ? 'Various Customers' : 'Various Suppliers',
      uniqueId: `${account.bankCode}-${date.getTime()}-${i}`,
    })
  }
  
  return transactions
}

// Reconcile a transaction
async function reconcileTransaction(body: any) {
  const { transactionId, reconcileToType, reconcileToId, notes, userId } = body
  
  const transaction = await prisma.bankTransactionImport.findUnique({
    where: { id: transactionId },
  })
  
  if (!transaction) {
    return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
  }
  
  if (transaction.reconciled) {
    return NextResponse.json({ error: 'Transaction already reconciled' }, { status: 400 })
  }
  
  // Update transaction
  const updated = await prisma.bankTransactionImport.update({
    where: { id: transactionId },
    data: {
      reconciled: true,
      reconciledAt: new Date(),
      reconciledBy: userId,
      reconciledToType: reconcileToType,
      reconciledToId: reconcileToId,
    },
  })
  
  // If reconciling to a sale, link it
  if (reconcileToType === 'sale') {
    const sale = await prisma.sale.findUnique({
      where: { id: reconcileToId },
    })
    
    if (sale) {
      await prisma.sale.update({
        where: { id: reconcileToId },
        data: {
          paymentStatus: 'completed',
          paymentReference: transaction.uniqueId,
        },
      })
    }
  }
  
  return NextResponse.json({
    success: true,
    transaction: updated,
  })
}

// Bulk import transactions (for CSV upload)
async function importTransactions(body: any) {
  const { accountId, transactions: csvTransactions, format } = body
  
  const account = await prisma.bankAccountIntegration.findUnique({
    where: { id: accountId },
  })
  
  if (!account) {
    return NextResponse.json({ error: 'Account not found' }, { status: 404 })
  }
  
  let imported = 0
  let duplicates = 0
  const errors: string[] = []
  
  for (const tx of csvTransactions) {
    try {
      // Generate unique ID based on transaction details
      const uniqueId = `${account.bankCode}-${tx.date}-${tx.amount}-${tx.reference || Math.random().toString(36).substr(2, 8)}`
      
      const existing = await prisma.bankTransactionImport.findUnique({
        where: { uniqueId },
      })
      
      if (!existing) {
        await prisma.bankTransactionImport.create({
          data: {
            bankAccountId: account.id,
            transactionDate: tx.date,
            valueDate: tx.valueDate || tx.date,
            description: tx.description,
            amount: parseFloat(tx.amount),
            currency: 'ZAR',
            transactionType: parseFloat(tx.amount) > 0 ? 'credit' : 'debit',
            reference: tx.reference,
            counterparty: tx.counterparty,
            uniqueId,
            reconciled: false,
          },
        })
        imported++
      } else {
        duplicates++
      }
    } catch (error) {
      errors.push(`Row ${csvTransactions.indexOf(tx) + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
  
  return NextResponse.json({
    success: true,
    imported,
    duplicates,
    errors,
    totalProcessed: csvTransactions.length,
  })
}
