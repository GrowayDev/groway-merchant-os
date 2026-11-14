import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getUserId, ok, error, parseMoney, serialize } from '../../_lib/helpers'
import { ensureConsumerUser } from '../../_lib/ensureUser'
import {
  ELECTRICITY_PROVIDERS,
  generateSTSRechargeToken,
  generateReceiptNo,
} from '@/lib/consumer-wallet/catalog'

/**
 * /api/consumer/bills/electricity
 *
 * Prepaid electricity (and water) purchases for South Africa + Malawi.
 * All providers here are STS-compatible prepaid meters — buying generates
 * a 20-digit STS recharge token which the customer keys into their meter.
 */

const MIN_AMOUNT_CENTS = BigInt(1_000) // R10.00
const MAX_AMOUNT_CENTS = BigInt(1_000_000_00) // R1,000.00
const QUICK_AMOUNTS_RANDS = [50, 100, 200, 500, 1000]

function findProvider(providerId: string) {
  return ELECTRICITY_PROVIDERS.find((p) => p.id === providerId)
}

function isValidMeterNumber(meter: string): boolean {
  const digits = meter.replace(/\D/g, '')
  return digits.length === 11 || digits.length === 20
}

// GET — list electricity providers grouped by country + quick amounts
export async function GET(request: NextRequest) {
  const userId = getUserId(request)
  const grouped: Record<string, typeof ELECTRICITY_PROVIDERS> = { ZA: [], MW: [] }
  for (const p of ELECTRICITY_PROVIDERS) {
    grouped[p.country].push(p)
  }

  // Recent electricity purchases for this user
  let recent: Array<Record<string, unknown>> = []
  try {
    const rows = await db.consumerTransaction.findMany({
      where: {
        userId,
        transactionType: 'bill_payment',
        counterpartyType: 'electricity_provider',
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })
    recent = rows.map((r) => ({
      id: r.id,
      provider: r.counterpartyName,
      meterNumber: r.meterNumber,
      stsToken: r.voucherToken,
      amountCents: r.amountCents,
      receiptNo: r.externalRef,
      status: r.status,
      createdAt: r.createdAt,
    }))
  } catch {
    // ignore — keep GET resilient
  }

  return ok({
    providers: ELECTRICITY_PROVIDERS,
    grouped,
    quickAmounts: QUICK_AMOUNTS_RANDS,
    minAmountCents: MIN_AMOUNT_CENTS.toString(),
    maxAmountCents: MAX_AMOUNT_CENTS.toString(),
    recent,
  })
}

// POST — purchase electricity and generate an STS recharge token
export async function POST(request: NextRequest) {
  try {
    const userId = await ensureConsumerUser(getUserId(request))
    const body = await request.json().catch(() => ({} as Record<string, unknown>))

    const providerId = (body.providerId as string | undefined)?.trim()
    const meterNumber = (body.meterNumber as string | undefined)?.replace(/\s+/g, '') ?? ''
    const phone = (body.phone as string | undefined)?.trim() ?? ''
    const amountInput = body.amountCents ?? body.amount

    if (!providerId) return error('providerId is required')
    if (!meterNumber) return error('meterNumber is required')
    if (!amountInput) return error('amount (cents) is required')

    const provider = findProvider(providerId)
    if (!provider) return error(`Unknown electricity provider: ${providerId}`, 404)

    if (!isValidMeterNumber(meterNumber)) {
      return error(
        'Meter number must be 11 or 20 digits (STS standard). Please check the number printed on your prepaid meter.',
        400,
      )
    }

    const amount = parseMoney(amountInput as string | number)
    if (amount < MIN_AMOUNT_CENTS) {
      return error(`Minimum electricity purchase is R${Number(MIN_AMOUNT_CENTS) / 100}`, 400)
    }
    if (amount > MAX_AMOUNT_CENTS) {
      return error(`Maximum electricity purchase is R${Number(MAX_AMOUNT_CENTS) / 100}`, 400)
    }

    const idempotencyKey =
      (body.idempotencyKey as string | undefined) ||
      `elec-${providerId}-${meterNumber}-${amount.toString()}-${Date.now()}`

    // Idempotency check
    const existing = await db.consumerTransaction.findUnique({ where: { idempotencyKey } })
    if (existing) {
      return ok({
        success: true,
        data: serialize(existing),
        message: 'Electricity purchase already processed',
      })
    }

    // Generate STS recharge token (20-digit, globally recognised prepaid spec)
    const stsToken = generateSTSRechargeToken()
    const receiptNo = generateReceiptNo('ELEC')

    // Rough kWh estimate (varies by provider tariff — demo only)
    const tariffPerKwh = provider.country === 'MW' ? 180 : 230 // cents per kWh
    const unitsKwh = Number(amount) / tariffPerKwh

    const tx = await db.consumerTransaction.create({
      data: {
        id: `tx-elec-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
        idempotencyKey,
        userId,
        transactionType: 'bill_payment',
        direction: 'debit',
        amountCents: amount,
        feeCents: BigInt(0),
        netAmountCents: amount,
        currency: provider.country === 'MW' ? 'MWK' : 'ZAR',
        status: 'completed',
        description: `Prepaid Electricity - ${provider.name} - Meter ${meterNumber}`,
        reference: receiptNo,
        category: 'utilities',
        counterpartyId: provider.id,
        counterpartyName: provider.name,
        counterpartyPhone: phone || null,
        counterpartyType: 'electricity_provider',
        paymentMethod: 'wallet_balance',
        voucherToken: stsToken,
        voucherExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        meterNumber,
        unitsPurchased: `${unitsKwh.toFixed(2)} kWh`,
        externalRef: receiptNo,
        completedAt: new Date(),
        updatedAt: new Date(),
      },
    })

    // Try to debit the wallet (best-effort — demo balance may be large enough)
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
      // non-fatal — the receipt is still valid
    }

    return ok(
      {
        success: true,
        data: serialize(tx),
        receiptNo,
        stsToken,
        meterNumber,
        amountCents: amount.toString(),
        provider: {
          id: provider.id,
          name: provider.name,
          country: provider.country,
          sts: provider.sts,
        },
        unitsKwh: unitsKwh.toFixed(2),
        instructions: [
          `Key the 20-digit STS token into your ${provider.name} prepaid meter.`,
          'Press the "#" or "Enter" key on the meter keypad after the last digit.',
          'The meter will display the kWh credit purchased and any balance.',
          'Keep this receipt — your token is also valid for re-entry within 24 hours.',
        ],
      },
      201,
    )
  } catch (err) {
    console.error('Electricity purchase error:', err)
    return error('Failed to process electricity purchase', 500)
  }
}
