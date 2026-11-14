/** @jest-environment node */
import { LedgerService, InMemoryLedgerRepo } from '../../src/lib/grocore/ledger/ledger';
import { Facility, FundingError, FundingService, InMemoryFacilityRepo, estimateFloat, fundingAcct } from '../../src/lib/grocore/capital/funding';
import { PRESETS } from '../../src/lib/grocore/topup/presets';
import { InMemoryAdvanceRepo, TopUpCredit, topupAcct } from '../../src/lib/grocore/topup/service';
import { AdvanceDelivery } from '../../src/lib/grocore/topup/orchestrator';
import { MockVendingProvider } from '../../src/lib/grocore/vending/mock';
import { InMemoryVendStore, VendingRouter } from '../../src/lib/grocore/vending/router';
import { History } from '../../src/lib/grocore/topup/products';

const T = 't1';
const NOW = new Date('2026-11-11T10:00:00Z');
const fac = (o: Partial<Facility>): Facility => ({ id: 'f1', funder: 'Bank A', countries: ['ZA'], currency: 'ZAR', products: '*', limitMinor: 1_000_000n, drawnMinor: 0n, priority: 1, costBps: 200, status: 'active', ...o });
const hist = (monthly: bigint): History => ({ tenureDays: 400, arrearsMinor: 0n, identityOk: true,
  recharges: [8, 9, 10].map((m) => ({ amountMinor: monthly, at: new Date(Date.UTC(2026, m, 5)) })) });

describe('funding mesh', () => {
  const mk = (fs: Facility[]) => { const ledger = new LedgerService(new InMemoryLedgerRepo()); return { ledger, f: new FundingService(ledger, new InMemoryFacilityRepo(fs)) }; };
  const a = (o = {}) => ({ tenantId: T, requestId: 'r1', productId: 'za-airtime', country: 'ZA' as const, currency: 'ZAR', commodity: 'airtime', principalMinor: 2000n, ...o });

  it('picks by priority, matches currency and country, and respects headroom and product scope', async () => {
    const { f } = mk([fac({ id: 'cheap', priority: 2 }), fac({ id: 'first', priority: 1, limitMinor: 1000n }), fac({ id: 'mwk', countries: ['MW'], currency: 'MWK', priority: 0 }), fac({ id: 'elec', products: ['za-electricity'], priority: 0 })]);
    expect((await f.allocate(a())).facilityId).toBe('cheap');       // 'first' lacks headroom, others are the wrong currency or product
  });
  it('funds Malawi advances only from kwacha facilities', async () => {
    const { f } = mk([fac({ id: 'zar' }), fac({ id: 'mwk', countries: ['MW'], currency: 'MWK' })]);
    expect((await f.allocate(a({ country: 'MW', currency: 'MWK', productId: 'mw-airtime' }))).facilityId).toBe('mwk');
    await expect(mk([fac({ id: 'zar' })]).f.allocate(a({ country: 'MW', currency: 'MWK' }))).rejects.toBeInstanceOf(FundingError);
  });
  it('is idempotent and posts a balanced entry that moves the obligation from supplier to funder', async () => {
    const { f, ledger } = mk([fac({})]);
    await f.allocate(a()); const again = await f.allocate(a());
    expect(again.replayed).toBe(true);
    expect(await ledger.balance(T, fundingAcct.funder('f1'))).toBe(-2000n);
    expect(await ledger.balance(T, fundingAcct.supplier('airtime'))).toBe(2000n);
    expect(await ledger.trialBalanceTotal(T)).toBe(0n);
  });
  it('repays the funder principal plus its cost from what is recovered', async () => {
    const { f, ledger } = mk([fac({ costBps: 200 })]);
    await f.allocate(a());
    const r = await f.repayFromRecovery({ tenantId: T, requestId: 'r1', topupRef: 'tu1', currency: 'ZAR', takenMinor: 2240n, principalMinor: 2000n, feeMinor: 240n });
    expect(r.paid).toBe(2040n);                                     // 2000 principal + 2% cost of 40
    expect(await ledger.balance(T, fundingAcct.funder('f1'))).toBe(0n);
    expect(await ledger.balance(T, fundingAcct.cost)).toBe(40n);
    expect(await ledger.trialBalanceTotal(T)).toBe(0n);
  });
  it('suspends a facility whose triggers are breached and resumes it on recovery', async () => {
    const { f } = mk([fac({ minRecoveryRateBps: 9000, maxChargeOffBps: 500 })]);
    await f.applyPerformance({ recoveryRateBps: 8500, chargeOffBps: 100 });
    await expect(f.allocate(a())).rejects.toBeInstanceOf(FundingError);
    await f.applyPerformance({ recoveryRateBps: 9500, chargeOffBps: 100 });
    expect((await f.allocate(a())).facilityId).toBe('f1');
  });
  it('releases the draw when delivery fails', async () => {
    const { f, ledger } = mk([fac({})]);
    await f.allocate(a()); await f.release({ tenantId: T, requestId: 'r1', currency: 'ZAR', commodity: 'airtime' });
    expect(await ledger.balance(T, fundingAcct.funder('f1'))).toBe(0n);
    expect(await f.headroom('ZAR')).toBe(1_000_000n);
  });
  it('sizes the float: daily advances times days outstanding plus a buffer', () => {
    expect(estimateFloat({ dailyAdvancesMinor: 1_000_000n, avgDaysOutstanding: 6.2, bufferBps: 2000 })).toBe(8_400_000n); // 10,000 x 7 days x 1.2
  });
});

describe('advance delivery', () => {
  const mk = (mode: any) => {
    const ledger = new LedgerService(new InMemoryLedgerRepo()); const credit = new TopUpCredit(ledger, new InMemoryAdvanceRepo(), PRESETS);
    const prov = new MockVendingProvider('p', mode); const router = new VendingRouter([{ provider: prov, priority: 1 }], new InMemoryVendStore());
    return { ledger, credit, prov, router, delivery: new AdvanceDelivery(credit, router) };
  };
  const ask = (o = {}) => ({ tenantId: T, subjectId: 'msisdn:27821234567', productId: 'za-airtime', amountMinor: 2000n, requestId: 'r1', history: hist(10000n), now: NOW, target: { msisdn: '+27821234567' }, ...o });

  it('issues then delivers, leaving a balanced book and a recoverable advance', async () => {
    const { delivery, ledger, credit } = mk('success');
    expect(await delivery.request(ask())).toMatchObject({ status: 'delivered' });
    expect(await ledger.balance(T, topupAcct.receivable('msisdn:27821234567'))).toBe(2240n);
    expect(await credit.recover({ tenantId: T, subjectId: 'msisdn:27821234567', topupRef: 'tu1', topupAmountMinor: 5000n })).toMatchObject({ taken: 2240n, repaid: true });
  });
  it('reverses the advance exactly when delivery definitely fails', async () => {
    const { delivery, ledger } = mk('fail');
    expect(await delivery.request(ask())).toMatchObject({ status: 'cancelled', code: 'DECLINED' });
    expect(await ledger.balance(T, topupAcct.receivable('msisdn:27821234567'))).toBe(0n);
    expect(await ledger.trialBalanceTotal(T)).toBe(0n);
  });
  it('holds the advance when delivery is unknown, blocks a second one, does not recover, then settles', async () => {
    const { delivery, credit, prov } = mk('timeout');
    expect(await delivery.request(ask())).toMatchObject({ status: 'pending' });
    expect(await delivery.request(ask({ requestId: 'r2' }))).toMatchObject({ status: 'declined', code: 'OPEN_ADVANCE' });
    expect(await credit.recover({ tenantId: T, subjectId: 'msisdn:27821234567', topupRef: 'tu1', topupAmountMinor: 5000n })).toMatchObject({ taken: 0n });
    prov.settle('r1', { status: 'success', providerId: 'p', providerRef: 'p-1' });
    expect(await delivery.settlePending(T, 'r1')).toMatchObject({ status: 'delivered' });
    expect(await credit.recover({ tenantId: T, subjectId: 'msisdn:27821234567', topupRef: 'tu2', topupAmountMinor: 5000n })).toMatchObject({ taken: 2240n });
  });
  it('cancels a pending advance when the lookup shows it failed', async () => {
    const { delivery, prov, ledger } = mk('timeout');
    await delivery.request(ask());
    prov.settle('r1', { status: 'failed', providerId: 'p', code: 'NOT_DELIVERED', message: 'no', retryable: false });
    expect(await delivery.settlePending(T, 'r1')).toMatchObject({ status: 'cancelled' });
    expect(await ledger.balance(T, topupAcct.receivable('msisdn:27821234567'))).toBe(0n);
  });
  it('declines an ineligible customer without delivering anything', async () => {
    const { delivery, prov } = mk('success');
    expect(await delivery.request(ask({ history: { ...hist(10000n), arrearsMinor: 1n } }))).toMatchObject({ status: 'declined', code: 'NOT_ELIGIBLE' });
    expect(prov.calls).toHaveLength(0);
  });
  it('delivers an electricity token for a meter', async () => {
    const { delivery } = mk('success');
    const r = await delivery.request(ask({ subjectId: 'meter:12345678901', productId: 'za-electricity', amountMinor: 10000n, history: hist(40000n), target: { meterNumber: '12345678901' } }));
    expect(r).toMatchObject({ status: 'delivered', token: '1234-5678-9012-3456-7890' });
  });
});
