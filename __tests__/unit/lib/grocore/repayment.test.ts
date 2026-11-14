/**
 * Unit tests for the GroCore repayment waterfall and settlement split.
 */

import {
  allocatePayment,
  splitSettlement,
  cappedRepaymentShare,
  amortiseEqualInstalments,
  WaterfallComponent,
} from '@/lib/grocore'
import { rand } from './_helpers'

describe('repayment.allocatePayment — waterfall order', () => {
  it('pays fees before interest, interest before principal, principal before penalty', () => {
    const payment = rand(10000n) // R100
    const components: WaterfallComponent[] = [
      { code: 'penalty', outstanding: rand(1000n) }, // R10
      { code: 'principal', outstanding: rand(4000n) }, // R40
      { code: 'interest', outstanding: rand(3000n) }, // R30
      { code: 'fees', outstanding: rand(2000n) }, // R20
    ]
    const allocation = allocatePayment(payment, components)
    expect(allocation.fees.cents).toBe(2000n)
    expect(allocation.interest.cents).toBe(3000n)
    expect(allocation.principal.cents).toBe(4000n)
    expect(allocation.penalty.cents).toBe(1000n)
    expect(allocation.remainder.cents).toBe(0n)
  })

  it('leaves a remainder when payment exceeds total outstanding', () => {
    const payment = rand(20000n) // R200
    const components: WaterfallComponent[] = [
      { code: 'fees', outstanding: rand(2000n) },
      { code: 'interest', outstanding: rand(3000n) },
      { code: 'principal', outstanding: rand(4000n) },
      { code: 'penalty', outstanding: rand(1000n) },
    ]
    // Total outstanding = R100, payment = R200 -> remainder = R100
    const allocation = allocatePayment(payment, components)
    expect(allocation.fees.cents).toBe(2000n)
    expect(allocation.interest.cents).toBe(3000n)
    expect(allocation.principal.cents).toBe(4000n)
    expect(allocation.penalty.cents).toBe(1000n)
    expect(allocation.remainder.cents).toBe(10000n)
  })

  it('handles partial payments correctly (only some components satisfied)', () => {
    const payment = rand(2500n) // R25
    const components: WaterfallComponent[] = [
      { code: 'fees', outstanding: rand(2000n) }, // R20
      { code: 'interest', outstanding: rand(3000n) }, // R30
      { code: 'principal', outstanding: rand(4000n) }, // R40
      { code: 'penalty', outstanding: rand(1000n) }, // R10
    ]
    // Fees fully paid (R20), interest partially paid (R5), principal/penalty untouched
    const allocation = allocatePayment(payment, components)
    expect(allocation.fees.cents).toBe(2000n)
    expect(allocation.interest.cents).toBe(500n)
    expect(allocation.principal.cents).toBe(0n)
    expect(allocation.penalty.cents).toBe(0n)
    expect(allocation.remainder.cents).toBe(0n)
  })

  it('skips zero-outstanding components', () => {
    const payment = rand(10000n) // R100
    const components: WaterfallComponent[] = [
      { code: 'fees', outstanding: rand(0n) }, // R0 (skipped)
      { code: 'interest', outstanding: rand(3000n) }, // R30
      { code: 'principal', outstanding: rand(4000n) }, // R40
      { code: 'penalty', outstanding: rand(1000n) }, // R10
    ]
    // Total non-zero outstanding = R80, payment = R100 -> remainder = R20
    const allocation = allocatePayment(payment, components)
    expect(allocation.fees.cents).toBe(0n)
    expect(allocation.interest.cents).toBe(3000n)
    expect(allocation.principal.cents).toBe(4000n)
    expect(allocation.penalty.cents).toBe(1000n)
    expect(allocation.remainder.cents).toBe(2000n)
  })
})

describe('repayment.splitSettlement', () => {
  it('correctly splits gross into fee + repayment + net', () => {
    const split = splitSettlement(rand(10000n), rand(1000n), rand(2000n))
    // gross = R100, fee = R10, repayment = R20, net = R70
    expect(split.gross.cents).toBe(10000n)
    expect(split.fee.cents).toBe(1000n)
    expect(split.repayment.cents).toBe(2000n)
    expect(split.net.cents).toBe(7000n)
  })

  it('throws when deductions exceed gross', () => {
    expect(() =>
      splitSettlement(rand(1000n), rand(500n), rand(1000n)),
    ).toThrow(/exceed gross/)
  })
})

describe('repayment.cappedRepaymentShare', () => {
  it('returns min(share, outstandingBalance) when share is smaller', () => {
    // gross = R100, outstanding = R200, share = 0.5 -> share = R50 < R200
    const result = cappedRepaymentShare(rand(10000n), rand(20000n), 0.5)
    expect(result.cents).toBe(5000n)
  })

  it('returns outstandingBalance when share would exceed it', () => {
    // gross = R100, outstanding = R30, share = 0.5 -> share = R50 > R30 -> R30
    const result = cappedRepaymentShare(rand(10000n), rand(3000n), 0.5)
    expect(result.cents).toBe(3000n)
  })

  it('throws on invalid share (>1)', () => {
    expect(() => cappedRepaymentShare(rand(10000n), rand(5000n), 1.5)).toThrow()
  })

  it('throws on invalid share (<0)', () => {
    expect(() => cappedRepaymentShare(rand(10000n), rand(5000n), -0.1)).toThrow()
  })

  it('accepts the boundary values 0 and 1', () => {
    expect(cappedRepaymentShare(rand(10000n), rand(5000n), 0).cents).toBe(0n)
    expect(cappedRepaymentShare(rand(10000n), rand(5000n), 1).cents).toBe(5000n)
  })
})

describe('repayment.amortiseEqualInstalments', () => {
  it('produces N schedule items with decreasing balance', () => {
    const principal = rand(120000n) // R1200
    const start = new Date('2024-01-01T00:00:00Z')
    const schedule = amortiseEqualInstalments(principal, 0, 12, start)
    expect(schedule).toHaveLength(12)
    // First period: principal portion = 120000/12 = 10000n
    expect(schedule[0].period).toBe(1)
    expect(schedule[0].principal.cents).toBe(10000n)
    expect(schedule[0].interest.cents).toBe(0n)
    expect(schedule[0].total.cents).toBe(10000n)
    expect(schedule[0].balanceAfter.cents).toBe(110000n)
    // Last period: balance reaches 0
    expect(schedule[11].period).toBe(12)
    expect(schedule[11].balanceAfter.cents).toBe(0n)
    // Balances are strictly decreasing
    for (let i = 1; i < schedule.length; i++) {
      expect(schedule[i].balanceAfter.cents).toBeLessThan(schedule[i - 1].balanceAfter.cents)
    }
  })

  it('accrues interest when annualRateBps > 0', () => {
    const principal = rand(120000n) // R1200
    const start = new Date('2024-01-01T00:00:00Z')
    const schedule = amortiseEqualInstalments(principal, 1200, 12, start) // 12% APR
    expect(schedule).toHaveLength(12)
    // Total interest across all periods > 0
    const totalInterest = schedule.reduce((s, p) => s + p.interest.cents, 0n)
    expect(totalInterest).toBeGreaterThan(0n)
    // Last period balance is 0
    expect(schedule[11].balanceAfter.cents).toBe(0n)
  })

  it('throws on periods <= 0', () => {
    expect(() =>
      amortiseEqualInstalments(rand(10000n), 0, 0, new Date()),
    ).toThrow(/periods must be > 0/)
    expect(() =>
      amortiseEqualInstalments(rand(10000n), 0, -3, new Date()),
    ).toThrow(/periods must be > 0/)
  })
})
