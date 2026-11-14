import { db } from '@/lib/db'

/**
 * SQLite enforces the foreign key on `ConsumerTransaction.userId -> ConsumerUser.id`.
 * For the demo flow (where the request has no real authenticated consumer) we
 * upsert a stable demo consumer + wallet so the transaction can be created
 * without hitting a FK violation. Returns the userId used.
 */
export async function ensureConsumerUser(userId: string): Promise<string> {
  const existing = await db.consumerUser.findUnique({ where: { id: userId } })
  if (existing) return userId

  // Use a deterministic phone derived from the userId so re-runs are idempotent.
  const phone = `+27000000${userId.slice(-4).padStart(4, '0')}`

  await db.consumerUser.upsert({
    where: { id: userId },
    create: {
      id: userId,
      phone,
      firstName: 'Consumer',
      lastName: 'Demo',
      kycLevel: 1,
      kycStatus: 'verified',
      kycVerifiedAt: new Date(),
      accountStatus: 'active',
      updatedAt: new Date(),
    },
    update: {},
  })

  // Make sure the user has a wallet too — many flows (debits, balance checks)
  // expect one to exist.
  await db.consumerWallet.upsert({
    where: { userId },
    create: {
      id: `wallet-${userId}`,
      userId,
      balanceCents: BigInt(1_000_000_00), // R1,000,000 demo balance
      currency: 'ZAR',
      updatedAt: new Date(),
    },
    update: {},
  })

  return userId
}
