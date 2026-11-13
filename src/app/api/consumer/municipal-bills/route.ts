import { NextRequest } from 'next/server'
import { randomBytes } from 'crypto'
import { db } from '@/lib/db'
import { getUserId, ok, error, parseMoney, serialize } from '../_lib/helpers'

/**
 * /api/consumer/municipal-bills
 *
 * There is no dedicated Prisma model for municipal bills, so we keep a
 * static catalogue of municipalities and persist bill payments as
 * ConsumerTransaction rows with `transactionType = 'bill_payment'`.
 * Bill-specific metadata (municipality, account number, billType) is
 * stored in the `reference`, `description` and `counterparty*` fields.
 */

// Static catalogue of supported municipalities
const MUNICIPAL_PROVIDERS = [
  {
    id: 'coj',
    name: 'City of Johannesburg',
    displayName: 'City of Johannesburg Metropolitan Municipality',
    province: 'Gauteng',
    municipalityType: 'metro',
    accountFormat: '\\d{10}',
    accountLabel: 'Municipal Account Number',
    supportedBillTypes: ['rates', 'water', 'electricity', 'refuse'],
    minAmountCents: 5000,
    maxAmountCents: 50000000,
    feeCents: 0,
    processingTime: 'same_day',
  },
  {
    id: 'cct',
    name: 'City of Cape Town',
    displayName: 'City of Cape Town Metropolitan Municipality',
    province: 'Western Cape',
    municipalityType: 'metro',
    accountFormat: '\\d{9}',
    accountLabel: 'Municipal Account Number',
    supportedBillTypes: ['rates', 'water', 'electricity', 'refuse'],
    minAmountCents: 5000,
    maxAmountCents: 50000000,
    feeCents: 0,
    processingTime: 'same_day',
  },
  {
    id: 'ethekwini',
    name: 'eThekwini',
    displayName: 'eThekwini Metropolitan Municipality',
    province: 'KwaZulu-Natal',
    municipalityType: 'metro',
    accountFormat: '\\d{11}',
    accountLabel: 'Municipal Account Number',
    supportedBillTypes: ['rates', 'water', 'electricity', 'refuse'],
    minAmountCents: 5000,
    maxAmountCents: 50000000,
    feeCents: 0,
    processingTime: 'same_day',
  },
  {
    id: 'tshwane',
    name: 'City of Tshwane',
    displayName: 'City of Tshwane Metropolitan Municipality',
    province: 'Gauteng',
    municipalityType: 'metro',
    accountFormat: '\\d{10}',
    accountLabel: 'Municipal Account Number',
    supportedBillTypes: ['rates', 'water', 'electricity', 'refuse'],
    minAmountCents: 5000,
    maxAmountCents: 50000000,
    feeCents: 0,
    processingTime: 'same_day',
  },
] as const

// GET /api/consumer/municipal-bills
export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request)
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const municipalityId = searchParams.get('municipalityId')
    const accountNumber = searchParams.get('accountNumber')

    // List municipalities
    if (action === 'providers' || !action) {
      return ok({
        success: true,
        data: {
          providers: MUNICIPAL_PROVIDERS.map((p) => ({
            id: p.id,
            name: p.name,
            displayName: p.displayName,
            province: p.province,
            supportedBillTypes: [...p.supportedBillTypes],
            accountLabel: p.accountLabel,
            minAmountCents: p.minAmountCents,
            maxAmountCents: p.maxAmountCents,
          })),
          recentPayments: await getRecentBillPayments(userId),
        },
      })
    }

    // Recent bill payments for the user
    if (action === 'bills') {
      return ok({ success: true, data: await getRecentBillPayments(userId) })
    }

    // Bill lookup - returns a mock bill for the given account
    if (action === 'lookup' && municipalityId && accountNumber) {
      const provider = MUNICIPAL_PROVIDERS.find((p) => p.id === municipalityId)
      if (!provider) {
        return error('Municipality not found', 404)
      }
      const regex = new RegExp(`^${provider.accountFormat}$`)
      if (!regex.test(accountNumber)) {
        return error(`Invalid account number format. Expected ${provider.accountLabel}.`, 400)
      }

      const dueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0]
      const ratesDueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0]

      return ok({
        success: true,
        data: {
          accountNumber,
          accountName: 'THABO MOLEFE',
          municipality: provider.name,
          address: '123 Main Street, Johannesburg, 2001',
          bills: [
            { type: 'electricity', description: 'Electricity - current month', amountCents: 125000, dueDate, status: 'unpaid' },
            { type: 'water', description: 'Water & Sanitation - current month', amountCents: 45000, dueDate, status: 'unpaid' },
            { type: 'rates', description: 'Property Rates - current quarter', amountCents: 89000, dueDate: ratesDueDate, status: 'unpaid' },
            { type: 'refuse', description: 'Refuse Removal - current month', amountCents: 15000, dueDate, status: 'unpaid' },
          ],
          totalOutstandingCents: 274000,
        },
      })
    }

    return ok({ success: true, data: { providers: MUNICIPAL_PROVIDERS } })
  } catch (err) {
    console.error('Municipal bills GET error:', err)
    return error('Failed to fetch municipal bills', 500)
  }
}

// POST /api/consumer/municipal-bills - pay a municipal bill
export async function POST(request: NextRequest) {
  try {
    const userId = getUserId(request)
    const body = await request.json().catch(() => ({} as Record<string, unknown>))

    const municipalityId = body.municipalityId as string | undefined
    const accountNumber = body.accountNumber as string | undefined
    const billType = (body.billType as string) || 'electricity'
    const amountInput = body.amountCents ?? body.amount
    const reference = (body.reference as string | undefined) || `MUNI-${Date.now()}`

    if (!municipalityId || !accountNumber || !amountInput) {
      return error('municipalityId, accountNumber and amountCents are required')
    }

    const provider = MUNICIPAL_PROVIDERS.find((p) => p.id === municipalityId)
    if (!provider) {
      return error('Municipality not found', 404)
    }

    const amount = parseMoney(amountInput as string | number)
    const fee = BigInt(provider.feeCents)
    if (amount < BigInt(provider.minAmountCents) || amount > BigInt(provider.maxAmountCents)) {
      return error(
        `Amount must be between R${provider.minAmountCents / 100} and R${provider.maxAmountCents / 100}`,
        400,
      )
    }

    const idempotencyKey =
      (body.idempotencyKey as string | undefined) || randomBytes(16).toString('hex')

    // Idempotency check
    const existing = await db.consumerTransaction.findUnique({ where: { idempotencyKey } })
    if (existing) {
      return ok({ success: true, data: existing, message: 'Bill payment already processed' })
    }

    const receiptNumber = `RCP-${Date.now().toString(36).toUpperCase()}`

    // Debit the wallet if the user has one.
    const wallet = await db.consumerWallet.findUnique({ where: { userId } })
    if (wallet && wallet.balanceCents < amount + fee) {
      return error('Insufficient funds', 400)
    }

    const tx = await db.$transaction(async (tx) => {
      if (wallet) {
        await tx.consumerWallet.update({
          where: { userId },
          data: {
            balanceCents: { decrement: amount + fee },
            totalSentCents: { increment: amount },
            updatedAt: new Date(),
          },
        })
      }

      return tx.consumerTransaction.create({
        data: {
          id: `tx-${randomBytes(8).toString('hex')}`,
          idempotencyKey,
          userId,
          transactionType: 'bill_payment',
          direction: 'debit',
          amountCents: amount,
          feeCents: fee,
          netAmountCents: amount + fee,
          currency: 'ZAR',
          status: 'completed',
          description: `${provider.name} - ${billType} - ${accountNumber}`,
          reference,
          category: 'utilities',
          counterpartyId: municipalityId,
          counterpartyName: provider.name,
          counterpartyType: 'municipality',
          paymentMethod: 'wallet_balance',
          externalRef: receiptNumber,
          completedAt: new Date(),
          updatedAt: new Date(),
        },
      })
    })

    return ok(
      {
        success: true,
        data: serialize(tx),
        message: 'Municipal bill paid successfully',
        receiptNumber,
      },
      201,
    )
  } catch (err) {
    console.error('Municipal bill payment error:', err)
    return error('Failed to process municipal bill payment', 500)
  }
}

// Helper: fetch recent bill payments for a user
async function getRecentBillPayments(userId: string) {
  const payments = await db.consumerTransaction.findMany({
    where: { userId, transactionType: 'bill_payment' },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })
  return payments.map((p) => ({
    id: p.id,
    reference: p.reference,
    municipalityName: p.counterpartyName,
    accountNumber: p.description?.split(' - ').pop() ?? null,
    billType: p.description?.split(' - ')[1] ?? null,
    amountCents: p.amountCents,
    feeCents: p.feeCents,
    totalCents: p.netAmountCents,
    receiptNumber: p.externalRef,
    status: p.status,
    processedAt: p.completedAt,
    createdAt: p.createdAt,
  }))
}
