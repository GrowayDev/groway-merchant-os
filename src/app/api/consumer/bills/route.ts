import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Bill categories and providers
const BILL_PROVIDERS = {
  electricity: [
    { id: 'citypower', name: 'City Power', logo: '/providers/citypower.png', category: 'electricity' },
    { id: 'eskom', name: 'Eskom', logo: '/providers/eskom.png', category: 'electricity' },
    { id: 'capetown', name: 'City of Cape Town', logo: '/providers/capetown.png', category: 'electricity' },
  ],
  water: [
    { id: 'joburgwater', name: 'Joburg Water', logo: '/providers/joburgwater.png', category: 'water' },
    { id: 'capetown-water', name: 'Cape Town Water', logo: '/providers/capetown.png', category: 'water' },
  ],
  tv: [
    { id: 'dstv', name: 'DStv', logo: '/providers/dstv.png', category: 'tv' },
    { id: 'gotv', name: 'GOtv', logo: '/providers/gotv.png', category: 'tv' },
    { id: 'startimes', name: 'StarTimes', logo: '/providers/startimes.png', category: 'tv' },
  ],
  municipal: [
    { id: 'ekurhuleni', name: 'Ekurhuleni Metro', logo: '/providers/ekurhuleni.png', category: 'municipal' },
    { id: 'tshwane', name: 'City of Tshwane', logo: '/providers/tshwane.png', category: 'municipal' },
    { id: 'ethekwini', name: 'eThekwini Municipality', logo: '/providers/ethekwini.png', category: 'municipal' },
  ],
  insurance: [
    { id: 'outsurance', name: 'OUTsurance', logo: '/providers/outsurance.png', category: 'insurance' },
    { id: 'discovery', name: 'Discovery', logo: '/providers/discovery.png', category: 'insurance' },
    { id: 'oldmutual', name: 'Old Mutual', logo: '/providers/oldmutual.png', category: 'insurance' },
  ],
}

// Ensure bill providers exist in database
async function ensureBillProviders() {
  for (const [category, providers] of Object.entries(BILL_PROVIDERS)) {
    for (const provider of providers) {
      const existing = await db.billProvider.findUnique({
        where: { id: provider.id }
      })
      
      if (!existing) {
        await db.billProvider.create({
          data: {
            id: provider.id,
            name: provider.name,
            category: provider.category,
            logo: provider.logo,
            accountFormat: '^[0-9]{6,12}$',
            accountLabel: 'Account Number',
            minAmount: BigInt(1000), // R10
            maxAmount: BigInt(50000000), // R500,000
            feeCents: BigInt(0),
            processingTime: 'instant',
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date(),
          }
        })
      }
    }
  }
}

// GET - Fetch bill providers and recent payments
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const category = searchParams.get('category')

    // Ensure providers exist
    await ensureBillProviders()

    // If category specified, return providers for that category
    if (category && BILL_PROVIDERS[category as keyof typeof BILL_PROVIDERS]) {
      const providers = await db.billProvider.findMany({
        where: { category, status: 'active' }
      })
      
      return NextResponse.json({
        success: true,
        data: { providers }
      })
    }

    // Return all providers grouped by category
    if (!userId) {
      const allProviders = await db.billProvider.findMany({
        where: { status: 'active' },
        orderBy: { name: 'asc' }
      })
      
      // Group by category
      const grouped = allProviders.reduce((acc, provider) => {
        if (!acc[provider.category]) acc[provider.category] = []
        acc[provider.category].push(provider)
        return acc
      }, {} as Record<string, typeof allProviders>)
      
      return NextResponse.json({
        success: true,
        data: { providers: grouped }
      })
    }

    // Fetch user's recent bill payments
    const recentPayments = await db.billPayment.findMany({
      where: { userId },
      include: { BillProvider: true },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    const allProviders = await db.billProvider.findMany({
      where: { status: 'active' },
      orderBy: { name: 'asc' }
    })

    const grouped = allProviders.reduce((acc, provider) => {
      if (!acc[provider.category]) acc[provider.category] = []
      acc[provider.category].push(provider)
      return acc
    }, {} as Record<string, typeof allProviders>)

    return NextResponse.json({
      success: true,
      data: {
        providers: grouped,
        recentPayments: recentPayments.map(p => ({
          id: p.id,
          provider: p.BillProvider.name,
          category: p.BillProvider.category,
          amountCents: p.amountCents.toString(),
          accountNumber: p.accountNumber,
          status: p.status,
          receiptNumber: p.receiptNumber,
          createdAt: p.createdAt,
          processedAt: p.processedAt
        }))
      }
    })

  } catch (error) {
    console.error('Get bill providers error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get bill providers' },
      { status: 500 }
    )
  }
}

// POST - Pay a bill
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, providerId, accountNumber, accountName, amountCents } = body

    if (!userId || !providerId || !accountNumber || !amountCents) {
      return NextResponse.json(
        { success: false, error: 'User ID, provider, account number, and amount are required' },
        { status: 400 }
      )
    }

    // Validate minimum amount (R10)
    if (BigInt(amountCents) < BigInt(1000)) {
      return NextResponse.json(
        { success: false, error: 'Minimum payment amount is R10' },
        { status: 400 }
      )
    }

    // Get provider
    const provider = await db.billProvider.findUnique({
      where: { id: providerId }
    })

    if (!provider) {
      return NextResponse.json(
        { success: false, error: 'Invalid provider' },
        { status: 400 }
      )
    }

    // Get user and wallet
    const user = await db.consumerUser.findUnique({
      where: { id: userId },
      include: { wallet: true }
    })

    if (!user || !user.wallet) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Check balance
    const amount = BigInt(amountCents)
    const fee = provider.feeCents || BigInt(0)
    const totalDebit = amount + fee

    if (user.wallet.balanceCents < totalDebit) {
      return NextResponse.json(
        { success: false, error: 'Insufficient funds' },
        { status: 400 }
      )
    }

    // Create pending payment
    const payment = await db.billPayment.create({
      data: {
        id: `bp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        userId,
        providerId,
        accountNumber,
        accountName: accountName || '',
        amountCents: amount,
        feeCents: fee,
        status: 'processing',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    })

    // Deduct from wallet
    await db.consumerWallet.update({
      where: { userId },
      data: {
        balanceCents: { decrement: totalDebit }
      }
    })

    // Create transaction record
    const txRef = `BILL${Date.now()}`
    await db.consumerTransaction.create({
      data: {
        id: `ctx-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        idempotencyKey: `bill-${payment.id}`,
        userId,
        transactionType: 'bill_payment',
        direction: 'debit',
        amountCents: totalDebit,
        feeCents: fee,
        netAmountCents: totalDebit,
        currency: 'ZAR',
        status: 'pending',
        description: `${provider.name} - ${accountNumber}`,
        reference: txRef,
        category: 'bills',
        counterpartyName: provider.name,
        paymentMethod: 'wallet',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    })

    // Simulate processing (in production, call biller API)
    // For demo, auto-complete after a short delay
    setTimeout(async () => {
      try {
        const receiptNumber = `RCP${Date.now()}`
        await db.billPayment.update({
          where: { id: payment.id },
          data: {
            status: 'completed',
            receiptNumber,
            processedAt: new Date(),
            updatedAt: new Date(),
          }
        })
      } catch (err) {
        console.error('Failed to complete bill payment:', err)
      }
    }, 2000)

    return NextResponse.json({
      success: true,
      message: 'Bill payment initiated successfully',
      data: {
        id: payment.id,
        amountCents: amount.toString(),
        feeCents: fee.toString(),
        status: 'processing',
        estimatedDelivery: provider.processingTime === 'instant' ? 'Immediate' : '24 hours'
      }
    })

  } catch (error) {
    console.error('Pay bill error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process bill payment' },
      { status: 500 }
    )
  }
}
