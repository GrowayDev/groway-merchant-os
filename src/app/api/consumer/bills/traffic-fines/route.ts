import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getUserId, ok, error, parseMoney, serialize } from '../../_lib/helpers'
import { ensureConsumerUser } from '../../_lib/ensureUser'
import {
  TRAFFIC_FINE_AUTHORITIES,
  generateReceiptNo,
} from '@/lib/consumer-wallet/catalog'

/**
 * /api/consumer/bills/traffic-fines
 *
 * Pay traffic fines issued by SA metros (AARTO / JMPD / Cape Town Traffic)
 * and Malawi traffic police. The fine number is the unique reference.
 */

const MIN_AMOUNT_CENTS = BigInt(500) // R5.00
const MAX_AMOUNT_CENTS = BigInt(100_000_00) // R10,000.00

function findAuthority(id: string) {
  return TRAFFIC_FINE_AUTHORITIES.find((a) => a.id === id)
}

// GET — list traffic fine authorities
export async function GET(request: NextRequest) {
  const userId = getUserId(request)
  const grouped: Record<string, typeof TRAFFIC_FINE_AUTHORITIES> = { ZA: [], MW: [] }
  for (const a of TRAFFIC_FINE_AUTHORITIES) {
    grouped[a.country].push(a)
  }

  let recent: Array<Record<string, unknown>> = []
  try {
    const rows = await db.consumerTransaction.findMany({
      where: {
        userId,
        transactionType: 'bill_payment',
        counterpartyType: 'traffic_authority',
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })
    recent = rows.map((r) => ({
      id: r.id,
      authority: r.counterpartyName,
      fineNumber: r.reference,
      vehicleReg: r.meterNumber,
      amountCents: r.amountCents,
      receiptNo: r.externalRef,
      status: r.status,
      createdAt: r.createdAt,
    }))
  } catch {
    // ignore
  }

  return ok({
    authorities: TRAFFIC_FINE_AUTHORITIES,
    grouped,
    minAmountCents: MIN_AMOUNT_CENTS.toString(),
    maxAmountCents: MAX_AMOUNT_CENTS.toString(),
    recent,
  })
}

// POST — pay a traffic fine
export async function POST(request: NextRequest) {
  try {
    const userId = await ensureConsumerUser(getUserId(request))
    const body = await request.json().catch(() => ({} as Record<string, unknown>))

    const authorityId = (body.authorityId as string | undefined)?.trim()
    const fineNumber = (body.fineNumber as string | undefined)?.trim() ?? ''
    const vehicleReg = (body.vehicleReg as string | undefined)?.trim() ?? ''
    const amountInput = body.amountCents ?? body.amount

    if (!authorityId) return error('authorityId is required')
    if (!fineNumber) return error('fineNumber is required')
    if (!amountInput) return error('amount (cents) is required')

    const authority = findAuthority(authorityId)
    if (!authority) {
      return error(`Unknown traffic fine authority: ${authorityId}`, 404)
    }

    if (fineNumber.length < 4 || fineNumber.length > 40) {
      return error('Fine number must be between 4 and 40 characters', 400)
    }

    const amount = parseMoney(amountInput as string | number)
    if (amount < MIN_AMOUNT_CENTS) {
      return error(`Minimum fine payment is R${Number(MIN_AMOUNT_CENTS) / 100}`, 400)
    }
    if (amount > MAX_AMOUNT_CENTS) {
      return error(`Maximum fine payment is R${Number(MAX_AMOUNT_CENTS) / 100}`, 400)
    }

    const idempotencyKey =
      (body.idempotencyKey as string | undefined) ||
      `fine-${authorityId}-${fineNumber}-${amount.toString()}-${Date.now()}`

    const existing = await db.consumerTransaction.findUnique({ where: { idempotencyKey } })
    if (existing) {
      return ok({
        success: true,
        data: serialize(existing),
        message: 'Traffic fine already paid',
      })
    }

    const receiptNo = generateReceiptNo('FIN')

    const tx = await db.consumerTransaction.create({
      data: {
        id: `tx-fine-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
        idempotencyKey,
        userId,
        transactionType: 'bill_payment',
        direction: 'debit',
        amountCents: amount,
        feeCents: BigInt(0),
        netAmountCents: amount,
        currency: authority.country === 'MW' ? 'MWK' : 'ZAR',
        status: 'completed',
        description: `Traffic Fine - ${authority.name} - ${fineNumber}${
          vehicleReg ? ` - ${vehicleReg}` : ''
        }`,
        reference: fineNumber,
        category: 'traffic_fine',
        counterpartyId: authority.id,
        counterpartyName: authority.name,
        counterpartyType: 'traffic_authority',
        paymentMethod: 'wallet_balance',
        meterNumber: vehicleReg || null, // reuse for vehicle reg
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
        fineNumber,
        vehicleReg,
        amountCents: amount.toString(),
        authority: {
          id: authority.id,
          name: authority.name,
          country: authority.country,
          desc: 'desc' in authority ? (authority as { desc?: string }).desc : undefined,
        },
        instructions: [
          `Your fine ${fineNumber} paid to ${authority.name} has been recorded.`,
          'Keep this receipt as proof of payment — the receipt number is your AARTO reference.',
          'Allow 48 hours for the infringement to be marked as paid on the eNatis / AARTO system.',
        ],
      },
      201,
    )
  } catch (err) {
    console.error('Traffic fine payment error:', err)
    return error('Failed to process traffic fine payment', 500)
  }
}
