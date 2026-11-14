/**
 * GroCore runtime singletons — shared across API routes.
 *
 * In the current dev in-memory phase:
 *   - ConsentService is in-process; the DB-backed version is a future step.
 *   - StubFeatureStore returns deterministic sample sales/tenure data so the
 *     DecisionOrchestrator can produce a realistic decision in the UI demo.
 *   - defaultPolicy is the credit scorecard configuration (illustrative).
 *
 * Designed and Built by Motheto Selepe.
 */

import { ConsentService } from '../consent/consent';
import type { FeatureStore, Policy } from '../decisioning/orchestrator';

/** In-memory singleton. Survives for the lifetime of the Node process. */
const globalForGroCore = globalThis as unknown as {
  __grocoreConsent?: ConsentService;
  __grocoreFeatureStore?: FeatureStore;
  __grocorePolicy?: Policy;
};

export const sharedConsent: ConsentService =
  globalForGroCore.__grocoreConsent ?? new ConsentService();
globalForGroCore.__grocoreConsent = sharedConsent;

/**
 * Stub feature store. Returns a sample merchant profile that satisfies the
 * hard stops in the orchestrator (KYC verified, no arrears, sufficient tenure)
 * and yields a ~R30,000 limit under the default 20% share of 30-day sales.
 *
 * sales_30d_minor: R150,000.00  -> 15000000n cents
 * tenure_days    : 45 (above 30-day minimum)
 * arrears_minor  : R0.00 -> 0n cents
 * kyc_verified   : 1 (true)
 */
class StubFeatureStore implements FeatureStore {
  async get(_subject: string, _names: string[]): Promise<Record<string, number | undefined>> {
    return {
      sales_30d_minor: Number(15_000_000n), // 15000000 — safe for these magnitudes
      tenure_days: 45,
      arrears_minor: Number(0n),
      kyc_verified: 1,
    };
  }
}

export const sharedFeatureStore: FeatureStore =
  globalForGroCore.__grocoreFeatureStore ?? new StubFeatureStore();
globalForGroCore.__grocoreFeatureStore = sharedFeatureStore;

export const defaultPolicy: Policy = globalForGroCore.__grocorePolicy ?? {
  version: '1.0.0',
  modelVersion: '1.0.0',
  minTenureDays: 30,
  minLimit: 50_000n, // R500.00
  maxLimit: 5_000_000n, // R50,000.00
  limitShareOfSalesBps: 2000, // 20% of trailing 30-day sales
};
globalForGroCore.__grocorePolicy = defaultPolicy;
