/** @jest-environment node */
import { LedgerService, InMemoryLedgerRepo } from '../../src/lib/grocore/ledger/ledger';
import { PRESETS } from '../../src/lib/grocore/topup/presets';
import { assessEligibility, quoteFee, History } from '../../src/lib/grocore/topup/products';
import { InMemoryAdvanceRepo, TopUpCredit, TopUpCreditError, topupAcct } from '../../src/lib/grocore/topup/service';

const T = 't1';
const NOW = new Date('2026-11-11T10:00:00Z');
const product = (id: string) => PRESETS.find((p) => p.id === id)!;
const month = (m: number) => new Date(Date.UTC(2026, m, 5));
const hist = (monthly: bigint, extra: Partial<History> = {}): History => ({
  tenureDays: 400, arrearsMinor: 0n, identityOk: true,
  recharges: [{ amountMinor: monthly, at: month(8) }, { amountMinor: monthly, at: month(9) }, { amountMinor: monthly, at: month(10) }], ...extra,
});
const mk = () => { const ledger = new LedgerService(new InMemoryLedgerRepo()); return { ledger, svc: new TopUpCredit(ledger, new InMemoryAdvanceRepo(), PRESETS) }; };

describe('fees', () => {
  it('charges per block, flat or percent', () => {
    expect(quoteFee(product('za-airtime'), 2000n)).toBe(240n);   // R20 -> two R10 blocks at R1.20
    expect(quoteFee(product('za-airtime'), 1500n)).toBe(240n);   // R15 -> "or part thereof"
    expect(quoteFee(product('mw-airtime'), 5000n)).toBe(500n);   // K50 -> K5 (10%)
    expect(quoteFee({ ...product('za-airtime'), fee: { kind: 'flat', feeMinor: 110n } }, 2000n)).toBe(110n);
  });
  it('refuses a fee above the product ceiling', () => {
    expect(() => quoteFee({ ...product('za-airtime'), maxFeeMinor: 200n }, 2000n)).toThrow(RangeError);
  });
});

describe('eligibility and limits', () => {
  it('needs enough recharge history and sets a limit from it', () => {
    const ok = assessEligibility(product('za-airtime'), hist(10000n), NOW);       // R100 a month
    expect(ok).toMatchObject({ ok: true, maxMinor: 2000n });
    const thin = assessEligibility(product('za-airtime'), { ...hist(10000n), recharges: [{ amountMinor: 10000n, at: month(10) }] }, NOW);
    expect(thin.reasons).toContain('RECHARGE_HISTORY_TOO_THIN');
  });
  it('blocks arrears, short tenure and unverified identity', () => {
    const r = assessEligibility(product('za-airtime'), hist(10000n, { arrearsMinor: 1n, tenureDays: 10, identityOk: false }), NOW);
    expect(r.reasons).toEqual(expect.arrayContaining(['ARREARS_PRESENT', 'TENURE_TOO_SHORT', 'IDENTITY_NOT_VERIFIED']));
  });
  it('a small spender gets a small limit, and spending below the minimum gets none', () => {
    expect(assessEligibility(product('za-airtime'), hist(3000n), NOW)).toMatchObject({ ok: true, maxMinor: 500n });
    const low = assessEligibility(product('za-airtime'), hist(1500n), NOW);
    expect(low.ok).toBe(false);
    expect(low.reasons).toContain('RECHARGE_HISTORY_TOO_THIN');
  });
});

describe('issue and clawback', () => {
  it('issues one advance at a time and posts a balanced entry', async () => {
    const { ledger, svc } = mk();
    const r = await svc.issue({ tenantId: T, subjectId: 'msisdn:27821234567', productId: 'za-airtime', amountMinor: 2000n, requestId: 'r1', history: hist(10000n), now: NOW });
    expect(r.record.fee).toBe(240n);
    expect(await ledger.balance(T, topupAcct.receivable('msisdn:27821234567'))).toBe(2240n);
    await expect(svc.issue({ tenantId: T, subjectId: 'msisdn:27821234567', productId: 'za-airtime', amountMinor: 500n, requestId: 'r2', history: hist(10000n), now: NOW }))
      .rejects.toMatchObject({ code: 'OPEN_ADVANCE' });
    expect(await ledger.trialBalanceTotal(T)).toBe(0n);
  });
  it('is idempotent on the request ID and refuses amounts above the limit', async () => {
    const { svc } = mk();
    const a = { tenantId: T, subjectId: 's', productId: 'za-airtime', amountMinor: 1000n, requestId: 'r1', history: hist(10000n), now: NOW };
    const first = await svc.issue(a); const again = await svc.issue(a);
    expect(again.replayed).toBe(true); expect(again.record.id).toBe(first.record.id);
    await expect(mk().svc.issue({ ...a, requestId: 'r9', amountMinor: 1500n, history: hist(4000n) })).rejects.toBeInstanceOf(TopUpCreditError);
  });
  it('claws the whole advance back from the next airtime top-up and passes the rest through', async () => {
    const { ledger, svc } = mk();
    await svc.issue({ tenantId: T, subjectId: 's', productId: 'za-airtime', amountMinor: 2000n, requestId: 'r1', history: hist(10000n), now: NOW });
    const r = await svc.recover({ tenantId: T, subjectId: 's', topupRef: 'tu1', topupAmountMinor: 10000n });
    expect(r).toMatchObject({ taken: 2240n, passThrough: 7760n, repaid: true });
    expect(await ledger.balance(T, topupAcct.receivable('s'))).toBe(0n);
    expect(await ledger.balance(T, topupAcct.clearing)).toBe(2240n);
    expect(await ledger.trialBalanceTotal(T)).toBe(0n);
  });
  it('takes a small top-up entirely and carries the rest to the next one', async () => {
    const { svc } = mk();
    await svc.issue({ tenantId: T, subjectId: 's', productId: 'za-airtime', amountMinor: 2000n, requestId: 'r1', history: hist(10000n), now: NOW });
    const a = await svc.recover({ tenantId: T, subjectId: 's', topupRef: 'tu1', topupAmountMinor: 1000n });
    expect(a).toMatchObject({ taken: 1000n, passThrough: 0n, repaid: false });
    const b = await svc.recover({ tenantId: T, subjectId: 's', topupRef: 'tu2', topupAmountMinor: 5000n });
    expect(b).toMatchObject({ taken: 1240n, passThrough: 3760n, repaid: true });
  });
  it('electricity takes only a share of each purchase', async () => {
    const { svc } = mk();
    await svc.issue({ tenantId: T, subjectId: 'meter:1234', productId: 'za-electricity', amountMinor: 10000n, requestId: 'e1', history: hist(40000n), now: NOW });
    const a = await svc.recover({ tenantId: T, subjectId: 'meter:1234', topupRef: 'p1', topupAmountMinor: 10000n });
    expect(a).toMatchObject({ taken: 5000n, passThrough: 5000n, repaid: false });
    const b = await svc.recover({ tenantId: T, subjectId: 'meter:1234', topupRef: 'p2', topupAmountMinor: 20000n });
    expect(b).toMatchObject({ taken: 6000n, passThrough: 14000n, repaid: true });   // 11,000 due in total
  });
  it('does nothing when there is no advance, and replays safely', async () => {
    const { svc } = mk();
    expect(await svc.recover({ tenantId: T, subjectId: 'x', topupRef: 'n1', topupAmountMinor: 5000n })).toMatchObject({ taken: 0n, passThrough: 5000n });
    await svc.issue({ tenantId: T, subjectId: 's', productId: 'mw-airtime', amountMinor: 20000n, requestId: 'm1', history: hist(500000n), now: NOW });
    const first = await svc.recover({ tenantId: T, subjectId: 's', topupRef: 'tu1', topupAmountMinor: 10000n });
    const again = await svc.recover({ tenantId: T, subjectId: 's', topupRef: 'tu1', topupAmountMinor: 10000n });
    expect(again.replayed).toBe(true); expect(again.taken).toBe(first.taken);
  });
});

describe('overdue', () => {
  it('South Africa airtime moves to the bill; Malawi airtime is written off; nothing before the due date', async () => {
    const za = mk(); const mw = mk();
    await za.svc.issue({ tenantId: T, subjectId: 's', productId: 'za-airtime', amountMinor: 1000n, requestId: 'r1', history: hist(10000n), now: NOW });
    await mw.svc.issue({ tenantId: T, subjectId: 's', productId: 'mw-airtime', amountMinor: 20000n, requestId: 'r1', history: hist(500000n), now: NOW });
    const later = new Date(NOW.getTime() + 31 * 86400000);
    expect(await za.svc.applyOverdue(T, 's', new Date(NOW.getTime() + 5 * 86400000))).toEqual({ action: 'none' });
    expect(await za.svc.applyOverdue(T, 's', later)).toMatchObject({ action: 'add_to_bill', amountMinor: 1120n });
    expect(await mw.svc.applyOverdue(T, 's', later)).toMatchObject({ action: 'write_off', amountMinor: 22000n });
    expect(await mw.ledger.balance(T, topupAcct.receivable('s'))).toBe(0n);
    expect(await mw.ledger.trialBalanceTotal(T)).toBe(0n);
  });
});
