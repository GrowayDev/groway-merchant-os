/**
 * Unit tests for the GroCore top-up advance module.
 */

import {
  quoteFee,
  quote,
  checkEligibility,
  issueAdvance,
  recover,
  applyOverdue,
  GroCoreError,
  TopupProduct,
  TopupAdvance,
  fromRand,
  fromKwacha,
} from '@/lib/grocore'
import { rand, kwacha, saAirtimeProduct, mwElectricityProduct } from './_helpers'

describe('topup.quoteFee', () => {
  it('flat fee model returns the configured fee', () => {
    const fee = quoteFee(rand(1000n), { kind: 'flat', fee: rand(200n) })
    expect(fee.cents).toBe(200n)
    expect(fee.currency).toBe('ZAR')
  })

  it('per_block fee model: R15 with R10 blocks -> 2 blocks -> 2 * feePerBlock', () => {
    // amount = R15 (1500 cents), block = R10 (1000 cents), feePerBlock = R1.20 (120 cents)
    // blocks = ceil(1500 / 1000) = 2, fee = 2 * 120 = 240 cents = R2.40
    const fee = quoteFee(rand(1500n), {
      kind: 'per_block',
      block: rand(1000n),
      feePerBlock: rand(120n),
    })
    expect(fee.cents).toBe(240n)
  })

  it('per_block fee model: R20 with R10 blocks -> 2 blocks (exact multiple)', () => {
    const fee = quoteFee(rand(2000n), {
      kind: 'per_block',
      block: rand(1000n),
      feePerBlock: rand(120n),
    })
    expect(fee.cents).toBe(240n)
  })

  it('percent fee model: 10% of R20 = R2.00', () => {
    const fee = quoteFee(rand(2000n), { kind: 'percent', percent: 10 })
    expect(fee.cents).toBe(200n)
  })

  it('percent fee model: 5% of R100 = R5.00', () => {
    const fee = quoteFee(rand(10000n), { kind: 'percent', percent: 5 })
    expect(fee.cents).toBe(500n)
  })
})

describe('topup.quote', () => {
  it('returns principal + fee = totalDue when amount is in menu', () => {
    const product = saAirtimeProduct()
    // SA_AIRTIME menu = [R5, R10, R20], per_block: block R10, feePerBlock R1.20
    const q = quote(rand(1000n), product) // R10 -> 1 block -> fee R1.20
    expect(q.principal.cents).toBe(1000n)
    expect(q.fee.cents).toBe(120n)
    expect(q.totalDue.cents).toBe(1120n)
  })

  it('throws when amount is not in menu', () => {
    const product = saAirtimeProduct()
    expect(() => quote(rand(700n), product)).toThrow(/not in menu/)
  })
})

describe('topup.checkEligibility', () => {
  it('returns eligible=true when all checks pass', () => {
    const product = saAirtimeProduct()
    const result = checkEligibility(
      {
        tenureDays: 365,
        activeMonths: 6,
        averageMonthlySpend: rand(10000n), // R100 -> shareCap R30 -> limit R20
        hasOpenAdvance: false,
      },
      product,
    )
    expect(result.eligible).toBe(true)
    expect(result.limitCents).toBe(2000n) // R20, largest menu item <= R30
    expect(result.reasonCodes).toContain('ELIGIBLE')
  })

  it('returns INSUFFICIENT_TENURE reason code when tenure is too short', () => {
    const product = saAirtimeProduct()
    const result = checkEligibility(
      {
        tenureDays: 30, // < 90
        activeMonths: 6,
        averageMonthlySpend: rand(10000n),
        hasOpenAdvance: false,
      },
      product,
    )
    expect(result.eligible).toBe(false)
    expect(result.reasonCodes).toContain('INSUFFICIENT_TENURE')
  })

  it('returns INSUFFICIENT_ACTIVITY reason code when activeMonths too short', () => {
    const product = saAirtimeProduct()
    const result = checkEligibility(
      {
        tenureDays: 365,
        activeMonths: 1, // < 3
        averageMonthlySpend: rand(10000n),
        hasOpenAdvance: false,
      },
      product,
    )
    expect(result.eligible).toBe(false)
    expect(result.reasonCodes).toContain('INSUFFICIENT_ACTIVITY')
  })

  it('returns BELOW_MIN_SPEND reason code when spend is below minimum', () => {
    const product = saAirtimeProduct()
    const result = checkEligibility(
      {
        tenureDays: 365,
        activeMonths: 6,
        averageMonthlySpend: rand(1000n), // R10 < R29
        hasOpenAdvance: false,
      },
      product,
    )
    expect(result.eligible).toBe(false)
    expect(result.reasonCodes).toContain('BELOW_MIN_SPEND')
  })

  it('returns OPEN_ADVANCE_EXISTS reason code when there is an open advance', () => {
    const product = saAirtimeProduct()
    const result = checkEligibility(
      {
        tenureDays: 365,
        activeMonths: 6,
        averageMonthlySpend: rand(10000n),
        hasOpenAdvance: true,
      },
      product,
    )
    expect(result.eligible).toBe(false)
    expect(result.reasonCodes).toContain('OPEN_ADVANCE_EXISTS')
  })

  it('returns ZERO_LIMIT when share cap is below smallest menu item', () => {
    // Custom product with a large minimum menu item so the 30% share cap
    // (avgMonthlySpend * 0.3) cannot reach it.
    const product: TopupProduct = {
      code: 'sa_airtime',
      market: 'ZA',
      product: 'airtime',
      currency: 'ZAR',
      menu: [fromRand(100)], // R100 only
      feeModel: { kind: 'flat', fee: rand(100n) },
      recovery: 'full_first',
      minTenureDays: 30,
      minActiveMonths: 1,
      minSpendPerMonth: fromRand(10), // R10 — pass with R20 spend
      overdueDays: 30,
      overdueAction: 'add_to_bill',
    }
    const result = checkEligibility(
      {
        tenureDays: 365,
        activeMonths: 6,
        averageMonthlySpend: rand(2000n), // R20 -> shareCap R6 < R100
        hasOpenAdvance: false,
      },
      product,
    )
    expect(result.eligible).toBe(false)
    expect(result.reasonCodes).toContain('ZERO_LIMIT')
    expect(result.limitCents).toBe(0n)
  })
})

describe('topup.issueAdvance', () => {
  function buildIssueInput(overrides: Record<string, unknown> = {}) {
    return {
      id: 'adv-1',
      tenantId: 't1',
      subjectId: 'subj-1',
      product: saAirtimeProduct(),
      amount: rand(2000n), // R20 (largest menu item)
      eligibility: {
        tenureDays: 365,
        activeMonths: 6,
        averageMonthlySpend: rand(10000n), // R100 -> limit R20
        hasOpenAdvance: false,
      },
      deliveryMethod: 'direct_recharge' as const,
      now: new Date('2024-06-01T00:00:00Z'),
      ...overrides,
    }
  }

  it('issues an advance when eligible', () => {
    const advance = issueAdvance(buildIssueInput())
    expect(advance.id).toBe('adv-1')
    expect(advance.status).toBe('open')
    expect(advance.principal.cents).toBe(2000n)
    expect(advance.paid.cents).toBe(0n)
    // SA_AIRTIME per_block: R20 -> 2 blocks -> 2 * R1.20 = R2.40 fee
    expect(advance.fee.cents).toBe(240n)
    expect(advance.totalDue.cents).toBe(2240n)
    expect(advance.currency).toBe('ZAR')
    expect(advance.deliveryMethod).toBe('direct_recharge')
  })

  it('throws VALIDATION_ERROR when not eligible', () => {
    let caught: GroCoreError | null = null
    try {
      issueAdvance(
        buildIssueInput({
          eligibility: {
            tenureDays: 30, // < 90 -> INSUFFICIENT_TENURE
            activeMonths: 6,
            averageMonthlySpend: rand(10000n),
            hasOpenAdvance: false,
          },
        }),
      )
    } catch (e) {
      caught = e as GroCoreError
    }
    expect(caught).toBeInstanceOf(GroCoreError)
    expect(caught?.code).toBe('VALIDATION_ERROR')
  })

  it('throws VALIDATION_ERROR when amount exceeds limit', () => {
    // limit = R20 (2000n); request R50 (5000n)
    let caught: GroCoreError | null = null
    try {
      issueAdvance(
        buildIssueInput({
          amount: rand(5000n),
          // amount R50 isn't in the SA_AIRTIME menu, so quote would throw first;
          // use a custom product whose menu includes R50 and limit is R20.
          product: {
            code: 'sa_airtime',
            market: 'ZA',
            product: 'airtime',
            currency: 'ZAR',
            menu: [fromRand(20), fromRand(50)],
            feeModel: { kind: 'flat', fee: rand(100n) },
            recovery: 'full_first',
            minTenureDays: 90,
            minActiveMonths: 3,
            minSpendPerMonth: fromRand(29),
            overdueDays: 30,
            overdueAction: 'add_to_bill',
          },
        }),
      )
    } catch (e) {
      caught = e as GroCoreError
    }
    expect(caught).toBeInstanceOf(GroCoreError)
    expect(caught?.code).toBe('VALIDATION_ERROR')
  })

  it('sets dueAt to now + 7 days', () => {
    const now = new Date('2024-06-01T00:00:00Z')
    const advance = issueAdvance(buildIssueInput({ now }))
    const expected = new Date('2024-06-08T00:00:00Z')
    expect(advance.dueAt.toISOString()).toBe(expected.toISOString())
  })
})

describe('topup.recover — full_first strategy', () => {
  function openAdvance(overrides: Partial<TopupAdvance> = {}): TopupAdvance {
    return {
      id: 'adv-1',
      tenantId: 't1',
      subjectId: 'subj-1',
      product: 'sa_airtime',
      principal: rand(2000n), // R20
      fee: rand(240n), // R2.40
      totalDue: rand(2240n), // R22.40
      paid: rand(0n),
      currency: 'ZAR',
      status: 'open',
      dueAt: new Date('2024-06-08T00:00:00Z'),
      createdAt: new Date('2024-06-01T00:00:00Z'),
      recoveredAt: null,
      writtenOffAt: null,
      deliveryMethod: 'direct_recharge',
      voucherSerial: null,
      decisionId: null,
      ...overrides,
    }
  }

  it('takes whole topup up to totalDue', () => {
    const advance = openAdvance()
    const result = recover(advance, saAirtimeProduct(), {
      topupAmount: rand(5000n), // R50 >> totalDue R22.40
      idempotencyKey: 'rec-1',
      source: 'topup_event',
      now: new Date('2024-06-02T00:00:00Z'),
    })
    expect(result.recovered.cents).toBe(2240n) // whole totalDue
    expect(result.passedThrough.cents).toBe(2760n) // R50 - R22.40 = R27.60
    expect(result.newPaid.cents).toBe(2240n)
    expect(result.newStatus).toBe('recovered')
    expect(result.advance.status).toBe('recovered')
    expect(result.advance.recoveredAt).toEqual(new Date('2024-06-02T00:00:00Z'))
  })

  it('passes through remainder when payment exceeds total outstanding', () => {
    const advance = openAdvance()
    const result = recover(advance, saAirtimeProduct(), {
      topupAmount: rand(10000n), // R100 >> R22.40
      idempotencyKey: 'rec-2',
      source: 'topup_event',
    })
    expect(result.recovered.cents).toBe(2240n)
    expect(result.passedThrough.cents).toBe(7760n)
  })

  it('handles partial payments correctly (advance stays open)', () => {
    const advance = openAdvance()
    const result = recover(advance, saAirtimeProduct(), {
      topupAmount: rand(1000n), // R10 < R22.40
      idempotencyKey: 'rec-3',
      source: 'topup_event',
    })
    expect(result.recovered.cents).toBe(1000n)
    expect(result.passedThrough.cents).toBe(0n)
    expect(result.newPaid.cents).toBe(1000n)
    expect(result.newStatus).toBe('open')
    expect(result.advance.status).toBe('open')
  })

  it('throws ADVANCE_ALREADY_CLOSED when status is not open', () => {
    const advance = openAdvance({ status: 'recovered' })
    let caught: GroCoreError | null = null
    try {
      recover(advance, saAirtimeProduct(), {
        topupAmount: rand(1000n),
        idempotencyKey: 'rec-4',
        source: 'topup_event',
      })
    } catch (e) {
      caught = e as GroCoreError
    }
    expect(caught).toBeInstanceOf(GroCoreError)
    expect(caught?.code).toBe('ADVANCE_ALREADY_CLOSED')
  })

  it('throws on currency mismatch', () => {
    const advance = openAdvance()
    let caught: GroCoreError | null = null
    try {
      recover(advance, saAirtimeProduct(), {
        topupAmount: kwacha(1000n), // MWK vs ZAR
        idempotencyKey: 'rec-5',
        source: 'topup_event',
      })
    } catch (e) {
      caught = e as GroCoreError
    }
    expect(caught).toBeInstanceOf(GroCoreError)
    expect(caught?.code).toBe('VALIDATION_ERROR')
  })
})

describe('topup.recover — cappedShare strategy', () => {
  function openAdvance(overrides: Partial<TopupAdvance> = {}): TopupAdvance {
    return {
      id: 'adv-1',
      tenantId: 't1',
      subjectId: 'subj-1',
      product: 'mw_electricity',
      principal: kwacha(500000n), // K5000
      fee: kwacha(50000n), // K500 (10%)
      totalDue: kwacha(550000n), // K5500
      paid: kwacha(0n),
      currency: 'MWK',
      status: 'open',
      dueAt: new Date('2024-06-08T00:00:00Z'),
      createdAt: new Date('2024-06-01T00:00:00Z'),
      recoveredAt: null,
      writtenOffAt: null,
      deliveryMethod: 'direct_recharge',
      voucherSerial: null,
      decisionId: null,
      ...overrides,
    }
  }

  it('takes share of topup, capped at outstanding', () => {
    const advance = openAdvance()
    // topup = K1000 (100000n tambala), share = 0.5
    // share = K500, outstanding = K5500 -> capped at K500
    const result = recover(advance, mwElectricityProduct(), {
      topupAmount: kwacha(100000n),
      idempotencyKey: 'rec-cap-1',
      source: 'topup_event',
    })
    expect(result.recovered.cents).toBe(50000n) // K500
    expect(result.passedThrough.cents).toBe(50000n) // K1000 - K500
    expect(result.newPaid.cents).toBe(50000n)
    expect(result.newStatus).toBe('open')
  })

  it('marks advance as recovered when fully paid', () => {
    // outstanding = K500 (after K5000 paid already)
    const advance = openAdvance({
      paid: kwacha(500000n), // K5000 paid, K500 outstanding
    })
    // topup = K10000, share = 0.5 = K5000, capped at K500 outstanding -> recovered = K500
    const result = recover(advance, mwElectricityProduct(), {
      topupAmount: kwacha(1000000n),
      idempotencyKey: 'rec-cap-2',
      source: 'topup_event',
      now: new Date('2024-06-05T00:00:00Z'),
    })
    expect(result.recovered.cents).toBe(50000n) // K500
    expect(result.newPaid.cents).toBe(550000n) // K5500 = totalDue
    expect(result.newStatus).toBe('recovered')
    expect(result.advance.recoveredAt).toEqual(new Date('2024-06-05T00:00:00Z'))
  })
})

describe('topup.applyOverdue', () => {
  function openAdvance(overrides: Partial<TopupAdvance> = {}): TopupAdvance {
    return {
      id: 'adv-1',
      tenantId: 't1',
      subjectId: 'subj-1',
      product: 'sa_airtime',
      principal: rand(2000n),
      fee: rand(240n),
      totalDue: rand(2240n),
      paid: rand(0n),
      currency: 'ZAR',
      status: 'open',
      dueAt: new Date('2024-06-08T00:00:00Z'),
      createdAt: new Date('2024-06-01T00:00:00Z'),
      recoveredAt: null,
      writtenOffAt: null,
      deliveryMethod: 'direct_recharge',
      voucherSerial: null,
      decisionId: null,
      ...overrides,
    }
  }

  it('marks as written_off for write_off products past due', () => {
    // MW_ELECTRICITY has overdueAction: 'write_off', overdueDays: 60
    const advance: TopupAdvance = {
      ...openAdvance(),
      product: 'mw_electricity',
      currency: 'MWK',
      principal: kwacha(500000n),
      fee: kwacha(50000n),
      totalDue: kwacha(550000n),
      paid: kwacha(0n),
      dueAt: new Date('2024-06-08T00:00:00Z'),
    }
    // Past dueAt + 60 days = 2024-08-07
    const now = new Date('2024-09-01T00:00:00Z')
    const result = applyOverdue(advance, mwElectricityProduct(), now)
    expect(result.status).toBe('written_off')
    expect(result.writtenOffAt).toBe(now)
  })

  it('marks as added_to_bill for add_to_bill products past due', () => {
    // SA_AIRTIME has overdueAction: 'add_to_bill', overdueDays: 30
    const advance = openAdvance()
    // dueAt = 2024-06-08, overdueDays = 30 -> overdue at 2024-07-08
    const now = new Date('2024-08-01T00:00:00Z')
    const result = applyOverdue(advance, saAirtimeProduct(), now)
    expect(result.status).toBe('added_to_bill')
    expect(result.writtenOffAt).toBeNull()
  })

  it('leaves open advances alone when not yet overdue', () => {
    const advance = openAdvance()
    // dueAt = 2024-06-08, overdueDays = 30 -> not overdue at 2024-06-15
    const now = new Date('2024-06-15T00:00:00Z')
    const result = applyOverdue(advance, saAirtimeProduct(), now)
    expect(result.status).toBe('open')
  })

  it('does not modify already-recovered advances', () => {
    const advance = openAdvance({ status: 'recovered' })
    const now = new Date('2024-12-01T00:00:00Z')
    const result = applyOverdue(advance, saAirtimeProduct(), now)
    expect(result.status).toBe('recovered')
  })
})
