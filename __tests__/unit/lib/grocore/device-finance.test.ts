/**
 * Unit tests for the GroCore device finance module.
 */

import {
  createContract,
  applyPayment,
  checkRepossession,
  DeviceProduct,
  DeviceContract,
  GroCoreError,
} from '@/lib/grocore'
import { rand } from './_helpers'

function makeProduct(overrides: Partial<DeviceProduct> = {}): DeviceProduct {
  return {
    id: 'prod-1',
    name: 'Solar Kit',
    currency: 'ZAR',
    principal: rand(10000n), // R100
    dailyPayment: rand(1000n), // R10
    totalDays: 10,
    graceDays: 7,
    ...overrides,
  }
}

function makeContract(overrides: Partial<DeviceContract> = {}): DeviceContract {
  const product = makeProduct()
  const now = new Date('2024-06-01T00:00:00Z')
  return {
    id: 'ctr-1',
    tenantId: 't1',
    customerId: 'cust-1',
    productId: product.id,
    deviceName: 'Solar Kit',
    deviceImei: null,
    principal: product.principal,
    paid: rand(0n),
    dailyPayment: product.dailyPayment,
    currency: product.currency,
    totalDays: product.totalDays,
    daysPaid: 0,
    status: 'active',
    locked: true,
    unlockedAt: null,
    dueAt: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

describe('device-finance.createContract', () => {
  it('starts locked, active, paid=0', () => {
    const contract = createContract({
      id: 'ctr-1',
      tenantId: 't1',
      customerId: 'cust-1',
      product: makeProduct(),
      deviceName: 'Solar Kit',
      now: new Date('2024-06-01T00:00:00Z'),
    })
    expect(contract.status).toBe('active')
    expect(contract.locked).toBe(true)
    expect(contract.paid.cents).toBe(0n)
    expect(contract.daysPaid).toBe(0)
    expect(contract.unlockedAt).toBeNull()
    expect(contract.principal.cents).toBe(10000n)
    expect(contract.dailyPayment.cents).toBe(1000n)
    expect(contract.totalDays).toBe(10)
  })
})

describe('device-finance.applyPayment', () => {
  it('reduces outstanding principal and increments daysPaid', () => {
    const contract = makeContract()
    const result = applyPayment(contract, {
      idempotencyKey: 'pay-1',
      amount: rand(1000n), // R10 = 1 daily payment
    })
    // paid increased by R10, daysPaid increased by 1
    expect(result.contract.paid.cents).toBe(1000n)
    expect(result.contract.daysPaid).toBe(1)
    // outstanding (principal - paid) decreased
    expect(result.contract.principal.cents - result.contract.paid.cents).toBe(9000n)
    // still active and locked (not yet paid off)
    expect(result.contract.status).toBe('active')
    expect(result.contract.locked).toBe(true)
    expect(result.unlocked).toBe(false)
    expect(result.paymentId).toBe('dp-pay-1')
  })

  it('unlocks device when fully paid (principal covered)', () => {
    const contract = makeContract({
      principal: rand(10000n), // R100
      totalDays: 100, // large enough that daysPaid won't trigger
      paid: rand(0n),
      daysPaid: 0,
    })
    const result = applyPayment(contract, {
      idempotencyKey: 'pay-2',
      amount: rand(10000n), // R100 in one payment
      now: new Date('2024-06-02T00:00:00Z'),
    })
    expect(result.contract.paid.cents).toBe(10000n)
    expect(result.contract.status).toBe('paid_off')
    expect(result.contract.locked).toBe(false)
    expect(result.contract.unlockedAt).toEqual(new Date('2024-06-02T00:00:00Z'))
    expect(result.unlocked).toBe(true)
  })

  it('unlocks device when daysPaid >= totalDays', () => {
    // principal is very large so it can't be fully paid by amount
    const contract = makeContract({
      principal: rand(1000000n), // R1000
      dailyPayment: rand(1000n), // R10
      totalDays: 3,
      paid: rand(0n),
      daysPaid: 0,
    })
    const result = applyPayment(contract, {
      idempotencyKey: 'pay-3',
      amount: rand(3000n), // R30 = 3 * R10 daily payment
    })
    expect(result.contract.daysPaid).toBe(3)
    expect(result.contract.status).toBe('paid_off')
    expect(result.contract.locked).toBe(false)
    expect(result.unlocked).toBe(true)
  })

  it('throws DEVICE_CONTRACT_PAID_OFF when already paid off', () => {
    const contract = makeContract({ status: 'paid_off', locked: false })
    let caught: GroCoreError | null = null
    try {
      applyPayment(contract, { idempotencyKey: 'pay-4', amount: rand(1000n) })
    } catch (e) {
      caught = e as GroCoreError
    }
    expect(caught).toBeInstanceOf(GroCoreError)
    expect(caught?.code).toBe('DEVICE_CONTRACT_PAID_OFF')
  })

  it('throws DEVICE_CONTRACT_LOCKED when repossessed', () => {
    const contract = makeContract({ status: 'repossessed', locked: true })
    let caught: GroCoreError | null = null
    try {
      applyPayment(contract, { idempotencyKey: 'pay-5', amount: rand(1000n) })
    } catch (e) {
      caught = e as GroCoreError
    }
    expect(caught).toBeInstanceOf(GroCoreError)
    expect(caught?.code).toBe('DEVICE_CONTRACT_LOCKED')
  })

  it('throws on currency mismatch', () => {
    const contract = makeContract({ currency: 'ZAR' })
    let caught: GroCoreError | null = null
    try {
      applyPayment(contract, {
        idempotencyKey: 'pay-6',
        amount: { cents: 1000n, currency: 'MWK' },
      })
    } catch (e) {
      caught = e as GroCoreError
    }
    expect(caught).toBeInstanceOf(GroCoreError)
    expect(caught?.code).toBe('VALIDATION_ERROR')
  })
})

describe('device-finance.checkRepossession', () => {
  it('repossesses when no payment within grace period', () => {
    const contract = makeContract({ createdAt: new Date('2024-05-01T00:00:00Z') })
    const lastPaymentAt = new Date('2024-06-01T00:00:00Z')
    const now = new Date('2024-06-15T00:00:00Z') // 14 days since last payment, > 7 graceDays
    const result = checkRepossession(contract, lastPaymentAt, makeProduct(), now)
    expect(result.status).toBe('repossessed')
    expect(result.locked).toBe(true)
  })

  it('leaves active contracts alone when within grace', () => {
    const contract = makeContract()
    const lastPaymentAt = new Date('2024-06-10T00:00:00Z')
    const now = new Date('2024-06-13T00:00:00Z') // 3 days since last payment, < 7 graceDays
    const result = checkRepossession(contract, lastPaymentAt, makeProduct(), now)
    expect(result.status).toBe('active')
  })

  it('repossesses when no payment ever and contract is older than grace period', () => {
    const createdAt = new Date('2024-05-01T00:00:00Z')
    const contract = makeContract({ createdAt })
    const now = new Date('2024-06-15T00:00:00Z') // 45 days since creation, > 7 graceDays
    const result = checkRepossession(contract, null, makeProduct(), now)
    expect(result.status).toBe('repossessed')
    expect(result.locked).toBe(true)
  })

  it('does nothing when already paid off', () => {
    const contract = makeContract({ status: 'paid_off', locked: false })
    const now = new Date('2024-12-01T00:00:00Z')
    const result = checkRepossession(contract, null, makeProduct(), now)
    expect(result.status).toBe('paid_off')
    expect(result.locked).toBe(false)
  })
})
