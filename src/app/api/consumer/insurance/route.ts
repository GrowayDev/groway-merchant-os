import { NextRequest } from 'next/server'
import { randomBytes } from 'crypto'
import { db } from '@/lib/db'
import { getUserId, ok, error, parseMoney } from '../_lib/helpers'
import {
  INSURANCE_CATEGORIES,
  INSURANCE_PROVIDERS,
  generateCaseRef,
  generateReceiptNo,
} from '@/lib/consumer-wallet/catalog'

/**
 * /api/consumer/insurance
 *
 * Browse insurance categories + providers from the catalog and apply for
 * cover. Insurance does NOT require a credit score (unlike loans) — you
 * can subscribe regardless of your credit history.
 *
 * Money is stored as BigInt cents on ConsumerInsurance.coverAmount and
 * ConsumerInsurance.premium.
 */

// GET /api/consumer/insurance — categories, providers + user policies
export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request)

    const policies = await db.consumerInsurance.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    }).catch(() => [])

    return ok({
      success: true,
      data: {
        categories: INSURANCE_CATEGORIES,
        providers: INSURANCE_PROVIDERS,
        policies: policies.map((p) => ({
          id: p.id,
          productType: p.productType,
          provider: p.provider,
          coverAmount: p.coverAmount.toString(),
          premium: p.premium.toString(),
          status: p.status,
          startDate: p.startDate,
          nextPaymentDate: p.nextPaymentDate,
          beneficiaries: p.beneficiaries ? JSON.parse(p.beneficiaries) : [],
        })),
        explainer:
          'Insurance does not require a credit score. You can subscribe regardless of your credit history. Premiums are based on cover amount, age and risk profile — not your credit record.',
      },
    })
  } catch (err) {
    console.error('Get insurance error:', err)
    return error('Failed to fetch insurance catalog', 500)
  }
}

// POST /api/consumer/insurance — apply for insurance
export async function POST(request: NextRequest) {
  try {
    const userId = getUserId(request)
    const body = await request.json().catch(() => ({} as Record<string, unknown>))

    const category = body.category as string | undefined
    const providerId = body.providerId as string | undefined
    const coverAmountInput = body.coverAmount ?? body.coverAmountCents
    const monthlyPremiumInput = body.monthlyPremium ?? body.monthlyPremiumCents ?? body.premium
    const details = (body.details as Record<string, unknown> | undefined) ?? {}

    if (!category) return error('category is required', 400)
    if (!providerId) return error('providerId is required', 400)
    if (coverAmountInput == null) return error('coverAmount is required', 400)
    if (monthlyPremiumInput == null) return error('monthlyPremium is required', 400)

    const categoryMeta = INSURANCE_CATEGORIES.find((c) => c.value === category)
    if (!categoryMeta) return error(`Invalid category: ${category}`, 400)

    const provider = INSURANCE_PROVIDERS.find((p) => p.id === providerId)
    if (!provider) return error(`Invalid provider: ${providerId}`, 400)
    if (!provider.categories.includes(category as never)) {
      return error(`${provider.name} does not offer ${categoryMeta.label}`, 400)
    }

    const coverAmount = parseMoney(coverAmountInput as string | number)
    const monthlyPremium = parseMoney(monthlyPremiumInput as string | number)

    if (coverAmount <= 0n) return error('coverAmount must be greater than 0', 400)
    if (monthlyPremium <= 0n) return error('monthlyPremium must be greater than 0', 400)

    // Generate policy number — POL-{YYYYMM}-{6 random}
    const now = new Date()
    const yyyymm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`
    const policyNo = `POL-${yyyymm}-${randomBytes(3).toString('hex').toUpperCase()}`
    const caseRef = generateCaseRef('INS')
    const receiptNo = generateReceiptNo('INS')

    // Next premium due in 1 month
    const nextPaymentDate = new Date(now)
    nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1)
    const nextPaymentStr = nextPaymentDate.toISOString().split('T')[0]
    const startStr = now.toISOString().split('T')[0]

    const beneficiaries = Array.isArray(details.beneficiaries) ? details.beneficiaries : []

    const policy = await db.consumerInsurance.create({
      data: {
        id: policyNo,
        userId,
        productType: category,
        provider: provider.name,
        coverAmount,
        premium: monthlyPremium,
        startDate: startStr,
        nextPaymentDate: nextPaymentStr,
        beneficiaries: JSON.stringify(beneficiaries),
        status: 'pending_activation',
        updatedAt: now,
      },
    }).catch((e) => {
      console.error('Create insurance policy error:', e)
      return null
    })

    // Record the first premium as a transaction (wallet is optional in demo).
    await db.consumerTransaction.create({
      data: {
        id: `ctx-${randomBytes(8).toString('hex')}`,
        idempotencyKey: `${receiptNo}-prem`,
        userId,
        transactionType: 'insurance_premium',
        direction: 'debit',
        amountCents: monthlyPremium,
        feeCents: 0n,
        netAmountCents: monthlyPremium,
        currency: 'ZAR',
        status: 'completed',
        description: `${categoryMeta.label} — first premium (${provider.name})`,
        reference: receiptNo,
        category: 'insurance',
        counterpartyName: provider.name,
        paymentMethod: 'wallet',
        completedAt: now,
        updatedAt: now,
      },
    }).catch((e) => {
      console.error('Create insurance transaction error:', e)
    })

    // If wallet exists, deduct the first premium.
    const wallet = await db.consumerWallet.findUnique({ where: { userId } }).catch(() => null)
    if (wallet && wallet.balanceCents >= monthlyPremium) {
      await db.consumerWallet.update({
        where: { userId },
        data: { balanceCents: { decrement: monthlyPremium }, updatedAt: now },
      }).catch(() => null)
    }

    return ok({
      success: true,
      data: {
        policyNo: policy?.id ?? policyNo,
        caseRef,
        receiptNo,
        category,
        categoryLabel: categoryMeta.label,
        categoryIcon: categoryMeta.icon,
        provider: provider.name,
        providerId: provider.id,
        providerPhone: provider.phone,
        coverAmount: coverAmount.toString(),
        premium: monthlyPremium.toString(),
        nextPaymentDate: nextPaymentStr,
        startDate: startStr,
        status: 'pending_activation',
        beneficiaries,
        requiresMedical: categoryMeta.requiresMedical,
        terms: [
          'Cover is subject to the insurer’s underwriting assessment.',
          categoryMeta.requiresMedical
            ? 'A medical questionnaire or examination may be required before cover is activated.'
            : 'No medical examination required for this cover.',
          'A 6-month waiting period applies to pre-existing conditions on funeral cover.',
          'Premiums are debited monthly via DebiCheck from your linked bank account.',
          'The first premium has been collected and the policy is pending activation.',
          'You may cancel within 30 days for a full refund of premiums paid.',
        ],
        message: `${categoryMeta.label} application submitted to ${provider.name}. Policy ${policyNo} is pending activation.`,
      },
    }, 201)
  } catch (err) {
    console.error('Apply insurance error:', err)
    return error('Failed to apply for insurance', 500)
  }
}
