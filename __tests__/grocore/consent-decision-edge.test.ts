/** @jest-environment node */
import { ConsentService } from '../../src/lib/grocore/consent/consent';
import { DecisionOrchestrator, Policy, FeatureStore } from '../../src/lib/grocore/decisioning/orchestrator';
import { newKeyPair, signEnvelope, verifyEnvelope, EdgeSpendTracker, EnvelopePayload } from '../../src/lib/grocore/edge/envelope';

describe('consent', () => {
  it('is purpose-bound, revocable and expiring', () => {
    const c = new ConsentService();
    const t0 = new Date('2026-11-01T00:00:00Z');
    c.grant('s1', 'wifi_billing', t0);
    expect(c.isAllowed('s1', 'wifi_billing', new Date('2026-11-02'))).toBe(true);
    expect(c.isAllowed('s1', 'credit_underwriting', new Date('2026-11-02'))).toBe(false);
    c.revoke('s1', 'wifi_billing', new Date('2026-11-03'));
    expect(c.isAllowed('s1', 'wifi_billing', new Date('2026-11-04'))).toBe(false);
    c.grant('s2', 'marketing', t0, new Date('2026-11-05'));
    expect(c.isAllowed('s2', 'marketing', new Date('2026-11-06'))).toBe(false);
  });
});

const policy: Policy = { version: 'p-0.1.0', modelVersion: 'm-0.1.0', minTenureDays: 60, minLimit: 50000n, maxLimit: 500000n, limitShareOfSalesBps: 5000 };
const fs = (f: Record<string, number | undefined>): FeatureStore => ({ get: async () => f });
const good = { sales_30d_minor: 400000, tenure_days: 120, arrears_minor: 0, kyc_verified: 1 };
function orch(f: Record<string, number | undefined>, consent = true) {
  const c = new ConsentService();
  if (consent) c.grant('m1', 'credit_underwriting', new Date('2026-01-01'));
  return new DecisionOrchestrator(c, fs(f), policy);
}

describe('decisioning', () => {
  it('approves with a limit, reasons and a full trace', async () => {
    const d = await orch(good).decide('m1', new Date('2026-11-09'));
    expect(d.outcome).toBe('approve');
    expect(d.limit).toBe(200000n);
    expect(d.trace.map((t) => t.step)).toEqual(['consent', 'features', 'hard_stops', 'affordability']);
    expect(d.versions).toEqual({ policy: 'p-0.1.0', model: 'm-0.1.0' });
  });
  it('caps the limit at the policy maximum', async () => {
    const d = await orch({ ...good, sales_30d_minor: 5_000_000 }).decide('m1', new Date('2026-11-09'));
    expect(d.limit).toBe(500000n);
  });
  it('refers when consent is missing, before reading features', async () => {
    const d = await orch(good, false).decide('m1', new Date('2026-11-09'));
    expect(d.outcome).toBe('refer');
    expect(d.reasonCodes).toEqual(['CONSENT_MISSING']);
    expect(d.trace).toHaveLength(1);
  });
  it('refers on a missing critical feature instead of guessing', async () => {
    const d = await orch({ ...good, tenure_days: undefined }).decide('m1', new Date('2026-11-09'));
    expect(d.outcome).toBe('refer');
    expect(d.reasonCodes).toEqual(['DATA_INCOMPLETE']);
  });
  it('declines with a counterfactual for arrears, tenure and low sales', async () => {
    const now = new Date('2026-11-09');
    const a = await orch({ ...good, arrears_minor: 15000 }).decide('m1', now);
    expect(a.reasonCodes).toEqual(['ARREARS_PRESENT']);
    expect(a.counterfactual[0]).toContain('R150.00');
    const t = await orch({ ...good, tenure_days: 40 }).decide('m1', now);
    expect(t.counterfactual[0]).toContain('20 more days');
    const s = await orch({ ...good, sales_30d_minor: 60000 }).decide('m1', now);
    expect(s.reasonCodes).toEqual(['AFFORDABILITY_LOW']);
    expect(s.counterfactual[0]).toContain('R1,000.00');
  });
  it('refers when KYC is not verified', async () => {
    const d = await orch({ ...good, kyc_verified: 0 }).decide('m1', new Date('2026-11-09'));
    expect(d.reasonCodes).toEqual(['KYC_PENDING']);
  });
});

describe('edge envelope', () => {
  const { publicKey, privateKey } = newKeyPair();
  const keys = new Map([['key-1', publicKey]]);
  const payload: EnvelopePayload = {
    envelopeId: 'e1', subject: 'm1', tenant: 't1', product: 'merchant-working-capital',
    maxOfflineAmountMinor: '50000', currency: 'ZAR', validFrom: '2026-11-01T00:00:00Z', expiresAt: '2026-11-08T00:00:00Z',
    policyVersion: 'p-0.1.0', modelVersion: 'm-0.1.0', alg: 'Ed25519', kid: 'key-1',
  };
  const env = signEnvelope(payload, privateKey);
  it('verifies a valid envelope and rejects tampering, expiry, wrong tenant and unknown keys', () => {
    expect(verifyEnvelope(env, keys, 't1', new Date('2026-11-05'))).toEqual({ ok: true });
    const forged = { ...env, payload: { ...payload, maxOfflineAmountMinor: '9999999' } };
    expect(verifyEnvelope(forged, keys, 't1', new Date('2026-11-05'))).toEqual({ ok: false, reason: 'BAD_SIGNATURE' });
    expect(verifyEnvelope(env, keys, 't1', new Date('2026-11-09'))).toEqual({ ok: false, reason: 'EXPIRED' });
    expect(verifyEnvelope(env, keys, 't1', new Date('2026-10-31'))).toEqual({ ok: false, reason: 'NOT_YET_VALID' });
    expect(verifyEnvelope(env, keys, 't2', new Date('2026-11-05'))).toEqual({ ok: false, reason: 'WRONG_TENANT' });
    expect(verifyEnvelope(env, new Map(), 't1', new Date('2026-11-05'))).toEqual({ ok: false, reason: 'UNKNOWN_KEY' });
  });
  it('caps offline spend at the envelope limit', () => {
    const t = new EdgeSpendTracker();
    expect(t.tryReserve(env, 30000n)).toBe(true);
    expect(t.tryReserve(env, 20000n)).toBe(true);
    expect(t.tryReserve(env, 1n)).toBe(false);
    expect(t.spentFor('e1')).toBe(50000n);
  });
});
