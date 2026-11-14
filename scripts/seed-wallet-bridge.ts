/**
 * Seed: Consumer Wallet <-> Merchant OS bridge demo data.
 *
 * The Merchant OS demo login (demo@groway.co.za) resolves to the
 * in-memory merchant `demo_merchant_1` (The Coffee Corner). This seed
 * mirrors that merchant into the real SQLite DB (same id) so wallet
 * links / credits / payments have a valid FK target, then creates
 * GoPay consumer users + wallets for its CRM customers and a
 * believable activity feed.
 *
 * Consumer demo logins (consumer app): phone + PIN 1234.
 *
 * Run: bun scripts/seed-wallet-bridge.ts
 */
import { db } from '../src/lib/db'
import { createHash } from 'crypto'

const sha256 = (s: string) => createHash('sha256').update(s).digest('hex')
const now = () => new Date()
const minsAgo = (m: number) => new Date(Date.now() - m * 60_000)

const MERCHANT_ID = 'demo_merchant_1'
const MERCHANT_CODE = 'MCH-001001'
const MERCHANT_NAME = 'The Coffee Corner'
const MERCHANT_PHONE = '+27871100001'
const BRANCH_ID = 'demo_branch_1'
const PIN = '1234'

const SEED_CONSUMERS = [
  { id: 'cu_wallet_thandi', phone: '+27821234567', firstName: 'Thandi', lastName: 'Mbeki', email: 'thandi.m@email.com' },
  { id: 'cu_wallet_sipho', phone: '+27832345678', firstName: 'Sipho', lastName: 'Dlamini', email: 'sipho.d@email.com' },
  { id: 'cu_wallet_david', phone: '+27726789012', firstName: 'David', lastName: 'Mokoena', email: 'david.m@email.com' },
]

async function main() {
  // 0) Mirror the in-memory demo merchant into the DB (idempotent)
  await db.merchant.upsert({
    where: { id: MERCHANT_ID },
    create: {
      id: MERCHANT_ID,
      code: MERCHANT_CODE,
      name: MERCHANT_NAME,
      tradingName: MERCHANT_NAME,
      vertical: 'fnb',
      subVertical: 'coffee_shop',
      phone: MERCHANT_PHONE,
      email: 'demo@groway.co.za',
      status: 'active',
      onboardingComplete: true,
      updatedAt: now(),
    },
    update: { updatedAt: now() },
  })

  const branch = await db.branch.upsert({
    where: { id: BRANCH_ID },
    create: {
      id: BRANCH_ID,
      merchantId: MERCHANT_ID,
      code: 'BR-001',
      name: 'Main Store',
      isDefault: true,
      updatedAt: now(),
    },
    update: { updatedAt: now() },
  })
  console.log('merchant + branch ready:', MERCHANT_ID, branch.id)

  for (const c of SEED_CONSUMERS) {
    // 1) ConsumerUser + wallet
    const user = await db.consumerUser.upsert({
      where: { phone: c.phone },
      create: {
        id: c.id,
        phone: c.phone,
        email: c.email,
        firstName: c.firstName,
        lastName: c.lastName,
        kycLevel: 2,
        kycStatus: 'verified',
        pinHash: sha256(PIN),
        accountStatus: 'active',
        updatedAt: now(),
      },
      update: { accountStatus: 'active', updatedAt: now() },
    })

    await db.consumerWallet.upsert({
      where: { userId: user.id },
      create: { id: `wal_${c.id}`, userId: user.id, balanceCents: 0n, currency: 'ZAR', updatedAt: now() },
      update: { updatedAt: now() },
    })

    // 2) CRM customer + loyalty account
    const fullName = `${c.firstName} ${c.lastName}`
    const customer = await db.merchantCustomer.upsert({
      where: { merchantId_phone: { merchantId: MERCHANT_ID, phone: c.phone } },
      create: {
        id: `mc_${c.id}`,
        merchantId: MERCHANT_ID,
        name: fullName,
        phone: c.phone,
        email: c.email,
        segment: 'wallet',
        tags: JSON.stringify(['GoPay Wallet']),
        updatedAt: now(),
      },
      update: { updatedAt: now() },
    })
    const loyalty = await db.loyaltyAccount.findUnique({ where: { customerId: customer.id } })
    if (!loyalty) {
      await db.loyaltyAccount.create({
        data: { id: `la_${c.id}`, merchantId: MERCHANT_ID, customerId: customer.id, updatedAt: now() },
      })
    }

    // 3) Link
    await db.consumerWalletLink.upsert({
      where: { merchantId_consumerUserId: { merchantId: MERCHANT_ID, consumerUserId: user.id } },
      create: {
        id: `cwl_${c.id}`,
        merchantId: MERCHANT_ID,
        consumerUserId: user.id,
        merchantCustomerId: customer.id,
        status: 'active',
        lastActivityAt: minsAgo(5),
        createdAt: now(),
        updatedAt: now(),
      },
      update: { status: 'active', merchantCustomerId: customer.id, updatedAt: now() },
    })

    // 4) Activity feed (skip if already seeded)
    const existing = await db.consumerWalletActivity.count({ where: { consumerUserId: user.id } })
    if (existing > 0) {
      console.log(`activities already seeded for ${fullName}, skipping feed`)
      continue
    }

    const feed = [
      { type: 'topup', title: 'Wallet top-up', desc: 'Via card', direction: 'credit', cents: 20000n, mins: 60 * 24 * 9 },
      { type: 'payment', title: `Payment to ${MERCHANT_NAME}`, desc: 'GoPay wallet payment in-store', direction: 'debit', cents: 8950n, mins: 60 * 24 * 7 },
      { type: 'cashback', title: 'Cashback received', desc: `From ${MERCHANT_NAME}`, direction: 'credit', cents: 5000n, mins: 60 * 24 * 6 },
      { type: 'payment', title: `Payment to ${MERCHANT_NAME}`, desc: 'GoPay wallet payment in-store', direction: 'debit', cents: 12500n, mins: 60 * 24 * 3 },
      { type: 'topup', title: 'Wallet top-up', desc: 'Via EFT', direction: 'credit', cents: 30000n, mins: 60 * 24 * 2 },
      { type: 'payment', title: `Payment to ${MERCHANT_NAME}`, desc: 'GoPay wallet payment in-store', direction: 'debit', cents: 6500n, mins: 90 },
    ]

    let balance = 0n
    for (const f of feed) {
      balance = f.direction === 'credit' ? balance + f.cents : balance - f.cents
      if (balance < 0n) balance = 0n
      const ts = minsAgo(f.mins)
      await db.consumerWalletActivity.create({
        data: {
          id: `wla_${c.id}_${f.type}_${f.mins}`,
          consumerUserId: user.id,
          activityType: f.type,
          title: f.title,
          description: f.desc,
          direction: f.direction,
          amountCents: f.cents,
          balanceAfterCents: balance,
          merchantId: f.type === 'payment' || f.type === 'cashback' ? MERCHANT_ID : null,
          merchantName: f.type === 'payment' || f.type === 'cashback' ? MERCHANT_NAME : null,
          referenceType: f.type === 'payment' ? 'wallet_payment' : f.type,
          createdAt: ts,
        },
      })
      if (f.type === 'payment') {
        await db.consumerTransaction.create({
          data: {
            id: `ctx_${c.id}_${f.mins}`,
            idempotencyKey: `seed_${c.id}_${f.mins}`,
            userId: user.id,
            transactionType: 'wallet_pay',
            direction: 'debit',
            amountCents: f.cents,
            netAmountCents: f.cents,
            status: 'completed',
            description: f.desc,
            counterpartyId: MERCHANT_ID,
            counterpartyName: MERCHANT_NAME,
            counterpartyType: 'merchant',
            paymentMethod: 'gopay_wallet',
            merchantId: MERCHANT_ID,
            merchantName: MERCHANT_NAME,
            completedAt: ts,
            processedAt: ts,
            updatedAt: ts,
          },
        })
        // CRM stats
        await db.merchantCustomer.update({
          where: { id: customer.id },
          data: {
            totalSpent: { increment: Number(f.cents) / 100 },
            visitCount: { increment: 1 },
            lastVisitAt: ts,
          },
        })
      }
    }
    // Align wallet balance to feed
    await db.consumerWallet.update({
      where: { userId: user.id },
      data: { balanceCents: balance, updatedAt: now() },
    })

    console.log(`seeded ${fullName} (${c.phone}) wallet=R${Number(balance) / 100} PIN=${PIN}`)
  }

  const totals = {
    consumers: await db.consumerUser.count(),
    links: await db.consumerWalletLink.count({ where: { merchantId: MERCHANT_ID } }),
    activities: await db.consumerWalletActivity.count(),
    merchantCustomers: await db.merchantCustomer.count({ where: { merchantId: MERCHANT_ID } }),
  }
  console.log('DONE', JSON.stringify(totals))
}

main().catch((e) => { console.error(e); process.exit(1) }).finally(() => process.exit(0))
