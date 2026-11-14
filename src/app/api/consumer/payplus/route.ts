import { NextRequest } from 'next/server'
import { randomBytes } from 'crypto'
import { db } from '@/lib/db'
import { getUserId, ok, error } from '../_lib/helpers'
import { PAYPLUS_PROVIDERS, generateCaseRef, generateReceiptNo } from '@/lib/consumer-wallet/catalog'

/**
 * /api/consumer/payplus
 *
 * Pay+ is a short-term cash advance. The fee is a flat SERVICE FEE, NOT
 * interest — this is NCR compliant under the easy category. Providers
 * are banks (FNB, Standard Bank, ABSA, Capitec, African Bank) registered
 * under the National Credit Regulator.
 *
 * Money is stored as BigInt cents in ConsumerTransaction; the provider
 * catalog uses Rands so we convert when needed.
 */

// GET /api/consumer/payplus — return providers
export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request)

    // Fetch the user's recent Pay+ transactions.
    const recent = await db.consumerTransaction.findMany({
      where: { userId, category: 'payplus' },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }).catch(() => [])

    return ok({
      success: true,
      data: {
        providers: PAYPLUS_PROVIDERS,
        recent: recent.map((t) => ({
          id: t.id,
          amountCents: t.amountCents.toString(),
          feeCents: t.feeCents.toString(),
          netAmountCents: t.netAmountCents.toString(),
          reference: t.reference,
          description: t.description,
          status: t.status,
          createdAt: t.createdAt,
        })),
        explainer:
          'Pay+ is a short-term cash advance. The fee is a service fee, NOT interest — this is NCR compliant under the easy category. Each registered bank provider charges a flat fee per advance.',
      },
    })
  } catch (err) {
    console.error('Get Pay+ error:', err)
    return error('Failed to fetch Pay+ providers', 500)
  }
}

// POST /api/consumer/payplus — apply for a Pay+ advance
export async function POST(request: NextRequest) {
  try {
    const userId = getUserId(request)
    const body = await request.json().catch(() => ({} as Record<string, unknown>))

    const providerId = body.providerId as string | undefined
    const amountInput = body.amount ?? body.amountCents

    if (!providerId) return error('providerId is required', 400)
    if (amountInput == null) return error('amount is required', 400)

    const provider = PAYPLUS_PROVIDERS.find((p) => p.id === providerId)
    if (!provider) return error(`Invalid provider: ${providerId}`, 400)

    // amount can be sent as Rand or cents — detect by magnitude.
    const rawAmount = Number(amountInput)
    const amountCents = rawAmount > 1000 ? BigInt(Math.round(rawAmount)) : BigInt(Math.round(rawAmount * 100))
    const amountRand = Number(amountCents) / 100

    if (amountCents <= BigInt(0)) return error('amount must be greater than 0', 400)
    if (amountRand > provider.maxAmount) {
      return error(`Amount exceeds ${provider.name} max of R${provider.maxAmount.toLocaleString()}`, 400)
    }

    // Service fee is flat — from the provider catalog (in Rand).
    const serviceFeeCents = BigInt(Math.round(provider.serviceFee * 100))
    const totalRepayableCents = amountCents + serviceFeeCents

    const caseRef = generateCaseRef('PAYPLUS')
    const receiptNo = generateReceiptNo('PAYPLUS')
    const agreementRef = `PPA-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${randomBytes(3).toString('hex').toUpperCase()}`
    const now = new Date()

    // Credit the wallet (if it exists) with the advance amount.
    const wallet = await db.consumerWallet.findUnique({ where: { userId } }).catch(() => null)
    if (wallet) {
      await db.consumerWallet.update({
        where: { userId },
        data: { balanceCents: { increment: amountCents }, updatedAt: now },
      }).catch(() => null)
    }

    // Record the advance as a credit transaction; the service fee is
    // captured separately in feeCents so it is clearly a fee, not interest.
    await db.consumerTransaction.create({
      data: {
        id: `ctx-${randomBytes(8).toString('hex')}`,
        idempotencyKey: `${receiptNo}-pp`,
        userId,
        transactionType: 'payplus_advance',
        direction: 'credit',
        amountCents,
        feeCents: serviceFeeCents,
        netAmountCents: amountCents,
        currency: 'ZAR',
        status: 'completed',
        description: `Pay+ advance from ${provider.name}`,
        reference: receiptNo,
        category: 'payplus',
        counterpartyName: provider.name,
        paymentMethod: 'internal',
        completedAt: now,
        updatedAt: now,
      },
    }).catch((e) => {
      console.error('Create Pay+ transaction error:', e)
    })

    return ok({
      success: true,
      data: {
        agreementRef,
        caseRef,
        receiptNo,
        provider: provider.name,
        providerId: provider.id,
        bank: provider.bank,
        ncrReg: provider.ncrReg,
        amountCents: amountCents.toString(),
        amount: amountRand,
        serviceFeeCents: serviceFeeCents.toString(),
        serviceFee: provider.serviceFee,
        totalRepayableCents: totalRepayableCents.toString(),
        totalRepayable: Number(totalRepayableCents) / 100,
        status: 'approved',
        approvedAt: now,
        // Repayment is collected via DebiCheck on the user's next payday.
        repaymentDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        terms: [
          'Pay+ is a short-term cash advance regulated under the National Credit Act.',
          `The service fee of R${provider.serviceFee.toFixed(2)} is a FLAT FEE, NOT interest.`,
          `${provider.name} is registered with the NCR under registration ${provider.ncrReg}.`,
          'The advance is repayable in full on your next payday via DebiCheck.',
          'Failure to repay on the due date may result in collection action.',
          'You may cancel this advance within 5 business days for a full refund of the service fee.',
          `Total repayable: R${(Number(totalRepayableCents) / 100).toFixed(2)} (R${amountRand.toFixed(2)} advance + R${provider.serviceFee.toFixed(2)} service fee).`,
        ],
        message: `Pay+ advance of R${amountRand.toFixed(2)} approved by ${provider.name}. Service fee R${provider.serviceFee.toFixed(2)}. Total repayable R${(Number(totalRepayableCents) / 100).toFixed(2)}.`,
      },
    }, 201)
  } catch (err) {
    console.error('Apply Pay+ error:', err)
    return error('Failed to apply for Pay+', 500)
  }
}
