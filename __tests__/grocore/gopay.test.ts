/** @jest-environment node */
import { LedgerService, InMemoryLedgerRepo } from '../../src/lib/grocore/ledger/ledger';
import { settleSale, collectDebit, failedDebit, acct, GoPayNotLiveError } from '../../src/lib/grocore/gopay/settlement';
import { allocateWaterfall, splitAtSettlement } from '../../src/lib/grocore/repayment/waterfall';

const T = 't1', M = 'm1';
async function seeded() {
  const ledger = new LedgerService(new InMemoryLedgerRepo());
  const b = { tenantId: T, correlationId: 'seed', currency: 'ZAR', reason: 'seed' };
  await ledger.post({ ...b, idempotencyKey: 'fund', lines: [{ account: acct.trust, amount: 500000n }, { account: 'lender_funding', amount: -500000n }] });
  await ledger.post({ ...b, idempotencyKey: 'disburse', lines: [{ account: acct.loan(M), amount: 500000n }, { account: acct.trust, amount: -500000n }] });
  return ledger;
}
const split = { goPayLive: true, route: 'split' as const, shareBps: 1000 };

describe('GoPay settlement', () => {
  it('splits repayment at settlement and keeps the books balanced', async () => {
    const ledger = await seeded();
    const r = await settleSale(ledger, split, { tenantId: T, merchantId: M, saleId: 's1', amount: 25000n, rail: 'qr_payshap' });
    expect(r).toMatchObject({ fee: 250n, net: 24750n, repaid: 2475n, payout: 22275n, replayed: false });
    expect(await ledger.balance(T, acct.loan(M))).toBe(497525n);
    expect(await ledger.balance(T, acct.wallet(M))).toBe(0n);
    expect(await ledger.balance(T, acct.clearing)).toBe(0n);
    expect(await ledger.balance(T, acct.trust)).toBe(2725n); // fee plus repayment retained
    expect(await ledger.trialBalanceTotal(T)).toBe(0n);
  });
  it('refuses the split route while GoPay is not live', async () => {
    const ledger = await seeded();
    await expect(settleSale(ledger, { ...split, goPayLive: false }, { tenantId: T, merchantId: M, saleId: 's1', amount: 25000n, rail: 'qr_payshap' }))
      .rejects.toBeInstanceOf(GoPayNotLiveError);
  });
  it('never repays more than is outstanding', async () => {
    const ledger = await seeded();
    await collectDebit(ledger, { tenantId: T, merchantId: M, debitId: 'd0', instalment: 499900n });
    const r = await settleSale(ledger, split, { tenantId: T, merchantId: M, saleId: 's2', amount: 100000n, rail: 'credit_card' });
    expect(r.repaid).toBe(100n);
    expect(await ledger.balance(T, acct.loan(M))).toBe(0n);
  });
  it('is safe to replay a sale', async () => {
    const ledger = await seeded();
    const sale = { tenantId: T, merchantId: M, saleId: 's3', amount: 40000n, rail: 'instant_eft' as const };
    const a = await settleSale(ledger, split, sale);
    const before = (await ledger.trialBalanceTotal(T), await ledger.balance(T, acct.loan(M)));
    const b = await settleSale(ledger, split, sale);
    expect(b.replayed).toBe(true);
    expect(b.repaid).toBe(a.repaid);
    expect(await ledger.balance(T, acct.loan(M))).toBe(before);
  });
  it('Wave 1 debit route pays out the full net and collects on schedule', async () => {
    const ledger = await seeded();
    const cfg = { goPayLive: false, route: 'debit' as const, shareBps: 0 };
    const r = await settleSale(ledger, cfg, { tenantId: T, merchantId: M, saleId: 's4', amount: 25000n, rail: 'debit_card' });
    expect(r.repaid).toBe(0n);
    expect(r.payout).toBe(24625n);
    const c = await collectDebit(ledger, { tenantId: T, merchantId: M, debitId: 'd1', instalment: 50000n });
    expect(c.collected).toBe(50000n);
    expect(await ledger.balance(T, acct.loan(M))).toBe(450000n);
    expect(await ledger.trialBalanceTotal(T)).toBe(0n);
  });
  it('a failed debit order raises arrears and posts nothing', async () => {
    const ledger = await seeded();
    const before = await ledger.trialBalanceTotal(T);
    const f = await failedDebit(ledger, { tenantId: T, merchantId: M, instalment: 50000n });
    expect(f.arrears).toBe(50000n);
    expect(f.nextAction).toBe('collections_contact_then_hardship_offer');
    expect(await ledger.trialBalanceTotal(T)).toBe(before);
  });
});

describe('waterfall', () => {
  it('allocates in configured order and reports the unapplied remainder', () => {
    const r = allocateWaterfall(1000n, [{ name: 'fees', due: 100n }, { name: 'arrears', due: 300n }, { name: 'instalment', due: 800n }]);
    expect(r.allocations).toEqual({ fees: 100n, arrears: 300n, instalment: 600n });
    expect(r.unapplied).toBe(0n);
    expect(allocateWaterfall(50n, [{ name: 'fees', due: 100n }]).allocations.fees).toBe(50n);
    expect(allocateWaterfall(500n, [{ name: 'fees', due: 100n }]).unapplied).toBe(400n);
  });
  it('split is zero when nothing is outstanding', () => {
    expect(splitAtSettlement(10000n, 1000, 0n)).toBe(0n);
  });
});
