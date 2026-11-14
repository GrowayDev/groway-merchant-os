import { db } from '../src/lib/db'

const DEMO_USER_ID = 'demo-consumer-user-001'
const DEMO_WALLET_ID = 'demo-wallet-001'

async function main() {
  // 1. ConsumerUser
  let user = await db.consumerUser.findUnique({ where: { id: DEMO_USER_ID } })
  if (!user) {
    const now = new Date()
    user = await db.consumerUser.create({
      data: {
        id: DEMO_USER_ID,
        phone: '+27820000001',
        email: 'demo@consumer.wallet',
        firstName: 'Demo',
        lastName: 'Consumer',
        pinHash: 'demo-pin',
        accountStatus: 'active',
        kycStatus: 'verified',
        kycLevel: 2,
        kycVerifiedAt: now,
        createdAt: now,
        updatedAt: now,
      },
    })
    console.log('Created ConsumerUser:', user.id)
  } else {
    console.log('ConsumerUser exists:', user.id)
  }

  // 2. ConsumerWallet
  let wallet = await db.consumerWallet.findUnique({ where: { userId: DEMO_USER_ID } })
  if (!wallet) {
    const now = new Date()
    wallet = await db.consumerWallet.create({
      data: {
        id: DEMO_WALLET_ID,
        userId: DEMO_USER_ID,
        balanceCents: BigInt(250000), // R2500.00
        reservedCents: BigInt(0),
        pendingCents: BigInt(0),
        currency: 'ZAR',
        dailySpendLimit: BigInt(50000), // R500
        monthlySpendLimit: BigInt(500000), // R5000
        dailySpentCents: BigInt(0),
        monthlySpentCents: BigInt(0),
        totalReceivedCents: BigInt(0),
        totalSentCents: BigInt(0),
        totalTopupsCents: BigInt(0),
        totalWithdrawalsCents: BigInt(0),
        createdAt: now,
        updatedAt: now,
      },
    })
    console.log('Created ConsumerWallet, balance:', wallet.balanceCents.toString())
  } else {
    console.log('ConsumerWallet exists, balance:', wallet.balanceCents.toString())
  }

  // 3. ConsumerLoyalty
  let loyalty = await db.consumerLoyalty.findUnique({ where: { userId: DEMO_USER_ID } })
  if (!loyalty) {
    const now = new Date()
    loyalty = await db.consumerLoyalty.create({
      data: {
        id: 'demo-loyalty-001',
        userId: DEMO_USER_ID,
        tier: 'silver',
        points: 1250,
        totalEarned: 5000,
        totalRedeemed: 3750,
        pointsToNextTier: 3750,
        tierProgress: 0.25,
        tierAchievedAt: now,
        createdAt: now,
        updatedAt: now,
      },
    })
    console.log('Created ConsumerLoyalty')
  } else {
    console.log('ConsumerLoyalty exists')
  }

  // 4. Seed a virtual card if model exists
  try {
    const existingCard = await db.consumerCard.findFirst({ where: { userId: DEMO_USER_ID } })
    if (!existingCard) {
      const card = await db.consumerCard.create({
        data: {
          userId: DEMO_USER_ID,
          cardType: 'virtual',
          cardNetwork: 'visa',
          cardVariant: 'debit',
          lastFour: '4242',
          expiryMonth: 12,
          expiryYear: 2028,
          cvvHash: 'hashed-cvv-123',
          status: 'active',
          isFrozen: false,
          dailySpendLimit: BigInt(50000),
          monthlySpendLimit: BigInt(500000),
        } as any,
      })
      console.log('Created ConsumerCard:', card.id)
    } else {
      console.log('ConsumerCard exists:', existingCard.id)
    }
  } catch (e: any) {
    console.log('ConsumerCard seed skipped:', e.message?.slice(0, 100))
  }

  console.log('SEED COMPLETE')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
