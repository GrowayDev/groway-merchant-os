/**
 * Unit tests for the GroCore capital funding grid.
 */

import {
  available,
  allocateCapital,
  applyAllocations,
  releaseCapital,
  summariseGrid,
  CapitalSource,
  GroCoreError,
} from '@/lib/grocore'
import { rand, kwacha } from './_helpers'

function makeSource(overrides: Partial<CapitalSource> = {}): CapitalSource {
  return {
    id: 'src-1',
    tenantId: 't1',
    name: 'Source 1',
    type: 'lender',
    currency: 'ZAR',
    committed: rand(100000n), // R1000
    deployed: rand(0n),
    costRateBps: 100,
    status: 'active',
    startDate: new Date('2024-01-01T00:00:00Z'),
    endDate: null,
    ...overrides,
  }
}

describe('capital-grid.available', () => {
  it('returns committed - deployed', () => {
    expect(available(makeSource({ committed: rand(100000n), deployed: rand(30000n) })).cents).toBe(
      70000n,
    )
  })

  it('returns zero when fully deployed', () => {
    expect(available(makeSource({ committed: rand(100000n), deployed: rand(100000n) })).cents).toBe(
      0n,
    )
  })
})

describe('capital-grid.allocateCapital', () => {
  it('picks the cheapest source first', () => {
    const cheap = makeSource({ id: 'cheap', costRateBps: 100 })
    const pricey = makeSource({ id: 'pricey', costRateBps: 300 })
    const allocations = allocateCapital([pricey, cheap], rand(50000n)) // R500
    expect(allocations).toHaveLength(1)
    expect(allocations[0].source.id).toBe('cheap')
    expect(allocations[0].amount.cents).toBe(50000n)
  })

  it('picks multiple sources when one is not enough', () => {
    const cheap = makeSource({ id: 'cheap', costRateBps: 100, committed: rand(50000n) }) // R500
    const pricey = makeSource({ id: 'pricey', costRateBps: 300, committed: rand(50000n) }) // R500
    const allocations = allocateCapital([pricey, cheap], rand(80000n)) // R800
    expect(allocations).toHaveLength(2)
    expect(allocations[0].source.id).toBe('cheap')
    expect(allocations[0].amount.cents).toBe(50000n)
    expect(allocations[1].source.id).toBe('pricey')
    expect(allocations[1].amount.cents).toBe(30000n)
  })

  it('throws CAPITAL_INSUFFICIENT when total available is short', () => {
    const src = makeSource({ committed: rand(50000n) }) // R500 available
    let caught: GroCoreError | null = null
    try {
      allocateCapital([src], rand(100000n)) // R1000 requested
    } catch (e) {
      caught = e as GroCoreError
    }
    expect(caught).toBeInstanceOf(GroCoreError)
    expect(caught?.code).toBe('CAPITAL_INSUFFICIENT')
  })

  it('filters by currency', () => {
    const zar = makeSource({ id: 'zar', currency: 'ZAR', costRateBps: 100 })
    const mwk = makeSource({
      id: 'mwk',
      currency: 'MWK',
      costRateBps: 50, // cheaper but wrong currency
    })
    const allocations = allocateCapital([mwk, zar], rand(10000n))
    expect(allocations).toHaveLength(1)
    expect(allocations[0].source.id).toBe('zar')
  })

  it('filters by active status (skips exhausted and withdrawn)', () => {
    const active = makeSource({ id: 'active', status: 'active', costRateBps: 300 })
    const exhausted = makeSource({
      id: 'exhausted',
      status: 'exhausted',
      costRateBps: 100, // cheaper but not eligible
    })
    const withdrawn = makeSource({
      id: 'withdrawn',
      status: 'withdrawn',
      costRateBps: 50, // cheapest but not eligible
    })
    const allocations = allocateCapital(
      [active, exhausted, withdrawn],
      rand(10000n),
    )
    expect(allocations).toHaveLength(1)
    expect(allocations[0].source.id).toBe('active')
  })

  it('filters by end date (skips sources whose end date is in the past)', () => {
    const now = new Date('2024-06-01T00:00:00Z')
    const current = makeSource({
      id: 'current',
      costRateBps: 300,
      endDate: new Date('2024-12-31T00:00:00Z'),
    })
    const expired = makeSource({
      id: 'expired',
      costRateBps: 100,
      endDate: new Date('2024-05-01T00:00:00Z'),
    })
    const allocations = allocateCapital([current, expired], rand(10000n), now)
    expect(allocations).toHaveLength(1)
    expect(allocations[0].source.id).toBe('current')
  })

  it('skips sources with zero available', () => {
    const full = makeSource({
      id: 'full',
      costRateBps: 100,
      committed: rand(100000n),
      deployed: rand(100000n), // fully deployed
    })
    const usable = makeSource({
      id: 'usable',
      costRateBps: 200,
      committed: rand(100000n),
      deployed: rand(0n),
    })
    const allocations = allocateCapital([full, usable], rand(50000n))
    expect(allocations).toHaveLength(1)
    expect(allocations[0].source.id).toBe('usable')
  })
})

describe('capital-grid.applyAllocations', () => {
  it('updates deployed amounts and marks exhausted sources', () => {
    const src = makeSource({
      id: 'src-1',
      committed: rand(100000n), // R1000
      deployed: rand(0n),
    })
    const allocations = [{ source: src, amount: rand(100000n) }] // allocate full R1000
    const updated = applyAllocations(allocations)
    const result = updated.get('src-1')!
    expect(result.deployed.cents).toBe(100000n)
    expect(result.status).toBe('exhausted')
  })

  it('leaves sources active when not fully deployed', () => {
    const src = makeSource({
      id: 'src-1',
      committed: rand(100000n), // R1000
      deployed: rand(0n),
    })
    const allocations = [{ source: src, amount: rand(30000n) }] // R300
    const updated = applyAllocations(allocations)
    const result = updated.get('src-1')!
    expect(result.deployed.cents).toBe(30000n)
    expect(result.status).toBe('active')
  })

  it('handles multiple allocations to the same source (sums them)', () => {
    const src = makeSource({
      id: 'src-1',
      committed: rand(100000n),
      deployed: rand(0n),
    })
    const allocations = [
      { source: src, amount: rand(30000n) },
      { source: src, amount: rand(20000n) },
    ]
    const updated = applyAllocations(allocations)
    expect(updated.get('src-1')!.deployed.cents).toBe(50000n)
  })
})

describe('capital-grid.releaseCapital', () => {
  it('reduces deployed amount', () => {
    const src = makeSource({
      id: 'src-1',
      committed: rand(100000n),
      deployed: rand(50000n),
      status: 'active',
    })
    const result = releaseCapital(src, rand(20000n))
    expect(result.deployed.cents).toBe(30000n)
    expect(result.status).toBe('active')
  })

  it('reactivates exhausted sources', () => {
    const src = makeSource({
      id: 'src-1',
      committed: rand(100000n),
      deployed: rand(100000n),
      status: 'exhausted',
    })
    const result = releaseCapital(src, rand(20000n))
    expect(result.deployed.cents).toBe(80000n)
    expect(result.status).toBe('active')
  })

  it('throws when release exceeds deployed', () => {
    const src = makeSource({
      id: 'src-1',
      committed: rand(100000n),
      deployed: rand(30000n),
    })
    let caught: GroCoreError | null = null
    try {
      releaseCapital(src, rand(50000n))
    } catch (e) {
      caught = e as GroCoreError
    }
    expect(caught).toBeInstanceOf(GroCoreError)
    expect(caught?.code).toBe('VALIDATION_ERROR')
  })

  it('throws on currency mismatch', () => {
    const src = makeSource({ id: 'src-1', currency: 'ZAR', deployed: rand(50000n) })
    let caught: GroCoreError | null = null
    try {
      releaseCapital(src, kwacha(10000n))
    } catch (e) {
      caught = e as GroCoreError
    }
    expect(caught).toBeInstanceOf(GroCoreError)
    expect(caught?.code).toBe('VALIDATION_ERROR')
  })
})

describe('capital-grid.summariseGrid', () => {
  it('aggregates by currency', () => {
    const sources = [
      makeSource({
        id: 's1',
        currency: 'ZAR',
        committed: rand(100000n), // R1000
        deployed: rand(20000n), // R200
      }),
      makeSource({
        id: 's2',
        currency: 'ZAR',
        committed: rand(50000n), // R500
        deployed: rand(10000n), // R100
      }),
      makeSource({
        id: 's3',
        currency: 'MWK',
        committed: kwacha(1000000n), // K10000
        deployed: kwacha(200000n), // K2000
      }),
    ]
    const summary = summariseGrid(sources)
    expect(summary).toHaveLength(2)
    const zar = summary.find((s) => s.currency === 'ZAR')!
    expect(zar.committedCents).toBe(150000n)
    expect(zar.deployedCents).toBe(30000n)
    expect(zar.availableCents).toBe(120000n)
    expect(zar.sources).toBe(2)
    const mwk = summary.find((s) => s.currency === 'MWK')!
    expect(mwk.committedCents).toBe(1000000n)
    expect(mwk.deployedCents).toBe(200000n)
    expect(mwk.availableCents).toBe(800000n)
    expect(mwk.sources).toBe(1)
  })

  it('returns an empty array for no sources', () => {
    expect(summariseGrid([])).toEqual([])
  })
})
