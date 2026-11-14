import { LedgerService } from '../ledger/ledger';
import { mulBps, minOf } from '../shared/money';
import { splitAtSettlement } from '../repayment/waterfall';

export type Rail = 'qr_payshap' | 'instant_eft' | 'debit_card' | 'credit_card';
/** Merchant discount rate in basis points, from the GoPay five-rail structure (four rails modelled). */
export const MDR_BPS: Record<Rail, number> = { qr_payshap: 100, instant_eft: 120, debit_card: 150, credit_card: 190 };

export interface GoPayConfig {
  /** Stays false until GoPay is licensed and live. The split route refuses to run while false. */
  goPayLive: boolean;
  route: 'split' | 'debit';
  shareBps: number;
}
export interface Sale { tenantId: string; merchantId: string; saleId: string; amount: bigint; rail: Rail; currency?: string }

export class GoPayNotLiveError extends Error {
  constructor() { super('GoPay settlement split is disabled until GoPay is live and licensed'); }
}

export const acct = {
  clearing: 'partner_clearing',
  trust: 'trust_bank',
  mdr: 'mdr_revenue',
  wallet: (m: string) => `merchant_wallet:${m}`,
  loan: (m: string) => `loan_receivable:${m}`,
};

export interface SettleResult { fee: bigint; net: bigint; repaid: bigint; payout: bigint; replayed: boolean }

export async function settleSale(ledger: LedgerService, cfg: GoPayConfig, s: Sale): Promise<SettleResult> {
  if (cfg.route === 'split' && !cfg.goPayLive) throw new GoPayNotLiveError();
  if (s.amount <= 0n) throw new RangeError('sale amount must be positive');
  const cur = s.currency ?? 'ZAR';
  const fee = mulBps(s.amount, BigInt(MDR_BPS[s.rail]));
  const net = s.amount - fee;
  const base = { tenantId: s.tenantId, correlationId: s.saleId, currency: cur };
  const key = (step: string) => `${s.saleId}:${step}`;

  // Replay safety: if the final step exists, rebuild the result from stored entries and post nothing.
  const done = await ledger.get(s.tenantId, key('payout'));
  if (done) {
    const rep = await ledger.get(s.tenantId, key('repayment'));
    const repaid = rep ? rep.lines.find((l) => l.account === acct.wallet(s.merchantId))!.amount : 0n;
    return { fee, net, repaid, payout: net - repaid, replayed: true };
  }

  await ledger.post({ ...base, idempotencyKey: key('captured'), reason: 'payment_captured',
    lines: [{ account: acct.clearing, amount: s.amount }, { account: acct.wallet(s.merchantId), amount: -s.amount }] });
  await ledger.post({ ...base, idempotencyKey: key('mdr'), reason: 'merchant_fee',
    lines: [{ account: acct.wallet(s.merchantId), amount: fee }, { account: acct.mdr, amount: -fee }] });
  await ledger.post({ ...base, idempotencyKey: key('settled'), reason: 'partner_settlement',
    lines: [{ account: acct.trust, amount: s.amount }, { account: acct.clearing, amount: -s.amount }] });

  let repaid = 0n;
  if (cfg.route === 'split') {
    const outstanding = await ledger.balance(s.tenantId, acct.loan(s.merchantId));
    repaid = splitAtSettlement(net, cfg.shareBps, outstanding);
    if (repaid > 0n) {
      await ledger.post({ ...base, idempotencyKey: key('repayment'), reason: 'repayment_split',
        lines: [{ account: acct.wallet(s.merchantId), amount: repaid }, { account: acct.loan(s.merchantId), amount: -repaid }] });
    }
  }
  const payout = net - repaid;
  await ledger.post({ ...base, idempotencyKey: key('payout'), reason: 'merchant_payout',
    lines: [{ account: acct.wallet(s.merchantId), amount: payout }, { account: acct.trust, amount: -payout }] });
  return { fee, net, repaid, payout, replayed: false };
}

/** Wave 1 route: scheduled debit order collected through a licensed partner. */
export async function collectDebit(ledger: LedgerService, p: { tenantId: string; merchantId: string; debitId: string; instalment: bigint }) {
  const outstanding = await ledger.balance(p.tenantId, acct.loan(p.merchantId));
  const amount = minOf(outstanding, p.instalment);
  if (amount <= 0n) return { collected: 0n };
  await ledger.post({ tenantId: p.tenantId, idempotencyKey: `${p.debitId}:collected`, reason: 'debit_order_collected',
    correlationId: p.debitId, currency: 'ZAR',
    lines: [{ account: acct.trust, amount }, { account: acct.loan(p.merchantId), amount: -amount }] });
  return { collected: amount };
}

/** A failed debit order posts nothing to the ledger: it raises arrears and starts the collections workflow. */
export async function failedDebit(ledger: LedgerService, p: { tenantId: string; merchantId: string; instalment: bigint }) {
  const outstanding = await ledger.balance(p.tenantId, acct.loan(p.merchantId));
  return { arrears: minOf(outstanding, p.instalment), nextAction: 'collections_contact_then_hardship_offer' as const };
}
