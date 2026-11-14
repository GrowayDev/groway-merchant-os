import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getConsumerAuth, isAuthError, ok, serverError, badRequest } from '@/lib/consumer-auth';
import {
  debitWallet, creditWallet, feeFor, WalletError, generateKey, reference,
  assessLoan, money,
} from '@/lib/consumer-wallet-service';
import { randomBytes } from 'crypto';

export const dynamic = 'force-dynamic';

/**
 * GET /api/consumer/v2/finance
 * Full financial-services summary: savings pockets, stokvels, credit score,
 * loans, BNPL, EWA, SASSA, insurance.
 */
export async function GET(request: NextRequest) {
  const auth = await getConsumerAuth(request);
  if (isAuthError(auth)) return auth;
  try {
    const [user, pockets, memberships, creditScore, loans, applications, bnpl, ewa, sassa, insurance, stokvelCounts] = await Promise.all([
      db.consumerUser.findUnique({ where: { id: auth.userId } }),
      db.savingsPocket.findMany({ where: { userId: auth.userId, status: 'active' }, orderBy: { createdAt: 'asc' } }),
      db.stokvelMember.findMany({ where: { userId: auth.userId, status: 'active' }, include: { StokvelGroup: true } }),
      db.consumerCreditScore.findUnique({ where: { userId: auth.userId } }),
      db.consumerLoan.findMany({ where: { userId: auth.userId, status: 'active' } }),
      db.consumerLoanApplication.findMany({ where: { userId: auth.userId }, orderBy: { createdAt: 'desc' }, take: 5 }),
      db.consumerBNPL.findFirst({ where: { userId: auth.userId }, include: { ConsumerBNPLPlan: { where: { status: 'active' }, include: { ConsumerBNPLInstalment: { where: { status: 'pending' }, orderBy: { dueDate: 'asc' } } } } } }),
      db.consumerEWA.findUnique({ where: { userId: auth.userId }, include: { ConsumerEWATransaction: { orderBy: { requestedAt: 'desc' }, take: 5 } } }),
      db.consumerSASSA.findUnique({ where: { userId: auth.userId }, include: { ConsumerSASSAGrant: true, ConsumerSASSAApplication: { orderBy: { createdAt: 'desc' }, take: 3 } } }),
      db.consumerInsurance.findMany({ where: { userId: auth.userId } }),
      db.stokvelMember.groupBy({ by: ['groupId'], _count: true }),
    ]);
    if (!user) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });

    const memberCounts = new Map<string, number>(stokvelCounts.map((c) => [c.groupId, c._count]));

    return ok({
      savings: {
        totalCents: pockets.reduce((s, p) => s + p.currentCents, 0n).toString(),
        totalInterestCents: pockets.reduce((s, p) => s + p.interestEarned, 0n).toString(),
        pockets: pockets.map((p) => ({
          id: p.id, name: p.name, icon: p.icon, color: p.color,
          targetCents: p.targetCents?.toString() ?? null,
          currentCents: p.currentCents.toString(),
          progress: p.targetCents ? Number(p.currentCents) / Number(p.targetCents) : null,
          interestRate: p.interestRate, interestEarnedCents: p.interestEarned.toString(),
          autoSaveRule: p.autoSaveRule ? JSON.parse(p.autoSaveRule) : null,
          targetDate: p.targetDate,
        })),
      },
      stokvels: {
        totalContributedCents: memberships.reduce((s, m) => s + m.totalContributed, 0n).toString(),
        groups: memberships.map((m) => ({
          membershipId: m.id, role: m.role, payoutPosition: m.payoutPosition,
          totalContributedCents: m.totalContributed.toString(),
          totalReceivedCents: m.totalReceived.toString(),
          group: {
            id: m.StokvelGroup.id, name: m.StokvelGroup.name, description: m.StokvelGroup.description,
            icon: m.StokvelGroup.icon, contributionCents: m.StokvelGroup.contributionCents.toString(),
            contributionDay: m.StokvelGroup.contributionDay, currentCycle: m.StokvelGroup.currentCycle,
            totalSavedCents: m.StokvelGroup.totalSavedCents.toString(),
            memberCount: memberCounts.get(m.StokvelGroup.id) ?? 0, // actual member count
          },
        })),
      },
      credit: {
        score: creditScore?.score ?? null,
        lastUpdated: creditScore?.lastUpdated ?? null,
        factors: creditScore?.factors ? JSON.parse(creditScore.factors) : [],
        history: creditScore?.history ? JSON.parse(creditScore.history) : [],
        loans: loans.map((l) => ({
          id: l.id, lenderName: l.lenderName, loanType: l.loanType, amount: l.amount,
          outstanding: l.outstanding, monthlyPayment: l.monthlyPayment, interestRate: l.interestRate,
          termMonths: l.termMonths, monthsRemaining: l.monthsRemaining,
        })),
        applications: applications.map((a) => ({ id: a.id, amount: a.amount, term: a.term, status: a.status, lenderName: a.lenderName, createdAt: a.createdAt })),
      },
      bnpl: bnpl ? {
        eligible: bnpl.eligible, creditScore: bnpl.creditScore,
        limit: bnpl.limit, used: bnpl.used, available: bnpl.available,
        plans: bnpl.ConsumerBNPLPlan.map((p) => ({
          id: p.id, merchant: p.merchant, purchaseAmount: p.purchaseAmount,
          instalmentAmount: p.instalmentAmount, paidInstalments: p.paidInstalments,
          totalInstalments: p.totalInstalments, nextDueDate: p.nextDueDate, status: p.status,
          pendingInstalments: p.ConsumerBNPLInstalment.map((i) => ({ id: i.id, number: i.number, amount: i.amount, dueDate: i.dueDate })),
        })),
      } : null,
      ewa: ewa ? {
        employer: ewa.employer, monthlySalary: ewa.monthlySalary, payDay: ewa.payDay,
        accruedSalary: ewa.accruedSalary, availableAdvance: ewa.availableAdvance,
        usedThisMonth: ewa.usedThisMonth, limit: ewa.limit, eligible: ewa.eligible,
        nextPayDay: ewa.nextPayDay,
        transactions: ewa.ConsumerEWATransaction.map((t) => ({ id: t.id, amount: t.amount, fee: t.fee, netAmount: t.netAmount, reason: t.reason, status: t.status, requestedAt: t.requestedAt })),
      } : null,
      sassa: sassa ? {
        linked: sassa.linked, status: sassa.status, totalMonthlyIncome: sassa.totalMonthlyIncome,
        grants: sassa.ConsumerSASSAGrant.map((g) => ({ id: g.id, grantType: g.grantType, grantName: g.grantName, amount: g.amount, beneficiaries: g.beneficiaries, totalAmount: g.totalAmount, status: g.status, nextPayment: g.nextPayment, lastPayment: g.lastPayment })),
      } : null,
      insurance: {
        policies: insurance.map((p) => ({
          id: p.id, productType: p.productType, provider: p.provider,
          coverAmountCents: p.coverAmount.toString(), premiumCents: p.premium.toString(),
          startDate: p.startDate, nextPaymentDate: p.nextPaymentDate, status: p.status,
          beneficiaries: p.beneficiaries ? JSON.parse(p.beneficiaries) : [],
        })),
        monthlyPremiumCents: insurance.filter(p => p.status === 'active').reduce((s, p) => s + p.premium, 0n).toString(),
      },
    });
  } catch (e) { console.error('finance error', e); return serverError(); }
}

/**
 * POST /api/consumer/v2/finance
 * body: { action: 'savings_deposit' | 'savings_withdraw' | 'savings_create'
 *       | 'stokvel_contribute' | 'loan_apply' | 'bnpl_pay' | 'ewa_withdraw'
 *       | 'insurance_subscribe', ... }
 */
export async function POST(request: NextRequest) {
  const auth = await getConsumerAuth(request);
  if (isAuthError(auth)) return auth;

  try {
    const body = await request.json();

    switch (body.action) {
      // ---------- Savings ----------
      case 'savings_deposit': {
        const amountCents = BigInt(body.amountCents ?? 0);
        if (amountCents <= 0n) return badRequest('Enter a valid amount');
        const pocket = await db.savingsPocket.findUnique({ where: { id: body.pocketId } });
        if (!pocket || pocket.userId !== auth.userId) return badRequest('Savings pocket not found');
        if (pocket.targetCents && pocket.currentCents + amountCents > pocket.targetCents) {
          return badRequest(`Deposit exceeds goal target of ${money(pocket.targetCents)}`);
        }
        const txn = await debitWallet({
          userId: auth.userId, transactionType: 'savings', direction: 'debit',
          amountCents, description: `Save to ${pocket.name}`, category: 'savings',
          counterpartyId: pocket.id, counterpartyName: pocket.name, counterpartyType: 'savings',
          idempotencyKey: body.idempotencyKey || generateKey('savdep'),
        });
        await db.savingsPocket.update({ where: { id: pocket.id }, data: { currentCents: { increment: amountCents }, updatedAt: new Date() } });
        return ok({ transaction: { id: txn.id, reference: txn.reference }, message: `Deposited ${money(amountCents)} to ${pocket.name}` });
      }

      case 'savings_withdraw': {
        const amountCents = BigInt(body.amountCents ?? 0);
        const pocket = await db.savingsPocket.findUnique({ where: { id: body.pocketId } });
        if (!pocket || pocket.userId !== auth.userId) return badRequest('Savings pocket not found');
        if (amountCents <= 0n || amountCents > pocket.currentCents) return badRequest('Withdrawal exceeds pocket balance');
        await db.savingsPocket.update({ where: { id: pocket.id }, data: { currentCents: { decrement: amountCents }, updatedAt: new Date() } });
        const txn = await creditWallet({
          userId: auth.userId, transactionType: 'savings_withdrawal', direction: 'credit',
          amountCents, description: `Withdrew from ${pocket.name}`, category: 'savings',
          counterpartyId: pocket.id, counterpartyName: pocket.name, counterpartyType: 'savings',
          idempotencyKey: body.idempotencyKey || generateKey('savwd'),
        });
        return ok({ transaction: { id: txn.id, reference: txn.reference }, message: `Withdrew ${money(amountCents)} from ${pocket.name}` });
      }

      case 'savings_create': {
        if (!body.name) return badRequest('Pocket name is required');
        const pocket = await db.savingsPocket.create({
          data: {
            id: `pocket-${randomBytes(8).toString('hex')}`,
            userId: auth.userId,
            name: String(body.name).slice(0, 40),
            icon: body.icon ?? 'wallet',
            color: body.color ?? '#00897B',
            targetCents: body.targetCents ? BigInt(body.targetCents) : null,
            interestRate: 0.05,
            autoSaveRule: body.autoSaveRule ? JSON.stringify(body.autoSaveRule) : null,
            targetDate: body.targetDate ?? null,
            updatedAt: new Date(),
          },
        });
        return ok({ pocket: { id: pocket.id, name: pocket.name }, message: 'Savings pocket created' });
      }

      // ---------- Stokvel ----------
      case 'stokvel_contribute': {
        const amountCents = BigInt(body.amountCents ?? 0);
        const membership = await db.stokvelMember.findUnique({ where: { id: body.membershipId }, include: { StokvelGroup: true } });
        if (!membership || membership.userId !== auth.userId) return badRequest('Stokvel membership not found');
        const group = membership.StokvelGroup;
        if (amountCents < group.contributionCents) {
          return badRequest(`Minimum contribution for ${group.name} is ${money(group.contributionCents)}`);
        }
        const txn = await debitWallet({
          userId: auth.userId, transactionType: 'stokvel', direction: 'debit',
          amountCents, description: `${group.name} — Cycle ${group.currentCycle}`, category: 'stokvel',
          counterpartyId: group.id, counterpartyName: group.name, counterpartyType: 'stokvel',
          idempotencyKey: body.idempotencyKey || generateKey('stok'),
        });
        const [contribution, member] = await db.$transaction([
          db.stokvelContribution.create({
            data: {
              id: `stokcon-${randomBytes(8).toString('hex')}`,
              groupId: group.id, memberId: membership.id, amountCents,
              cycle: group.currentCycle, status: 'completed', paidAt: new Date(), updatedAt: new Date(),
            },
          }),
          db.stokvelMember.update({ where: { id: membership.id }, data: { totalContributed: { increment: amountCents }, updatedAt: new Date() } }),
          db.stokvelGroup.update({ where: { id: group.id }, data: { totalSavedCents: { increment: amountCents }, updatedAt: new Date() } }),
        ]);
        return ok({
          transaction: { id: txn.id, reference: txn.reference }, contributionId: contribution.id,
          message: `Contributed ${money(amountCents)} to ${group.name}`,
        });
      }

      // ---------- Loan ----------
      case 'loan_apply': {
        const amount = Number(body.amount);
        const term = Number(body.term);
        const decision = await assessLoan(auth.userId, amount, term);
        const app = await db.consumerLoanApplication.create({
          data: {
            id: `loanapp-${randomBytes(8).toString('hex')}`,
            userId: auth.userId, lenderId: 'groway-credit', lenderName: 'Groway Credit',
            amount, term, loanType: body.loanType ?? 'personal', purpose: body.purpose ?? null,
            status: 'approved', updatedAt: new Date(),
          },
        });
        // Instant disbursement to wallet + active loan record
        const txn = await creditWallet({
          userId: auth.userId, transactionType: 'loan_disbursement', direction: 'credit',
          amountCents: BigInt(Math.round(amount * 100)),
          description: `Groway Credit personal loan — ${term} months @ ${decision.interestRate}%`,
          category: 'credit', counterpartyName: 'Groway Credit', counterpartyType: 'lender',
          paymentMethod: 'groway_credit', reference: reference('LOAN'),
          idempotencyKey: body.idempotencyKey || generateKey('loan'),
        });
        const loan = await db.consumerLoan.create({
          data: {
            id: `loan-${randomBytes(8).toString('hex')}`,
            userId: auth.userId, lenderId: 'groway-credit', lenderName: 'Groway Credit',
            loanType: body.loanType ?? 'personal', amount,
            outstanding: decision.totalRepayment, monthlyPayment: decision.monthlyPayment,
            interestRate: decision.interestRate, termMonths: term, monthsRemaining: term,
            status: 'active', updatedAt: new Date(),
          },
        });
        return ok({
          applicationId: app.id, loanId: loan.id, decision,
          transaction: { id: txn.id, reference: txn.reference },
          message: `Approved! ${money(BigInt(Math.round(amount * 100)))} paid into your wallet`,
        });
      }

      // ---------- BNPL ----------
      case 'bnpl_pay': {
        const instalment = await db.consumerBNPLInstalment.findUnique({ where: { id: body.instalmentId }, include: { ConsumerBNPLPlan: true } });
        if (!instalment || instalment.status !== 'pending') return badRequest('Instalment not found or already paid');
        const plan = instalment.ConsumerBNPLPlan;
        const bnpl = await db.consumerBNPL.findUnique({ where: { id: plan.userId } });
        if (!bnpl || bnpl.userId !== auth.userId) return badRequest('BNPL account mismatch');
        const amountCents = BigInt(Math.round(instalment.amount * 100));
        const txn = await debitWallet({
          userId: auth.userId, transactionType: 'bnpl_instalment', direction: 'debit',
          amountCents, description: `BNPL instalment ${instalment.number}/${plan.totalInstalments} — ${plan.merchant}`,
          category: 'bnpl', counterpartyName: plan.merchant, counterpartyType: 'merchant',
          idempotencyKey: body.idempotencyKey || generateKey('bnplpay'),
        });
        const paid = plan.paidInstalments + 1;
        const done = paid >= plan.totalInstalments;
        await db.$transaction([
          db.consumerBNPLInstalment.update({ where: { id: instalment.id }, data: { status: 'paid', paidAt: new Date(), updatedAt: new Date() } }),
          db.consumerBNPLPlan.update({
            where: { id: plan.id },
            data: {
              paidInstalments: paid,
              status: done ? 'completed' : 'active',
              nextDueDate: done ? null : new Date(Date.now() + 30 * 86400000),
              updatedAt: new Date(),
            },
          }),
          db.consumerBNPL.update({
            where: { id: bnpl.id },
            data: { used: { decrement: instalment.amount }, available: { increment: instalment.amount }, updatedAt: new Date() },
          }),
        ]);
        return ok({ transaction: { id: txn.id, reference: txn.reference }, completed: done, message: done ? 'Plan complete — limit restored!' : `Instalment ${instalment.number} paid` });
      }

      // ---------- EWA ----------
      case 'ewa_withdraw': {
        const ewa = await db.consumerEWA.findUnique({ where: { userId: auth.userId } });
        if (!ewa || !ewa.eligible) return badRequest('Earned wage access not available');
        const amount = Math.floor(Number(body.amount) * 100) / 100;
        if (amount < 50) return badRequest('Minimum advance is R50');
        if (amount > ewa.availableAdvance) return badRequest(`Maximum available advance is R${ewa.availableAdvance.toFixed(2)}`);
        const fee = Math.round(amount * 2) / 100; // 2%
        const net = amount - fee;
        const txn = await creditWallet({
          userId: auth.userId, transactionType: 'ewa', direction: 'credit',
          amountCents: BigInt(Math.round(net * 100)), feeCents: BigInt(Math.round(fee * 100)),
          description: `Wage advance — ${ewa.employer ?? 'employer'}`, category: 'income',
          counterpartyName: ewa.employer, counterpartyType: 'employer', paymentMethod: 'ewa',
          idempotencyKey: body.idempotencyKey || generateKey('ewa'),
        });
        await db.$transaction([
          db.consumerEWA.update({ where: { userId: auth.userId }, data: { availableAdvance: { decrement: amount }, usedThisMonth: { increment: amount }, accruedSalary: { decrement: amount }, updatedAt: new Date() } }),
          db.consumerEWATransaction.create({
            data: {
              id: `ewatx-${randomBytes(8).toString('hex')}`, userId: ewa.id, amount, fee, netAmount: net,
              reason: body.reason ?? 'Advance withdrawal', status: 'settled',
              repaymentDate: ewa.nextPayDay, requestedAt: new Date(), settledAt: new Date(), updatedAt: new Date(),
            },
          }),
        ]);
        return ok({ transaction: { id: txn.id, reference: txn.reference }, netAmount: net, fee, message: `R${net.toFixed(2)} sent to your wallet (fee R${fee.toFixed(2)})` });
      }

      // ---------- Insurance ----------
      case 'insurance_subscribe': {
        const products: Record<string, { provider: string; premiums: Record<string, number> }> = {
          funeral: { provider: 'Groway Protect', premiums: { '5000000': 18900, '10000000': 34500, '25000000': 78900 } },
          hospital_cash: { provider: 'Groway Protect', premiums: { '3000000': 9900, '6000000': 18900 } },
          savings_protector: { provider: 'Groway Protect', premiums: { '2000000': 7900, '5000000': 17500 } },
        };
        const product = products[body.productType];
        if (!product) return badRequest('Unknown insurance product');
        const premium = product.premiums[String(body.coverAmountCents)];
        if (!premium) return badRequest('Invalid cover amount for this product');
        const txn = await debitWallet({
          userId: auth.userId, transactionType: 'insurance', direction: 'debit',
          amountCents: BigInt(premium), feeCents: 0n,
          description: `First premium — ${body.productType.replace('_', ' ')} (${product.provider})`,
          category: 'insurance', counterpartyName: product.provider, counterpartyType: 'insurer',
          idempotencyKey: body.idempotencyKey || generateKey('ins'),
        });
        const policy = await db.consumerInsurance.create({
          data: {
            id: `ins-${randomBytes(8).toString('hex')}`, userId: auth.userId,
            productType: body.productType, provider: product.provider,
            coverAmount: BigInt(body.coverAmountCents), premium: BigInt(premium),
            startDate: new Date().toISOString().slice(0, 10),
            nextPaymentDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
            status: 'active',
            beneficiaries: body.beneficiaries ? JSON.stringify(body.beneficiaries) : '[]',
            updatedAt: new Date(),
          },
        });
        return ok({ policyId: policy.id, transaction: { id: txn.id }, message: 'Policy active — cover starts today' });
      }

      default:
        return badRequest('Unknown action');
    }
  } catch (e) {
    if (e instanceof WalletError) {
      return NextResponse.json({ success: false, error: e.message, code: e.code }, { status: e.status });
    }
    console.error('finance action error', e);
    return serverError();
  }
}
