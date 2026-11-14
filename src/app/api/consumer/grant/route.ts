import { NextRequest } from 'next/server'
import { randomBytes } from 'crypto'
import { db } from '@/lib/db'
import { getUserId, ok, error } from '../_lib/helpers'
import {
  SASSA_GRANT_TYPES,
  SASSA_PAYMENT_DATES_2026,
  generateCaseRef,
  generateReceiptNo,
} from '@/lib/consumer-wallet/catalog'

/**
 * /api/consumer/grant
 *
 * Grant+ helps consumers apply for SASSA grants. The South African Social
 * Security Agency pays grants monthly. We persist applications in the
 * ConsumerSASSA + ConsumerSASSAApplication tables and return the next
 * payment date from the SASSA_PAYMENT_DATES_2026 catalog.
 */

// GET /api/consumer/grant — grant types + payment dates + user grants
export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request)

    // Ensure ConsumerSASSA row exists for the user.
    let sassa = await db.consumerSASSA.findUnique({
      where: { userId },
      include: {
        ConsumerSASSAApplication: { orderBy: { submittedAt: 'desc' }, take: 20 },
        ConsumerSASSAGrant: { orderBy: { createdAt: 'desc' } },
      },
    }).catch(() => null)

    if (!sassa) {
      sassa = await db.consumerSASSA.create({
        data: {
          id: `sassa-${randomBytes(8).toString('hex')}`,
          userId,
          linked: false,
          status: 'active',
          totalMonthlyIncome: 0,
          updatedAt: new Date(),
        },
        include: {
          ConsumerSASSAApplication: true,
          ConsumerSASSAGrant: true,
        },
      }).catch(() => null)
    }

    return ok({
      success: true,
      data: {
        grantTypes: SASSA_GRANT_TYPES,
        paymentDates2026: SASSA_PAYMENT_DATES_2026,
        sassa: sassa
          ? {
              id: sassa.id,
              linked: sassa.linked,
              idNumber: sassa.idNumber,
              status: sassa.status,
              totalMonthlyIncome: sassa.totalMonthlyIncome,
              grants: sassa.ConsumerSASSAGrant.map((g) => ({
                id: g.id,
                grantType: g.grantType,
                grantName: g.grantName,
                amount: g.amount,
                beneficiaries: g.beneficiaries,
                totalAmount: g.totalAmount,
                status: g.status,
                nextPayment: g.nextPayment,
                lastPayment: g.lastPayment,
              })),
              applications: sassa.ConsumerSASSAApplication.map((a) => ({
                id: a.id,
                grantType: a.grantType,
                grantName: a.grantName,
                status: a.status,
                submittedAt: a.submittedAt,
                processedAt: a.processedAt,
              })),
            }
          : null,
        explainer:
          'Grant+ helps you apply for SASSA grants. The South African Social Security Agency pays grants monthly. Grant types include Old Age, Disability, Child Support, Foster Child, Care Dependency, War Veterans, Grant-in-Aid and Social Relief of Distress.',
      },
    })
  } catch (err) {
    console.error('Get grant error:', err)
    return error('Failed to fetch grant data', 500)
  }
}

// POST /api/consumer/grant — apply for a grant
export async function POST(request: NextRequest) {
  try {
    const userId = getUserId(request)
    const body = await request.json().catch(() => ({} as Record<string, unknown>))

    const grantType = body.grantType as string | undefined
    const idNumber = (body.idNumber as string | undefined) ?? ''
    const children = Number(body.children ?? 1)

    if (!grantType) return error('grantType is required', 400)
    if (!idNumber || idNumber.length < 6) return error('A valid ID number is required', 400)

    const grantMeta = SASSA_GRANT_TYPES.find((g) => g.value === grantType)
    if (!grantMeta) return error(`Invalid grant type: ${grantType}`, 400)

    // Ensure ConsumerSASSA row exists; link the ID number.
    let sassa = await db.consumerSASSA.findUnique({ where: { userId } }).catch(() => null)
    if (!sassa) {
      sassa = await db.consumerSASSA.create({
        data: {
          id: `sassa-${randomBytes(8).toString('hex')}`,
          userId,
          linked: true,
          idNumber,
          status: 'active',
          totalMonthlyIncome: 0,
          updatedAt: new Date(),
        },
      })
    } else if (!sassa.linked) {
      sassa = await db.consumerSASSA.update({
        where: { userId },
        data: { linked: true, idNumber, updatedAt: new Date() },
      })
    }

    // Estimated amount — for child support grants, multiply by children count.
    const baseAmount = grantMeta.amount
    const beneficiaries = grantType === 'child_support' ? Math.max(1, children) : 1
    const estimatedAmount = grantMeta.perChild ? baseAmount * beneficiaries : baseAmount

    // Next payment date — find the next upcoming date in 2026 calendar.
    const now = new Date()
    const upcomingPayment = SASSA_PAYMENT_DATES_2026
      .map((d) => ({ ...d, parsed: new Date(d.date) }))
      .filter((d) => d.parsed.getTime() >= now.getTime())
      .sort((a, b) => a.parsed.getTime() - b.parsed.getTime())[0]
    const nextPaymentDate = upcomingPayment?.date ?? SASSA_PAYMENT_DATES_2026[0]?.date ?? '2026-01-05'

    const applicationRef = `SASSA-APP-${new Date().getFullYear()}-${randomBytes(3).toString('hex').toUpperCase()}`
    const caseRef = generateCaseRef('GRANT')
    const receiptNo = generateReceiptNo('GRANT')
    const now2 = new Date()

    // Create the application record.
    const application = await db.consumerSASSAApplication.create({
      data: {
        id: applicationRef,
        sassaId: sassa.id,
        grantType,
        grantName: grantMeta.label,
        status: 'submitted',
        submittedAt: now2,
        documents: JSON.stringify({
          idNumber,
          children: beneficiaries,
          receiptNo,
        }),
        updatedAt: now2,
      },
    }).catch((e) => {
      console.error('Create SASSA application error:', e)
      return null
    })

    // Record the application submission as a transaction (no money moves).
    await db.consumerTransaction.create({
      data: {
        id: `ctx-${randomBytes(8).toString('hex')}`,
        idempotencyKey: `${receiptNo}-grant`,
        userId,
        transactionType: 'grant_application',
        direction: 'none',
        amountCents: BigInt(Math.round(estimatedAmount * 100)),
        feeCents: BigInt(0),
        netAmountCents: BigInt(0),
        currency: 'ZAR',
        status: 'completed',
        description: `SASSA grant application: ${grantMeta.label}`,
        reference: receiptNo,
        category: 'grant',
        counterpartyName: 'SASSA',
        paymentMethod: 'internal',
        completedAt: now2,
        updatedAt: now2,
      },
    }).catch(() => null)

    return ok({
      success: true,
      data: {
        applicationRef: application?.id ?? applicationRef,
        caseRef,
        receiptNo,
        grantType,
        grantName: grantMeta.label,
        grantDesc: grantMeta.desc,
        estimatedAmount,
        beneficiaries,
        nextPaymentDate,
        status: 'submitted',
        submittedAt: now2,
        processingDays: 30,
        paymentCalendar: SASSA_PAYMENT_DATES_2026,
        terms: [
          'This is a SASSA grant application submitted via Groway Grant+.',
          `Estimated monthly amount: R${estimatedAmount.toLocaleString()} (subject to SASSA means test).`,
          `Next payment date (per SASSA 2026 calendar): ${nextPaymentDate}.`,
          'Processing typically takes 30 days for child support, 90 days for pension and disability grants.',
          'SASSA will verify your ID, means test, and supporting documents.',
          'You will be notified via SMS once your application is approved.',
          'Grant payments are made monthly via bank deposit, Post Office or cash send.',
        ],
        message: `Application for ${grantMeta.label} submitted. Reference ${applicationRef}. Estimated R${estimatedAmount.toLocaleString()}/month. Next payment ${nextPaymentDate}.`,
      },
    }, 201)
  } catch (err) {
    console.error('Apply grant error:', err)
    return error('Failed to apply for grant', 500)
  }
}
