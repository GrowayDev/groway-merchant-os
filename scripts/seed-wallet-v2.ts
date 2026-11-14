/**
 * Groway Consumer Wallet v2 — Fresh Seed
 * Seeds: merchant OS demo (minimal) + full consumer wallet financial dataset.
 * Schema-accurate (BigInt cents, Int kycLevel, correct relation wiring).
 * Idempotent: clears consumer scope, then creates.
 */
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
import { createHash, randomBytes } from 'crypto';

const base = new PrismaClient();
const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');

// Auto-fill updatedAt on all writes (models lack a DB default for it)
const prisma = base.$extends({
  query: {
    $allModels: {
      async $allOperations({ args, query }) {
        const fill = (row: unknown) => {
          if (row && typeof row === 'object' && !Array.isArray(row) && (row as Record<string, unknown>).updatedAt === undefined) {
            (row as Record<string, unknown>).updatedAt = new Date();
          }
        };
        const d = (args as Record<string, unknown> | undefined)?.data;
        if (d !== undefined) {
          if (Array.isArray(d)) d.forEach(fill); else fill(d);
        }
        return query(args as never);
      },
    },
  },
}) as unknown as PrismaClient;


const id = (p: string) => `${p}-${randomBytes(8).toString('hex')}`;
const daysAgo = (n: number, h = 10) => new Date(Date.now() - n * 86400000 + h * 3600000);
const daysAhead = (n: number) => new Date(Date.now() + n * 86400000);

const CONSUMER_PHONE = '+27821234567';
const CONSUMER_PIN = '1234';

async function seedMerchantOs() {
  const passwordHash = await hash('demo1234', 10);
  const user = await prisma.user.upsert({
    where: { id: 'user-demo' },
    update: { passwordHash },
    create: {
      id: 'user-demo',
      email: 'demo@groway.co.za',
      name: 'Demo User',
      passwordHash,
      role: 'admin',
      emailVerified: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  const merchant = await prisma.merchant.upsert({
    where: { id: 'merchant-grocery' },
    update: {},
    create: {
      id: 'merchant-grocery',
      code: 'GRW-DEMO-001',
      name: 'Demo Grocery Store',
      tradingName: 'Demo Grocery Store',
      email: 'demo@groway.co.za',
      phone: '+27112345678',
      vertical: 'grocery',
      status: 'active',
      city: 'Johannesburg',
      province: 'Gauteng',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  await prisma.branch.upsert({
    where: { id: 'branch-merchant-grocery' },
    update: {},
    create: {
      id: 'branch-merchant-grocery',
      merchantId: merchant.id,
      code: 'MAIN',
      name: 'Main Branch',
      type: 'store',
      phone: '+27112345678',
      addressLine1: '12 Vilakazi Street, Orlando West',
      city: 'Soweto',
      province: 'Gauteng',
      isDefault: true,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  await prisma.merchantUser.upsert({
    where: { id: 'mu-user-demo-merchant-grocery' },
    update: {},
    create: {
      id: 'mu-user-demo-merchant-grocery',
      userId: user.id,
      merchantId: merchant.id,
      role: 'owner',
      branchId: 'branch-merchant-grocery',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  console.log('✓ Merchant OS demo seeded (demo@groway.co.za / demo1234)');
  return merchant;
}

async function seedConsumer(merchantId: string) {
  // ---- Consumer identity --------------------------------------------------
  await prisma.consumerTransaction.deleteMany({});
  await prisma.stokvelPayout.deleteMany({});
  await prisma.stokvelContribution.deleteMany({});
  await prisma.stokvelMember.deleteMany({});
  await prisma.stokvelGroup.deleteMany({});
  await prisma.savingsPocket.deleteMany({});
  await prisma.consumerEWATransaction.deleteMany({});
  await prisma.consumerEWA.deleteMany({});
  await prisma.consumerBNPLInstalment.deleteMany({});
  await prisma.consumerBNPLPlan.deleteMany({});
  await prisma.consumerBNPL.deleteMany({});
  await prisma.consumerLoanApplication.deleteMany({});
  await prisma.consumerLoan.deleteMany({});
  await prisma.consumerCreditScore.deleteMany({});
  await prisma.consumerSASSAGrant.deleteMany({});
  await prisma.consumerSASSAApplication.deleteMany({});
  await prisma.consumerSASSA.deleteMany({});
  await prisma.consumerInsurance.deleteMany({});
  await prisma.consumerCard.deleteMany({});
  await prisma.consumerLoyalty.deleteMany({});
  await prisma.consumerQR.deleteMany({});
  await prisma.billPayment.deleteMany({});
  await prisma.billProvider.deleteMany({});
  await prisma.payShapRecipient.deleteMany({});
  await prisma.beneficiary.deleteMany({});
  await prisma.consumerWallet.deleteMany({});
  await prisma.consumerUser.deleteMany({});

  const consumer = await prisma.consumerUser.create({
    data: {
      id: 'consumer-demo-thandi',
      phone: CONSUMER_PHONE,
      email: 'thandi.demo@wallet.co.za',
      firstName: 'Thandi',
      lastName: 'Mkhize',
      idNumber: '9005140268085',
      idType: 'sa_id',
      dateOfBirth: '1990-05-14',
      nationality: 'ZA',
      kycLevel: 2,
      kycStatus: 'verified',
      kycVerifiedAt: daysAgo(120),
      pinHash: sha256(CONSUMER_PIN),
      languagePreference: 'en',
      accountStatus: 'active',
    },
  });

  const wallet = await prisma.consumerWallet.create({
    data: {
      id: 'wallet-demo-thandi',
      userId: consumer.id,
      balanceCents: 854750,
      reservedCents: 0,
      pendingCents: 0,
      dailySpendLimit: 500000,
      monthlySpendLimit: 5000000,
      dailySpentCents: 12450,
      monthlySpentCents: 342800,
      totalReceivedCents: 4123000,
      totalSentCents: 2710500,
      totalTopupsCents: 1500000,
      totalWithdrawalsCents: 500000,
    },
  });

  await prisma.consumerLoyalty.create({
    data: {
      id: 'loyalty-demo-thandi',
      userId: consumer.id,
      tier: 'gold',
      points: 4820,
      totalEarned: 6200,
      totalRedeemed: 1380,
      pointsToNextTier: 1180,
      tierProgress: 0.72,
      tierAchievedAt: daysAgo(60),
    },
  });

  await prisma.consumerCreditScore.create({
    data: {
      id: 'cscore-demo-thandi',
      userId: consumer.id,
      score: 682,
      lastUpdated: daysAgo(3),
      factors: JSON.stringify([
        { name: 'Payment history', impact: 'positive', weight: 0.35, detail: 'No missed payments in 12 months' },
        { name: 'Wallet activity', impact: 'positive', weight: 0.25, detail: 'Healthy transaction volume' },
        { name: 'Savings behaviour', impact: 'positive', weight: 0.2, detail: '3 active savings pockets' },
        { name: 'Credit utilisation', impact: 'neutral', weight: 0.2, detail: '38% of available credit used' },
      ]),
      history: JSON.stringify([
        { month: '2025-05', score: 641 }, { month: '2025-06', score: 655 },
        { month: '2025-07', score: 649 }, { month: '2025-08', score: 663 },
        { month: '2025-09', score: 671 }, { month: '2025-10', score: 682 },
      ]),
    },
  });

  // ---- Credit / loans ------------------------------------------------------
  await prisma.consumerLoan.create({
    data: {
      id: 'loan-demo-thandi-1',
      userId: consumer.id,
      lenderId: 'groway-credit',
      lenderName: 'Groway Credit',
      loanType: 'personal',
      amount: 15000,
      outstanding: 6250,
      monthlyPayment: 1450,
      interestRate: 19.5,
      termMonths: 12,
      monthsRemaining: 5,
      status: 'active',
    },
  });
  await prisma.consumerLoanApplication.create({
    data: {
      id: 'loanapp-demo-thandi-1',
      userId: consumer.id,
      lenderId: 'groway-credit',
      lenderName: 'Groway Credit',
      amount: 8000,
      term: 6,
      loanType: 'personal',
      purpose: 'Stock purchase for side business',
      status: 'approved',
    },
  });

  // ---- BNPL (plan.userId -> ConsumerBNPL.id) -------------------------------
  const bnpl = await prisma.consumerBNPL.create({
    data: {
      id: 'bnpl-demo-thandi',
      userId: consumer.id,
      eligible: true,
      creditScore: 682,
      limit: 8000,
      used: 1450,
      available: 6550,
    },
  });
  const bnplPlan = await prisma.consumerBNPLPlan.create({
    data: {
      id: 'bnplplan-demo-thandi-1',
      userId: bnpl.id,
      merchant: 'Demo Grocery Store',
      purchaseAmount: 4350,
      instalmentAmount: 1450,
      paidInstalments: 2,
      totalInstalments: 3,
      nextDueDate: daysAhead(9),
      status: 'active',
    },
  });
  await prisma.consumerBNPLInstalment.createMany({
    data: [
      { id: 'bnpli-1', planId: bnplPlan.id, number: 1, amount: 1450, dueDate: daysAgo(40), status: 'paid', paidAt: daysAgo(40) },
      { id: 'bnpli-2', planId: bnplPlan.id, number: 2, amount: 1450, dueDate: daysAgo(10), status: 'paid', paidAt: daysAgo(10) },
      { id: 'bnpli-3', planId: bnplPlan.id, number: 3, amount: 1450, dueDate: daysAhead(9), status: 'pending' },
    ],
  });

  // ---- EWA (tx.userId -> ConsumerEWA.id) ------------------------------------
  const ewa = await prisma.consumerEWA.create({
    data: {
      id: 'ewa-demo-thandi',
      userId: consumer.id,
      employeeId: 'EMP-2847',
      employer: 'Siyakhana Logistics (Pty) Ltd',
      monthlySalary: 14500,
      payDay: 25,
      accruedSalary: 9733.33,
      availableAdvance: 7300,
      usedThisMonth: 1200,
      limit: 10950,
      eligible: true,
      nextPayDay: daysAhead(12),
    },
  });
  await prisma.consumerEWATransaction.create({
    data: {
      id: 'ewatx-demo-thandi-1',
      userId: ewa.id,
      amount: 1200,
      fee: 24,
      netAmount: 1176,
      reason: 'Transport emergency',
      status: 'settled',
      repaymentDate: daysAhead(12),
      requestedAt: daysAgo(6),
      settledAt: daysAgo(6),
    },
  });

  // ---- SASSA ----------------------------------------------------------------
  const sassa = await prisma.consumerSASSA.create({
    data: {
      id: 'sassa-demo-thandi',
      userId: consumer.id,
      linked: true,
      idNumber: '9005140268085',
      status: 'active',
      totalMonthlyIncome: 1060,
    },
  });
  await prisma.consumerSASSAGrant.createMany({
    data: [
      {
        id: 'sassag-1', sassaId: sassa.id, grantType: 'child_support',
        grantName: 'Child Support Grant', amount: 530, beneficiaries: 2,
        totalAmount: 1060, status: 'approved',
        nextPayment: daysAhead(8), lastPayment: daysAgo(22),
      },
    ],
  });

  // ---- Insurance ------------------------------------------------------------
  await prisma.consumerInsurance.createMany({
    data: [
      {
        id: 'ins-1', userId: consumer.id, productType: 'funeral',
        provider: 'Groway Protect', coverAmount: 5000000, premium: 18900,
        startDate: '2024-11-01', status: 'active', nextPaymentDate: '2025-11-01',
        beneficiaries: JSON.stringify([{ name: 'Sipho Mkhize', relationship: 'spouse', share: 50 }, { name: 'Lerato Mkhize', relationship: 'daughter', share: 50 }]),
      },
      {
        id: 'ins-2', userId: consumer.id, productType: 'hospital_cash',
        provider: 'Groway Protect', coverAmount: 3000000, premium: 9900,
        startDate: '2025-03-01', status: 'active', nextPaymentDate: '2025-11-01', beneficiaries: '[]',
      },
    ],
  });

  // ---- Cards ------------------------------------------------------------------
  await prisma.consumerCard.createMany({
    data: [
      {
        id: 'card-virtual-1', userId: consumer.id, cardType: 'visa', cardCategory: 'virtual',
        cardDesign: 'groway-teal', lastFourDigits: '4821', cardToken: 'tok_' + randomBytes(12).toString('hex'),
        panEncrypted: 'enc:' + Buffer.from('4539148803434821').toString('base64'), cvvEncrypted: 'enc:821',
        expiryMonth: '08', expiryYear: '28', cardholderName: 'THANDI MKHIZE',
        status: 'active', spendingLimitDaily: 200000, onlineEnabled: true,
        contactlessEnabled: true, atmEnabled: false, internationalEnabled: false,
        issuedAt: daysAgo(100), activatedAt: daysAgo(100),
      },
      {
        id: 'card-physical-1', userId: consumer.id, cardType: 'mastercard', cardCategory: 'physical',
        cardDesign: 'groway-classic', lastFourDigits: '7734', cardToken: 'tok_' + randomBytes(12).toString('hex'),
        panEncrypted: 'enc:' + Buffer.from('5412751234567734').toString('base64'), cvvEncrypted: 'enc:447',
        expiryMonth: '02', expiryYear: '29', cardholderName: 'THANDI MKHIZE',
        status: 'active', spendingLimitDaily: 500000, onlineEnabled: true,
        contactlessEnabled: true, atmEnabled: true, internationalEnabled: true,
        issuedAt: daysAgo(200), activatedAt: daysAgo(195),
      },
    ],
  });

  // ---- Savings pockets ---------------------------------------------------------
  await prisma.savingsPocket.createMany({
    data: [
      {
        id: 'pocket-emergency', userId: consumer.id, name: 'Emergency Fund', icon: 'shield',
        color: '#00897B', targetCents: 2000000, currentCents: 1240000,
        interestRate: 0.06, interestEarned: 44550, autoSaveRule: JSON.stringify({ type: 'percent_of_topup', value: 10 }),
      },
      {
        id: 'pocket-school', userId: consumer.id, name: 'Back to School', icon: 'graduation-cap',
        color: '#7C4DFF', targetCents: 800000, currentCents: 315000,
        interestRate: 0.05, interestEarned: 9800, targetDate: '2026-01-15',
        autoSaveRule: JSON.stringify({ type: 'fixed_weekly', value: 10000 }),
      },
      {
        id: 'pocket-december', userId: consumer.id, name: 'December Groceries', icon: 'shopping-basket',
        color: '#FF8F00', targetCents: 600000, currentCents: 182500,
        interestRate: 0.05, interestEarned: 4200, targetDate: '2025-12-15',
      },
    ],
  });

  // ---- Stokvels ------------------------------------------------------------------
  const members = [
    { userId: 'consumer-demo-thandi', name: 'Thandi Mkhize', role: 'treasurer', position: 2 },
    { userId: 'consumer-member-2', name: 'Nomsa Dlamini', role: 'member', position: 1 },
    { userId: 'consumer-member-3', name: 'Busi Nkosi', role: 'member', position: 3 },
    { userId: 'consumer-member-4', name: 'Zanele Botha', role: 'member', position: 4 },
    { userId: 'consumer-member-5', name: 'Ayanda Khumalo', role: 'member', position: 5 },
  ];
  for (const m of members.slice(1)) {
    await prisma.consumerUser.create({
      data: {
        id: m.userId, phone: `+2782111${m.position}${m.position}${m.position}${m.position}${m.position}`,
        firstName: m.name.split(' ')[0], lastName: m.name.split(' ')[1],
        kycLevel: 1, kycStatus: 'verified', pinHash: sha256('1234'), accountStatus: 'active',
      },
    });
  }

  const groovy = await prisma.stokvelGroup.create({
    data: {
      id: 'stokvel-groovy-5', name: 'Groovy Five Stokvel', description: 'Monthly grocery rotation — 5 members, R2,000/month. Payout every month end.',
      icon: 'users', creatorId: 'consumer-demo-thandi', targetCents: 10000000,
      contributionCents: 200000, contributionDay: 25, payoutOrder: JSON.stringify(members.map(m => m.position)),
      currentCycle: 4, status: 'active', totalSavedCents: 4000000,
    },
  });
  const createdMembers: { id: string; userId: string; name: string }[] = [];
  for (const m of members) {
    const mem = await prisma.stokvelMember.create({
      data: {
        id: id('stokmem'), groupId: groovy.id, userId: m.userId, role: m.role,
        payoutPosition: m.position, totalContributed: BigInt(200000 * 3),
        totalReceived: m.position === 1 ? 1000000 : 0, status: 'active',
        joinedAt: daysAgo(120),
      },
    });
    createdMembers.push({ id: mem.id, userId: m.userId, name: m.name });
  }
  await prisma.stokvelContribution.createMany({
    data: createdMembers.flatMap((m) => [1, 2, 3].map((cycle) => ({
      id: id('stokcon'), groupId: groovy.id, memberId: m.id, amountCents: 200000,
      cycle, status: 'completed', paidAt: daysAgo(90 - (cycle - 1) * 30),
    }))),
  });
  await prisma.stokvelPayout.create({
    data: {
      id: id('stokpay'), groupId: groovy.id, memberId: createdMembers[1].id,
      amountCents: 1000000, cycle: 1, status: 'completed', paidAt: daysAgo(60),
    },
  });

  const christmas = await prisma.stokvelGroup.create({
    data: {
      id: 'stokvel-xmas-8', name: 'Christmas Eight Club', description: 'December payout club — 8 members, R500/month. All 8 receive payout in December.',
      icon: 'gift', creatorId: 'consumer-member-2', targetCents: 4000000,
      contributionCents: 50000, contributionDay: 1, payoutOrder: 'all_at_once',
      currentCycle: 7, status: 'active', totalSavedCents: 2800000,
    },
  });
  await prisma.stokvelMember.create({
    data: {
      id: id('stokmem2'), groupId: christmas.id, userId: 'consumer-demo-thandi',
      role: 'member', payoutPosition: 3, totalContributed: 350000,
      totalReceived: 0, status: 'active', joinedAt: daysAgo(210),
    },
  });

  // ---- Beneficiaries & PayShap -----------------------------------------------------
  await prisma.beneficiary.createMany({
    data: [
      { id: 'ben-1', userId: consumer.id, name: 'Sipho Mkhize', nickname: 'Husband', type: 'wallet', identifier: '+27827654321', isFavorite: true, useCount: 14, lastUsedAt: daysAgo(2) },
      { id: 'ben-2', userId: consumer.id, name: 'Mama Ntombi', type: 'wallet', identifier: '+27831112233', isFavorite: true, useCount: 8, lastUsedAt: daysAgo(9) },
      { id: 'ben-3', userId: consumer.id, name: 'FNB — Thandi Mkhize', type: 'bank', identifier: '62841234567', bankName: 'FNB', accountType: 'cheque', useCount: 3, lastUsedAt: daysAgo(30) },
    ],
  });
  await prisma.payShapRecipient.createMany({
    data: [
      { id: 'payshap-1', userId: consumer.id, proxyId: '+27827654321', proxyType: 'cellphone', accountHolderName: 'Sipho Mkhize', bankName: 'Standard Bank', verified: true, verifiedAt: daysAgo(50), lastUsedAt: daysAgo(2) },
      { id: 'payshap-2', userId: consumer.id, proxyId: 'thandi@groway', proxyType: 'payshap_alias', accountHolderName: 'Thandi Mkhize', bankName: 'Groway Wallet', verified: true, verifiedAt: daysAgo(90) },
      { id: 'payshap-3', userId: consumer.id, proxyId: '8405123445', proxyType: 'id_number', accountHolderName: 'Mama Ntombi', bankName: 'Capitec', verified: false },
    ],
  });

  // ---- Bill providers -----------------------------------------------------------------
  await prisma.billProvider.createMany({
    data: [
      { id: 'prov-eskom', name: 'Eskom Prepaid Electricity', category: 'electricity', accountFormat: '######', accountLabel: 'Meter number', minAmount: 1000, maxAmount: 500000, feeCents: 215, processingTime: 'instant' },
      { id: 'prov-jhb-water', name: 'City of Joburg — Water', category: 'water', accountFormat: '##########', accountLabel: 'Account number', minAmount: 2000, maxAmount: 200000, feeCents: 0, processingTime: 'instant' },
      { id: 'prov-dstv', name: 'DStv', category: 'tv', accountFormat: '########', accountLabel: 'Customer number', minAmount: 5000, maxAmount: 100000, feeCents: 250, processingTime: 'instant' },
      { id: 'prov-vodacom', name: 'Vodacom Account', category: 'mobile', accountFormat: '#########', accountLabel: 'Cellphone number', minAmount: 1000, maxAmount: 50000, feeCents: 0 },
      { id: 'prov-mtn', name: 'MTN Account', category: 'mobile', accountFormat: '#########', accountLabel: 'Cellphone number', minAmount: 1000, maxAmount: 50000, feeCents: 0 },
      { id: 'prov-gautrain', name: 'Gautrain Card', category: 'transport', accountFormat: '############', accountLabel: 'Card number', minAmount: 3000, maxAmount: 100000, feeCents: 0 },
      { id: 'prov-telkom', name: 'Telkom', category: 'internet', accountFormat: '##########', accountLabel: 'Account number', minAmount: 5000, maxAmount: 150000, feeCents: 200 },
      { id: 'prov-sanlam', name: 'Sanlam Premiums', category: 'insurance', accountFormat: '#########', accountLabel: 'Policy number', minAmount: 5000, maxAmount: 300000, feeCents: 0 },
    ],
  });

  // ---- Consumer QR (static receive code) ----------------------------------------------
  const qrPayload = JSON.stringify({ v: 'groway-qr-1', userId: consumer.id, phone: CONSUMER_PHONE, name: 'Thandi Mkhize', type: 'receive' });
  await prisma.consumerQR.create({
    data: {
      id: 'qr-static-thandi', userId: consumer.id, qrType: 'personal_receive',
      qrData: qrPayload, staticCode: true, status: 'active', nfcEnabled: false,
    },
  });

  console.log('✓ Consumer identity, wallet, loyalty, credit, BNPL, EWA, SASSA, insurance, cards, pockets, stokvels seeded');

  // ---- Transactions (30 days of realistic history) --------------------------------------
  const txSeed: Array<{
    type: string; dir: 'debit' | 'credit'; amount: number; fee?: number; desc: string;
    cat: string; days: number; merchantName?: string; counterparty?: string; cpType?: string;
    method?: string; extra?: Record<string, string>;
  }> = [
    { type: 'salary', dir: 'credit', amount: 1450000, desc: 'Salary — Siyakhana Logistics', cat: 'income', days: 24, method: 'payroll', counterparty: 'Siyakhana Logistics' },
    { type: 'sassa', dir: 'credit', amount: 106000, desc: 'SASSA Child Support Grant', cat: 'income', days: 22, method: 'government', counterparty: 'SASSA' },
    { type: 'pos_purchase', dir: 'debit', amount: 32450, desc: 'Groceries — Demo Grocery Store', cat: 'groceries', days: 21, merchantName: 'Demo Grocery Store', method: 'wallet_qr', cpType: 'merchant' },
    { type: 'airtime', dir: 'debit', amount: 5000, desc: 'Vodacom Airtime R50', cat: 'airtime', days: 20, method: 'wallet' },
    { type: 'send_money', dir: 'debit', amount: 50000, desc: 'Sent to Sipho Mkhize', cat: 'transfer', days: 19, counterparty: 'Sipho Mkhize', cpType: 'personal', method: 'wallet' },
    { type: 'electricity', dir: 'debit', amount: 20000, desc: 'Eskom Prepaid — 84.2 kWh', cat: 'utilities', days: 18, method: 'wallet', extra: { meterNumber: '04117893456', voucherToken: '4101 2233 4455 6677 8899', unitsPurchased: '84.2 kWh' } },
    { type: 'savings', dir: 'debit', amount: 10000, desc: 'Save to Emergency Fund', cat: 'savings', days: 17, method: 'wallet' },
    { type: 'stokvel', dir: 'debit', amount: 20000, desc: 'Groovy Five Stokvel — Cycle 4', cat: 'stokvel', days: 15, method: 'wallet' },
    { type: 'pos_purchase', dir: 'debit', amount: 8750, desc: 'POS — Demo Grocery Store', cat: 'groceries', days: 14, merchantName: 'Demo Grocery Store', method: 'wallet_qr' },
    { type: 'ewa', dir: 'credit', amount: 117600, desc: 'Earned wage advance — Siyakhana', cat: 'income', days: 6, method: 'ewa', fee: 240 },
    { type: 'bill', dir: 'debit', amount: 89900, desc: 'DStv Compact — November', cat: 'entertainment', days: 6, method: 'wallet' },
    { type: 'send_money', dir: 'credit', amount: 30000, desc: 'Received from Nomsa Dlamini', cat: 'transfer', days: 5, counterparty: 'Nomsa Dlamini', cpType: 'personal', method: 'payshap' },
    { type: 'pos_purchase', dir: 'debit', amount: 15600, desc: 'Weekly shop — Demo Grocery Store', cat: 'groceries', days: 5, merchantName: 'Demo Grocery Store', method: 'wallet_qr' },
    { type: 'insurance', dir: 'debit', amount: 28800, desc: 'Groway Protect premiums', cat: 'insurance', days: 4, method: 'debit_order' },
    { type: 'transport', dir: 'debit', amount: 3600, desc: 'Gautrain Top-up', cat: 'transport', days: 4, method: 'wallet' },
    { type: 'loan_repayment', dir: 'debit', amount: 145000, desc: 'Groway Credit — monthly instalment', cat: 'credit', days: 3, method: 'debit_order' },
    { type: 'bnpl_instalment', dir: 'debit', amount: 14500, desc: 'BNPL instalment 2/3 — Demo Grocery Store', cat: 'bnpl', days: 10, merchantName: 'Demo Grocery Store', method: 'wallet' },
    { type: 'data', dir: 'debit', amount: 9900, desc: 'MTN 2GB Data Bundle', cat: 'airtime', days: 3, method: 'wallet' },
    { type: 'water', dir: 'debit', amount: 28450, desc: 'Joburg Water — Account 7103...', cat: 'utilities', days: 2, method: 'wallet' },
    { type: 'pos_purchase', dir: 'debit', amount: 12450, desc: 'POS — Demo Grocery Store', cat: 'groceries', days: 1, merchantName: 'Demo Grocery Store', method: 'wallet_qr' },
    { type: 'savings', dir: 'debit', amount: 10000, desc: 'Save to Back to School', cat: 'savings', days: 1, method: 'wallet' },
    { type: 'airtime', dir: 'debit', amount: 2900, desc: 'Vodacom Airtime R29', cat: 'airtime', days: 0, method: 'wallet' },
    { type: 'pos_purchase', dir: 'debit', amount: 6730, desc: 'POS — Demo Grocery Store', cat: 'groceries', days: 0, merchantName: 'Demo Grocery Store', method: 'wallet_qr' },
  ];

  let i = 0;
  for (const t of txSeed) {
    const amountCents = BigInt(t.amount);
    const feeCents = BigInt(t.fee || 0);
    const net = t.dir === 'debit' ? amountCents + feeCents : amountCents - feeCents;
    await prisma.consumerTransaction.create({
      data: {
        id: id('ctx'), idempotencyKey: `seed-${t.type}-${i++}-${t.days}`,
        userId: consumer.id,
        transactionType: t.type,
        direction: t.dir,
        amountCents,
        feeCents,
        netAmountCents: net,
        status: 'completed',
        description: t.desc,
        category: t.cat,
        counterpartyName: t.counterparty || t.merchantName || null,
        counterpartyType: t.cpType || (t.type === 'send_money' ? 'personal' : null),
        paymentMethod: t.method || 'wallet',
        merchantId: t.merchantName ? merchantId : null,
        merchantName: t.merchantName || null,
        voucherToken: t.extra?.voucherToken || null,
        meterNumber: t.extra?.meterNumber || null,
        unitsPurchased: t.extra?.unitsPurchased || null,
        processedAt: daysAgo(t.days), completedAt: daysAgo(t.days),
        createdAt: daysAgo(t.days), updatedAt: daysAgo(t.days),
      },
    });
  }
  console.log(`✓ ${txSeed.length} wallet transactions seeded`);

  // ---- Bill payment history ----------------------------------------------------------------
  await prisma.billPayment.createMany({
    data: [
      { id: id('billpay'), userId: consumer.id, providerId: 'prov-dstv', accountNumber: '41234567', accountName: 'Thandi Mkhize', amountCents: 89900, feeCents: 250, reference: 'DSTV-NOV', status: 'completed', receiptNumber: 'RCPT-88123', processedAt: daysAgo(6) },
      { id: id('billpay2'), userId: consumer.id, providerId: 'prov-eskom', accountNumber: '04117893456', accountName: 'Prepaid', amountCents: 20000, feeCents: 215, reference: 'ELEC-TOKEN', status: 'completed', receiptNumber: 'RCPT-88410', processedAt: daysAgo(18) },
    ],
  });

  console.log('\n=== CONSUMER WALLET V2 SEED COMPLETE ===');
  console.log(`Consumer login: phone ${CONSUMER_PHONE} / PIN ${CONSUMER_PIN}`);
  console.log(`Merchant login: demo@groway.co.za / demo1234`);
  console.log(`Wallet balance: R${(854750 / 100).toFixed(2)}`);
}

async function main() {
  const merchant = await seedMerchantOs();
  await seedConsumer(merchant.id);
}

main()
  .catch((e) => { console.error('Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
