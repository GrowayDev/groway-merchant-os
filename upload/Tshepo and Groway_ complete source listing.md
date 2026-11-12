# Tshepo and Groway: complete source listing

**11 November 2026 · Companion to the Groway and Tshepo Master Build Document v2.0**

Every file in the `tshepo-groway-integration` bundle is reproduced below, in the order shown in the index. 64 tests pass and the TypeScript compiles with no errors. The converted Postgres schema (`groway-changes/prisma/schema.prisma`, 302 models) is a mechanical conversion of Groway's own 296-model schema plus the six Tshepo models, so it is listed in the bundle but not reproduced here.

## Index

**Application code: src/lib/tshepo**

- `src/lib/tshepo/capital/funding.ts` (119 lines)
- `src/lib/tshepo/consent/consent.ts` (22 lines)
- `src/lib/tshepo/decisioning/orchestrator.ts` (87 lines)
- `src/lib/tshepo/edge/envelope.ts` (50 lines)
- `src/lib/tshepo/gopay/settlement.ts` (85 lines)
- `src/lib/tshepo/ledger/ledger.ts` (90 lines)
- `src/lib/tshepo/ledger/prisma-ledger-repo.ts` (51 lines)
- `src/lib/tshepo/repayment/waterfall.ts` (23 lines)
- `src/lib/tshepo/shared/ids.ts` (12 lines)
- `src/lib/tshepo/shared/money.ts` (17 lines)
- `src/lib/tshepo/topup/orchestrator.ts` (44 lines)
- `src/lib/tshepo/topup/presets.ts` (41 lines)
- `src/lib/tshepo/topup/products.ts` (85 lines)
- `src/lib/tshepo/topup/service.ts` (158 lines)
- `src/lib/tshepo/vending/catalogue.ts` (33 lines)
- `src/lib/tshepo/vending/http-adapter.ts` (67 lines)
- `src/lib/tshepo/vending/mock.ts` (31 lines)
- `src/lib/tshepo/vending/paychangu.ts` (53 lines)
- `src/lib/tshepo/vending/router.ts` (77 lines)
- `src/lib/tshepo/vending/types.ts` (32 lines)

**Tests: **tests**/tshepo**

- `__tests__/tshepo/consent-decision-edge.test.ts` (94 lines)
- `__tests__/tshepo/funding-delivery.test.ts` (111 lines)
- `__tests__/tshepo/gopay.test.ts` (81 lines)
- `__tests__/tshepo/ledger.test.ts` (48 lines)
- `__tests__/tshepo/prisma-ledger-repo.test.ts` (44 lines)
- `__tests__/tshepo/topup.test.ts` (112 lines)
- `__tests__/tshepo/vending.test.ts` (120 lines)

**Database: Prisma models and SQL guards**

- `prisma/tshepo.models.prisma` (84 lines)
- `prisma/tshepo-ledger-guards.sql` (23 lines)

**Groway changes: database client and helper scripts**

- `groway-changes/src/lib/db.ts` (16 lines)
- `groway-changes/setup-groway-postgres.sh` (98 lines)
- `groway-changes/build-groway.sh` (17 lines)
- `groway-changes/start-groway.sh` (12 lines)
- `groway-changes/backup-groway.sh` (11 lines)

**Project files**

- `package.json` (15 lines)
- `tsconfig.json` (19 lines)
- `vitest.config.ts` (2 lines)
- `README.md` (15 lines)
- `INTEGRATION.md` (19 lines)
- `groway-changes/MAC_SERVER_SETUP.md` (25 lines)

Total files listed: 40

## Application code: src/lib/tshepo

### `src/lib/tshepo/capital/funding.ts`

```ts
import { LedgerService } from '../ledger/ledger';
import { mulBps } from '../shared/money';

/**
 * Funding is a mesh of facilities, not one lender. Each facility has its own currency, scope, limit, price and
 * performance triggers, all held as data, so a new funder (bank, development lender, pension fund, impact
 * fund or a digital-native source) is added by configuration. Funding is matched to the currency of the asset,
 * so a kwacha advance is never funded from a rand facility.
 */
export interface Facility {
  id: string; funder: string; countries: ('ZA' | 'MW')[]; currency: string; products: string[] | '*';
  limitMinor: bigint; drawnMinor: bigint;
  /** Lower number is used first. */
  priority: number;
  /** Funder's cost on each advance, in basis points of principal (a flat simplification). */
  costBps: number;
  /** Performance triggers: breaching either suspends new draws. */
  minRecoveryRateBps?: number; maxChargeOffBps?: number;
  status: 'active' | 'suspended' | 'amortising';
}
export interface Allocation { requestId: string; facilityId: string; principalMinor: bigint; costBps: number; repaidMinor: bigint }

export interface FacilityRepo {
  list(): Promise<Facility[]>;
  save(f: Facility): Promise<void>;
  allocation(requestId: string): Promise<Allocation | undefined>;
  saveAllocation(a: Allocation): Promise<void>;
}
export class InMemoryFacilityRepo implements FacilityRepo {
  private f = new Map<string, Facility>(); private a = new Map<string, Allocation>();
  constructor(facilities: Facility[] = []) { facilities.forEach((x) => this.f.set(x.id, { ...x })); }
  async list() { return [...this.f.values()]; }
  async save(x: Facility) { this.f.set(x.id, x); }
  async allocation(r: string) { return this.a.get(r); }
  async saveAllocation(x: Allocation) { this.a.set(x.requestId, x); }
}

export class FundingError extends Error { constructor(public readonly code: string, m: string) { super(m); } }

export const fundingAcct = {
  supplier: (commodity: string) => `supplier_payable:${commodity}`,
  funder: (facilityId: string) => `funder_payable:${facilityId}`,
  cost: 'funding_cost_expense',
  clearing: 'collections_clearing',
};

/** Peak float needed: daily advances times the days they stay outstanding, plus a safety buffer. */
export function estimateFloat(p: { dailyAdvancesMinor: bigint; avgDaysOutstanding: number; bufferBps: number }): bigint {
  if (p.avgDaysOutstanding < 0 || p.bufferBps < 0) throw new RangeError('inputs must be non-negative');
  return (p.dailyAdvancesMinor * BigInt(Math.ceil(p.avgDaysOutstanding)) * BigInt(10000 + p.bufferBps)) / 10000n;
}

export class FundingService {
  constructor(private ledger: LedgerService, private repo: FacilityRepo) {}

  /** Choose a facility for an advance and move the obligation from the supplier to the funder. Idempotent per request. */
  async allocate(a: { tenantId: string; requestId: string; productId: string; country: 'ZA' | 'MW'; currency: string; commodity: string; principalMinor: bigint }) {
    const prior = await this.repo.allocation(a.requestId);
    if (prior) return { facilityId: prior.facilityId, replayed: true };
    const eligible = (await this.repo.list())
      .filter((f) => f.status === 'active' && f.currency === a.currency && f.countries.includes(a.country)
        && (f.products === '*' || f.products.includes(a.productId)) && f.limitMinor - f.drawnMinor >= a.principalMinor)
      .sort((x, y) => x.priority - y.priority || Number((x.drawnMinor * 10000n) / (x.limitMinor || 1n) - (y.drawnMinor * 10000n) / (y.limitMinor || 1n)));
    const f = eligible[0];
    if (!f) throw new FundingError('FUNDING_UNAVAILABLE', 'no facility can fund this advance');
    await this.ledger.post({
      tenantId: a.tenantId, idempotencyKey: `${a.requestId}:funded`, reason: 'advance_funded', correlationId: a.requestId, currency: a.currency,
      lines: [{ account: fundingAcct.supplier(a.commodity), amount: a.principalMinor }, { account: fundingAcct.funder(f.id), amount: -a.principalMinor }],
    });
    f.drawnMinor += a.principalMinor; await this.repo.save(f);
    await this.repo.saveAllocation({ requestId: a.requestId, facilityId: f.id, principalMinor: a.principalMinor, costBps: f.costBps, repaidMinor: 0n });
    return { facilityId: f.id, replayed: false };
  }

  /** Funding fell through (delivery failed): release the draw. */
  async release(a: { tenantId: string; requestId: string; currency: string; commodity: string }) {
    const al = await this.repo.allocation(a.requestId);
    if (!al || al.repaidMinor > 0n) return;
    await this.ledger.post({
      tenantId: a.tenantId, idempotencyKey: `${a.requestId}:funding_released`, reason: 'advance_funding_released', correlationId: a.requestId, currency: a.currency,
      lines: [{ account: fundingAcct.funder(al.facilityId), amount: al.principalMinor }, { account: fundingAcct.supplier(a.commodity), amount: -al.principalMinor }],
    });
    const f = (await this.repo.list()).find((x) => x.id === al.facilityId)!;
    f.drawnMinor -= al.principalMinor; await this.repo.save(f);
    await this.repo.saveAllocation({ ...al, repaidMinor: al.principalMinor });
  }

  /** Pay the funder its principal share, plus its cost, out of what was recovered from the customer. */
  async repayFromRecovery(a: { tenantId: string; requestId: string; topupRef: string; currency: string; takenMinor: bigint; principalMinor: bigint; feeMinor: bigint }) {
    const al = await this.repo.allocation(a.requestId);
    if (!al) return { paid: 0n };
    const share = (a.takenMinor * a.principalMinor) / (a.principalMinor + a.feeMinor);
    const principalPart = share > al.principalMinor - al.repaidMinor ? al.principalMinor - al.repaidMinor : share;
    if (principalPart <= 0n) return { paid: 0n };
    const cost = mulBps(principalPart, BigInt(al.costBps));
    const lines = [{ account: fundingAcct.funder(al.facilityId), amount: principalPart }, { account: fundingAcct.clearing, amount: -(principalPart + cost) }];
    if (cost > 0n) lines.splice(1, 0, { account: fundingAcct.cost, amount: cost });
    await this.ledger.post({ tenantId: a.tenantId, idempotencyKey: `${a.topupRef}:funder`, reason: 'funder_repaid', correlationId: a.topupRef, currency: a.currency, lines });
    const f = (await this.repo.list()).find((x) => x.id === al.facilityId)!;
    f.drawnMinor -= principalPart; await this.repo.save(f);
    await this.repo.saveAllocation({ ...al, repaidMinor: al.repaidMinor + principalPart });
    return { paid: principalPart + cost };
  }

  /** Performance triggers as code: suspend new draws on a breach, resume when performance recovers. */
  async applyPerformance(stats: { recoveryRateBps: number; chargeOffBps: number }) {
    for (const f of await this.repo.list()) {
      if (f.status === 'amortising') continue;
      const breach = (f.minRecoveryRateBps !== undefined && stats.recoveryRateBps < f.minRecoveryRateBps)
        || (f.maxChargeOffBps !== undefined && stats.chargeOffBps > f.maxChargeOffBps);
      const next = breach ? 'suspended' : 'active';
      if (next !== f.status) { f.status = next; await this.repo.save(f); }
    }
  }

  async headroom(currency: string) {
    return (await this.repo.list()).filter((f) => f.status === 'active' && f.currency === currency).reduce((s, f) => s + (f.limitMinor - f.drawnMinor), 0n);
  }
}
```

### `src/lib/tshepo/consent/consent.ts`

```ts
export type Purpose = 'credit_underwriting' | 'wifi_billing' | 'marketing';
interface ConsentEvent { subject: string; purpose: Purpose; kind: 'grant' | 'revoke'; at: Date; expiresAt?: Date }

/** Append-only consent log. Latest event per (subject, purpose) wins. */
export class ConsentService {
  private log: ConsentEvent[] = [];
  grant(subject: string, purpose: Purpose, at = new Date(), expiresAt?: Date) {
    this.log.push({ subject, purpose, kind: 'grant', at, expiresAt });
  }
  revoke(subject: string, purpose: Purpose, at = new Date()) {
    this.log.push({ subject, purpose, kind: 'revoke', at });
  }
  isAllowed(subject: string, purpose: Purpose, now = new Date()): boolean {
    for (let i = this.log.length - 1; i >= 0; i--) {
      const e = this.log[i]!;
      if (e.subject !== subject || e.purpose !== purpose || e.at > now) continue;
      if (e.kind === 'revoke') return false;
      return !e.expiresAt || e.expiresAt > now;
    }
    return false;
  }
}
```

### `src/lib/tshepo/decisioning/orchestrator.ts`

```ts
import { ConsentService } from '../consent/consent';
import { fmtRand, mulBps, minOf } from '../shared/money';

export interface FeatureStore { get(subject: string, names: string[]): Promise<Record<string, number | undefined>> }

export interface Policy {
  version: string;
  modelVersion: string;
  minTenureDays: number;
  minLimit: bigint;
  maxLimit: bigint;
  /** Limit as a share of trailing 30-day sales, in basis points. */
  limitShareOfSalesBps: number;
}

export type Outcome = 'approve' | 'decline' | 'refer';
export interface TraceStep { step: string; result: 'pass' | 'fail' | 'skip'; detail: string }
export interface Decision {
  outcome: Outcome;
  limit: bigint;
  reasonCodes: string[];
  /** Plain-language explanation and what would change the outcome. */
  explanation: string[];
  counterfactual: string[];
  trace: TraceStep[];
  versions: { policy: string; model: string };
}

const FEATURES = ['sales_30d_minor', 'tenure_days', 'arrears_minor', 'kyc_verified'] as const;

export class DecisionOrchestrator {
  constructor(private consent: ConsentService, private features: FeatureStore, private policy: Policy) {}

  async decide(subject: string, now = new Date()): Promise<Decision> {
    const trace: TraceStep[] = [];
    const versions = { policy: this.policy.version, model: this.policy.modelVersion };
    const out = (o: Outcome, limit: bigint, codes: string[], why: string[], cf: string[]): Decision =>
      ({ outcome: o, limit, reasonCodes: codes, explanation: why, counterfactual: cf, trace, versions });

    // 1. Consent is checked before any feature is read.
    if (!this.consent.isAllowed(subject, 'credit_underwriting', now)) {
      trace.push({ step: 'consent', result: 'fail', detail: 'no valid credit_underwriting consent' });
      return out('refer', 0n, ['CONSENT_MISSING'], ['We need your permission to use your trading data for a credit check.'], ['Give consent for credit checks.']);
    }
    trace.push({ step: 'consent', result: 'pass', detail: 'credit_underwriting granted' });

    // 2. Features. A missing critical feature means refer, never guess.
    const f = await this.features.get(subject, [...FEATURES]);
    const missing = FEATURES.filter((n) => f[n] === undefined);
    if (missing.length) {
      trace.push({ step: 'features', result: 'fail', detail: `missing: ${missing.join(', ')}` });
      return out('refer', 0n, ['DATA_INCOMPLETE'], ['We do not yet have enough information to decide.'], ['A reviewer will check your details.']);
    }
    trace.push({ step: 'features', result: 'pass', detail: 'all critical features present' });
    const sales = BigInt(f.sales_30d_minor!);
    const tenure = f.tenure_days!;
    const arrears = BigInt(f.arrears_minor!);

    // 3. Hard stops.
    if (f.kyc_verified !== 1) {
      trace.push({ step: 'hard_stops', result: 'fail', detail: 'KYC not verified' });
      return out('refer', 0n, ['KYC_PENDING'], ['Your identity check is not complete.'], ['Complete identity verification.']);
    }
    if (arrears > 0n) {
      trace.push({ step: 'hard_stops', result: 'fail', detail: `arrears ${fmtRand(arrears)}` });
      return out('decline', 0n, ['ARREARS_PRESENT'], ['You have an overdue amount on another account.'], [`Clear the overdue ${fmtRand(arrears)} and apply again.`]);
    }
    if (tenure < this.policy.minTenureDays) {
      const more = Math.ceil(this.policy.minTenureDays - tenure);
      trace.push({ step: 'hard_stops', result: 'fail', detail: `tenure ${tenure} days` });
      return out('decline', 0n, ['TENURE_TOO_SHORT'], ['You have not been trading with us long enough yet.'], [`Keep trading for ${more} more days and apply again.`]);
    }
    trace.push({ step: 'hard_stops', result: 'pass', detail: 'kyc, arrears, tenure ok' });

    // 4. Affordability and limit (illustrative scorecard stand-in: share of recent sales).
    const raw = mulBps(sales, BigInt(this.policy.limitShareOfSalesBps));
    const limit = minOf(raw, this.policy.maxLimit);
    if (limit < this.policy.minLimit) {
      const needed = (this.policy.minLimit * 10000n + BigInt(this.policy.limitShareOfSalesBps) - 1n) / BigInt(this.policy.limitShareOfSalesBps);
      trace.push({ step: 'affordability', result: 'fail', detail: `limit ${fmtRand(limit)} below minimum` });
      return out('decline', 0n, ['AFFORDABILITY_LOW'], ['Your recent sales do not support the smallest advance we offer.'],
        [`Monthly sales of at least ${fmtRand(needed)} would qualify.`]);
    }
    trace.push({ step: 'affordability', result: 'pass', detail: `limit ${fmtRand(limit)}` });
    return out('approve', limit, ['APPROVED'], [`You are approved for up to ${fmtRand(limit)}.`], []);
  }
}
```

### `src/lib/tshepo/edge/envelope.ts`

```ts
import { createPrivateKey, createPublicKey, generateKeyPairSync, sign, verify, KeyObject } from 'node:crypto';

export interface EnvelopePayload {
  envelopeId: string; subject: string; tenant: string; product: string;
  maxOfflineAmountMinor: string; currency: string;
  validFrom: string; expiresAt: string; policyVersion: string; modelVersion: string;
  alg: 'Ed25519'; kid: string;
}
export interface SignedEnvelope { payload: EnvelopePayload; signature: string }

const canonical = (p: EnvelopePayload) =>
  JSON.stringify(Object.fromEntries(Object.entries(p).sort(([a], [b]) => (a < b ? -1 : 1))));

export function newKeyPair() {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519');
  return { publicKey, privateKey };
}
export const exportPublic = (k: KeyObject) => k.export({ type: 'spki', format: 'pem' }).toString();
export const importPublic = (pem: string) => createPublicKey(pem);
export const importPrivate = (pem: string) => createPrivateKey(pem);

export function signEnvelope(payload: EnvelopePayload, privateKey: KeyObject): SignedEnvelope {
  return { payload, signature: sign(null, Buffer.from(canonical(payload)), privateKey).toString('base64') };
}

export type VerifyResult = { ok: true } | { ok: false; reason: 'UNKNOWN_KEY' | 'BAD_SIGNATURE' | 'NOT_YET_VALID' | 'EXPIRED' | 'WRONG_TENANT' };

/** What an edge node runs before every offline decision: signature, validity window, tenant, key ID. */
export function verifyEnvelope(env: SignedEnvelope, keys: Map<string, KeyObject>, tenant: string, now = new Date()): VerifyResult {
  const key = keys.get(env.payload.kid);
  if (!key) return { ok: false, reason: 'UNKNOWN_KEY' };
  if (!verify(null, Buffer.from(canonical(env.payload)), key, Buffer.from(env.signature, 'base64'))) return { ok: false, reason: 'BAD_SIGNATURE' };
  if (env.payload.tenant !== tenant) return { ok: false, reason: 'WRONG_TENANT' };
  if (now < new Date(env.payload.validFrom)) return { ok: false, reason: 'NOT_YET_VALID' };
  if (now >= new Date(env.payload.expiresAt)) return { ok: false, reason: 'EXPIRED' };
  return { ok: true };
}

/** Tracks offline spend against the envelope cap; reported to the core on sync. */
export class EdgeSpendTracker {
  private spent = new Map<string, bigint>();
  tryReserve(env: SignedEnvelope, amount: bigint): boolean {
    const cap = BigInt(env.payload.maxOfflineAmountMinor);
    const next = (this.spent.get(env.payload.envelopeId) ?? 0n) + amount;
    if (amount <= 0n || next > cap) return false;
    this.spent.set(env.payload.envelopeId, next);
    return true;
  }
  spentFor(id: string) { return this.spent.get(id) ?? 0n; }
}
```

### `src/lib/tshepo/gopay/settlement.ts`

```ts
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
```

### `src/lib/tshepo/ledger/ledger.ts`

```ts
import { uuidv7 } from '../shared/ids';

/** Signed amounts: debit positive, credit negative. Every entry must sum to zero. */
export interface Line { account: string; amount: bigint }
export interface EntryInput {
  tenantId: string;
  idempotencyKey: string;
  reason: string;
  correlationId: string;
  currency: string;
  lines: Line[];
}
export interface Entry extends EntryInput { id: string; postedAt: Date }
export interface OutboxEvent { id: string; topic: string; payload: unknown }

/** Port. A Postgres/Prisma adapter must write the entry and outbox row in ONE transaction. */
export interface LedgerRepo {
  findByKey(tenantId: string, key: string): Promise<Entry | undefined>;
  appendWithOutbox(entry: Entry, event: OutboxEvent): Promise<void>;
  entries(tenantId: string): Promise<readonly Entry[]>;
}

export class LedgerError extends Error {
  constructor(public readonly code: string, message: string) { super(message); }
}

const fingerprint = (i: EntryInput) =>
  [i.reason, i.currency, ...i.lines.map((l) => `${l.account}:${l.amount}`)].join('|');

export class InMemoryLedgerRepo implements LedgerRepo {
  private byKey = new Map<string, Entry>();
  private byTenant = new Map<string, Entry[]>();
  readonly outbox: OutboxEvent[] = [];

  async findByKey(t: string, k: string) { return this.byKey.get(`${t}/${k}`); }
  async appendWithOutbox(e: Entry, ev: OutboxEvent) {
    this.byKey.set(`${e.tenantId}/${e.idempotencyKey}`, e);
    const list = this.byTenant.get(e.tenantId) ?? [];
    list.push(e);
    this.byTenant.set(e.tenantId, list);
    this.outbox.push(ev);
  }
  async entries(t: string) { return this.byTenant.get(t) ?? []; }
}

export class LedgerService {
  constructor(private readonly repo: LedgerRepo) {}

  async post(input: EntryInput): Promise<{ entry: Entry; replayed: boolean }> {
    if (!/^[A-Z]{3}$/.test(input.currency)) throw new LedgerError('BAD_CURRENCY', 'currency must be ISO 4217');
    if (input.lines.length < 2) throw new LedgerError('TOO_FEW_LINES', 'an entry needs at least two lines');
    let sum = 0n;
    for (const l of input.lines) {
      if (!l.account) throw new LedgerError('NO_ACCOUNT', 'every line needs an account');
      if (l.amount === 0n) throw new LedgerError('ZERO_AMOUNT', 'zero-amount lines are not allowed');
      sum += l.amount;
    }
    if (sum !== 0n) throw new LedgerError('UNBALANCED', `entry sums to ${sum}, expected 0`);

    const existing = await this.repo.findByKey(input.tenantId, input.idempotencyKey);
    if (existing) {
      if (fingerprint(existing) !== fingerprint(input)) {
        throw new LedgerError('IDEMPOTENCY_CONFLICT', 'same key reused with different content');
      }
      return { entry: existing, replayed: true };
    }
    const entry: Entry = { ...input, id: uuidv7(), postedAt: new Date() };
    await this.repo.appendWithOutbox(entry, {
      id: uuidv7(),
      topic: 'ledger.entry.posted',
      payload: { entryId: entry.id, tenantId: entry.tenantId, reason: entry.reason, correlationId: entry.correlationId },
    });
    return { entry, replayed: false };
  }

  async get(tenantId: string, key: string) { return this.repo.findByKey(tenantId, key); }

  async balance(tenantId: string, account: string): Promise<bigint> {
    let b = 0n;
    for (const e of await this.repo.entries(tenantId)) for (const l of e.lines) if (l.account === account) b += l.amount;
    return b;
  }

  /** Sum of all lines across the tenant. Must always be zero. */
  async trialBalanceTotal(tenantId: string): Promise<bigint> {
    let t = 0n;
    for (const e of await this.repo.entries(tenantId)) for (const l of e.lines) t += l.amount;
    return t;
  }
}
```

### `src/lib/tshepo/ledger/prisma-ledger-repo.ts`

```ts
import type { Entry, LedgerRepo, OutboxEvent } from './ledger';

/** Minimal structural types so this adapter compiles without importing the generated Prisma client. */
/* eslint-disable @typescript-eslint/no-explicit-any */
export interface TshepoTx {
  tshepoJournalEntry: { findUnique(a: any): Promise<any>; create(a: any): Promise<any>; findMany(a: any): Promise<any[]> };
  tshepoAccount: { upsert(a: any): Promise<{ id: string }> };
  tshepoOutbox: { create(a: any): Promise<any> };
}
export interface TshepoDb extends TshepoTx { $transaction<T>(fn: (tx: TshepoTx) => Promise<T>): Promise<T> }

const toEntry = (r: any): Entry => ({
  id: r.id, tenantId: r.tenantId, idempotencyKey: r.idempotencyKey, reason: r.reason,
  correlationId: r.correlationId, currency: r.currency, postedAt: r.postedAt,
  lines: r.lines.map((l: any) => ({ account: l.account.code, amount: BigInt(l.amountMinor) })),
});
const include = { lines: { include: { account: true } } };

/** Prisma-backed ledger. The entry, its lines and its outbox row commit in ONE transaction. */
export class PrismaLedgerRepo implements LedgerRepo {
  constructor(private readonly db: TshepoDb) {}

  async findByKey(tenantId: string, key: string) {
    const r = await this.db.tshepoJournalEntry.findUnique({ where: { tenantId_idempotencyKey: { tenantId, idempotencyKey: key } }, include });
    return r ? toEntry(r) : undefined;
  }

  async appendWithOutbox(entry: Entry, event: OutboxEvent) {
    await this.db.$transaction(async (tx) => {
      const lines = [];
      for (const l of entry.lines) {
        const acc = await tx.tshepoAccount.upsert({
          where: { tenantId_code: { tenantId: entry.tenantId, code: l.account } },
          create: { id: `${entry.tenantId}:${l.account}`, tenantId: entry.tenantId, code: l.account, kind: l.account.split(':')[0], currency: entry.currency },
          update: {},
        });
        lines.push({ id: `${entry.id}:${lines.length}`, accountId: acc.id, amountMinor: l.amount, currency: entry.currency });
      }
      await tx.tshepoJournalEntry.create({
        data: { id: entry.id, tenantId: entry.tenantId, idempotencyKey: entry.idempotencyKey, reason: entry.reason,
          correlationId: entry.correlationId, currency: entry.currency, postedAt: entry.postedAt, lines: { create: lines } },
      });
      await tx.tshepoOutbox.create({ data: { id: event.id, tenantId: entry.tenantId, topic: event.topic, payload: Buffer.from(JSON.stringify(event.payload)) } });
    });
  }

  async entries(tenantId: string) {
    const rows = await this.db.tshepoJournalEntry.findMany({ where: { tenantId }, include, orderBy: { postedAt: 'asc' } });
    return rows.map(toEntry);
  }
}
```

### `src/lib/tshepo/repayment/waterfall.ts`

```ts
import { mulBps, minOf } from '../shared/money';

export interface Bucket { name: string; due: bigint }

/** Allocate a payment across buckets in the configured order. Order is product config approved by compliance. */
export function allocateWaterfall(amount: bigint, buckets: Bucket[]) {
  if (amount < 0n) throw new RangeError('amount must be non-negative');
  let left = amount;
  const allocations: Record<string, bigint> = {};
  for (const b of buckets) {
    const take = minOf(left, b.due < 0n ? 0n : b.due);
    allocations[b.name] = take;
    left -= take;
  }
  return { allocations, unapplied: left };
}

/** GoPay settlement split: share of net sale, never more than the amount outstanding. */
export function splitAtSettlement(net: bigint, shareBps: number, outstanding: bigint): bigint {
  if (shareBps < 0 || shareBps > 10000) throw new RangeError('shareBps out of range');
  if (outstanding <= 0n || net <= 0n) return 0n;
  return minOf(outstanding, mulBps(net, BigInt(shareBps)));
}
```

### `src/lib/tshepo/shared/ids.ts`

```ts
import { randomBytes } from 'node:crypto';

/** UUIDv7: 48-bit millisecond timestamp, then random bits. Sortable by creation time. */
export function uuidv7(now: number = Date.now()): string {
  const b = randomBytes(16);
  const ts = BigInt(now);
  for (let i = 0; i < 6; i++) b[i] = Number((ts >> BigInt(40 - 8 * i)) & 0xffn);
  b[6] = (b[6]! & 0x0f) | 0x70;
  b[8] = (b[8]! & 0x3f) | 0x80;
  const h = b.toString('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}
```

### `src/lib/tshepo/shared/money.ts`

```ts
/** All money is integer minor units (cents) held as bigint. Never floating point. */
export type Minor = bigint;

/** amount * bps / 10_000, rounded half-up. Amounts must be non-negative. */
export function mulBps(amount: Minor, bps: bigint): Minor {
  if (amount < 0n || bps < 0n) throw new RangeError('mulBps expects non-negative inputs');
  return (amount * bps + 5000n) / 10000n;
}

export const minOf = (a: Minor, b: Minor): Minor => (a < b ? a : b);

export function fmtRand(c: Minor): string {
  const neg = c < 0n;
  const abs = neg ? -c : c;
  const whole = (abs / 100n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${neg ? '-' : ''}R${whole}.${(abs % 100n).toString().padStart(2, '0')}`;
}
```

### `src/lib/tshepo/topup/orchestrator.ts`

```ts
import { VendRequest } from '../vending/types';
import { VendingRouter } from '../vending/router';
import { History } from './products';
import { TopUpCredit } from './service';

export type DeliveryResult =
  | { status: 'delivered'; token?: string; providerRef: string; replayed: boolean }
  | { status: 'pending'; reason: string }
  | { status: 'cancelled'; code: string }
  | { status: 'declined'; code: string };

export interface AdvanceRequest {
  tenantId: string; subjectId: string; productId: string; amountMinor: bigint; requestId: string; history: History; now?: Date;
  /** Where to deliver: msisdn for airtime and data, meterNumber for electricity. */
  target: Pick<VendRequest, 'msisdn' | 'operator' | 'meterNumber' | 'municipality' | 'customerName'>;
}

/** Issue the advance, deliver the airtime or token, and keep the books right whatever the delivery outcome. */
export class AdvanceDelivery {
  constructor(private credit: TopUpCredit, private router: VendingRouter) {}

  async request(a: AdvanceRequest): Promise<DeliveryResult> {
    const p = this.credit.getProduct(a.productId);
    let issued;
    try { issued = await this.credit.issue(a); }
    catch (e: any) { return { status: 'declined', code: e?.code ?? 'ERROR' }; }

    const out = await this.router.vend({
      reference: a.requestId, country: p.jurisdiction, commodity: p.commodity, amountMinor: a.amountMinor, currency: p.currency, ...a.target,
    });
    if (out.status === 'success') return { status: 'delivered', token: out.token, providerRef: out.providerRef, replayed: issued.replayed };
    if (out.status === 'failed') { await this.credit.cancel(a.tenantId, a.requestId); return { status: 'cancelled', code: out.code }; }
    await this.credit.markPending(a.tenantId, a.requestId);
    return { status: 'pending', reason: out.reason };
  }

  /** Daily job and manual tool: look up deliveries whose outcome was unknown and settle them. */
  async settlePending(tenantId: string, requestId: string): Promise<DeliveryResult> {
    const out = await this.router.resolve(requestId);
    if (out.status === 'success') { await this.credit.confirm(tenantId, requestId); return { status: 'delivered', token: out.token, providerRef: out.providerRef, replayed: false }; }
    if (out.status === 'failed') { await this.credit.cancel(tenantId, requestId); return { status: 'cancelled', code: out.code }; }
    return { status: 'pending', reason: out.reason };
  }
}
```

### `src/lib/tshepo/topup/presets.ts`

```ts
import { Product } from './products';

/**
 * ILLUSTRATIVE starting points taken from public product descriptions. Every number must be confirmed
 * with the operator or vendor and with counsel before launch (see master build document, section 16).
 * Amounts are minor units: rand in cents, kwacha in tambala.
 */
export const PRESETS: Product[] = [
  { // South Africa airtime: Vodacom-style menu, fee per R10 or part thereof, repaid in full on next recharge
    id: 'za-airtime', jurisdiction: 'ZA', commodity: 'airtime', currency: 'ZAR',
    menuMinor: [500n, 1000n, 1500n, 2000n],
    fee: { kind: 'per_block', blockMinor: 1000n, feePerBlockMinor: 120n },
    recovery: { mode: 'full_first' },
    minTenureDays: 90, minMonths: 3, minMonthlyRechargeMinor: 2900n, limitShareBps: 3000,
    dueAfterDays: 30, overdueAction: 'add_to_bill',
  },
  { // South Africa electricity: share of each future purchase goes to the advance until repaid
    id: 'za-electricity', jurisdiction: 'ZA', commodity: 'electricity', currency: 'ZAR',
    menuMinor: [5000n, 10000n, 15000n, 30000n],
    fee: { kind: 'percent_bps', bps: 1000 },
    recovery: { mode: 'capped_share', capBps: 5000 },
    minTenureDays: 90, minMonths: 2, minMonthlyRechargeMinor: 15000n, limitShareBps: 3000,
    dueAfterDays: 60, overdueAction: 'write_off',
  },
  { // Malawi airtime: kwacha menu, 10% fee, repaid on next recharge
    id: 'mw-airtime', jurisdiction: 'MW', commodity: 'airtime', currency: 'MWK',
    menuMinor: [5000n, 10000n, 20000n, 50000n, 100000n, 200000n],
    fee: { kind: 'percent_bps', bps: 1000 },
    recovery: { mode: 'full_first' },
    minTenureDays: 90, minMonths: 2, minMonthlyRechargeMinor: 100000n, limitShareBps: 3000,
    dueAfterDays: 30, overdueAction: 'write_off',
  },
  { // Malawi electricity (prepaid units): share of each purchase until repaid
    id: 'mw-electricity', jurisdiction: 'MW', commodity: 'electricity', currency: 'MWK',
    menuMinor: [500000n, 1000000n, 2000000n],
    fee: { kind: 'percent_bps', bps: 1000 },
    recovery: { mode: 'capped_share', capBps: 5000 },
    minTenureDays: 90, minMonths: 2, minMonthlyRechargeMinor: 500000n, limitShareBps: 3000,
    dueAfterDays: 60, overdueAction: 'write_off',
  },
];
```

### `src/lib/tshepo/topup/products.ts`

```ts
import { mulBps } from '../shared/money';

export type Jurisdiction = 'ZA' | 'MW';
export type Commodity = 'airtime' | 'data' | 'electricity';

/** How the access fee is charged. Illustrative defaults are in presets.ts and must be confirmed with each partner. */
export type FeeModel =
  | { kind: 'flat'; feeMinor: bigint }                                   // e.g. a fixed access fee per advance
  | { kind: 'per_block'; blockMinor: bigint; feePerBlockMinor: bigint }  // e.g. fee per R10 or part thereof
  | { kind: 'percent_bps'; bps: number };                                // e.g. 10% = 1000 bps

/** full_first: the whole top-up goes to the advance until it is repaid. capped_share: only a share of each purchase. */
export interface RecoveryRule { mode: 'full_first' | 'capped_share'; capBps?: number }

export interface Product {
  id: string;
  jurisdiction: Jurisdiction;
  commodity: Commodity;
  currency: string;
  /** The advance amounts the customer may choose from (the USSD or app menu). */
  menuMinor: bigint[];
  fee: FeeModel;
  /** Hard ceiling on the fee for one advance, set from the rules that apply to the product. Checked at quote time. */
  maxFeeMinor?: bigint;
  recovery: RecoveryRule;
  minTenureDays: number;
  /** Eligibility: at least minMonths of the last 3 calendar months with recharges totalling minMonthlyRechargeMinor. */
  minMonths: number;
  minMonthlyRechargeMinor: bigint;
  /** Largest advance as a share of average monthly recharge, in basis points. */
  limitShareBps: number;
  /** After this many days unrecovered, the overdue action applies. */
  dueAfterDays: number;
  overdueAction: 'add_to_bill' | 'write_off';
}

export function quoteFee(p: Product, principal: bigint): bigint {
  if (principal <= 0n) throw new RangeError('principal must be positive');
  let fee: bigint;
  switch (p.fee.kind) {
    case 'flat': fee = p.fee.feeMinor; break;
    case 'per_block': fee = ((principal + p.fee.blockMinor - 1n) / p.fee.blockMinor) * p.fee.feePerBlockMinor; break;
    case 'percent_bps': fee = mulBps(principal, BigInt(p.fee.bps)); break;
  }
  if (p.maxFeeMinor !== undefined && fee > p.maxFeeMinor) {
    throw new RangeError(`fee ${fee} exceeds the product ceiling ${p.maxFeeMinor}`);
  }
  return fee;
}

export interface History {
  tenureDays: number;
  recharges: { amountMinor: bigint; at: Date }[];
  arrearsMinor: bigint;
  /** Electricity: meter registered and linked to the customer. Airtime: SIM registered. */
  identityOk: boolean;
}

export interface Eligibility { ok: boolean; maxMinor: bigint; reasons: string[] }

export function assessEligibility(p: Product, h: History, now: Date): Eligibility {
  const reasons: string[] = [];
  if (!h.identityOk) reasons.push('IDENTITY_NOT_VERIFIED');
  if (h.arrearsMinor > 0n) reasons.push('ARREARS_PRESENT');
  if (h.tenureDays < p.minTenureDays) reasons.push('TENURE_TOO_SHORT');

  const since = new Date(now.getTime() - 90 * 86400000);
  const byMonth = new Map<string, bigint>();
  let total = 0n;
  for (const r of h.recharges) {
    if (r.at < since || r.at > now) continue;
    const k = `${r.at.getUTCFullYear()}-${r.at.getUTCMonth()}`;
    byMonth.set(k, (byMonth.get(k) ?? 0n) + r.amountMinor);
    total += r.amountMinor;
  }
  const goodMonths = [...byMonth.values()].filter((v) => v >= p.minMonthlyRechargeMinor).length;
  if (goodMonths < p.minMonths) reasons.push('RECHARGE_HISTORY_TOO_THIN');

  const avgMonthly = total / 3n;
  const cap = mulBps(avgMonthly, BigInt(p.limitShareBps));
  const eligibleMenu = p.menuMinor.filter((m) => m <= cap);
  const maxMinor = eligibleMenu.length ? eligibleMenu.reduce((a, b) => (a > b ? a : b)) : 0n;
  if (maxMinor === 0n && !reasons.includes('RECHARGE_HISTORY_TOO_THIN')) reasons.push('LIMIT_BELOW_SMALLEST_ADVANCE');
  return { ok: reasons.length === 0, maxMinor, reasons };
}
```

### `src/lib/tshepo/topup/service.ts`

```ts
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
```

### `src/lib/tshepo/vending/catalogue.ts`

```ts
import { Country, VendCommodity } from './types';

export interface ProviderProfile {
  id: string; name: string; country: Country | 'ZA+MW'; role: 'aggregator' | 'operator' | 'utility' | 'network';
  commodities: VendCommodity[];
  integration: 'adapter_built' | 'public_docs' | 'partner_gated' | 'in_negotiation';
  notes: string;
}

/** Providers named in public sources (see master build document, section 17). Commercial terms and API access must be confirmed with each. */
export const PROVIDERS: ProviderProfile[] = [
  { id: 'blue-label', name: 'Blue Label Telecoms (Cigicell platform, Ringas)', country: 'ZA', role: 'aggregator', commodities: ['airtime', 'data', 'electricity'], integration: 'partner_gated', notes: 'Reported to handle over 60% of prepaid top-ups; also runs BlueAdvance, a competing advance product' },
  { id: 'easypay', name: 'EasyPay (Lesaka group)', country: 'ZA', role: 'aggregator', commodities: ['airtime', 'data', 'electricity'], integration: 'partner_gated', notes: 'Switching and bill payments; named as an electricity aggregator' },
  { id: 'kazang', name: 'Kazang (Connect Group)', country: 'ZA', role: 'aggregator', commodities: ['airtime', 'data', 'electricity'], integration: 'partner_gated', notes: 'About 68,000 active devices; also sells international electricity vouchers including Malawi ESCOM; corporate integration offered' },
  { id: 'flash', name: 'Flash', country: 'ZA', role: 'aggregator', commodities: ['airtime', 'data', 'electricity'], integration: 'partner_gated', notes: 'Named as a national prepaid competitor' },
  { id: 'prepaid24', name: 'Prepaid24', country: 'ZA', role: 'aggregator', commodities: ['airtime', 'data', 'electricity'], integration: 'public_docs', notes: 'Electricity for over 94% of municipalities; offers API integration for platforms' },
  { id: 'syntell', name: 'Syntell', country: 'ZA', role: 'aggregator', commodities: ['electricity'], integration: 'partner_gated', notes: 'Named as an electricity vending aggregator' },
  { id: 'contour', name: 'Contour', country: 'ZA', role: 'aggregator', commodities: ['electricity'], integration: 'partner_gated', notes: 'Named as an electricity vending aggregator' },
  { id: 'ontec', name: 'Ontec', country: 'ZA', role: 'aggregator', commodities: ['electricity'], integration: 'partner_gated', notes: 'Named as an electricity vending aggregator' },
  { id: 'ipay', name: 'iPay', country: 'ZA', role: 'aggregator', commodities: ['electricity'], integration: 'partner_gated', notes: 'Named as an electricity vending aggregator' },
  { id: 'pay-at', name: 'Pay@', country: 'ZA', role: 'aggregator', commodities: ['electricity'], integration: 'partner_gated', notes: 'Municipal bill payments' },
  { id: 'cellair', name: 'CellAir', country: 'ZA', role: 'aggregator', commodities: ['airtime', 'data'], integration: 'partner_gated', notes: 'Named as a prepaid player' },
  { id: 'ra-cellular', name: 'RA Cellular', country: 'ZA', role: 'aggregator', commodities: ['airtime', 'data'], integration: 'partner_gated', notes: 'Named as a prepaid player' },
  { id: 'vodacom', name: 'Vodacom (direct)', country: 'ZA', role: 'operator', commodities: ['airtime', 'data'], integration: 'partner_gated', notes: 'Runs Airtime Advance already; direct supply for the later operator-embedded model' },
  { id: 'mtn-za', name: 'MTN South Africa (direct)', country: 'ZA', role: 'operator', commodities: ['airtime', 'data'], integration: 'partner_gated', notes: 'XtraTime; reported to be reducing advances' },
  { id: 'cell-c', name: 'Cell C (direct)', country: 'ZA', role: 'operator', commodities: ['airtime', 'data'], integration: 'partner_gated', notes: 'Fixed fee per advance, no interest' },
  { id: 'telkom', name: 'Telkom Mobile (direct)', country: 'ZA', role: 'operator', commodities: ['airtime', 'data'], integration: 'partner_gated', notes: 'Reported to lean on airtime advances' },
  { id: 'eskom-vendors', name: 'Eskom national vendors and municipal vending systems', country: 'ZA', role: 'utility', commodities: ['electricity'], integration: 'partner_gated', notes: 'Tokens are requested in real time from the utility vending server through contracted vendors' },
  { id: 'tnm', name: 'TNM (Telekom Networks Malawi) and TNM Mpamba', country: 'MW', role: 'operator', commodities: ['airtime', 'data'], integration: 'in_negotiation', notes: 'In discussions; runs Pasavute with Net1 and Supa Pesa today' },
  { id: 'airtel-mw', name: 'Airtel Malawi and Airtel Money', country: 'MW', role: 'operator', commodities: ['airtime', 'data'], integration: 'partner_gated', notes: 'Runs Kutapa and Kutchova' },
  { id: 'escom', name: 'ESCOM (Electricity Supply Corporation of Malawi)', country: 'MW', role: 'utility', commodities: ['electricity'], integration: 'in_negotiation', notes: 'Negotiations under way; prepaid tokens' },
  { id: 'paychangu', name: 'PayChangu bill payments', country: 'MW', role: 'aggregator', commodities: ['airtime', 'data', 'electricity'], integration: 'adapter_built', notes: 'Documented API for Airtel and TNM airtime and ESCOM tokens, paid from a pre-funded wallet' },
];
```

### `src/lib/tshepo/vending/http-adapter.ts`

```ts
import { Country, MeterInfo, VendCommodity, VendOutcome, VendRequest, VendingProvider } from './types';

export interface HttpCall { method: 'GET' | 'POST'; path: string; body?: unknown }

/**
 * A provider integration is configuration: how to build each call and how to read each reply.
 * Onboarding a new aggregator means writing one config object once its partner documentation is in hand.
 */
export interface HttpAdapterConfig {
  id: string;
  baseUrl: string;
  headers: () => Record<string, string>;
  supported: { commodity: VendCommodity; country: Country }[];
  buildVend(req: VendRequest): HttpCall;
  mapVend(httpStatus: number, body: any, req: VendRequest): VendOutcome;
  buildStatus?(reference: string): HttpCall;
  mapStatus?(httpStatus: number, body: any, reference: string): VendOutcome;
  buildValidate?(meterNumber: string, country: Country, municipality?: string): HttpCall;
  mapValidate?(httpStatus: number, body: any): MeterInfo;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

export class HttpVendingAdapter implements VendingProvider {
  readonly id: string;
  constructor(private cfg: HttpAdapterConfig) { this.id = cfg.id; }

  supports(c: VendCommodity, country: Country) { return this.cfg.supported.some((s) => s.commodity === c && s.country === country); }

  private async call(c: HttpCall): Promise<{ status: number; body: any }> {
    const f = this.cfg.fetchImpl ?? fetch;
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), this.cfg.timeoutMs ?? 15_000);
    try {
      const res = await f(this.cfg.baseUrl + c.path, {
        method: c.method, signal: ctl.signal,
        headers: { 'content-type': 'application/json', accept: 'application/json', ...this.cfg.headers() },
        body: c.body === undefined ? undefined : JSON.stringify(c.body),
      });
      let body: any = undefined;
      try { body = await res.json(); } catch { body = undefined; }
      return { status: res.status, body };
    } finally { clearTimeout(timer); }
  }

  /** No answer, a timeout or a server error means we cannot know whether it was delivered, so the result is unknown. */
  async vend(req: VendRequest): Promise<VendOutcome> {
    let r: { status: number; body: any };
    try { r = await this.call(this.cfg.buildVend(req)); }
    catch (e) { return { status: 'unknown', providerId: this.id, reason: `NO_RESPONSE: ${String(e)}` }; }
    if (r.status >= 500) return { status: 'unknown', providerId: this.id, reason: `HTTP_${r.status}` };
    if (r.status === 429) return { status: 'failed', providerId: this.id, code: 'RATE_LIMITED', message: 'rate limited', retryable: true };
    return this.cfg.mapVend(r.status, r.body, req);
  }

  async status(reference: string): Promise<VendOutcome> {
    if (!this.cfg.buildStatus || !this.cfg.mapStatus) return { status: 'unknown', providerId: this.id, reason: 'STATUS_ENDPOINT_NOT_CONFIGURED' };
    try { const r = await this.call(this.cfg.buildStatus(reference)); return this.cfg.mapStatus(r.status, r.body, reference); }
    catch (e) { return { status: 'unknown', providerId: this.id, reason: `NO_RESPONSE: ${String(e)}` }; }
  }

  async validateMeter(meterNumber: string, country: Country, municipality?: string): Promise<MeterInfo> {
    if (!this.cfg.buildValidate || !this.cfg.mapValidate) return { valid: false };
    const r = await this.call(this.cfg.buildValidate(meterNumber, country, municipality));
    return this.cfg.mapValidate(r.status, r.body);
  }
}
```

### `src/lib/tshepo/vending/mock.ts`

```ts
import { Country, MeterInfo, VendCommodity, VendOutcome, VendRequest, VendingProvider } from './types';

export type MockMode = 'success' | 'fail' | 'fail_retryable' | 'timeout' | 'throw';

/** Sandbox provider for development and tests. Delivers nothing real. */
export class MockVendingProvider implements VendingProvider {
  calls: VendRequest[] = [];
  private done = new Map<string, VendOutcome>();
  constructor(public readonly id: string, public mode: MockMode = 'success',
              private scope: { commodities?: VendCommodity[]; countries?: Country[] } = {}) {}
  supports(c: VendCommodity, country: Country) {
    return (this.scope.commodities ?? ['airtime', 'data', 'electricity']).includes(c) && (this.scope.countries ?? ['ZA', 'MW']).includes(country);
  }
  async validateMeter(meterNumber: string): Promise<MeterInfo> { return { valid: /^\d{11}$/.test(meterNumber), name: 'Sandbox customer' }; }
  async vend(req: VendRequest): Promise<VendOutcome> {
    this.calls.push(req);
    if (this.mode === 'throw') throw new Error('network down');
    if (this.mode === 'timeout') { const o: VendOutcome = { status: 'unknown', providerId: this.id, reason: 'TIMEOUT' }; return o; }
    if (this.mode === 'fail') return { status: 'failed', providerId: this.id, code: 'DECLINED', message: 'declined', retryable: false };
    if (this.mode === 'fail_retryable') return { status: 'failed', providerId: this.id, code: 'BUSY', message: 'try elsewhere', retryable: true };
    const o: VendOutcome = { status: 'success', providerId: this.id, providerRef: `${this.id}-${req.reference}`,
      token: req.commodity === 'electricity' ? '1234-5678-9012-3456-7890' : undefined };
    this.done.set(req.reference, o);
    return o;
  }
  /** Tests can mark a timed-out delivery as having actually succeeded. */
  settle(reference: string, outcome: VendOutcome) { this.done.set(reference, outcome); }
  async status(reference: string): Promise<VendOutcome> {
    return this.done.get(reference) ?? { status: 'unknown', providerId: this.id, reason: 'NO_RECORD' };
  }
}
```

### `src/lib/tshepo/vending/paychangu.ts`

```ts
import { HttpAdapterConfig, HttpVendingAdapter } from './http-adapter';
import { VendOutcome, VendRequest } from './types';

/** Tambala to the decimal string the provider expects, e.g. 100000n -> '1000', 150n -> '1.50'. */
export function minorToDecimal(minor: bigint): string {
  const whole = minor / 100n; const frac = (minor % 100n).toString().padStart(2, '0');
  return frac === '00' ? whole.toString() : `${whole}.${frac}`;
}
/** +265991234567 -> 0991234567. The provider's examples use the local form. CONFIRM in the sandbox. */
export function toLocalMsisdn(msisdn: string): string {
  const d = msisdn.replace(/[^\d]/g, '');
  return d.startsWith('265') ? `0${d.slice(3)}` : d;
}

const ok = (b: any) => b?.status === 'success' || b?.status === 'successful' || b?.success === true;

/**
 * PayChangu bill payments for Malawi (airtime on Airtel and TNM, ESCOM prepaid tokens), built from the public
 * documentation. Response bodies are not fully documented, so anything unrecognised is reported as UNKNOWN,
 * never as success. CONFIRM every response shape and the status endpoint in the provider sandbox.
 */
export function paychanguConfig(opts: { secretKey: () => string; baseUrl?: string; statusPath?: (ref: string) => string; fetchImpl?: typeof fetch }): HttpAdapterConfig {
  const id = 'paychangu';
  return {
    id, baseUrl: opts.baseUrl ?? 'https://api.paychangu.com', fetchImpl: opts.fetchImpl,
    headers: () => ({ Authorization: `Bearer ${opts.secretKey()}` }),
    supported: [{ commodity: 'airtime', country: 'MW' }, { commodity: 'data', country: 'MW' }, { commodity: 'electricity', country: 'MW' }],
    buildVend(req: VendRequest) {
      if (req.commodity === 'electricity') {
        if (!req.meterNumber) throw new Error('meterNumber is required for electricity');
        return { method: 'POST', path: '/bills/pay', body: { biller: 'escom', account: req.meterNumber, amount: minorToDecimal(req.amountMinor), customer_name: req.customerName, reference: req.reference } };
      }
      if (!req.msisdn) throw new Error('msisdn is required for airtime');
      return { method: 'POST', path: '/bills/buy-airtime', body: { phone: toLocalMsisdn(req.msisdn), amount: minorToDecimal(req.amountMinor), reference: req.reference } };
    },
    mapVend(httpStatus, body, req): VendOutcome {
      if (httpStatus >= 200 && httpStatus < 300 && ok(body)) {
        return { status: 'success', providerId: id, providerRef: String(body?.data?.reference ?? body?.data?.id ?? req.reference),
          token: body?.data?.token ? String(body.data.token) : undefined, units: body?.data?.units ? String(body.data.units) : undefined };
      }
      if (httpStatus >= 400 && httpStatus < 500) return { status: 'failed', providerId: id, code: `HTTP_${httpStatus}`, message: String(body?.message ?? 'rejected'), retryable: false };
      return { status: 'unknown', providerId: id, reason: 'UNRECOGNISED_RESPONSE' };
    },
    buildStatus: opts.statusPath ? (ref) => ({ method: 'GET', path: opts.statusPath!(ref) }) : undefined,
    mapStatus: opts.statusPath ? (s, b, ref): VendOutcome => (s < 300 && ok(b)
      ? { status: 'success', providerId: id, providerRef: String(b?.data?.reference ?? ref), token: b?.data?.token ? String(b.data.token) : undefined }
      : { status: 'unknown', providerId: id, reason: 'STATUS_NOT_FINAL' }) : undefined,
    buildValidate: (meter) => ({ method: 'POST', path: '/bills/validate', body: { biller: 'escom', account: meter } }),
    mapValidate: (s, b) => ({ valid: s < 300 && ok(b), name: b?.data?.name ?? b?.data?.customer_name, raw: b }),
  };
}

export const createPayChanguProvider = (opts: Parameters<typeof paychanguConfig>[0]) => new HttpVendingAdapter(paychanguConfig(opts));
```

### `src/lib/tshepo/vending/router.ts`

```ts
import { VendOutcome, VendRequest, VendingProvider } from './types';

export interface VendStore {
  get(reference: string): Promise<{ outcome: VendOutcome } | undefined>;
  put(reference: string, outcome: VendOutcome): Promise<void>;
}
export class InMemoryVendStore implements VendStore {
  private m = new Map<string, { outcome: VendOutcome }>();
  async get(r: string) { return this.m.get(r); }
  async put(r: string, outcome: VendOutcome) { this.m.set(r, { outcome }); }
}

export interface RoutedProvider { provider: VendingProvider; priority: number }
export interface RouterOptions { failureThreshold?: number; cooldownMs?: number; now?: () => number }

/**
 * Routes a delivery to the best available provider and fails over ONLY when the first provider definitely
 * did not deliver. An unknown outcome (timeout, unreadable reply) stops the chain: the item might have been
 * delivered, so it is looked up, never sent to a second provider.
 */
export class VendingRouter {
  private health = new Map<string, { failures: number; openUntil: number }>();
  private threshold: number; private cooldown: number; private now: () => number;
  constructor(private providers: RoutedProvider[], private store: VendStore, opts: RouterOptions = {}) {
    this.threshold = opts.failureThreshold ?? 3; this.cooldown = opts.cooldownMs ?? 60_000; this.now = opts.now ?? Date.now;
  }

  private circuitOpen(id: string) { const h = this.health.get(id); return !!h && h.openUntil > this.now(); }
  private record(id: string, ok: boolean) {
    const h = this.health.get(id) ?? { failures: 0, openUntil: 0 };
    if (ok) { h.failures = 0; h.openUntil = 0; } else if (++h.failures >= this.threshold) h.openUntil = this.now() + this.cooldown;
    this.health.set(id, h);
  }

  async vend(req: VendRequest): Promise<VendOutcome> {
    const prior = await this.store.get(req.reference);
    if (prior) return prior.outcome.status === 'unknown' ? this.resolve(req.reference) : prior.outcome;

    const candidates = this.providers
      .filter((p) => p.provider.supports(req.commodity, req.country) && !this.circuitOpen(p.provider.id))
      .sort((a, b) => a.priority - b.priority);
    let last: VendOutcome = { status: 'failed', providerId: 'router', code: 'NO_PROVIDER', message: 'no available provider', retryable: false };

    for (const { provider } of candidates) {
      let out: VendOutcome;
      try { out = await provider.vend(req); }
      catch (e) { out = { status: 'unknown', providerId: provider.id, reason: String(e) }; }
      if (out.status === 'success') { this.record(provider.id, true); await this.store.put(req.reference, out); return out; }
      if (out.status === 'unknown') { this.record(provider.id, false); await this.store.put(req.reference, out); return out; }
      this.record(provider.id, false);
      last = out;
      if (!out.retryable) break;
    }
    await this.store.put(req.reference, last);
    return last;
  }

  /** Look up an unknown delivery with the provider that took it. */
  async resolve(reference: string): Promise<VendOutcome> {
    const prior = await this.store.get(reference);
    if (!prior) return { status: 'failed', providerId: 'router', code: 'NOT_FOUND', message: 'no such delivery', retryable: false };
    if (prior.outcome.status !== 'unknown') return prior.outcome;
    const p = this.providers.find((x) => x.provider.id === prior.outcome.providerId)?.provider;
    if (!p) return prior.outcome;
    let out: VendOutcome;
    try { out = await p.status(reference); } catch (e) { return prior.outcome; }
    if (out.status !== 'unknown') await this.store.put(reference, out);
    return out.status === 'unknown' ? prior.outcome : out;
  }

  async validateMeter(meterNumber: string, country: 'ZA' | 'MW', municipality?: string) {
    for (const { provider } of [...this.providers].sort((a, b) => a.priority - b.priority)) {
      if (provider.validateMeter && provider.supports('electricity', country)) return provider.validateMeter(meterNumber, country, municipality);
    }
    return { valid: false } as const;
  }
}
```

### `src/lib/tshepo/vending/types.ts`

```ts
export type Country = 'ZA' | 'MW';
export type VendCommodity = 'airtime' | 'data' | 'electricity';

export interface VendRequest {
  /** Unique per delivery. Reusing it can never vend twice. */
  reference: string;
  country: Country;
  commodity: VendCommodity;
  amountMinor: bigint;
  currency: string;
  msisdn?: string;
  operator?: string;
  meterNumber?: string;
  municipality?: string;
  customerName?: string;
}

/** success: delivered. failed: definitely not delivered. unknown: we cannot tell, so never retry elsewhere; look it up. */
export type VendOutcome =
  | { status: 'success'; providerId: string; providerRef: string; token?: string; units?: string }
  | { status: 'failed'; providerId: string; code: string; message: string; retryable: boolean }
  | { status: 'unknown'; providerId: string; reason: string };

export interface MeterInfo { valid: boolean; name?: string; municipality?: string; raw?: unknown }

export interface VendingProvider {
  readonly id: string;
  supports(commodity: VendCommodity, country: Country): boolean;
  validateMeter?(meterNumber: string, country: Country, municipality?: string): Promise<MeterInfo>;
  vend(req: VendRequest): Promise<VendOutcome>;
  status(reference: string): Promise<VendOutcome>;
}
```

## Tests: **tests**/tshepo

### `__tests__/tshepo/consent-decision-edge.test.ts`

```ts
/** @jest-environment node */
import { ConsentService } from '../../src/lib/tshepo/consent/consent';
import { DecisionOrchestrator, Policy, FeatureStore } from '../../src/lib/tshepo/decisioning/orchestrator';
import { newKeyPair, signEnvelope, verifyEnvelope, EdgeSpendTracker, EnvelopePayload } from '../../src/lib/tshepo/edge/envelope';

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
```

### `__tests__/tshepo/funding-delivery.test.ts`

```ts
/** @jest-environment node */
import { LedgerService, InMemoryLedgerRepo } from '../../src/lib/tshepo/ledger/ledger';
import { Facility, FundingError, FundingService, InMemoryFacilityRepo, estimateFloat, fundingAcct } from '../../src/lib/tshepo/capital/funding';
import { PRESETS } from '../../src/lib/tshepo/topup/presets';
import { InMemoryAdvanceRepo, TopUpCredit, topupAcct } from '../../src/lib/tshepo/topup/service';
import { AdvanceDelivery } from '../../src/lib/tshepo/topup/orchestrator';
import { MockVendingProvider } from '../../src/lib/tshepo/vending/mock';
import { InMemoryVendStore, VendingRouter } from '../../src/lib/tshepo/vending/router';
import { History } from '../../src/lib/tshepo/topup/products';

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
```

### `__tests__/tshepo/gopay.test.ts`

```ts
/** @jest-environment node */
import { LedgerService, InMemoryLedgerRepo } from '../../src/lib/tshepo/ledger/ledger';
import { settleSale, collectDebit, failedDebit, acct, GoPayNotLiveError } from '../../src/lib/tshepo/gopay/settlement';
import { allocateWaterfall, splitAtSettlement } from '../../src/lib/tshepo/repayment/waterfall';

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
```

### `__tests__/tshepo/ledger.test.ts`

```ts
/** @jest-environment node */
import { LedgerService, InMemoryLedgerRepo, LedgerError } from '../../src/lib/tshepo/ledger/ledger';

const mk = () => { const repo = new InMemoryLedgerRepo(); return { repo, ledger: new LedgerService(repo) }; };
const base = { tenantId: 't1', correlationId: 'c1', currency: 'ZAR', reason: 'test' };

describe('ledger', () => {
  it('rejects unbalanced entries', async () => {
    const { ledger } = mk();
    await expect(ledger.post({ ...base, idempotencyKey: 'a', lines: [{ account: 'x', amount: 5n }, { account: 'y', amount: -4n }] }))
      .rejects.toMatchObject({ code: 'UNBALANCED' });
  });
  it('rejects zero lines, single lines and bad currency', async () => {
    const { ledger } = mk();
    await expect(ledger.post({ ...base, idempotencyKey: 'a', lines: [{ account: 'x', amount: 0n }, { account: 'y', amount: 0n }] })).rejects.toBeInstanceOf(LedgerError);
    await expect(ledger.post({ ...base, idempotencyKey: 'b', lines: [{ account: 'x', amount: 1n }] })).rejects.toMatchObject({ code: 'TOO_FEW_LINES' });
    await expect(ledger.post({ ...base, currency: 'rand', idempotencyKey: 'c', lines: [{ account: 'x', amount: 1n }, { account: 'y', amount: -1n }] })).rejects.toMatchObject({ code: 'BAD_CURRENCY' });
  });
  it('is idempotent and detects key reuse with different content', async () => {
    const { ledger, repo } = mk();
    const lines = [{ account: 'x', amount: 10n }, { account: 'y', amount: -10n }];
    const first = await ledger.post({ ...base, idempotencyKey: 'k', lines });
    const again = await ledger.post({ ...base, idempotencyKey: 'k', lines });
    expect(again.replayed).toBe(true);
    expect(again.entry.id).toBe(first.entry.id);
    expect(repo.outbox).toHaveLength(1);
    await expect(ledger.post({ ...base, idempotencyKey: 'k', lines: [{ account: 'x', amount: 11n }, { account: 'y', amount: -11n }] }))
      .rejects.toMatchObject({ code: 'IDEMPOTENCY_CONFLICT' });
  });
  it('keeps the trial balance at zero across 500 random balanced entries', async () => {
    const { ledger } = mk();
    const accts = ['a', 'b', 'c', 'd', 'e', 'f'];
    for (let i = 0; i < 500; i++) {
      const n = 2 + Math.floor(Math.random() * 3);
      const picked = [...accts].sort(() => Math.random() - 0.5).slice(0, n);
      const amounts = picked.slice(1).map(() => BigInt(1 + Math.floor(Math.random() * 100000)));
      const lines = [{ account: picked[0]!, amount: -amounts.reduce((s, x) => s + x, 0n) },
        ...amounts.map((a, j) => ({ account: picked[j + 1]!, amount: a }))];
      await ledger.post({ ...base, idempotencyKey: `r${i}`, lines });
    }
    expect(await ledger.trialBalanceTotal('t1')).toBe(0n);
  });
  it('isolates tenants', async () => {
    const { ledger } = mk();
    await ledger.post({ ...base, idempotencyKey: 'k', lines: [{ account: 'x', amount: 5n }, { account: 'y', amount: -5n }] });
    expect(await ledger.balance('t2', 'x')).toBe(0n);
  });
});
```

### `__tests__/tshepo/prisma-ledger-repo.test.ts`

```ts
/** @jest-environment node */
import { PrismaLedgerRepo, TshepoDb, TshepoTx } from '../../src/lib/tshepo/ledger/prisma-ledger-repo';
import { LedgerService } from '../../src/lib/tshepo/ledger/ledger';

/** Fake Prisma client: checks the adapter's call shapes and transaction boundary, not a real database. */
function fakeDb() {
  const entries: any[] = []; const accounts = new Map<string, any>(); const outbox: any[] = [];
  let failOutbox = false;
  const tx = (): TshepoTx => ({
    tshepoAccount: { upsert: async ({ where, create }: any) => { const k = `${where.tenantId_code.tenantId}/${where.tenantId_code.code}`; if (!accounts.has(k)) accounts.set(k, create); return accounts.get(k); } },
    tshepoJournalEntry: {
      create: async ({ data }: any) => { entries.push({ ...data, lines: data.lines.create.map((l: any) => ({ ...l, account: [...accounts.values()].find((a) => a.id === l.accountId) })) }); },
      findUnique: async ({ where }: any) => entries.find((e) => e.tenantId === where.tenantId_idempotencyKey.tenantId && e.idempotencyKey === where.tenantId_idempotencyKey.idempotencyKey) ?? null,
      findMany: async ({ where }: any) => entries.filter((e) => e.tenantId === where.tenantId),
    },
    tshepoOutbox: { create: async ({ data }: any) => { if (failOutbox) throw new Error('outbox down'); outbox.push(data); } },
  });
  const db: TshepoDb = {
    ...tx(),
    $transaction: async (fn) => { const snap = [entries.length, outbox.length]; try { return await fn(tx()); } catch (e) { entries.length = snap[0]!; outbox.length = snap[1]!; throw e; } },
  };
  return { db, entries, outbox, setFail: (v: boolean) => { failOutbox = v; } };
}
const b = { tenantId: 't1', correlationId: 'c', currency: 'ZAR', reason: 'x' };

describe('PrismaLedgerRepo', () => {
  it('round-trips entries, bigint amounts and idempotent replays', async () => {
    const f = fakeDb(); const ledger = new LedgerService(new PrismaLedgerRepo(f.db));
    const lines = [{ account: 'trust_bank', amount: 12345n }, { account: 'lender_funding', amount: -12345n }];
    const a = await ledger.post({ ...b, idempotencyKey: 'k1', lines });
    const again = await ledger.post({ ...b, idempotencyKey: 'k1', lines });
    expect(again.replayed).toBe(true);
    expect(again.entry.id).toBe(a.entry.id);
    expect(await ledger.balance('t1', 'trust_bank')).toBe(12345n);
    expect(await ledger.trialBalanceTotal('t1')).toBe(0n);
    expect(f.outbox).toHaveLength(1);
  });
  it('rolls the entry back when the outbox write fails', async () => {
    const f = fakeDb(); const ledger = new LedgerService(new PrismaLedgerRepo(f.db));
    f.setFail(true);
    await expect(ledger.post({ ...b, idempotencyKey: 'k2', lines: [{ account: 'a', amount: 5n }, { account: 'b', amount: -5n }] })).rejects.toThrow('outbox down');
    expect(f.entries).toHaveLength(0);
  });
});
```

### `__tests__/tshepo/topup.test.ts`

```ts
/** @jest-environment node */
import { LedgerService, InMemoryLedgerRepo } from '../../src/lib/tshepo/ledger/ledger';
import { PRESETS } from '../../src/lib/tshepo/topup/presets';
import { assessEligibility, quoteFee, History } from '../../src/lib/tshepo/topup/products';
import { InMemoryAdvanceRepo, TopUpCredit, TopUpCreditError, topupAcct } from '../../src/lib/tshepo/topup/service';

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
```

### `__tests__/tshepo/vending.test.ts`

```ts
/** @jest-environment node */
import { MockVendingProvider } from '../../src/lib/tshepo/vending/mock';
import { InMemoryVendStore, VendingRouter } from '../../src/lib/tshepo/vending/router';
import { HttpVendingAdapter } from '../../src/lib/tshepo/vending/http-adapter';
import { createPayChanguProvider, minorToDecimal, toLocalMsisdn } from '../../src/lib/tshepo/vending/paychangu';
import { PROVIDERS } from '../../src/lib/tshepo/vending/catalogue';
import { VendRequest } from '../../src/lib/tshepo/vending/types';

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
```

## Database: Prisma models and SQL guards

### `prisma/tshepo.models.prisma`

```prisma
// Tshepo models to APPEND to Groway's prisma/schema.postgresql.prisma.
// Money is BigInt minor units (cents). tenantId is PlatformTenant.id. Ledger tables are append-only (see migration).

model TshepoAccount {
  id        String   @id
  tenantId  String
  code      String
  kind      String
  currency  String   @default("ZAR") @db.Char(3)
  ownerRef  String?
  createdAt DateTime @default(now())
  lines     TshepoLedgerLine[]

  @@unique([tenantId, code])
  @@index([tenantId, kind])
}

model TshepoJournalEntry {
  id             String   @id
  tenantId       String
  idempotencyKey String
  reason         String
  correlationId  String
  currency       String   @db.Char(3)
  sourceType     String?
  sourceId       String?
  postedAt       DateTime @default(now())
  lines          TshepoLedgerLine[]

  @@unique([tenantId, idempotencyKey])
  @@index([tenantId, postedAt])
  @@index([sourceType, sourceId])
}

model TshepoLedgerLine {
  id          String             @id
  entryId     String
  accountId   String
  amountMinor BigInt
  currency    String             @db.Char(3)
  entry       TshepoJournalEntry @relation(fields: [entryId], references: [id])
  account     TshepoAccount      @relation(fields: [accountId], references: [id])

  @@index([entryId])
  @@index([accountId])
}

model TshepoOutbox {
  id          String    @id
  tenantId    String
  topic       String
  payload     Bytes
  createdAt   DateTime  @default(now())
  publishedAt DateTime?

  @@index([publishedAt, createdAt])
}

model TshepoConsentEvent {
  id        String    @id
  tenantId  String
  subject   String
  purpose   String
  kind      String
  at        DateTime  @default(now())
  expiresAt DateTime?

  @@index([tenantId, subject, purpose, at])
}

model TshepoDecision {
  id            String   @id
  tenantId      String
  subject       String
  outcome       String
  limitMinor    BigInt
  reasonCodes   String[]
  trace         Json
  policyVersion String
  modelVersion  String
  createdAt     DateTime @default(now())

  @@index([tenantId, subject])
}
```

### `prisma/tshepo-ledger-guards.sql`

```sql
-- Apply after the Tshepo tables exist (Postgres only). NOT yet run against a database: test on staging first.
-- 1. Every journal entry must net to zero, checked at commit.
CREATE OR REPLACE FUNCTION tshepo_assert_entry_balanced() RETURNS trigger AS $$
BEGIN
  IF (SELECT COALESCE(SUM("amountMinor"), 0) FROM "TshepoLedgerLine" WHERE "entryId" = NEW."entryId") <> 0 THEN
    RAISE EXCEPTION 'journal entry % does not net to zero', NEW."entryId";
  END IF;
  RETURN NULL;
END; $$ LANGUAGE plpgsql;

CREATE CONSTRAINT TRIGGER tshepo_ledger_line_balanced
  AFTER INSERT ON "TshepoLedgerLine" DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION tshepo_assert_entry_balanced();

ALTER TABLE "TshepoLedgerLine" ADD CONSTRAINT tshepo_nonzero_amount CHECK ("amountMinor" <> 0);

-- 2. Append-only: block UPDATE and DELETE on ledger and consent tables for every role, including the app role.
CREATE OR REPLACE FUNCTION tshepo_block_mutation() RETURNS trigger AS $$
BEGIN RAISE EXCEPTION '% on % is not allowed: ledger tables are append-only', TG_OP, TG_TABLE_NAME; END; $$ LANGUAGE plpgsql;

CREATE TRIGGER tshepo_entry_append_only BEFORE UPDATE OR DELETE ON "TshepoJournalEntry" FOR EACH ROW EXECUTE FUNCTION tshepo_block_mutation();
CREATE TRIGGER tshepo_line_append_only  BEFORE UPDATE OR DELETE ON "TshepoLedgerLine"   FOR EACH ROW EXECUTE FUNCTION tshepo_block_mutation();
CREATE TRIGGER tshepo_consent_append_only BEFORE UPDATE OR DELETE ON "TshepoConsentEvent" FOR EACH ROW EXECUTE FUNCTION tshepo_block_mutation();
```

## Groway changes: database client and helper scripts

### `groway-changes/src/lib/db.ts`

```ts
import { PrismaClient } from '@prisma/client'

// One client per process. Query logging is off unless PRISMA_LOG_QUERIES=1, because logging every
// query in production slows the app and floods the logs.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.PRISMA_LOG_QUERIES === '1' ? ['query', 'warn', 'error'] : ['warn', 'error'],
  })

// Reuse the client across hot reloads in development so connections are not leaked.
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

export { PrismaClient }
```

### `groway-changes/setup-groway-postgres.sh`

```bash
#!/usr/bin/env bash
# Groway: move from SQLite to Postgres on this Mac, and install the Tshepo foundation.
# Usage:  ./setup-groway-postgres.sh /path/to/groway-repo [--yes]
# Run it from inside the unzipped "tshepo/groway-changes" folder. Safe to re-run.
# NOT yet run on a Mac by its author: read the plan it prints before you confirm.
set -euo pipefail

REPO="${1:-}"; YES="${2:-}"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUNDLE="$(cd "$HERE/.." && pwd)"          # the "tshepo" folder from the zip
DB_NAME="groway"; DB_USER="groway_app"
say()  { printf '\n\033[1m==> %s\033[0m\n' "$*"; }
die()  { printf '\n\033[31mStopped: %s\033[0m\n' "$*" >&2; exit 1; }

[[ -n "$REPO" ]] || die "give the path to the Groway repo, e.g. ./setup-groway-postgres.sh ~/groway"
[[ "$(uname)" == "Darwin" ]] || die "this script is for macOS"
command -v brew >/dev/null || die "Homebrew is not installed (https://brew.sh)"
command -v node >/dev/null || die "Node is not installed (brew install node@20)"
[[ -f "$REPO/package.json" && -f "$REPO/prisma/schema.prisma" ]] || die "$REPO does not look like the Groway repo"
for f in "$HERE/prisma/schema.prisma" "$HERE/src/lib/db.ts" "$BUNDLE/src/lib/tshepo" "$BUNDLE/prisma/tshepo-ledger-guards.sql"; do
  [[ -e "$f" ]] || die "missing $f (run from the unzipped bundle)"
done

cat <<PLAN

This will, in $REPO:
  1. back up prisma/schema.prisma, src/lib/db.ts, .env and dev.db into ./backups/<timestamp>
  2. install and start PostgreSQL 16 with Homebrew, create database "$DB_NAME" and role "$DB_USER"
  3. set DATABASE_URL in .env, replace prisma/schema.prisma (Postgres, 302 models) and src/lib/db.ts,
     and add the build, start and backup helper scripts to the repo root
  4. copy the Tshepo code and tests, generate a baseline migration, create the tables, add the ledger guards
  5. run the Tshepo tests if jest is installed
It does NOT move your data. That is a separate, checked step.
PLAN
if [[ "$YES" != "--yes" ]]; then read -r -p "Continue? [y/N] " a; [[ "$a" =~ ^[Yy]$ ]] || die "cancelled, nothing changed"; fi

cd "$REPO"
say "1/5 Backups"
STAMP="$(date +%Y%m%d-%H%M%S)"; BK="backups/$STAMP"; mkdir -p "$BK"
for f in prisma/schema.prisma src/lib/db.ts .env dev.db; do [[ -f "$f" ]] && cp "$f" "$BK/$(echo "$f" | tr '/' '_')"; done
echo "Backed up to $BK"

say "2/5 PostgreSQL 16"
brew list postgresql@16 >/dev/null 2>&1 || brew install postgresql@16
export PATH="$(brew --prefix postgresql@16)/bin:$PATH"
brew services start postgresql@16 >/dev/null
for _ in $(seq 1 30); do pg_isready -q && break; sleep 1; done
pg_isready -q || die "PostgreSQL did not start"

if grep -qs "^DATABASE_URL=.*${DB_USER}@localhost:5432/${DB_NAME}" .env 2>/dev/null; then
  echo "Reusing the existing DATABASE_URL in .env"
else
  PW="$(openssl rand -hex 16)"
  psql -d postgres -tAc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" | grep -q 1 \
    && psql -d postgres -qc "ALTER ROLE $DB_USER WITH LOGIN PASSWORD '$PW'" \
    || psql -d postgres -qc "CREATE ROLE $DB_USER LOGIN PASSWORD '$PW'"
  touch .env; grep -v '^DATABASE_URL=' .env > .env.tmp || true; mv .env.tmp .env
  echo "DATABASE_URL=\"postgresql://$DB_USER:$PW@localhost:5432/$DB_NAME\"" >> .env
  echo "Wrote DATABASE_URL to .env (the password is only stored there)"
fi
psql -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" | grep -q 1 \
  || createdb -O "$DB_USER" "$DB_NAME"

say "3/5 Schema and database client"
cp "$HERE/prisma/schema.prisma" prisma/schema.prisma
cp "$HERE/src/lib/db.ts" src/lib/db.ts
for h in build-groway.sh start-groway.sh backup-groway.sh; do cp "$HERE/$h" "./$h"; chmod +x "./$h"; done

say "4/5 Tshepo code, baseline migration, ledger guards"
mkdir -p src/lib __tests__
rm -rf src/lib/tshepo __tests__/tshepo
cp -R "$BUNDLE/src/lib/tshepo" src/lib/tshepo
cp -R "$BUNDLE/__tests__/tshepo" __tests__/tshepo
cp "$BUNDLE/prisma/tshepo-ledger-guards.sql" prisma/tshepo-ledger-guards.sql
cp "$BUNDLE/prisma/tshepo.models.prisma" prisma/tshepo.models.prisma
[[ -d node_modules ]] || npm install
npx prisma generate
if [[ ! -d prisma/migrations/0_baseline ]]; then
  mkdir -p prisma/migrations/0_baseline
  npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > prisma/migrations/0_baseline/migration.sql
fi
npx prisma migrate deploy
URL="$(grep '^DATABASE_URL=' .env | cut -d= -f2- | tr -d '"')"
psql "$URL" -v ON_ERROR_STOP=1 -q -f prisma/tshepo-ledger-guards.sql 2>&1 | grep -v 'already exists' || true

say "5/5 Checks"
TABLES="$(psql "$URL" -tAc "SELECT count(*) FROM information_schema.tables WHERE table_schema='public'")"
echo "Tables created: $TABLES (expected about 302 plus the migrations table)"
if [[ -x node_modules/.bin/jest ]]; then npx jest __tests__/tshepo || echo "Tshepo tests did not all pass: send me the output."
else echo "jest is not installed in this repo, so the Tshepo tests were skipped."; fi

cat <<DONE

Done. Next:
  - Start the app:   npm run dev   (or: npx next build && npx next start -p 3000)
  - Move your data:  tell me how the rows should come across (pgloader from backups/$STAMP/dev.db, or re-seed with npm run seed:all)
  - Undo everything: copy the files in $BK back into place and drop the database ("dropdb $DB_NAME")
DONE
```

### `groway-changes/build-groway.sh`

```bash
#!/usr/bin/env bash
# Run from the Groway repo root: ./build-groway.sh   (takes a few minutes)
set -euo pipefail
cd "$(dirname "$0")"
[[ -f .env ]] || { echo "No .env file here. Run the database setup first."; exit 1; }
set -a; source .env; set +a
export NODE_ENV=production
npx prisma generate
npx next build
SERVER="$(find .next/standalone -maxdepth 3 -name server.js -not -path '*/node_modules/*' | head -1)"
[[ -n "$SERVER" ]] || { echo "Build finished but server.js was not found."; exit 1; }
DIR="$(dirname "$SERVER")"
rm -rf "$DIR/public" "$DIR/.next/static"
cp -R public "$DIR/public"
mkdir -p "$DIR/.next"
cp -R .next/static "$DIR/.next/static"
echo "Build finished. Start the app with ./start-groway.sh"
```

### `groway-changes/start-groway.sh`

```bash
#!/usr/bin/env bash
# Run from the Groway repo root: ./start-groway.sh   (stop with Ctrl+C)
set -euo pipefail
cd "$(dirname "$0")"
[[ -f .env ]] || { echo "No .env file here."; exit 1; }
set -a; source .env; set +a
SERVER="$(find .next/standalone -maxdepth 3 -name server.js -not -path '*/node_modules/*' | head -1)"
[[ -n "$SERVER" ]] || { echo "Not built yet. Run ./build-groway.sh first."; exit 1; }
export NODE_ENV=production PORT="${PORT:-3000}" HOSTNAME=127.0.0.1
cd "$(dirname "$SERVER")"
echo "Groway running at http://localhost:$PORT"
exec node server.js
```

### `groway-changes/backup-groway.sh`

```bash
#!/usr/bin/env bash
# Run from the Groway repo root: ./backup-groway.sh
set -euo pipefail
cd "$(dirname "$0")"
URL="$(grep '^DATABASE_URL=' .env | cut -d= -f2- | tr -d '"')"
export PATH="$(brew --prefix postgresql@16)/bin:$PATH"
mkdir -p "$HOME/groway-backups"
OUT="$HOME/groway-backups/groway-$(date +%F-%H%M).dump"
pg_dump -Fc "$URL" > "$OUT"
find "$HOME/groway-backups" -name 'groway-*.dump' -mtime +30 -delete
echo "Backup saved: $OUT"
```

## Project files

### `package.json`

```json
{
  "name": "tshepo",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "vitest run",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "typescript": "^5.6.0",
    "vitest": "^2.1.0"
  }
}
```

### `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noEmit": true,
    "skipLibCheck": true,
    "types": [
      "node",
      "vitest/globals"
    ]
  },
  "include": [
    "src",
    "__tests__"
  ]
}
```

### `vitest.config.ts`

```ts
import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { globals: true, include: ['__tests__/**/*.test.ts'] } });
```

### `README.md`

```markdown
# Tshepo foundation (TypeScript)

Stack alignment: Groway is TypeScript with Prisma, so Tshepo is TypeScript on Node 22 with Prisma. Python is for model training only.

## What is here (all tested, `npm test`)
- `src/ledger`: double-entry ledger, idempotency, outbox port, trial balance. In-memory repo for tests; the Prisma repo must write entry and outbox in one transaction.
- `src/consent`: purpose-bound, revocable, expiring consent log.
- `src/repayment`: waterfall allocation and the settlement-split rule.
- `src/gopay`: sale settlement (capture, fee, settle, split, payout), Wave 1 debit-order route, and a hard refusal of the split route while `goPayLive` is false.
- `src/decisioning`: consent-first orchestrator with hard stops, affordability, reason codes, counterfactuals and trace.
- `src/edge`: Ed25519 decision envelopes, offline verification and spend caps.
- `prisma/`: schema and ledger guard migration. UNVERIFIED, needs validation against the real database.

## Not built yet
Prisma repository adapters, HTTP/API layer, ingestion adapters, feature store, KYC and bureau integrations, collections, back office, observability, edge bundle packaging.
```

### `INTEGRATION.md`

```markdown
# Dropping Tshepo into the Groway repo

Layout matches Groway (`src/lib`, `__tests__`, jest with `@/` alias). Copy:

| From | To |
|---|---|
| `src/lib/tshepo/**` | `src/lib/tshepo/**` |
| `__tests__/tshepo/**` | `__tests__/tshepo/**` (jest, node environment per file) |
| `prisma/tshepo.models.prisma` | append to `prisma/schema.postgresql.prisma` |
| `prisma/tshepo-ledger-guards.sql` | run after the tables exist (Postgres only) |

Verified: TypeScript compiles; 24 tests pass (run here under vitest globals; same `describe/it/expect` API as jest); the merged Postgres schema (Groway's 62 models plus 6 Tshepo models) passes the Prisma 6 schema validator.
Not verified: a live database, the SQL guards, and a jest run inside the real Groway repo (dependencies were not installed).

Wiring that still has to be written in Groway:
1. `PrismaLedgerRepo(prisma)` in a shared module, one `LedgerService` per request.
2. Call `settleSale` from the GoPay settlement path once GoPay is live; keep `goPayLive` false until then.
3. Wrap GroCredit tiers and `MerchantCredit` as the `Policy` input to `DecisionOrchestrator`.
4. Feature reads from Merchant OS sales data behind the `FeatureStore` port.
```

### `groway-changes/MAC_SERVER_SETUP.md`

```markdown
# Moving Groway from SQLite-on-Netlify to Postgres on your Mac

Audit result: production builds with `prisma generate` against `prisma/schema.prisma` (SQLite, 296 models). The 62-model `schema.postgresql.prisma` is not referenced by any script and is stale. Use the converted schema in this folder instead (only the datasource changed, Tshepo's 6 models added, 302 models, passes the Prisma 6 validator).

## 1. Database
1. `brew install postgresql@16 && brew services start postgresql@16`
2. `createdb groway && psql groway -c "CREATE ROLE groway_app LOGIN PASSWORD '<strong password>'; GRANT ALL ON DATABASE groway TO groway_app;"`
3. `.env`: `DATABASE_URL="postgresql://groway_app:<password>@localhost:5432/groway"`
4. Copy `prisma/schema.prisma` and `src/lib/db.ts` from this folder into the repo.
5. `npx prisma migrate dev --name baseline` (creates the missing `prisma/migrations` folder), commit it, then use `prisma migrate deploy` everywhere else.
6. `psql groway -f prisma/tshepo-ledger-guards.sql` (balanced entries, non-zero lines, append-only).

## 2. Data
- `dev.db` is the only data source (a 3.4 MB backup exists). Move it with `pgloader sqlite:///path/dev.db postgresql://...` or re-seed with `npm run seed:all`. Check row counts per table afterwards.

## 3. Run
- Build without the static-export config: `npx prisma generate && npx next build`, then `npx next start -p 3000` under `launchd` or `pm2` so it restarts after a reboot.
- Public access without opening ports: a Cloudflare Tunnel to localhost:3000.

## 4. Keep the Mac safe to rely on
- Never sleep: `sudo pmset -a sleep 0`; use a UPS; turn on FileVault and the firewall.
- Nightly `pg_dump -Fc groway`, encrypted, copied off the machine; restore into a scratch database monthly to prove it works.

## 5. Limits
Fine for development, staging and demos. Do not run live credit or payments for real customers from it: that needs hosted Postgres in a South African region, monitored backups and an uptime commitment. Move before any pilot.
```