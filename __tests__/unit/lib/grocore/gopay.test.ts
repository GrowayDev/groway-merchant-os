/**
 * Unit tests for the GoPay settlement module.
 */

import {
  assertGoPayLive,
  settleCapture,
  aggregateSettlement,
  debitOrdersDue,
  GoPayCapture,
  GoPayCaptureInput,
  GroCoreError,
} from '@/lib/grocore'
import { rand } from './_helpers'

function makeCapture(overrides: Partial<GoPayCapture> = {}): GoPayCapture {
  return {
    id: 'cap-1',
    tenantId: 't1',
    merchantId: 'm1',
    captureId: 'cap-1',
    amount: rand(10000n), // R100
    fee: rand(1000n), // R10
    paymentMethod: 'qr',
    liveMode: true,
    status: 'captured',
    settlementId: null,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  }
}

function makeCaptureInput(overrides: Partial<GoPayCaptureInput> = {}): GoPayCaptureInput {
  return {
    tenantId: 't1',
    merchantId: 'm1',
    captureId: 'cap-1',
    amount: rand(10000n),
    fee: rand(1000n),
    paymentMethod: 'qr',
    liveMode: true,
    ...overrides,
  }
}

describe('gopay.assertGoPayLive', () => {
  it('does not throw when liveMode is true', () => {
    expect(() => assertGoPayLive(makeCaptureInput({ liveMode: true }))).not.toThrow()
  })

  it('throws GroCoreError with code GOPAY_NOT_LIVE when liveMode is false', () => {
    let caught: GroCoreError | null = null
    try {
      assertGoPayLive(makeCaptureInput({ liveMode: false }))
    } catch (e) {
      caught = e as GroCoreError
    }
    expect(caught).toBeInstanceOf(GroCoreError)
    expect(caught?.code).toBe('GOPAY_NOT_LIVE')
  })
})

describe('gopay.settleCapture', () => {
  it('throws GOPAY_NOT_LIVE when liveMode is false', () => {
    let caught: GroCoreError | null = null
    try {
      settleCapture(makeCapture(), null, 0.5, false)
    } catch (e) {
      caught = e as GroCoreError
    }
    expect(caught).toBeInstanceOf(GroCoreError)
    expect(caught?.code).toBe('GOPAY_NOT_LIVE')
  })

  it('throws GOPAY_CAPTURE_REVERSED when capture is reversed', () => {
    let caught: GroCoreError | null = null
    try {
      settleCapture(makeCapture({ status: 'reversed' }), null, 0.5, true)
    } catch (e) {
      caught = e as GroCoreError
    }
    expect(caught).toBeInstanceOf(GroCoreError)
    expect(caught?.code).toBe('GOPAY_CAPTURE_REVERSED')
  })

  it('returns correct split: gross - fee - repayment = net', () => {
    // capture.amount = R100, fee = R10, outstanding = R50, share = 0.5
    // repayment = min(R50, R50) = R50, net = R100 - R10 - R50 = R40
    const result = settleCapture(
      makeCapture({ amount: rand(10000n), fee: rand(1000n) }),
      rand(5000n),
      0.5,
      true,
    )
    expect(result.gross.cents).toBe(10000n)
    expect(result.fee.cents).toBe(1000n)
    expect(result.repayment.cents).toBe(5000n)
    expect(result.net.cents).toBe(4000n)
    expect(result.settlementId).toBe('settle-cap-1')
  })

  it('uses cappedRepaymentShare when outstandingBalance is provided', () => {
    // gross = R100, outstanding = R30, share = 0.5
    // share would be R50 but capped at R30 outstanding -> repayment = R30
    const result = settleCapture(
      makeCapture({ amount: rand(10000n) }),
      rand(3000n),
      0.5,
      true,
    )
    expect(result.repayment.cents).toBe(3000n)
    expect(result.net.cents).toBe(6000n) // 10000 - 1000 (fee) - 3000 (repayment)
  })

  it('returns zero repayment when outstandingBalance is null', () => {
    const result = settleCapture(makeCapture(), null, 0.5, true)
    expect(result.repayment.cents).toBe(0n)
    expect(result.net.cents).toBe(9000n) // 10000 - 1000 (fee)
  })
})

describe('gopay.aggregateSettlement', () => {
  it('sums gross and fee across captures and computes net', () => {
    const captures = [
      makeCapture({ id: 'c1', captureId: 'c1', amount: rand(10000n), fee: rand(1000n) }), // R100, R10
      makeCapture({ id: 'c2', captureId: 'c2', amount: rand(20000n), fee: rand(2000n) }), // R200, R20
    ]
    const result = aggregateSettlement('t1', 'm1', captures, new Date('2024-06-01T00:00:00Z'))
    expect(result.gross.cents).toBe(30000n)
    expect(result.fee.cents).toBe(3000n)
    expect(result.net.cents).toBe(27000n)
    expect(result.captureCount).toBe(2)
    expect(result.tenantId).toBe('t1')
    expect(result.merchantId).toBe('m1')
    expect(result.status).toBe('pending')
  })

  it('throws VALIDATION_ERROR when no captures', () => {
    let caught: GroCoreError | null = null
    try {
      aggregateSettlement('t1', 'm1', [])
    } catch (e) {
      caught = e as GroCoreError
    }
    expect(caught).toBeInstanceOf(GroCoreError)
    expect(caught?.code).toBe('VALIDATION_ERROR')
  })

  it('skips reversed captures (excludes from gross/fee/count)', () => {
    const captures = [
      makeCapture({ id: 'c1', captureId: 'c1', amount: rand(10000n), fee: rand(1000n) }),
      makeCapture({
        id: 'c2',
        captureId: 'c2',
        amount: rand(50000n), // would have been R500 but should be skipped
        fee: rand(5000n),
        status: 'reversed',
      }),
    ]
    const result = aggregateSettlement('t1', 'm1', captures)
    expect(result.gross.cents).toBe(10000n) // only c1
    expect(result.fee.cents).toBe(1000n)
    expect(result.net.cents).toBe(9000n)
    expect(result.captureCount).toBe(1)
  })

  it('throws VALIDATION_ERROR on currency mismatch', () => {
    const captures = [
      makeCapture({ id: 'c1', captureId: 'c1', amount: rand(10000n) }),
      makeCapture({
        id: 'c2',
        captureId: 'c2',
        amount: { cents: 10000n, currency: 'MWK' },
        fee: { cents: 1000n, currency: 'MWK' },
      }),
    ]
    let caught: GroCoreError | null = null
    try {
      aggregateSettlement('t1', 'm1', captures)
    } catch (e) {
      caught = e as GroCoreError
    }
    expect(caught).toBeInstanceOf(GroCoreError)
    expect(caught?.code).toBe('VALIDATION_ERROR')
  })
})

describe('gopay.debitOrdersDue', () => {
  it('filters items within the next N days', () => {
    const from = new Date('2024-06-01T00:00:00Z')
    const items = [
      { facilityId: 'f1', amount: rand(1000n), dueDate: new Date('2024-06-05T00:00:00Z') }, // +5 days
      { facilityId: 'f2', amount: rand(2000n), dueDate: new Date('2024-06-10T00:00:00Z') }, // +10 days
      { facilityId: 'f3', amount: rand(3000n), dueDate: new Date('2024-07-01T00:00:00Z') }, // +30 days
      { facilityId: 'f4', amount: rand(4000n), dueDate: new Date('2024-05-30T00:00:00Z') }, // before from
    ]
    const due = debitOrdersDue(items, from, 7)
    expect(due.map((d) => d.facilityId)).toEqual(['f1'])
  })

  it('includes items due on the boundary day', () => {
    const from = new Date('2024-06-01T00:00:00Z')
    const items = [
      { facilityId: 'f1', amount: rand(1000n), dueDate: new Date('2024-06-08T00:00:00Z') }, // +7 days
    ]
    const due = debitOrdersDue(items, from, 7)
    expect(due).toHaveLength(1)
  })

  it('returns an empty array when nothing is due', () => {
    const from = new Date('2024-06-01T00:00:00Z')
    const items = [
      { facilityId: 'f1', amount: rand(1000n), dueDate: new Date('2024-07-01T00:00:00Z') },
    ]
    expect(debitOrdersDue(items, from, 7)).toHaveLength(0)
  })
})
