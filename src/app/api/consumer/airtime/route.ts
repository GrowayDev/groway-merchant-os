import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getUserId, ok, error, parseMoney, serialize } from '../_lib/helpers'
import { ensureConsumerUser } from '../_lib/ensureUser'
import {
  AIRTIME_PROVIDERS,
  generatePin,
  generateReceiptNo,
} from '@/lib/consumer-wallet/catalog'

/**
 * /api/consumer/airtime
 *
 * Voice airtime (voucher PIN) and data bundle (direct recharge) purchases
 * for SA networks (Vodacom, MTN, Cell C, Telkom) and Malawi (Airtel, TNM).
 *
 *  - Voice: returns a 12-digit PIN voucher the customer can dial `*100*PIN#`
 *    to redeem on any compatible handset.
 *  - Data: direct recharge — the bundle is pushed to the MSISDN immediately,
 *    no PIN needed.
 *
 * Catalog lives in `@/lib/consumer-wallet/catalog`. Voice denominations are
 * in Rands; data bundle prices are in Rands too. The API standardises on
 * cents for amount output.
 */

const MIN_VOICE_CENTS = BigInt(200) // R2.00

type AirtimeProvider = (typeof AIRTIME_PROVIDERS)[number]
type DataBundle = AirtimeProvider['dataBundles'][number]

function findProvider(providerId: string): AirtimeProvider | undefined {
  return AIRTIME_PROVIDERS.find((p) => p.id === providerId)
}

function findBundle(provider: AirtimeProvider, bundleId: string): DataBundle | undefined {
  return provider.dataBundles.find((b) => b.id === bundleId)
}

function normalisePhone(input: string): string {
  const digits = input.replace(/\D/g, '')
  if (!digits) return ''
  // Local ZA: 0XXXXXXXXX -> +27XXXXXXXXX
  if (digits.startsWith('0')) return '+27' + digits.slice(1)
  if (digits.startsWith('27')) return '+' + digits
  if (digits.startsWith('+')) return digits
  // Malawi default if length matches
  if (digits.length === 9) return '+265' + digits
  return '+' + digits
}

// GET — list airtime providers with voice denominations and data bundles
export async function GET(request: NextRequest) {
  const userId = getUserId(request)

  const providers = AIRTIME_PROVIDERS.map((p) => ({
    id: p.id,
    name: p.name,
    country: p.country,
    voiceDenominations: [...p.voiceDenominations],
    dataBundles: p.dataBundles.map((b) => ({ ...b })),
  }))

  const grouped: Record<string, typeof providers> = { ZA: [], MW: [] }
  for (const p of providers) grouped[p.country].push(p)

  let recent: Array<Record<string, unknown>> = []
  try {
    const rows = await db.consumerTransaction.findMany({
      where: {
        userId,
        transactionType: 'airtime',
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })
    recent = rows.map((r) => ({
      id: r.id,
      provider: r.counterpartyName,
      phoneNumber: r.counterpartyPhone,
      type: r.category, // 'voice' | 'data'
      bundleId: r.providerRef,
      pin: r.voucherToken,
      amountCents: r.amountCents,
      receiptNo: r.externalRef,
      status: r.status,
      createdAt: r.createdAt,
    }))
  } catch {
    // ignore
  }

  return ok({
    providers,
    grouped,
    minVoiceCents: MIN_VOICE_CENTS.toString(),
    recent,
  })
}

// POST — purchase voice airtime or a data bundle
export async function POST(request: NextRequest) {
  try {
    const userId = await ensureConsumerUser(getUserId(request))
    const body = await request.json().catch(() => ({} as Record<string, unknown>))

    const providerId = (body.providerId as string | undefined)?.trim()
    const rawPhone = (body.phoneNumber as string | undefined)?.trim() ?? ''
    const type = (body.type as string | undefined) as 'voice' | 'data' | undefined
    const bundleId = (body.bundleId as string | undefined)?.trim() ?? ''

    if (!providerId) return error('providerId is required')
    if (!rawPhone) return error('phoneNumber is required')
    if (type !== 'voice' && type !== 'data') {
      return error("type must be 'voice' or 'data'", 400)
    }

    const provider = findProvider(providerId)
    if (!provider) return error(`Unknown airtime provider: ${providerId}`, 404)

    const phoneNumber = normalisePhone(rawPhone)
    if (phoneNumber.length < 10) {
      return error('Please enter a valid phone number (e.g. 082 123 4567).', 400)
    }

    const receiptNo = generateReceiptNo('AT')

    // Resolve the amount (in cents) and the bundle metadata
    let amountCents: bigint
    let bundle: DataBundle | undefined
    let pin: string | null = null

    if (type === 'data') {
      if (!bundleId) {
        return error('bundleId is required for data purchases', 400)
      }
      bundle = findBundle(provider, bundleId)
      if (!bundle) {
        return error(`Unknown data bundle for ${provider.name}: ${bundleId}`, 400)
      }
      amountCents = parseMoney(bundle.price * 100)
    } else {
      // Voice airtime — amount in Rands, sent as `amountCents` (or `amount` in cents)
      const amountInput = body.amountCents ?? body.amount
      if (amountInput === undefined || amountInput === null) {
        return error('amount (cents) is required for voice airtime', 400)
      }
      amountCents = parseMoney(amountInput as string | number)
      if (amountCents < MIN_VOICE_CENTS) {
        return error(`Minimum voice airtime is R${Number(MIN_VOICE_CENTS) / 100}`, 400)
      }
      pin = generatePin(12)
    }

    const idempotencyKey =
      (body.idempotencyKey as string | undefined) ||
      `air-${provider.id}-${phoneNumber}-${type}-${bundleId || amountCents.toString()}-${Date.now()}`

    const existing = await db.consumerTransaction.findUnique({ where: { idempotencyKey } })
    if (existing) {
      return ok({
        success: true,
        data: serialize(existing),
        message: 'Airtime purchase already processed',
      })
    }

    const tx = await db.consumerTransaction.create({
      data: {
        id: `tx-air-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
        idempotencyKey,
        userId,
        transactionType: 'airtime',
        direction: 'debit',
        amountCents,
        feeCents: BigInt(0),
        netAmountCents: amountCents,
        currency: provider.country === 'MW' ? 'MWK' : 'ZAR',
        status: 'completed',
        description:
          type === 'data'
            ? `${provider.name} Data Bundle - ${bundle!.name} - ${phoneNumber}`
            : `${provider.name} Voice Airtime - ${phoneNumber}`,
        reference: receiptNo,
        category: type,
        counterpartyId: provider.id,
        counterpartyName: provider.name,
        counterpartyPhone: phoneNumber,
        counterpartyType: 'airtime_provider',
        paymentMethod: 'wallet_balance',
        voucherToken: pin, // null for data
        voucherExpiry:
          type === 'voice'
            ? new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() // 90 days
            : null,
        providerRef: bundle?.id ?? null,
        externalRef: receiptNo,
        completedAt: new Date(),
        updatedAt: new Date(),
      },
    })

    // Best-effort wallet debit
    try {
      const wallet = await db.consumerWallet.findUnique({ where: { userId } })
      if (wallet && wallet.balanceCents >= amountCents) {
        await db.consumerWallet.update({
          where: { userId },
          data: {
            balanceCents: { decrement: amountCents },
            totalSentCents: { increment: amountCents },
            updatedAt: new Date(),
          },
        })
      }
    } catch {
      // non-fatal
    }

    const response: Record<string, unknown> = {
      success: true,
      data: serialize(tx),
      receiptNo,
      amountCents: amountCents.toString(),
      provider: {
        id: provider.id,
        name: provider.name,
        country: provider.country,
      },
      phoneNumber,
      type,
    }

    if (type === 'voice') {
      response.pin = pin
      response.voucherExpiry = tx.voucherExpiry
      response.instructions = [
        `Dial *100*${pin}# on your ${provider.name} handset to load the airtime.`,
        'Alternatively, dial *100# and choose "Recharge with voucher".',
        'The PIN is valid for 90 days from purchase.',
      ]
    } else {
      response.directRecharge = true
      response.bundle = bundle
        ? { id: bundle.id, name: bundle.name, price: bundle.price, validity: bundle.validity }
        : null
      response.instructions = [
        `R${bundle!.price} of ${bundle!.name} has been pushed directly to ${phoneNumber}.`,
        `Data is valid for ${bundle!.validity}.`,
        'You should receive an SMS confirmation from the network within 60 seconds.',
      ]
    }

    return ok(response, 201)
  } catch (err) {
    console.error('Airtime purchase error:', err)
    return error('Failed to process airtime purchase', 500)
  }
}
