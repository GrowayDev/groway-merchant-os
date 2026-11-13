import { NextRequest } from 'next/server'
import { randomBytes } from 'crypto'
import { db } from '@/lib/db'
import { getUserId, ok, error, parseMoney } from '../_lib/helpers'

/**
 * /api/consumer/investments
 *
 * Replaces the previous in-memory mockInvestments and mockStokvelGroups Maps.
 *
 * - Stokvel groups: persisted with the StokvelGroup / StokvelMember Prisma
 *   models (BigInt contribution / totalSaved).
 * - Individual investments (fixed term, goal-based, notice): there is no
 *   dedicated Prisma model, so we persist contributions and withdrawals as
 *   ConsumerTransaction rows with `transactionType = 'investment'`. The
 *   `description` field encodes the product id and `category` encodes the
 *   investment type so the catalogue can be reconstructed later.
 *
 * The static investment product catalogue below remains in-memory because
 * it is read-only reference data.
 */

// Static investment product catalogue (read-only reference data)
const INVESTMENT_PRODUCTS = [
  {
    id: 'fixed-3-month',
    name: '3-Month Fixed Term Savings',
    type: 'fixed_term',
    description: 'Lock your money for 3 months and earn competitive interest.',
    minAmountCents: 100000,
    maxAmountCents: 100000000,
    termMonths: 3,
    interestRate: 7.5,
    interestType: 'fixed',
    interestPayout: 'maturity',
    features: ['Guaranteed returns', 'Interest paid at maturity', 'Early withdrawal penalty: 2%'],
  },
  {
    id: 'fixed-6-month',
    name: '6-Month Fixed Term Savings',
    type: 'fixed_term',
    description: 'Higher interest rate for a 6-month commitment.',
    minAmountCents: 100000,
    maxAmountCents: 500000000,
    termMonths: 6,
    interestRate: 8.25,
    interestType: 'fixed',
    interestPayout: 'maturity',
    features: ['Guaranteed returns', 'Interest paid at maturity', 'Early withdrawal penalty: 3%'],
  },
  {
    id: 'fixed-12-month',
    name: '12-Month Fixed Term Savings',
    type: 'fixed_term',
    description: 'Best rates for a year-long commitment.',
    minAmountCents: 100000,
    maxAmountCents: 1000000000,
    termMonths: 12,
    interestRate: 9.5,
    interestType: 'fixed',
    interestPayout: 'quarterly',
    features: ['Best guaranteed rates', 'Quarterly interest payouts', 'Early withdrawal penalty: 4%'],
  },
  {
    id: 'goal-emergency',
    name: 'Emergency Fund Goal',
    type: 'goal_based',
    description: 'Build your emergency fund with automatic savings.',
    minAmountCents: 50000,
    maxAmountCents: 50000000,
    termMonths: null,
    interestRate: 6.5,
    interestType: 'variable',
    interestPayout: 'monthly',
    features: ['Flexible deposits anytime', 'Withdraw anytime (1 day notice)', 'Interest paid monthly'],
  },
  {
    id: 'goal-holiday',
    name: 'Holiday Savings Goal',
    type: 'goal_based',
    description: 'Save for your dream vacation with targeted savings.',
    minAmountCents: 25000,
    maxAmountCents: 100000000,
    termMonths: null,
    interestRate: 7.0,
    interestType: 'variable',
    interestPayout: 'monthly',
    features: ['Set target date and amount', 'Flexible contributions', 'Interest paid monthly'],
  },
  {
    id: 'goal-education',
    name: 'Education Savings Goal',
    type: 'goal_based',
    description: 'Invest in education for yourself or loved ones.',
    minAmountCents: 100000,
    maxAmountCents: 500000000,
    termMonths: null,
    interestRate: 8.0,
    interestType: 'variable',
    interestPayout: 'monthly',
    features: ['Higher education bonus rate', 'Flexible contributions', 'Beneficiary designation'],
  },
  {
    id: 'stokvel-savings',
    name: 'Stokvel Savings Account',
    type: 'stokvel',
    description: 'Join a stokvel or create your own.',
    minAmountCents: 50000,
    maxAmountCents: 50000000,
    termMonths: 12,
    interestRate: 10.0,
    interestType: 'fixed',
    interestPayout: 'maturity',
    features: ['Create or join a stokvel group', 'Monthly contributions', 'Rotating payouts'],
  },
  {
    id: 'notice-32-day',
    name: '32-Day Notice Account',
    type: 'notice',
    description: 'Higher interest with just 32 days notice.',
    minAmountCents: 50000,
    maxAmountCents: 200000000,
    noticeDays: 32,
    termMonths: null,
    interestRate: 7.75,
    interestType: 'variable',
    interestPayout: 'monthly',
    features: ['Give 32 days notice to withdraw', 'No penalty for notice withdrawals', 'Interest paid monthly'],
  },
] as const

const INVESTMENT_TYPES = [
  { id: 'fixed_term', name: 'Fixed Term Savings', icon: 'Lock', description: 'Lock funds for a set period for higher returns' },
  { id: 'goal_based', name: 'Goal-Based Savings', icon: 'Target', description: 'Save towards specific financial goals' },
  { id: 'stokvel', name: 'Stokvel', icon: 'Users', description: 'Group savings with family and friends' },
  { id: 'notice', name: 'Notice Savings', icon: 'Clock', description: 'Higher interest with notice period for withdrawals' },
]

function calculateInterest(principalCents: bigint, ratePct: number, months: number): bigint {
  const principal = Number(principalCents)
  const monthlyRate = ratePct / 100 / 12
  return BigInt(Math.round(principal * monthlyRate * months))
}

// GET /api/consumer/investments
export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request)
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const type = searchParams.get('type')
    const productId = searchParams.get('productId')

    // List products
    if (action === 'products' || !action) {
      let products = [...INVESTMENT_PRODUCTS]
      if (type) products = products.filter((p) => p.type === type)
      return ok({
        success: true,
        data: products.map((p) => ({
          id: p.id,
          name: p.name,
          type: p.type,
          description: p.description,
          minAmountCents: p.minAmountCents,
          maxAmountCents: p.maxAmountCents,
          termMonths: p.termMonths,
          interestRate: p.interestRate,
          interestType: p.interestType,
          features: p.features?.slice(0, 3),
        })),
      })
    }

    // Product detail
    if (action === 'detail') {
      const product = INVESTMENT_PRODUCTS.find((p) => p.id === productId)
      if (!product) return error('Product not found', 404)
      return ok({ success: true, data: product })
    }

    // Investment types
    if (action === 'types') {
      return ok({ success: true, data: INVESTMENT_TYPES })
    }

    // Investment projection calculator
    if (action === 'calculate') {
      const amountInput = parseInt(searchParams.get('amount') || '0', 10)
      const product = INVESTMENT_PRODUCTS.find((p) => p.id === productId)
      if (!product) return error('Product not found', 404)
      const amount = BigInt(amountInput)
      const months = product.termMonths || 12
      const interest = calculateInterest(amount, product.interestRate, months)
      const maturity = amount + interest
      return ok({
        success: true,
        data: {
          principal: amount,
          interestRate: product.interestRate,
          term: months,
          interestEarned: interest,
          maturityValue: maturity,
          monthlyInterest: calculateInterest(amount, product.interestRate, 1),
          effectiveAnnualRate: product.interestRate,
        },
      })
    }

    // User's investments (transactions with transactionType=investment)
    if (action === 'my-investments') {
      const txs = await db.consumerTransaction.findMany({
        where: { userId, transactionType: 'investment' },
        orderBy: { createdAt: 'desc' },
      })
      return ok({ success: true, data: txs })
    }

    // Stokvels
    if (action === 'stokvels') {
      const myMemberships = await db.stokvelMember.findMany({
        where: { userId },
        include: { StokvelGroup: true },
      })
      const publicGroups = await db.stokvelGroup.findMany({
        where: { status: 'active' },
        take: 20,
        orderBy: { createdAt: 'desc' },
      })
      return ok({
        success: true,
        data: {
          myGroups: myMemberships,
          publicGroups,
        },
      })
    }

    return ok({ success: true, data: INVESTMENT_PRODUCTS })
  } catch (err) {
    console.error('Investments GET error:', err)
    return error('Failed to fetch investments', 500)
  }
}

// POST /api/consumer/investments
export async function POST(request: NextRequest) {
  try {
    const userId = getUserId(request)
    const body = await request.json().catch(() => ({} as Record<string, unknown>))
    const action = body.action as string | undefined

    // Create a new investment (persisted as an investment ConsumerTransaction)
    if (action === 'create') {
      const productId = body.productId as string | undefined
      const amountInput = body.amount ?? body.amountCents
      if (!productId || amountInput === undefined) {
        return error('productId and amount are required')
      }

      const product = INVESTMENT_PRODUCTS.find((p) => p.id === productId)
      if (!product) return error('Product not found', 404)

      const amount = parseMoney(amountInput as string | number)
      if (amount < BigInt(product.minAmountCents) || amount > BigInt(product.maxAmountCents)) {
        return error(
          `Amount must be between R${product.minAmountCents / 100} and R${product.maxAmountCents / 100}`,
          400,
        )
      }

      // Debit the wallet if it has insufficient funds
      const wallet = await db.consumerWallet.findUnique({ where: { userId } })
      if (wallet && wallet.balanceCents < amount) {
        return error('Insufficient funds', 400)
      }

      const tx = await db.$transaction(async (tx) => {
        if (wallet) {
          await tx.consumerWallet.update({
            where: { userId },
            data: {
              balanceCents: { decrement: amount },
              updatedAt: new Date(),
            },
          })
        }
        return tx.consumerTransaction.create({
          data: {
            id: `inv-${randomBytes(8).toString('hex')}`,
            idempotencyKey: randomBytes(16).toString('hex'),
            userId,
            transactionType: 'investment',
            direction: 'debit',
            amountCents: amount,
            feeCents: BigInt(0),
            netAmountCents: amount,
            currency: 'ZAR',
            status: 'completed',
            description: `Investment: ${product.name}`,
            reference: `INV-${productId}-${Date.now().toString(36).toUpperCase()}`,
            category: product.type,
            counterpartyName: product.name,
            counterpartyType: 'investment',
            paymentMethod: 'wallet_balance',
            completedAt: new Date(),
            updatedAt: new Date(),
          },
        })
      })

      return ok(
        {
          success: true,
          data: tx,
          message: 'Investment created successfully',
        },
        201,
      )
    }

    // Deposit to existing investment (by transaction id)
    if (action === 'deposit') {
      const investmentId = body.investmentId as string | undefined
      const amountInput = body.amount ?? body.depositAmount
      if (!investmentId || amountInput === undefined) {
        return error('investmentId and amount are required')
      }
      const amount = parseMoney(amountInput as string | number)
      if (amount <= 0) return error('amount must be greater than 0')

      const inv = await db.consumerTransaction.findUnique({ where: { id: investmentId } })
      if (!inv || inv.userId !== userId || inv.transactionType !== 'investment') {
        return error('Investment not found', 404)
      }

      const wallet = await db.consumerWallet.findUnique({ where: { userId } })
      if (wallet && wallet.balanceCents < amount) {
        return error('Insufficient funds', 400)
      }

      const tx = await db.$transaction(async (tx) => {
        if (wallet) {
          await tx.consumerWallet.update({
            where: { userId },
            data: { balanceCents: { decrement: amount }, updatedAt: new Date() },
          })
        }
        return tx.consumerTransaction.create({
          data: {
            id: `inv-dep-${randomBytes(8).toString('hex')}`,
            idempotencyKey: randomBytes(16).toString('hex'),
            userId,
            transactionType: 'investment',
            direction: 'debit',
            amountCents: amount,
            feeCents: BigInt(0),
            netAmountCents: amount,
            currency: 'ZAR',
            status: 'completed',
            description: `Deposit to investment ${inv.reference}`,
            reference: `INV-DEP-${Date.now().toString(36).toUpperCase()}`,
            category: inv.category,
            counterpartyName: inv.counterpartyName,
            counterpartyType: 'investment',
            originalTxId: inv.id,
            paymentMethod: 'wallet_balance',
            completedAt: new Date(),
            updatedAt: new Date(),
          },
        })
      })

      return ok({ success: true, data: tx, message: 'Deposit successful' })
    }

    // Withdraw from an investment
    if (action === 'withdraw') {
      const investmentId = body.investmentId as string | undefined
      const amountInput = body.amount ?? body.withdrawAmount
      if (!investmentId || amountInput === undefined) {
        return error('investmentId and amount are required')
      }
      const amount = parseMoney(amountInput as string | number)
      if (amount <= 0) return error('amount must be greater than 0')

      const inv = await db.consumerTransaction.findUnique({ where: { id: investmentId } })
      if (!inv || inv.userId !== userId || inv.transactionType !== 'investment') {
        return error('Investment not found', 404)
      }

      // Apply a 4% early withdrawal penalty for fixed-term investments
      const penaltyRate = inv.category === 'fixed_term' ? 0.04 : 0
      const penalty = BigInt(Math.round(Number(amount) * penaltyRate))
      const net = amount - penalty

      const tx = await db.$transaction(async (tx) => {
        const wallet = await tx.consumerWallet.findUnique({ where: { userId } })
        if (wallet) {
          await tx.consumerWallet.update({
            where: { userId },
            data: {
              balanceCents: { increment: net },
              totalReceivedCents: { increment: net },
              updatedAt: new Date(),
            },
          })
        }
        return tx.consumerTransaction.create({
          data: {
            id: `inv-wd-${randomBytes(8).toString('hex')}`,
            idempotencyKey: randomBytes(16).toString('hex'),
            userId,
            transactionType: 'investment',
            direction: 'credit',
            amountCents: amount,
            feeCents: penalty,
            netAmountCents: net,
            currency: 'ZAR',
            status: 'completed',
            description: `Withdrawal from investment ${inv.reference}`,
            reference: `INV-WD-${Date.now().toString(36).toUpperCase()}`,
            category: inv.category,
            counterpartyName: inv.counterpartyName,
            counterpartyType: 'investment',
            originalTxId: inv.id,
            paymentMethod: 'wallet_balance',
            completedAt: new Date(),
            updatedAt: new Date(),
          },
        })
      })

      return ok({ success: true, data: tx, message: 'Withdrawal successful' })
    }

    // Create a stokvel group
    if (action === 'create-stokvel') {
      const name = body.name as string | undefined
      const contributionInput = body.contributionAmount ?? body.contributionCents
      if (!name || contributionInput === undefined) {
        return error('name and contributionAmount are required')
      }
      const contribution = parseMoney(contributionInput as string | number)

      const groupId = `stokvel-${randomBytes(8).toString('hex')}`

      const stokvel = await db.$transaction(async (tx) => {
        const group = await tx.stokvelGroup.create({
          data: {
            id: groupId,
            name,
            description: (body.description as string) || null,
            creatorId: userId,
            contributionCents: contribution,
            contributionDay: (body.contributionDay as number) || 1,
            currentCycle: 1,
            status: 'active',
            totalSavedCents: BigInt(0),
            updatedAt: new Date(),
          },
        })
        // The creator becomes the first admin member with payout position 1
        await tx.stokvelMember.create({
          data: {
            id: `svm-${randomBytes(8).toString('hex')}`,
            groupId,
            userId,
            role: 'admin',
            payoutPosition: 1,
            updatedAt: new Date(),
          },
        })
        return group
      })

      return ok({ success: true, data: stokvel, message: 'Stokvel created successfully' }, 201)
    }

    return error('Invalid action', 400)
  } catch (err) {
    console.error('Investments POST error:', err)
    return error('Failed to process request', 500)
  }
}
