import { NextRequest } from 'next/server'
import { randomBytes } from 'crypto'
import { db } from '@/lib/db'
import { getUserId, ok, error } from '../_lib/helpers'
import { generateCaseRef, generateReceiptNo } from '@/lib/consumer-wallet/catalog'

/**
 * /api/consumer/laybye
 *
 * Digital laybye agreements — protected under the National Credit Act.
 * A laybye is a purchase plan where the merchant holds the item while the
 * consumer pays it off in instalments. Money is stored as Float (ZAR) on
 * the ConsumerLaybye model per the Prisma schema.
 *
 * Each agreement creates a ConsumerTransaction for the deposit and a
 * ConsumerLaybyePayment record tracking the deposit type.
 */

// GET /api/consumer/laybye — list user's laybye agreements
export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request)

    const laybyes = await db.consumerLaybye.findMany({
      where: { userId },
      include: { ConsumerLaybyePayment: { orderBy: { createdAt: 'desc' } } },
      orderBy: { createdAt: 'desc' },
    }).catch(() => [])

    return ok({
      success: true,
      data: {
        laybyes: laybyes.map((l) => {
          const progress = l.totalInstalments > 0
            ? Math.min(100, Math.round((l.instalmentsPaid / l.totalInstalments) * 100))
            : 0
          return {
            id: l.id,
            merchant: l.merchant,
            item: l.item,
            itemPrice: l.itemPrice,
            deposit: l.deposit,
            totalPaid: l.totalPaid,
            remainingBalance: l.remainingBalance,
            instalmentAmount: l.instalmentAmount,
            instalmentsPaid: l.instalmentsPaid,
            totalInstalments: l.totalInstalments,
            nextDueDate: l.nextDueDate,
            expiresAt: l.expiresAt,
            status: l.status,
            ncaProtected: l.ncaProtected,
            progress,
            payments: l.ConsumerLaybyePayment.map((p) => ({
              id: p.id,
              amount: p.amount,
              type: p.type,
              status: p.status,
              createdAt: p.createdAt,
            })),
            createdAt: l.createdAt,
          }
        }),
        explainer:
          'A laybye lets you pay off an item in instalments while the merchant holds it for you. Laybyes are protected under the National Credit Act — you can cancel within 48 hours for a full refund, and the merchant may not charge more than 1% cancellation fee thereafter.',
      },
    })
  } catch (err) {
    console.error('Get laybye error:', err)
    return error('Failed to fetch laybyes', 500)
  }
}

// POST /api/consumer/laybye — create a laybye agreement
export async function POST(request: NextRequest) {
  try {
    const userId = getUserId(request)
    const body = await request.json().catch(() => ({} as Record<string, unknown>))

    const merchantId = (body.merchantId as string | undefined) ?? null
    const merchantName = (body.merchantName as string | undefined) ?? (merchantId ? 'Linked Merchant' : 'Retailer')
    const itemName = (body.itemName as string | undefined)?.trim()
    const itemPrice = Number(body.itemPrice ?? 0)
    const depositAmount = Number(body.depositAmount ?? 0)
    const instalmentAmount = Number(body.instalmentAmount ?? 0)

    if (!itemName) return error('itemName is required', 400)
    if (itemPrice <= 0) return error('itemPrice must be greater than 0', 400)
    if (depositAmount <= 0) return error('depositAmount must be greater than 0', 400)
    if (instalmentAmount <= 0) return error('instalmentAmount must be greater than 0', 400)
    if (depositAmount > itemPrice) return error('deposit cannot exceed item price', 400)

    // Calculate the schedule.
    const remainingBalance = Math.round((itemPrice - depositAmount) * 100) / 100
    const totalInstalments = Math.ceil(remainingBalance / instalmentAmount)
    const lastInstalmentAmount = Math.round((remainingBalance - instalmentAmount * (totalInstalments - 1)) * 100) / 100

    const now = new Date()
    const nextDueDate = new Date(now)
    nextDueDate.setDate(nextDueDate.getDate() + 7) // first instalment in a week
    const expiresAt = new Date(now)
    expiresAt.setMonth(expiresAt.getMonth() + 6) // 6-month window

    const laybyeId = `laybye-${randomBytes(8).toString('hex')}`
    const caseRef = generateCaseRef('LAY')
    const receiptNo = generateReceiptNo('LAY')

    // Create the laybye + record the deposit as a payment + transaction.
    await db.$transaction([
      db.consumerLaybye.create({
        data: {
          id: laybyeId,
          userId,
          merchant: `${merchantName}${merchantId ? ` (${merchantId})` : ''}`,
          item: itemName,
          itemPrice,
          deposit: depositAmount,
          totalPaid: depositAmount,
          remainingBalance,
          instalmentAmount,
          instalmentsPaid: 0,
          totalInstalments,
          nextDueDate,
          expiresAt,
          status: 'active',
          ncaProtected: true,
          updatedAt: now,
          ConsumerLaybyePayment: {
            create: {
              id: `laybye-pay-${randomBytes(6).toString('hex')}`,
              amount: depositAmount,
              type: 'deposit',
              status: 'completed',
              updatedAt: now,
            },
          },
        },
      }),
      db.consumerTransaction.create({
        data: {
          id: `ctx-${randomBytes(8).toString('hex')}`,
          idempotencyKey: `${receiptNo}-dep`,
          userId,
          transactionType: 'laybye_deposit',
          direction: 'debit',
          amountCents: BigInt(Math.round(depositAmount * 100)),
          feeCents: BigInt(0),
          netAmountCents: BigInt(Math.round(depositAmount * 100)),
          currency: 'ZAR',
          status: 'completed',
          description: `Laybye deposit: ${itemName}`,
          reference: receiptNo,
          category: 'laybye',
          merchantId: merchantId ?? undefined,
          merchantName: merchantName ?? undefined,
          paymentMethod: 'wallet',
          completedAt: now,
          updatedAt: now,
        },
      }),
    ])

    return ok({
      success: true,
      data: {
        laybyeId,
        caseRef,
        receiptNo,
        merchant: merchantName,
        merchantId,
        item: itemName,
        itemPrice,
        deposit: depositAmount,
        totalPaid: depositAmount,
        remainingBalance,
        instalmentAmount,
        instalmentsPaid: 0,
        totalInstalments,
        lastInstalmentAmount,
        nextDueDate,
        expiresAt,
        status: 'active',
        ncaProtected: true,
        schedule: Array.from({ length: totalInstalments }, (_, i) => {
          const due = new Date(now)
          due.setDate(due.getDate() + 7 * (i + 1))
          return {
            number: i + 1,
            amount: i === totalInstalments - 1 ? lastInstalmentAmount : instalmentAmount,
            dueDate: due,
            status: 'pending',
          }
        }),
        terms: [
          'This laybye is protected under the National Credit Act (NCA).',
          'You may cancel within 48 hours for a full refund of all amounts paid.',
          'After 48 hours, the merchant may charge a cancellation fee of up to 1% of the item price.',
          `Item will be held for you until ${expiresAt.toLocaleDateString('en-ZA')} (6 months).`,
          `Weekly instalments of R${instalmentAmount.toFixed(2)} start on ${nextDueDate.toLocaleDateString('en-ZA')}.`,
          'Once the full price is paid, the merchant will release the item to you.',
          'Failure to maintain payments may result in cancellation of the laybye per NCA regulations.',
        ],
        message: `Laybye created for ${itemName}. Deposit of R${depositAmount.toFixed(2)} recorded. ${totalInstalments} weekly instalments of R${instalmentAmount.toFixed(2)} start ${nextDueDate.toLocaleDateString('en-ZA')}.`,
      },
    }, 201)
  } catch (err) {
    console.error('Create laybye error:', err)
    return error('Failed to create laybye', 500)
  }
}
