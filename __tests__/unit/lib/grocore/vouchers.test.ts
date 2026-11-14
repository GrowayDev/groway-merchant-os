/**
 * Unit tests for the GroCore voucher module.
 */

import {
  generateSerial,
  generatePin,
  buildQrPayload,
  issueVoucher,
  redeemVoucher,
  voidVoucher,
  Voucher,
  GroCoreError,
} from '@/lib/grocore'
import { rand } from './_helpers'

describe('vouchers.generateSerial', () => {
  it('produces format GC-{PRODUCT}-{YYYYMMDD}-{8char}', () => {
    const now = new Date('2024-06-15T00:00:00Z')
    const serial = generateSerial('airtime', now)
    // GC-AIRTIME-20240615-XXXXXXXX (8 alphanumeric chars)
    expect(serial).toMatch(/^GC-AIRTIME-20240615-[A-Za-z0-9]{8}$/)
  })

  it('uppercases the product code', () => {
    const serial = generateSerial('electricity', new Date('2024-01-01T00:00:00Z'))
    expect(serial.startsWith('GC-ELECTRICITY-20240101-')).toBe(true)
  })

  it('produces unique serials across calls (with high probability)', () => {
    const now = new Date('2024-06-15T00:00:00Z')
    const serials = new Set<string>()
    for (let i = 0; i < 100; i++) {
      serials.add(generateSerial('data', now))
    }
    // 100 unique serials (collision is astronomically unlikely with 8 base64 chars)
    expect(serials.size).toBe(100)
  })
})

describe('vouchers.generatePin', () => {
  it('produces a 12-digit numeric string', () => {
    const pin = generatePin()
    expect(pin).toMatch(/^\d{12}$/)
    expect(pin).toHaveLength(12)
  })

  it('produces unique PINs across calls (with high probability)', () => {
    const pins = new Set<string>()
    for (let i = 0; i < 50; i++) {
      pins.add(generatePin())
    }
    expect(pins.size).toBe(50)
  })
})

describe('vouchers.buildQrPayload', () => {
  it('produces grocore://voucher?serial=...&product=...&pin=...', () => {
    const payload = buildQrPayload({
      serial: 'GC-AIRTIME-20240615-ABCD1234',
      product: 'airtime',
      pin: '123456789012',
    })
    expect(payload).toBe(
      'grocore://voucher?serial=GC-AIRTIME-20240615-ABCD1234&product=airtime&pin=123456789012',
    )
  })

  it('omits the pin query param when pin is null', () => {
    const payload = buildQrPayload({
      serial: 'GC-AIRTIME-20240615-ABCD1234',
      product: 'airtime',
      pin: null,
    })
    expect(payload).toBe(
      'grocore://voucher?serial=GC-AIRTIME-20240615-ABCD1234&product=airtime',
    )
    expect(payload).not.toContain('pin=')
  })
})

describe('vouchers.issueVoucher', () => {
  const baseInput = {
    tenantId: 't1',
    product: 'airtime' as const,
    supplier: 'vodacom',
    faceValue: rand(1000n), // R10
    cost: rand(900n), // R9
    recipientMsisdn: '+27821234567',
    now: new Date('2024-06-15T00:00:00Z'),
  }

  it('for direct_recharge, has no PIN/QR', () => {
    const voucher = issueVoucher({ ...baseInput, deliveryMethod: 'direct_recharge' })
    expect(voucher.pin).toBeNull()
    expect(voucher.qrPayload).toBeNull()
    expect(voucher.status).toBe('issued')
    expect(voucher.deliveryMethod).toBe('direct_recharge')
    expect(voucher.serial).toMatch(/^GC-AIRTIME-20240615-[A-Za-z0-9]{8}$/)
  })

  it('for voucher_print, has a PIN but no QR payload', () => {
    const voucher = issueVoucher({ ...baseInput, deliveryMethod: 'voucher_print' })
    expect(voucher.pin).not.toBeNull()
    expect(voucher.pin).toMatch(/^\d{12}$/)
    expect(voucher.qrPayload).toBeNull()
    expect(voucher.deliveryMethod).toBe('voucher_print')
  })

  it('for voucher_qr, has both PIN and QR payload', () => {
    const voucher = issueVoucher({ ...baseInput, deliveryMethod: 'voucher_qr' })
    expect(voucher.pin).not.toBeNull()
    expect(voucher.pin).toMatch(/^\d{12}$/)
    expect(voucher.qrPayload).not.toBeNull()
    expect(voucher.qrPayload).toContain('grocore://voucher?')
    expect(voucher.qrPayload).toContain(`pin=${voucher.pin}`)
    expect(voucher.qrPayload).toContain(`serial=${encodeURIComponent(voucher.serial)}`)
  })

  it('throws VALIDATION_ERROR on currency mismatch between faceValue and cost', () => {
    let caught: GroCoreError | null = null
    try {
      issueVoucher({
        ...baseInput,
        deliveryMethod: 'direct_recharge',
        faceValue: { cents: 1000n, currency: 'ZAR' },
        cost: { cents: 900n, currency: 'MWK' },
      })
    } catch (e) {
      caught = e as GroCoreError
    }
    expect(caught).toBeInstanceOf(GroCoreError)
    expect(caught?.code).toBe('VALIDATION_ERROR')
  })
})

describe('vouchers.redeemVoucher', () => {
  function makeVoucher(overrides: Partial<Voucher> = {}): Voucher {
    return {
      id: 'vch-1',
      tenantId: 't1',
      serial: 'GC-AIRTIME-20240615-ABCD1234',
      product: 'airtime',
      supplier: 'vodacom',
      faceValue: rand(1000n),
      cost: rand(900n),
      recipientMsisdn: null,
      meterNumber: null,
      status: 'issued',
      deliveryMethod: 'direct_recharge',
      redeemedAt: null,
      advanceId: null,
      qrPayload: null,
      pin: null,
      createdAt: new Date('2024-06-15T00:00:00Z'),
      ...overrides,
    }
  }

  it('marks as redeemed with a timestamp', () => {
    const now = new Date('2024-06-20T00:00:00Z')
    const result = redeemVoucher(makeVoucher(), now)
    expect(result.status).toBe('redeemed')
    expect(result.redeemedAt).toBe(now)
  })

  it('throws VOUCHER_ALREADY_REDEEMED when already redeemed', () => {
    let caught: GroCoreError | null = null
    try {
      redeemVoucher(makeVoucher({ status: 'redeemed', redeemedAt: new Date('2024-06-18T00:00:00Z') }))
    } catch (e) {
      caught = e as GroCoreError
    }
    expect(caught).toBeInstanceOf(GroCoreError)
    expect(caught?.code).toBe('VOUCHER_ALREADY_REDEEMED')
  })

  it('throws VOUCHER_EXPIRED when status is voided', () => {
    let caught: GroCoreError | null = null
    try {
      redeemVoucher(makeVoucher({ status: 'voided' }))
    } catch (e) {
      caught = e as GroCoreError
    }
    expect(caught).toBeInstanceOf(GroCoreError)
    expect(caught?.code).toBe('VOUCHER_EXPIRED')
  })

  it('throws VOUCHER_EXPIRED when status is expired', () => {
    let caught: GroCoreError | null = null
    try {
      redeemVoucher(makeVoucher({ status: 'expired' }))
    } catch (e) {
      caught = e as GroCoreError
    }
    expect(caught).toBeInstanceOf(GroCoreError)
    expect(caught?.code).toBe('VOUCHER_EXPIRED')
  })
})

describe('vouchers.voidVoucher', () => {
  function makeVoucher(overrides: Partial<Voucher> = {}): Voucher {
    return {
      id: 'vch-1',
      tenantId: 't1',
      serial: 'GC-AIRTIME-20240615-ABCD1234',
      product: 'airtime',
      supplier: 'vodacom',
      faceValue: rand(1000n),
      cost: rand(900n),
      recipientMsisdn: null,
      meterNumber: null,
      status: 'issued',
      deliveryMethod: 'direct_recharge',
      redeemedAt: null,
      advanceId: null,
      qrPayload: null,
      pin: null,
      createdAt: new Date('2024-06-15T00:00:00Z'),
      ...overrides,
    }
  }

  it('marks as voided', () => {
    const result = voidVoucher(makeVoucher())
    expect(result.status).toBe('voided')
  })

  it('throws VOUCHER_ALREADY_REDEEMED when voucher is already redeemed', () => {
    let caught: GroCoreError | null = null
    try {
      voidVoucher(makeVoucher({ status: 'redeemed', redeemedAt: new Date('2024-06-18T00:00:00Z') }))
    } catch (e) {
      caught = e as GroCoreError
    }
    expect(caught).toBeInstanceOf(GroCoreError)
    expect(caught?.code).toBe('VOUCHER_ALREADY_REDEEMED')
  })
})
