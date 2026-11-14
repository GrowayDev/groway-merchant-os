/**
 * Unit tests for the GroCore edge: signed envelopes and spend caps.
 */

import {
  canonicalPayloadJson,
  buildEnvelope,
  verifyEnvelope,
  SpendTracker,
  EnvelopePayload,
  GroCoreError,
} from '@/lib/grocore'

function makePayload(overrides: Partial<EnvelopePayload> = {}): EnvelopePayload {
  return {
    tenantId: 't1',
    subjectId: 'subj-1',
    product: 'topup_airtime',
    approvedLimitCents: 5000n,
    currency: 'ZAR',
    issuedAt: 1_700_000_000_000,
    expiresAt: 1_800_000_000_000, // far future
    keyId: 'key-1',
    ...overrides,
  }
}

describe('edge.canonicalPayloadJson', () => {
  it('produces stable JSON with keys in declaration order', () => {
    const json = canonicalPayloadJson(makePayload())
    const parsed = JSON.parse(json)
    // BigInts are serialised as strings.
    expect(parsed.tenantId).toBe('t1')
    expect(parsed.subjectId).toBe('subj-1')
    expect(parsed.product).toBe('topup_airtime')
    expect(parsed.approvedLimitCents).toBe('5000')
    expect(parsed.currency).toBe('ZAR')
    expect(parsed.keyId).toBe('key-1')
  })

  it('is deterministic — the same payload always serialises to the same string', () => {
    const a = canonicalPayloadJson(makePayload())
    const b = canonicalPayloadJson(makePayload())
    expect(a).toBe(b)
  })

  it('encodes approvedLimitCents as a string (BigInt-safe)', () => {
    const json = canonicalPayloadJson(makePayload({ approvedLimitCents: 1234567890123456789n }))
    expect(JSON.parse(json).approvedLimitCents).toBe('1234567890123456789')
  })
})

describe('edge.buildEnvelope', () => {
  it('calls signer with canonical bytes and stores the signature', () => {
    const payload = makePayload()
    let receivedBytes: Uint8Array | null = null
    const signer = (bytes: Uint8Array) => {
      receivedBytes = bytes
      return 'sig-abc'
    }
    const env = buildEnvelope(payload, signer)
    expect(env.signature).toBe('sig-abc')
    expect(env.payloadJson).toBe(canonicalPayloadJson(payload))
    expect(receivedBytes).not.toBeNull()
    // The signer must have received exactly the canonical JSON encoded as UTF-8.
    const expectedBytes = new TextEncoder().encode(canonicalPayloadJson(payload))
    expect(Buffer.from(receivedBytes!)).toEqual(Buffer.from(expectedBytes))
  })
})

describe('edge.verifyEnvelope', () => {
  it('succeeds and returns payload when verifier returns true', () => {
    const payload = makePayload()
    const env = buildEnvelope(payload, () => 'sig')
    const result = verifyEnvelope(env, () => true, 't1')
    expect(result).toEqual(payload)
  })

  it('throws EDGE_SIGNATURE_INVALID when verifier returns false', () => {
    const payload = makePayload()
    const env = buildEnvelope(payload, () => 'sig')
    let caught: GroCoreError | null = null
    try {
      verifyEnvelope(env, () => false, 't1')
    } catch (e) {
      caught = e as GroCoreError
    }
    expect(caught).toBeInstanceOf(GroCoreError)
    expect(caught?.code).toBe('EDGE_SIGNATURE_INVALID')
  })

  it('throws EDGE_ENVELOPE_EXPIRED when expiresAt is in the past', () => {
    const past = Date.now() - 1000
    const payload = makePayload({ expiresAt: past })
    const env = buildEnvelope(payload, () => 'sig')
    let caught: GroCoreError | null = null
    try {
      verifyEnvelope(env, () => true, 't1', new Date())
    } catch (e) {
      caught = e as GroCoreError
    }
    expect(caught).toBeInstanceOf(GroCoreError)
    expect(caught?.code).toBe('EDGE_ENVELOPE_EXPIRED')
  })

  it('throws TENANT_MISMATCH when tenantId does not match', () => {
    const payload = makePayload({ tenantId: 't1' })
    const env = buildEnvelope(payload, () => 'sig')
    let caught: GroCoreError | null = null
    try {
      verifyEnvelope(env, () => true, 'other-tenant')
    } catch (e) {
      caught = e as GroCoreError
    }
    expect(caught).toBeInstanceOf(GroCoreError)
    expect(caught?.code).toBe('TENANT_MISMATCH')
  })

  it('throws EDGE_SIGNATURE_INVALID when payloadJson was tampered', () => {
    const payload = makePayload()
    const env = buildEnvelope(payload, () => 'sig')
    // Tamper: change subjectId in payload but keep the old payloadJson
    const tampered: typeof env = {
      ...env,
      payload: { ...env.payload, subjectId: 'attacker' },
    }
    let caught: GroCoreError | null = null
    try {
      verifyEnvelope(tampered, () => true, 't1')
    } catch (e) {
      caught = e as GroCoreError
    }
    expect(caught).toBeInstanceOf(GroCoreError)
    expect(caught?.code).toBe('EDGE_SIGNATURE_INVALID')
  })
})

describe('edge.SpendTracker', () => {
  it('tracks cumulative spend per subject/product', () => {
    const tracker = new SpendTracker(10000n)
    tracker.spend('t1', 'subj-1', 'topup_airtime', 3000n)
    tracker.spend('t1', 'subj-1', 'topup_airtime', 2000n)
    expect(tracker.remaining('t1', 'subj-1', 'topup_airtime')).toBe(5000n)
  })

  it('isolates spend by subject and product', () => {
    const tracker = new SpendTracker(10000n)
    tracker.spend('t1', 'subj-1', 'topup_airtime', 3000n)
    tracker.spend('t1', 'subj-1', 'topup_data', 4000n)
    expect(tracker.remaining('t1', 'subj-1', 'topup_airtime')).toBe(7000n)
    expect(tracker.remaining('t1', 'subj-1', 'topup_data')).toBe(6000n)
  })

  it('throws EDGE_CAP_EXCEEDED when exceeding cap', () => {
    const tracker = new SpendTracker(5000n)
    let caught: GroCoreError | null = null
    try {
      tracker.spend('t1', 'subj-1', 'topup_airtime', 6000n)
    } catch (e) {
      caught = e as GroCoreError
    }
    expect(caught).toBeInstanceOf(GroCoreError)
    expect(caught?.code).toBe('EDGE_CAP_EXCEEDED')
    // On failure, the tracker must not record the spend.
    expect(tracker.remaining('t1', 'subj-1', 'topup_airtime')).toBe(5000n)
  })

  it('throws EDGE_CAP_EXCEEDED when cumulative spend exceeds cap', () => {
    const tracker = new SpendTracker(5000n)
    tracker.spend('t1', 'subj-1', 'topup_airtime', 3000n)
    expect(() => tracker.spend('t1', 'subj-1', 'topup_airtime', 3000n)).toThrow()
  })

  it('remaining() returns cap - spent (full cap when nothing spent)', () => {
    const tracker = new SpendTracker(7000n)
    expect(tracker.remaining('t1', 'subj-1', 'topup_airtime')).toBe(7000n)
  })

  it('reset() clears the tracker for a subject/product', () => {
    const tracker = new SpendTracker(10000n)
    tracker.spend('t1', 'subj-1', 'topup_airtime', 5000n)
    expect(tracker.remaining('t1', 'subj-1', 'topup_airtime')).toBe(5000n)
    tracker.reset('t1', 'subj-1', 'topup_airtime')
    expect(tracker.remaining('t1', 'subj-1', 'topup_airtime')).toBe(10000n)
  })

  it('reset() does not affect other subjects/products', () => {
    const tracker = new SpendTracker(10000n)
    tracker.spend('t1', 'subj-1', 'topup_airtime', 5000n)
    tracker.spend('t1', 'subj-2', 'topup_airtime', 3000n)
    tracker.reset('t1', 'subj-1', 'topup_airtime')
    expect(tracker.remaining('t1', 'subj-1', 'topup_airtime')).toBe(10000n)
    expect(tracker.remaining('t1', 'subj-2', 'topup_airtime')).toBe(7000n)
  })
})
