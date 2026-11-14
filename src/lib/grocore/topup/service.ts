import { LedgerService } from '../ledger/ledger';
import { uuidv7 } from '../shared/ids';
import { mulBps, minOf } from '../shared/money';
import { History, Product, assessEligibility, quoteFee } from './products';

export interface AdvanceRecord {
  id: string; tenantId: string; subjectId: string; productId: string; requestId: string;
  principal: bigint; fee: bigint; recovered: bigint; issuedAt: Date;
  status: 'pending' | 'open' | 'repaid' | 'billed' | 'written_off' | 'cancelled';
}
export interface AdvanceRepo {
  byRequest(tenantId: string, requestId: string): Promise<AdvanceRecord | undefined>;
  openFor(tenantId: string, subjectId: string): Promise<AdvanceRecord | undefined>;
  save(r: AdvanceRecord): Promise<void>;
}
export class InMemoryAdvanceRepo implements AdvanceRepo {
  private rows: AdvanceRecord[] = [];
  async byRequest(t: string, id: string) { return this.rows.find((r) => r.tenantId === t && r.requestId === id); }
  async openFor(t: string, s: string) { return this.rows.find((r) => r.tenantId === t && r.subjectId === s && (r.status === 'open' || r.status === 'pending')); }
  async save(r: AdvanceRecord) { const i = this.rows.findIndex((x) => x.id === r.id); if (i >= 0) this.rows[i] = r; else this.rows.push(r); }
}

export class TopUpCreditError extends Error {
  constructor(public readonly code: string, message: string) { super(message); }
}

export const topupAcct = {
  receivable: (subject: string) => `advance_receivable:${subject}`,
  supplier: (commodity: string) => `supplier_payable:${commodity}`,
  fee: 'fee_income:topup',
  clearing: 'collections_clearing',
  badDebt: 'bad_debt_expense',
};

export class TopUpCredit {
  private products: Map<string, Product>;
  constructor(private ledger: LedgerService, private repo: AdvanceRepo, products: Product[]) {
    this.products = new Map(products.map((p) => [p.id, p]));
  }
  getProduct(id: string) { return this.product(id); }
  private product(id: string) {
    const p = this.products.get(id);
    if (!p) throw new TopUpCreditError('UNKNOWN_PRODUCT', id);
    return p;
  }

  /** Everything the customer sees before accepting: amount, fee, total to repay. */
  quote(productId: string, amountMinor: bigint) {
    const p = this.product(productId);
    if (!p.menuMinor.includes(amountMinor)) throw new TopUpCreditError('NOT_ON_MENU', 'amount is not an offered advance');
    const fee = quoteFee(p, amountMinor);
    return { principal: amountMinor, fee, totalDue: amountMinor + fee };
  }

  /** Issue an advance. The commodity (airtime, data or a meter token) is delivered by the operator or vendor adapter. */
  async issue(a: { tenantId: string; subjectId: string; productId: string; amountMinor: bigint; requestId: string; history: History; now?: Date }) {
    const now = a.now ?? new Date();
    const existing = await this.repo.byRequest(a.tenantId, a.requestId);
    if (existing) return { record: existing, replayed: true };
    const p = this.product(a.productId);
    if (await this.repo.openFor(a.tenantId, a.subjectId)) throw new TopUpCreditError('OPEN_ADVANCE', 'one advance at a time');
    const el = assessEligibility(p, a.history, now);
    if (!el.ok) throw new TopUpCreditError('NOT_ELIGIBLE', el.reasons.join(','));
    if (a.amountMinor > el.maxMinor) throw new TopUpCreditError('ABOVE_LIMIT', `limit is ${el.maxMinor}`);
    const q = this.quote(a.productId, a.amountMinor);
    await this.ledger.post({
      tenantId: a.tenantId, idempotencyKey: `${a.requestId}:issued`, reason: 'advance_issued', correlationId: a.requestId, currency: p.currency,
      lines: [
        { account: topupAcct.receivable(a.subjectId), amount: q.totalDue },
        { account: topupAcct.supplier(p.commodity), amount: -q.principal },
        { account: topupAcct.fee, amount: -q.fee },
      ],
    });
    const record: AdvanceRecord = { id: uuidv7(), tenantId: a.tenantId, subjectId: a.subjectId, productId: p.id, requestId: a.requestId,
      principal: q.principal, fee: q.fee, recovered: 0n, issuedAt: now, status: 'open' };
    await this.repo.save(record);
    return { record, replayed: false };
  }

  /**
   * Called on every top-up or purchase by the subject (the clawback). Takes what the product rule allows,
   * posts it, and tells the vending adapter how much of the purchase to pass through as normal value.
   */
  async recover(a: { tenantId: string; subjectId: string; topupRef: string; topupAmountMinor: bigint }) {
    if (a.topupAmountMinor <= 0n) throw new RangeError('top-up amount must be positive');
    const key = `${a.topupRef}:recovered`;
    const done = await this.ledger.get(a.tenantId, key);
    if (done) {
      const taken = -done.lines.find((l) => l.account === topupAcct.receivable(a.subjectId))!.amount;
      return { taken, passThrough: a.topupAmountMinor - taken, replayed: true, repaid: false };
    }
    const open = await this.repo.openFor(a.tenantId, a.subjectId);
    if (!open || open.status !== 'open') return { taken: 0n, passThrough: a.topupAmountMinor, replayed: false, repaid: false };
    const p = this.product(open.productId);
    const due = open.principal + open.fee - open.recovered;
    const room = p.recovery.mode === 'capped_share' ? mulBps(a.topupAmountMinor, BigInt(p.recovery.capBps ?? 10000)) : a.topupAmountMinor;
    const taken = minOf(due, room);
    if (taken > 0n) {
      await this.ledger.post({
        tenantId: a.tenantId, idempotencyKey: key, reason: 'advance_recovered', correlationId: a.topupRef, currency: p.currency,
        lines: [{ account: topupAcct.clearing, amount: taken }, { account: topupAcct.receivable(a.subjectId), amount: -taken }],
      });
      open.recovered += taken;
      if (open.recovered === open.principal + open.fee) open.status = 'repaid';
      await this.repo.save(open);
    }
    return { taken, passThrough: a.topupAmountMinor - taken, replayed: false, repaid: open.status === 'repaid' };
  }

  /** Delivery outcome unknown: keep the advance, block a second one, and do not recover until delivery is confirmed. */
  async markPending(tenantId: string, requestId: string) {
    const r = await this.repo.byRequest(tenantId, requestId);
    if (r && r.status === 'open') { r.status = 'pending'; await this.repo.save(r); }
    return r;
  }
  /** Delivery confirmed after an unknown outcome. */
  async confirm(tenantId: string, requestId: string) {
    const r = await this.repo.byRequest(tenantId, requestId);
    if (r && r.status === 'pending') { r.status = 'open'; await this.repo.save(r); }
    return r;
  }
  /** Delivery definitely failed: reverse the issue entry exactly, so nothing is owed. Not allowed once any recovery has happened. */
  async cancel(tenantId: string, requestId: string) {
    const r = await this.repo.byRequest(tenantId, requestId);
    if (!r || r.status === 'cancelled') return r;
    if (r.recovered > 0n || (r.status !== 'open' && r.status !== 'pending')) throw new TopUpCreditError('CANNOT_CANCEL', 'advance already in repayment or closed');
    const p = this.product(r.productId);
    await this.ledger.post({
      tenantId, idempotencyKey: `${requestId}:cancelled`, reason: 'advance_cancelled', correlationId: requestId, currency: p.currency,
      lines: [
        { account: topupAcct.supplier(p.commodity), amount: r.principal },
        { account: topupAcct.fee, amount: r.fee },
        { account: topupAcct.receivable(r.subjectId), amount: -(r.principal + r.fee) },
      ],
    });
    r.status = 'cancelled'; await this.repo.save(r);
    return r;
  }

  /** Daily job: what to do with advances not recovered within the product's period. */
  async applyOverdue(tenantId: string, subjectId: string, now: Date) {
    const open = await this.repo.openFor(tenantId, subjectId);
    if (!open || open.status !== 'open') return { action: 'none' as const };
    const p = this.product(open.productId);
    if (now.getTime() - open.issuedAt.getTime() < p.dueAfterDays * 86400000) return { action: 'none' as const };
    const owing = open.principal + open.fee - open.recovered;
    if (p.overdueAction === 'add_to_bill') {
      open.status = 'billed'; await this.repo.save(open);
      return { action: 'add_to_bill' as const, amountMinor: owing };
    }
    await this.ledger.post({
      tenantId, idempotencyKey: `${open.requestId}:written_off`, reason: 'advance_written_off', correlationId: open.requestId, currency: p.currency,
      lines: [{ account: topupAcct.badDebt, amount: owing }, { account: topupAcct.receivable(subjectId), amount: -owing }],
    });
    open.status = 'written_off'; await this.repo.save(open);
    return { action: 'write_off' as const, amountMinor: owing };
  }
}
