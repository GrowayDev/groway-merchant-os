/**
 * Shared helpers for GroCore unit tests.
 *
 * All amounts use BigInt minor units (cents for ZAR, tambala for MWK).
 */

import {
  Money,
  money,
  DecisionPolicy,
  DecisionFeatures,
} from '@/lib/grocore'
import { SA_AIRTIME, MW_ELECTRICITY } from '@/lib/grocore/topup/presets'
import { TopupProduct } from '@/lib/grocore/topup/products'

/** Build a ZAR Money from a number of cents. */
export function rand(cents: bigint | number): Money {
  return money(typeof cents === 'bigint' ? cents : BigInt(cents), 'ZAR')
}

/** Build an MWK Money from a number of tambala. */
export function kwacha(cents: bigint | number): Money {
  return money(typeof cents === 'bigint' ? cents : BigInt(cents), 'MWK')
}

/**
 * Default policy used by decisioning tests. Tuned so that `defaultFeatures()`
 * with a `rand(5000)` requested amount yields "approve".
 */
export function defaultPolicy(): DecisionPolicy {
  return {
    policyVersion: 'test-policy-v1',
    modelVersion: 'test-model-v1',
    product: 'topup_airtime',
    minTenureDays: 90,
    minActiveMonths: 3,
    minSpendPerMonth: rand(2900n), // R29.00
    limitAsShareOfSpend: 0.5,
    hardCap: rand(100000n), // R1000.00
    maxAffordabilityRatio: 0.5,
    minRetainedIncome: rand(5000n), // R50.00
  }
}

/**
 * Sensible default features. Pass overrides to flip specific fields
 * for a given test scenario.
 */
export function defaultFeatures(overrides: Partial<DecisionFeatures> = {}): DecisionFeatures {
  return {
    tenureDays: 365,
    averageMonthlySpend: rand(10000n), // R100.00
    activeMonths: 6,
    identityVerified: true,
    onBlocklist: false,
    arrears: rand(0n),
    hasOpenAdvance: false,
    netMonthlyIncome: rand(50000n), // R500.00
    monthlyObligations: rand(10000n), // R100.00
    ...overrides,
  }
}

/** Return the SA airtime product preset (per_block fee model). */
export function saAirtimeProduct(): TopupProduct {
  return SA_AIRTIME
}

/** Return the MW electricity product preset (percent fee model + cappedShare). */
export function mwElectricityProduct(): TopupProduct {
  return MW_ELECTRICITY
}
