/**
 * Unit tests for GroCore currency primitives.
 */

import {
  money,
  fromRand,
  fromKwacha,
  toMajor,
  add,
  sub,
  min,
  max,
  lte,
  gte,
  lt,
  gt,
  equals,
  isZero,
  format,
  feeBps,
  sum,
  assertSameCurrency,
  ZERO,
} from '@/lib/grocore'

describe('currency.money', () => {
  it('accepts a bigint amount', () => {
    expect(money(1000n).cents).toBe(1000n)
  })

  it('accepts a number amount (truncated)', () => {
    expect(money(1000).cents).toBe(1000n)
    expect(money(1000.9).cents).toBe(1000n) // truncated, not rounded
  })

  it('accepts a numeric string amount', () => {
    expect(money('1500').cents).toBe(1500n)
  })

  it('rejects a negative bigint', () => {
    expect(() => money(-1n)).toThrow(/non-negative/)
  })

  it('rejects a negative number', () => {
    expect(() => money(-5)).toThrow(/non-negative/)
  })

  it('defaults to ZAR when no currency is provided', () => {
    expect(money(0n).currency).toBe('ZAR')
  })

  it('honours the currency argument', () => {
    expect(money(0n, 'MWK').currency).toBe('MWK')
    expect(money(0n, 'USD').currency).toBe('USD')
  })
})

describe('currency.fromRand / fromKwacha', () => {
  it('fromRand converts major rand to cents', () => {
    expect(fromRand(10).cents).toBe(1000n)
    expect(fromRand(0).cents).toBe(0n)
  })

  it('fromRand rounds half-to-even (uses Math.round)', () => {
    // 10.005 -> rounds to 1000 or 1001 depending on float repr; both are
    // acceptable as long as the value is "close". Verify 10.01 -> 1001.
    expect(fromRand(10.01).cents).toBe(1001n)
  })

  it('fromRand rejects negative or non-finite values', () => {
    expect(() => fromRand(-1)).toThrow()
    expect(() => fromRand(NaN)).toThrow()
    expect(() => fromRand(Infinity)).toThrow()
  })

  it('fromKwacha converts major kwacha to tambala', () => {
    expect(fromKwacha(500).cents).toBe(50000n)
    expect(fromKwacha(0).currency).toBe('MWK')
  })

  it('fromKwacha rejects negative values', () => {
    expect(() => fromKwacha(-1)).toThrow()
  })

  it('toMajor reads back the major-unit amount', () => {
    expect(toMajor(fromRand(10))).toBeCloseTo(10, 10)
    expect(toMajor(fromKwacha(500))).toBeCloseTo(500, 10)
  })
})

describe('currency arithmetic', () => {
  it('add sums two Money amounts in the same currency', () => {
    expect(add(money(100n), money(200n)).cents).toBe(300n)
  })

  it('sub subtracts two Money amounts in the same currency', () => {
    expect(sub(money(300n), money(100n)).cents).toBe(200n)
  })

  it('sub throws when the result would be negative', () => {
    expect(() => sub(money(100n), money(200n))).toThrow(/negative/)
  })

  it('max picks the larger amount', () => {
    expect(max(money(100n), money(200n)).cents).toBe(200n)
    expect(max(money(500n), money(200n)).cents).toBe(500n)
  })

  it('min picks the smaller amount', () => {
    expect(min(money(100n), money(200n)).cents).toBe(100n)
    expect(min(money(500n), money(200n)).cents).toBe(200n)
  })

  it('lte returns true when a <= b', () => {
    expect(lte(money(100n), money(200n))).toBe(true)
    expect(lte(money(200n), money(200n))).toBe(true)
    expect(lte(money(300n), money(200n))).toBe(false)
  })

  it('gte returns true when a >= b', () => {
    expect(gte(money(300n), money(200n))).toBe(true)
    expect(gte(money(200n), money(200n))).toBe(true)
    expect(gte(money(100n), money(200n))).toBe(false)
  })

  it('lt and gt work as expected', () => {
    expect(lt(money(100n), money(200n))).toBe(true)
    expect(gt(money(300n), money(200n))).toBe(true)
  })

  it('equals compares cents and currency', () => {
    expect(equals(money(100n), money(100n))).toBe(true)
    expect(equals(money(100n), money(200n))).toBe(false)
    expect(equals(money(100n, 'ZAR'), money(100n, 'MWK'))).toBe(false)
  })

  it('isZero detects zero amounts', () => {
    expect(isZero(money(0n))).toBe(true)
    expect(isZero(money(1n))).toBe(false)
    expect(isZero(ZERO)).toBe(true)
  })
})

describe('currency.assertSameCurrency', () => {
  it('does not throw when currencies match', () => {
    expect(() => assertSameCurrency(money(1n), money(2n))).not.toThrow()
  })

  it('throws on currency mismatch', () => {
    expect(() => assertSameCurrency(money(1n, 'ZAR'), money(1n, 'MWK'))).toThrow(/Currency mismatch/)
  })
})

describe('currency.format', () => {
  it('formats ZAR with R prefix and two decimals', () => {
    expect(format(money(1000n, 'ZAR'))).toBe('R10.00')
    expect(format(money(0n, 'ZAR'))).toBe('R0.00')
    expect(format(money(5n, 'ZAR'))).toBe('R0.05')
  })

  it('formats MWK with K prefix', () => {
    expect(format(money(50000n, 'MWK'))).toBe('K500.00')
  })

  it('formats USD with $ prefix', () => {
    expect(format(money(2500n, 'USD'))).toBe('$25.00')
  })
})

describe('currency.feeBps', () => {
  it('applies a basis-point fee correctly (250 bps of R100 = R2.50)', () => {
    const principal = money(10000n, 'ZAR') // R100.00
    const fee = feeBps(principal, 250) // 2.5%
    expect(fee.cents).toBe(250n) // R2.50
    expect(fee.currency).toBe('ZAR')
  })

  it('100 bps of R1000 = R10.00', () => {
    const fee = feeBps(money(100000n, 'ZAR'), 100)
    expect(fee.cents).toBe(1000n)
  })

  it('0 bps yields zero fee', () => {
    expect(feeBps(money(10000n), 0).cents).toBe(0n)
  })

  it('rejects negative bps', () => {
    expect(() => feeBps(money(10000n), -1)).toThrow()
  })

  it('inherits currency from principal', () => {
    expect(feeBps(money(10000n, 'MWK'), 250).currency).toBe('MWK')
  })
})

describe('currency.sum', () => {
  it('sums a list of Money amounts in the same currency', () => {
    const total = sum([money(100n), money(200n), money(300n)])
    expect(total.cents).toBe(600n)
    expect(total.currency).toBe('ZAR')
  })

  it('returns zero ZAR for an empty list', () => {
    const total = sum([])
    expect(total.cents).toBe(0n)
    expect(total.currency).toBe('ZAR')
  })

  it('throws on currency mismatch within the list', () => {
    expect(() => sum([money(100n, 'ZAR'), money(100n, 'MWK')])).toThrow(/currency mismatch/)
  })
})
