/**
 * Unit tests for the GroCore decisioning orchestrator.
 */

import { decide, requireApproval, GroCoreError, DecisionResult } from '@/lib/grocore'
import { rand, defaultPolicy, defaultFeatures } from './_helpers'

describe('decisioning.decide — approvals', () => {
  it('returns approve when all checks pass and affordability is fine', () => {
    const result = decide(defaultFeatures(), defaultPolicy(), rand(5000n))
    expect(result.outcome).toBe('approve')
    expect(result.approvedLimit.cents).toBe(5000n)
    expect(result.reasonCodes).toContain('APPROVED')
  })
})

describe('decisioning.decide — hard stops (decline)', () => {
  it('declines when identity is not verified', () => {
    const result = decide(
      defaultFeatures({ identityVerified: false }),
      defaultPolicy(),
      rand(5000n),
    )
    expect(result.outcome).toBe('decline')
    expect(result.reasonCodes).toContain('IDENTITY_NOT_VERIFIED')
  })

  it('declines when on blocklist', () => {
    const result = decide(
      defaultFeatures({ onBlocklist: true }),
      defaultPolicy(),
      rand(5000n),
    )
    expect(result.outcome).toBe('decline')
    expect(result.reasonCodes).toContain('ON_BLOCKLIST')
  })

  it('declines when tenureDays < minTenureDays', () => {
    const result = decide(
      defaultFeatures({ tenureDays: 30 }),
      defaultPolicy(),
      rand(5000n),
    )
    expect(result.outcome).toBe('decline')
    expect(result.reasonCodes).toContain('INSUFFICIENT_TENURE')
  })

  it('declines when activeMonths < minActiveMonths', () => {
    const result = decide(
      defaultFeatures({ activeMonths: 1 }),
      defaultPolicy(),
      rand(5000n),
    )
    expect(result.outcome).toBe('decline')
    expect(result.reasonCodes).toContain('INSUFFICIENT_ACTIVITY')
  })

  it('declines when averageMonthlySpend < minSpendPerMonth', () => {
    const result = decide(
      defaultFeatures({ averageMonthlySpend: rand(1000n) }), // R10 < R29
      defaultPolicy(),
      rand(5000n),
    )
    expect(result.outcome).toBe('decline')
    expect(result.reasonCodes).toContain('BELOW_MIN_SPEND')
  })

  it('declines when hasOpenAdvance', () => {
    const result = decide(
      defaultFeatures({ hasOpenAdvance: true }),
      defaultPolicy(),
      rand(5000n),
    )
    expect(result.outcome).toBe('decline')
    expect(result.reasonCodes).toContain('OPEN_ADVANCE_EXISTS')
  })

  it('declines when arrears > 0', () => {
    const result = decide(
      defaultFeatures({ arrears: rand(500n) }),
      defaultPolicy(),
      rand(5000n),
    )
    expect(result.outcome).toBe('decline')
    expect(result.reasonCodes).toContain('HAS_ARREARS')
  })
})

describe('decisioning.decide — affordability', () => {
  it('returns refer when income/obligations are missing', () => {
    const result = decide(
      defaultFeatures({ netMonthlyIncome: undefined }),
      defaultPolicy(),
      rand(5000n),
    )
    expect(result.outcome).toBe('refer')
    expect(result.reasonCodes).toContain('AFFORDABILITY_MISSING')
  })

  it('returns refer when monthlyObligations are missing', () => {
    const result = decide(
      defaultFeatures({ monthlyObligations: undefined }),
      defaultPolicy(),
      rand(5000n),
    )
    expect(result.outcome).toBe('refer')
    expect(result.reasonCodes).toContain('AFFORDABILITY_MISSING')
  })

  it('returns decline when affordability ratio exceeds cap', () => {
    // income = R500, obligations = R300, requested = R50
    // proposed = 35000 / 50000 = 0.7 > 0.5 cap
    const result = decide(
      defaultFeatures({ monthlyObligations: rand(30000n) }),
      defaultPolicy(),
      rand(5000n),
    )
    expect(result.outcome).toBe('decline')
    expect(result.reasonCodes).toContain('AFFORDABILITY_FAIL')
  })
})

describe('decisioning.decide — limit computation', () => {
  it('returns refer when approvedLimit is below requested', () => {
    // avgMonthlySpend = R50 -> shareLimit = R25 (50% of R50)
    // hardCap = R1000, requested = R50 -> approvedLimit = R25 < R50
    const result = decide(
      defaultFeatures({ averageMonthlySpend: rand(5000n) }),
      defaultPolicy(),
      rand(5000n),
    )
    expect(result.outcome).toBe('refer')
    expect(result.reasonCodes).toContain('LIMIT_BELOW_REQUESTED')
    expect(result.approvedLimit.cents).toBe(2500n)
  })

  it('returns decline with ZERO_LIMIT when share-based limit is 0', () => {
    // Use a policy with limitAsShareOfSpend = 0 so shareLimit = 0
    const policy = {
      ...defaultPolicy(),
      limitAsShareOfSpend: 0,
    }
    const result = decide(defaultFeatures(), policy, rand(5000n))
    expect(result.outcome).toBe('decline')
    expect(result.reasonCodes).toContain('ZERO_LIMIT')
  })

  it('respects hardCap (limit never exceeds hardCap)', () => {
    // shareLimit = R50 (50% of R100), hardCap = R30, requested = R30
    // approvedLimit = min(min(R50, R30), R30) = R30 — capped by hardCap, not shareLimit
    const policy = {
      ...defaultPolicy(),
      hardCap: rand(3000n), // R30
    }
    const result = decide(defaultFeatures(), policy, rand(3000n))
    expect(result.outcome).toBe('approve')
    expect(result.approvedLimit.cents).toBe(3000n) // R30, capped
  })

  it('respects minRetainedIncome (refers when retained would fall below)', () => {
    // income = R500, obligations = R100, approvedLimit = R50
    // retained = 500 - 100 - 50 = R350
    // minRetainedIncome = R400 -> R350 < R400 -> refer BELOW_MIN_RETAINED_INCOME
    const policy = {
      ...defaultPolicy(),
      minRetainedIncome: rand(40000n), // R400
    }
    const result = decide(defaultFeatures(), policy, rand(5000n))
    expect(result.outcome).toBe('refer')
    expect(result.reasonCodes).toContain('BELOW_MIN_RETAINED_INCOME')
  })
})

describe('decisioning.requireApproval', () => {
  it('returns the result when approved', () => {
    const result: DecisionResult = {
      outcome: 'approve',
      approvedLimit: rand(5000n),
      reasonCodes: ['APPROVED'],
      trace: { policyVersion: 'v1', modelVersion: 'm1', steps: [] },
    }
    expect(requireApproval(result)).toBe(result)
  })

  it('throws GroCoreError DECISION_DECLINE when declined', () => {
    const result: DecisionResult = {
      outcome: 'decline',
      approvedLimit: rand(0n),
      reasonCodes: ['IDENTITY_NOT_VERIFIED'],
      trace: { policyVersion: 'v1', modelVersion: 'm1', steps: [] },
    }
    let caught: GroCoreError | null = null
    try {
      requireApproval(result)
    } catch (e) {
      caught = e as GroCoreError
    }
    expect(caught).toBeInstanceOf(GroCoreError)
    expect(caught?.code).toBe('DECISION_DECLINE')
  })

  it('throws GroCoreError DECISION_REFER when referred', () => {
    const result: DecisionResult = {
      outcome: 'refer',
      approvedLimit: rand(0n),
      reasonCodes: ['LIMIT_BELOW_REQUESTED'],
      trace: { policyVersion: 'v1', modelVersion: 'm1', steps: [] },
    }
    let caught: GroCoreError | null = null
    try {
      requireApproval(result)
    } catch (e) {
      caught = e as GroCoreError
    }
    expect(caught).toBeInstanceOf(GroCoreError)
    expect(caught?.code).toBe('DECISION_REFER')
  })
})
