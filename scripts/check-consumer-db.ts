import { PrismaClient } from '@prisma/client';
const db = new PrismaClient({ datasources: { db: { url: 'file:./dev.db' } } });

async function main() {
  const users = await db.consumerUser.findMany({ take: 5, select: { id: true, phone: true, firstName: true, kycLevel: true, accountStatus: true } });
  console.log('ConsumerUsers:', JSON.stringify(users, null, 1));
  if (users[0]) {
    const w = await db.consumerWallet.findFirst({ where: { userId: users[0].id } });
    console.log('Wallet for first user:', w ? { balance: w.balanceCents.toString() } : 'NONE');
    const txCount = await db.consumerTransaction.count({ where: { userId: users[0].id } });
    console.log('Tx count:', txCount);
  }
  const wallets = await db.consumerWallet.count();
  console.log('Total wallets:', wallets);
  const txTotal = await db.consumerTransaction.count();
  console.log('Total consumer txs:', txTotal);
  const providers = await db.billProvider.count();
  console.log('Bill providers:', providers);
  const stokvels = await db.stokvelGroup.count();
  console.log('Stokvel groups:', stokvels);
  const pockets = await db.savingsPocket.count();
  console.log('Savings pockets:', pockets);
  const cards = await db.consumerCard.count();
  console.log('Cards:', cards);
  const loyalty = await db.consumerLoyalty.count();
  console.log('Loyalty records:', loyalty);
  const scores = await db.consumerCreditScore.count();
  console.log('Credit scores:', scores);
  const ewa = await db.consumerEWA.count();
  console.log('EWA records:', ewa);
  const sassa = await db.consumerSASSA.count();
  console.log('SASSA records:', sassa);
  const insurance = await db.consumerInsurance.count();
  console.log('Insurance policies:', insurance);
  const bnpl = await db.consumerBNPL.count();
  console.log('BNPL records:', bnpl);
}
main().finally(() => db.$disconnect());
