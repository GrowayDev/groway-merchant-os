/** @jest-environment node */
import { MockVendingProvider } from '../../src/lib/grocore/vending/mock';
import { InMemoryVendStore, VendingRouter } from '../../src/lib/grocore/vending/router';
import { HttpVendingAdapter } from '../../src/lib/grocore/vending/http-adapter';
import { createPayChanguProvider, minorToDecimal, toLocalMsisdn } from '../../src/lib/grocore/vending/paychangu';
import { PROVIDERS } from '../../src/lib/grocore/vending/catalogue';
import { VendRequest } from '../../src/lib/grocore/vending/types';

const req = (o: Partial<VendRequest> = {}): VendRequest => ({ reference: 'r1', country: 'ZA', commodity: 'airtime', amountMinor: 2000n, currency: 'ZAR', msisdn: '+27821234567', ...o });
const router = (...ps: [MockVendingProvider, number][]) => new VendingRouter(ps.map(([provider, priority]) => ({ provider, priority })), new InMemoryVendStore());

describe('router', () => {
  it('uses the best provider that supports the item and country', async () => {
    const mw = new MockVendingProvider('mw', 'success', { countries: ['MW'] }); const za = new MockVendingProvider('za', 'success', { countries: ['ZA'] });
    const r = router([mw, 1], [za, 2]);
    expect(await r.vend(req())).toMatchObject({ status: 'success', providerId: 'za' });
    expect(mw.calls).toHaveLength(0);
  });
  it('fails over when the first provider definitely did not deliver, and never vends twice', async () => {
    const a = new MockVendingProvider('a', 'fail_retryable'); const b = new MockVendingProvider('b', 'success');
    const r = router([a, 1], [b, 2]);
    expect(await r.vend(req())).toMatchObject({ status: 'success', providerId: 'b' });
    await r.vend(req());
    expect(b.calls).toHaveLength(1);                       // same reference, no second delivery
  });
  it('stops on a hard decline without trying others', async () => {
    const a = new MockVendingProvider('a', 'fail'); const b = new MockVendingProvider('b', 'success');
    expect(await router([a, 1], [b, 2]).vend(req())).toMatchObject({ status: 'failed', code: 'DECLINED' });
    expect(b.calls).toHaveLength(0);
  });
  it('does NOT fail over on an unknown outcome, and settles it later from the first provider', async () => {
    const a = new MockVendingProvider('a', 'timeout'); const b = new MockVendingProvider('b', 'success');
    const r = router([a, 1], [b, 2]);
    expect(await r.vend(req())).toMatchObject({ status: 'unknown', providerId: 'a' });
    expect(b.calls).toHaveLength(0);
    a.settle('r1', { status: 'success', providerId: 'a', providerRef: 'a-1' });
    expect(await r.resolve('r1')).toMatchObject({ status: 'success', providerRef: 'a-1' });
    expect(await r.vend(req())).toMatchObject({ status: 'success' });   // stored result, not a new vend
    expect(a.calls).toHaveLength(1);
  });
  it('treats a thrown error as unknown, not as failure', async () => {
    const a = new MockVendingProvider('a', 'throw');
    expect(await router([a, 1]).vend(req())).toMatchObject({ status: 'unknown' });
  });
  it('opens a circuit after repeated failures and uses the next provider', async () => {
    let t = 0; const a = new MockVendingProvider('a', 'fail_retryable'); const b = new MockVendingProvider('b', 'success');
    const r = new VendingRouter([{ provider: a, priority: 1 }, { provider: b, priority: 2 }], new InMemoryVendStore(), { failureThreshold: 2, cooldownMs: 1000, now: () => t });
    await r.vend(req({ reference: 'x1' })); await r.vend(req({ reference: 'x2' }));
    await r.vend(req({ reference: 'x3' }));
    expect(a.calls).toHaveLength(2);                        // a is skipped on the third item
    t = 5000; await r.vend(req({ reference: 'x4' }));
    expect(a.calls).toHaveLength(3);                        // cooled down, tried again
  });
  it('returns NO_PROVIDER when nobody supports the item', async () => {
    const a = new MockVendingProvider('a', 'success', { countries: ['MW'] });
    expect(await router([a, 1]).vend(req())).toMatchObject({ status: 'failed', code: 'NO_PROVIDER' });
  });
  it('validates a meter through a provider that can', async () => {
    const a = new MockVendingProvider('a');
    expect(await router([a, 1]).validateMeter('12345678901', 'ZA')).toMatchObject({ valid: true });
  });
});

describe('http adapter and PayChangu', () => {
  const fakeFetch = (status: number, body: unknown, seen: any[] = []) => (async (url: string, init: any) => {
    seen.push({ url, init }); return { status, json: async () => body } as any;
  }) as unknown as typeof fetch;
  const mk = (f: typeof fetch) => createPayChanguProvider({ secretKey: () => 'SEC-test', fetchImpl: f });

  it('formats amounts and phone numbers', () => {
    expect(minorToDecimal(100000n)).toBe('1000'); expect(minorToDecimal(150n)).toBe('1.50');
    expect(toLocalMsisdn('+265991234567')).toBe('0991234567');
  });
  it('sends the documented airtime request and reads success', async () => {
    const seen: any[] = []; const p = mk(fakeFetch(200, { status: 'success', data: { reference: 'PC1' } }, seen));
    const out = await p.vend(req({ country: 'MW', currency: 'MWK', amountMinor: 100000n, msisdn: '+265991234567', reference: 'PC1' }));
    expect(out).toMatchObject({ status: 'success', providerRef: 'PC1' });
    expect(seen[0].url).toBe('https://api.paychangu.com/bills/buy-airtime');
    expect(seen[0].init.headers.Authorization).toBe('Bearer SEC-test');
    expect(JSON.parse(seen[0].init.body)).toEqual({ phone: '0991234567', amount: '1000', reference: 'PC1' });
  });
  it('sends an ESCOM token purchase and returns the token', async () => {
    const seen: any[] = []; const p = mk(fakeFetch(200, { status: 'success', data: { token: '1111-2222' } }, seen));
    const out = await p.vend(req({ country: 'MW', commodity: 'electricity', currency: 'MWK', meterNumber: '917535617', amountMinor: 1000000n, customerName: 'J Phiri', reference: 'E1' }));
    expect(out).toMatchObject({ status: 'success', token: '1111-2222' });
    expect(JSON.parse(seen[0].init.body)).toEqual({ biller: 'escom', account: '917535617', amount: '10000', customer_name: 'J Phiri', reference: 'E1' });
  });
  it('maps rejections to failed and server errors, timeouts and odd replies to unknown', async () => {
    const mwReq = req({ country: 'MW', currency: 'MWK', msisdn: '+265991234567' });
    expect(await mk(fakeFetch(400, { message: 'bad number' })).vend(mwReq)).toMatchObject({ status: 'failed', retryable: false });
    expect(await mk(fakeFetch(503, {})).vend(mwReq)).toMatchObject({ status: 'unknown' });
    expect(await mk(fakeFetch(200, { hello: 'world' })).vend(mwReq)).toMatchObject({ status: 'unknown', reason: 'UNRECOGNISED_RESPONSE' });
    const boom = (async () => { throw new Error('socket hang up'); }) as unknown as typeof fetch;
    expect(await mk(boom).vend(mwReq)).toMatchObject({ status: 'unknown' });
    expect(await mk(fakeFetch(429, {})).vend(mwReq)).toMatchObject({ status: 'failed', retryable: true });
  });
  it('reports status as unknown until a status endpoint is configured', async () => {
    expect(await mk(fakeFetch(200, {})).status('x')).toMatchObject({ status: 'unknown', reason: 'STATUS_ENDPOINT_NOT_CONFIGURED' });
  });
  it('works for any provider through configuration alone', async () => {
    const p = new HttpVendingAdapter({
      id: 'sa-aggregator', baseUrl: 'https://agg.example', headers: () => ({ 'x-key': 'k' }), supported: [{ commodity: 'airtime', country: 'ZA' }],
      buildVend: (r) => ({ method: 'POST', path: '/vend', body: { msisdn: r.msisdn, rands: Number(r.amountMinor) / 100, ref: r.reference } }),
      mapVend: (s, b) => (s === 200 && b.ok ? { status: 'success', providerId: 'sa-aggregator', providerRef: b.id } : { status: 'failed', providerId: 'sa-aggregator', code: 'X', message: 'no', retryable: false }),
      fetchImpl: fakeFetch(200, { ok: true, id: 'A9' }),
    });
    expect(await p.vend(req())).toMatchObject({ status: 'success', providerRef: 'A9' });
    expect(p.supports('airtime', 'ZA')).toBe(true); expect(p.supports('electricity', 'ZA')).toBe(false);
  });
});

describe('catalogue', () => {
  it('lists South African and Malawian providers with unique ids', () => {
    expect(new Set(PROVIDERS.map((p) => p.id)).size).toBe(PROVIDERS.length);
    expect(PROVIDERS.filter((p) => p.country === 'ZA').length).toBeGreaterThanOrEqual(10);
    expect(PROVIDERS.find((p) => p.id === 'paychangu')?.integration).toBe('adapter_built');
    expect(PROVIDERS.find((p) => p.id === 'tnm')?.integration).toBe('in_negotiation');
    expect(PROVIDERS.find((p) => p.id === 'escom')?.integration).toBe('in_negotiation');
  });
});
