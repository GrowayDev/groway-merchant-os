import { NextRequest } from 'next/server'
import { randomBytes } from 'crypto'
import { db } from '@/lib/db'
import { getUserId, ok, error } from '../_lib/helpers'
import { BNPL_PROVIDERS, generateCaseRef, generateReceiptNo } from '@/lib/consumer-wallet/catalog'

/**
 * /api/consumer/bnpl
 *
 * Buy Now, Pay Later. The ConsumerBNPL + ConsumerBNPLPlan + ConsumerBNPLInstalment
 * models track eligibility and instalment schedules. Most providers offer 0%
 * interest; the schedule is built as N equal instalments spaced 30 days apart.
 */

// GET /api/consumer/bnpl — providers + user plans
export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request)

    // Ensure the user has a BNPL eligibility row; create one if missing.
    let bnpl = await db.consumerBNPL.findUnique({ where: { userId } }).catch(() => null)
    if (!bnpl) {
      bnpl = await db.consumerBNPL.create({
        data: {
          id: `bnpl-${randomBytes(8).toString('hex')}`,
          userId,
          eligible: true,
          creditScore: 650,
          limit: 15000,
          used: 0,
          available: 15000,
          updatedAt: new Date(),
        },
      }).catch(() => null)
    }

    const plans = await db.consumerBNPLPlan.findMany({
      where: { userId },
      include: { ConsumerBNPLInstalment: { orderBy: { number: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    }).catch(() => [])

    return ok({
      success: true,
      data: {
        providers: BNPL_PROVIDERS,
        eligibility: bnpl
          ? {
              creditScore: bnpl.creditScore,
              limit: bnpl.limit,
              used: bnpl.used,
              available: bnpl.available,
              eligible: bnpl.eligible,
            }
          : null,
        plans: plans.map((p) => ({
          id: p.id,
          merchant: p.merchant,
          purchaseAmount: p.purchaseAmount,
          instalmentAmount: p.instalmentAmount,
          paidInstalments: p.paidInstalments,
          totalInstalments: p.totalInstalments,
          nextDueDate: p.nextDueDate,
          status: p.status,
          createdAt: p.createdAt,
          instalments: p.ConsumerBNPLInstalment.map((i) => ({
            number: i.number,
            amount: i.amount,
            dueDate: i.dueDate,
            status: i.status,
            paidAt: i.paidAt,
          })),
        })),
        explainer:
          'Buy Now, Pay Later lets you split a purchase into 3-6 interest-free instalments. Most providers charge 0% interest when paid on time. Late payments may incur fees and affect your credit score.',
      },
    })
  } catch (err) {
    console.error('Get BNPL error:', err)
    return error('Failed to fetch BNPL', 500)
  }
}

// POST /api/consumer/bnpl — create a BNPL plan
export async function POST(request: NextRequest) {
  try {
    const userId = getUserId(request)
    const body = await request.json().catch(() => ({} as Record<string, unknown>))

    const providerId = body.providerId as string | undefined
    const purchaseAmountInput = body.purchaseAmount ?? body.purchaseAmountCents ?? body.amount
    const itemDescription = (body.itemDescription as string | undefined) ?? 'BNPL purchase'
    const merchantId = (body.merchantId as string | undefined) ?? null
    const merchantName = (body.merchantName as string | undefined) ?? (merchantId ? 'Linked Merchant' : 'Online Store')
    const termOverride = body.term as number | undefined

    if (!providerId) return error('providerId is required', 400)
    if (purchaseAmountInput == null) return error('purchaseAmount is required', 400)

    const provider = BNPL_PROVIDERS.find((p) => p.id === providerId)
    if (!provider) return error(`Invalid provider: ${providerId}`, 400)

    const purchaseAmount = Number(purchaseAmountInput)
    if (purchaseAmount <= 0) return error('purchaseAmount must be greater than 0', 400)
    if (purchaseAmount > provider.maxAmount) {
      return error(`Amount exceeds ${provider.name} max of R${provider.maxAmount.toLocaleString()}`, 400)
    }

    // Pick the term — default to the first available term for the provider.
    const terms = provider.terms as readonly number[]
    const term = termOverride && terms.includes(termOverride) ? termOverride : terms[0]

    // Ensure BNPL eligibility row exists; check eligibility + available limit.
    let bnpl = await db.consumerBNPL.findUnique({ where: { userId } }).catch(() => null)
    if (!bnpl) {
      bnpl = await db.consumerBNPL.create({
        data: {
          id: `bnpl-${randomBytes(8).toString('hex')}`,
          userId,
          eligible: true,
          creditScore: 650,
          limit: Math.max(provider.maxAmount, 15000),
          used: 0,
          available: Math.max(provider.maxAmount, 15000),
          updatedAt: new Date(),
        },
      })
    }
    if (!bnpl.eligible) {
      return error('You are not currently eligible for BNPL', 403)
    }
    if (purchaseAmount > bnpl.available) {
      return error(`Amount exceeds your available BNPL limit of R${bnpl.available.toLocaleString()}`, 400)
    }

    const instalmentAmount = Math.round((purchaseAmount / term) * 100) / 100
    const planId = `bnpl-plan-${randomBytes(8).toString('hex')}`
    const caseRef = generateCaseRef('BNPL')
    const receiptNo = generateReceiptNo('BNPL')
    const now = new Date()

    // Build the instalment schedule — equal payments 30 days apart.
    const instalments = Array.from({ length: term }, (_, i) => {
      const dueDate = new Date(now)
      dueDate.setDate(dueDate.getDate() + (i + 1) * 30)
      return {
        number: i + 1,
        amount: instalmentAmount,
        dueDate,
        status: 'pending',
      }
    })

    // Create the plan + instalments + decrement BNPL availability.
    await db.$transaction([
      db.consumerBNPLPlan.create({
        data: {
          id: planId,
          userId,
          merchant: `${merchantName}${merchantId ? ` (${merchantId})` : ''}`,
          purchaseAmount,
          instalmentAmount,
          paidInstalments: 0,
          totalInstalments: term,
          nextDueDate: instalments[0]?.dueDate ?? null,
          status: 'active',
          updatedAt: now,
          ConsumerBNPLInstalment: {
            create: instalments.map((i) => ({
              id: `bnpl-inst-${randomBytes(6).toString('hex')}`,
              number: i.number,
              amount: i.amount,
              dueDate: i.dueDate,
              status: i.status,
              updatedAt: now,
            })),
          },
        },
      }),
      db.consumerBNPL.update({
        where: { userId },
        data: {
          used: { increment: purchaseAmount },
          available: { decrement: purchaseAmount },
          updatedAt: now,
        },
      }),
      db.consumerTransaction.create({
        data: {
          id: `ctx-${randomBytes(8).toString('hex')}`,
          idempotencyKey: `${receiptNo}-bnpl`,
          userId,
          transactionType: 'bnpl_purchase',
          direction: 'debit',
          amountCents: BigInt(Math.round(purchaseAmount * 100)),
          feeCents: 0n,
          netAmountCents: BigInt(Math.round(purchaseAmount * 100)),
          currency: 'ZAR',
          status: 'completed',
          description: `BNPL: ${itemDescription} (${provider.name})`,
          reference: receiptNo,
          category: 'bnpl',
          counterpartyName: provider.name,
          merchantId: merchantId ?? undefined,
          merchantName: merchantName ?? undefined,
          paymentMethod: 'bnpl',
          completedAt: now,
          updatedAt: now,
        },
      }),
    ])

    // Reload the plan with instalments for the response.
    const created = await db.consumerBNPLPlan.findUnique({
      where: { id: planId },
      include: { ConsumerBNPLInstalment: { orderBy: { number: 'asc' } } },
    })

    return ok({
      success: true,
      data: {
        planId,
        caseRef,
        receiptNo,
        provider: provider.name,
        providerId: provider.id,
        providerDesc: provider.desc,
        itemDescription,
        merchant: merchantName,
        merchantId,
        purchaseAmount,
        instalmentAmount,
        totalInstalments: term,
        paidInstalments: 0,
        nextDueDate: instalments[0]?.dueDate ?? null,
        status: 'active',
        interestRate: 0,
        instalments: created?.ConsumerBNPLInstalment.map((i) => ({
          number: i.number,
          amount: i.amount,
          dueDate: i.dueDate,
          status: i.status,
        })) ?? instalments,
        terms: [
          `${term} instalments of R${instalmentAmount.toFixed(2)} each.`,
          '0% interest when paid on time.',
          'Payments are debited via DebiCheck on the due date.',
          'Late payments may incur fees and affect your credit score.',
          'You can settle early at no extra cost.',
        ],
        message: `BNPL plan created with ${provider.name}. ${term} payments of R${instalmentAmount.toFixed(2)} — first payment due ${instalments[0]?.dueDate?.toLocaleDateString('en-ZA') ?? 'in 30 days'}.`,
      },
    }, 201)
  } catch (err) {
    console.error('Create BNPL plan error:', err)
    return error('Failed to create BNPL plan', 500)
  }
}
