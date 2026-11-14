import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getUserId, ok, error, parseMoney, serialize } from '../../_lib/helpers'
import { ensureConsumerUser } from '../../_lib/ensureUser'
import { MUNICIPALITIES, generateReceiptNo } from '@/lib/consumer-wallet/catalog'

/**
 * /api/consumer/bills/municipal
 *
 * Pay a municipal account (rates / water / electricity / refuse) for any
 * of the supported SA metros and Malawi city councils. Unlike prepaid
 * electricity, municipal payments post to an account — no token is issued,
 * just a receipt.
 */

const MIN_AMOUNT_CENTS = BigInt(500) // R5.00
const MAX_AMOUNT_CENTS = BigInt(50_000_000_00) // R500,000.00

function findMunicipality(id: string) {
  return MUNICIPALITIES.find((m) => m.id === id)
}

// GET — list municipalities grouped by country
export async function GET(request: NextRequest) {
  const userId = getUserId(request)
  const grouped: Record<string, typeof MUNICIPALITIES> = { ZA: [], MW: [] }
  for (const m of MUNICIPALITIES) {
    grouped[m.country].push(m)
  }

  let recent: Array<Record<string, unknown>> = []
  try {
    const rows = await db.consumerTransaction.findMany({
      where: {
        userId,
        transactionType: 'bill_payment',
        counterpartyType: 'municipality',
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })
    recent = rows.map((r) => ({
      id: r.id,
      municipality: r.counterpartyName,
      accountNumber: r.meterNumber,
      amountCents: r.amountCents,
      receiptNo: r.externalRef,
      status: r.status,
      createdAt: r.createdAt,
    }))
  } catch {
    // ignore — keep GET resilient
  }

  return ok({
    municipalities: MUNICIPALITIES,
    grouped,
    minAmountCents: MIN_AMOUNT_CENTS.toString(),
    maxAmountCents: MAX_AMOUNT_CENTS.toString(),
    recent,
  })
}

// POST — pay a municipal bill
export async function POST(request: NextRequest) {
  try {
    const userId = await ensureConsumerUser(getUserId(request))
    const body = await request.json().catch(() => ({} as Record<string, unknown>))

    const municipalityId = (body.municipalityId as string | undefined)?.trim()
    const accountNumber = (body.accountNumber as string | undefined)?.trim() ?? ''
    const amountInput = body.amountCents ?? body.amount
    const billType = (body.billType as string | undefined) || 'municipal'

    if (!municipalityId) return error('municipalityId is required')
    if (!accountNumber) return error('accountNumber is required')
    if (!amountInput) return error('amount (cents) is required')

    const municipality = findMunicipality(municipalityId)
    if (!municipality) {
      return error(`Unknown municipality: ${municipalityId}`, 404)
    }

    if (accountNumber.length < 5 || accountNumber.length > 30) {
      return error('Account number must be between 5 and 30 characters', 400)
    }

    const amount = parseMoney(amountInput as string | number)
    if (amount < MIN_AMOUNT_CENTS) {
      return error(`Minimum municipal payment is R${Number(MIN_AMOUNT_CENTS) / 100}`, 400)
    }
    if (amount > MAX_AMOUNT_CENTS) {
      return error(`Maximum municipal payment is R${Number(MAX_AMOUNT_CENTS) / 100}`, 400)
    }

    const idempotencyKey =
      (body.idempotencyKey as string | undefined) ||
      `muni-${municipalityId}-${accountNumber}-${amount.toString()}-${Date.now()}`

    const existing = await db.consumerTransaction.findUnique({ where: { idempotencyKey } })
    if (existing) {
      return ok({
        success: true,
        data: serialize(existing),
        message: 'Municipal payment already processed',
      })
    }

    const receiptNo = generateReceiptNo('MUN')

    const tx = await db.consumerTransaction.create({
      data: {
        id: `tx-muni-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
        idempotencyKey,
        userId,
        transactionType: 'bill_payment',
        direction: 'debit',
        amountCents: amount,
        feeCents: BigInt(0),
        netAmountCents: amount,
        currency: municipality.country === 'MW' ? 'MWK' : 'ZAR',
        status: 'completed',
        description: `${municipality.name} - ${billType} - ${accountNumber}`,
        reference: receiptNo,
        category: 'utilities',
        counterpartyId: municipality.id,
        counterpartyName: municipality.name,
        counterpartyType: 'municipality',
        paymentMethod: 'wallet_balance',
        meterNumber: accountNumber, // reuse as the account reference
        externalRef: receiptNo,
        completedAt: new Date(),
        updatedAt: new Date(),
      },
    })

    // Best-effort wallet debit
    try {
      const wallet = await db.consumerWallet.findUnique({ where: { userId } })
      if (wallet && wallet.balanceCents >= amount) {
        await db.consumerWallet.update({
          where: { userId },
          data: {
            balanceCents: { decrement: amount },
            totalSentCents: { increment: amount },
            updatedAt: new Date(),
          },
        })
      }
    } catch {
      // non-fatal
    }

    return ok(
      {
        success: true,
        data: serialize(tx),
        receiptNo,
        accountNumber,
        amountCents: amount.toString(),
        municipality: {
          id: municipality.id,
          name: municipality.name,
          country: municipality.country,
          province: municipality.province,
        },
        billType,
        instructions: [
          `Your payment to ${municipality.name} has been submitted.`,
          'Allow up to 2 business days for the payment to reflect on your municipal account.',
          'Quote the receipt number when querying the payment with the municipality.',
        ],
      },
      201,
    )
  } catch (err) {
    console.error('Municipal bill payment error:', err)
    return error('Failed to process municipal bill payment', 500)
  }
}
