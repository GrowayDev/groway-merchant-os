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
