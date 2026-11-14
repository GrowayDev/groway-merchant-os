/**
 * Unit tests for the GroCore consent module.
 */

import {
  isActive,
  requireConsent,
  revoke,
  shouldReplaceConsent,
  ConsentRecord,
  GroCoreError,
} from '@/lib/grocore'

function makeRecord(overrides: Partial<ConsentRecord> = {}): ConsentRecord {
  return {
    id: 'consent-1',
    tenantId: 't1',
    subjectId: 'subj-1',
    subjectType: 'customer',
    purpose: 'credit_use',
    status: 'active',
    grantedAt: new Date('2024-01-01T00:00:00Z'),
    revokedAt: null,
    expiresAt: null,
    policyVersion: 'v1',
    evidence: 'ip:1.2.3.4',
    ...overrides,
  }
}

describe('consent.isActive', () => {
  it('returns true for active records', () => {
    expect(isActive(makeRecord())).toBe(true)
  })

  it('returns false for revoked records', () => {
    expect(isActive(makeRecord({ status: 'revoked' }))).toBe(false)
  })

  it('returns false for expired records', () => {
    const now = new Date('2024-06-01T00:00:00Z')
    const past = new Date('2024-05-01T00:00:00Z')
    expect(isActive(makeRecord({ expiresAt: past }), now)).toBe(false)
  })

  it('returns true when expiresAt is in the future', () => {
    const now = new Date('2024-06-01T00:00:00Z')
    const future = new Date('2024-12-01T00:00:00Z')
    expect(isActive(makeRecord({ expiresAt: future }), now)).toBe(true)
  })

  it('returns true when expiresAt is null', () => {
    expect(isActive(makeRecord({ expiresAt: null }))).toBe(true)
  })

  it('treats expired status as not active', () => {
    expect(isActive(makeRecord({ status: 'expired' }))).toBe(false)
  })
})

describe('consent.requireConsent', () => {
  it('returns the record when active', () => {
    const record = makeRecord()
    expect(requireConsent(record, 'credit_use')).toBe(record)
  })

  it('throws CONSENT_REVOKED when revoked', () => {
    let caught: GroCoreError | null = null
    try {
      requireConsent(makeRecord({ status: 'revoked' }), 'credit_use')
    } catch (e) {
      caught = e as GroCoreError
    }
    expect(caught).toBeInstanceOf(GroCoreError)
    expect(caught?.code).toBe('CONSENT_REVOKED')
  })

  it('throws CONSENT_EXPIRED when expired', () => {
    const now = new Date('2024-06-01T00:00:00Z')
    const past = new Date('2024-05-01T00:00:00Z')
    let caught: GroCoreError | null = null
    try {
      requireConsent(makeRecord({ expiresAt: past }), 'credit_use', now)
    } catch (e) {
      caught = e as GroCoreError
    }
    expect(caught).toBeInstanceOf(GroCoreError)
    expect(caught?.code).toBe('CONSENT_EXPIRED')
  })

  it('throws CONSENT_MISSING when record is null', () => {
    let caught: GroCoreError | null = null
    try {
      requireConsent(null, 'credit_use')
    } catch (e) {
      caught = e as GroCoreError
    }
    expect(caught).toBeInstanceOf(GroCoreError)
    expect(caught?.code).toBe('CONSENT_MISSING')
  })

  it('throws CONSENT_MISSING when record is undefined', () => {
    let caught: GroCoreError | null = null
    try {
      requireConsent(undefined, 'credit_use')
    } catch (e) {
      caught = e as GroCoreError
    }
    expect(caught).toBeInstanceOf(GroCoreError)
    expect(caught?.code).toBe('CONSENT_MISSING')
  })
})

describe('consent.revoke', () => {
  it('sets status to revoked and revokedAt timestamp', () => {
    const now = new Date('2024-06-01T12:00:00Z')
    const record = makeRecord()
    const revoked = revoke(record, now)
    expect(revoked.status).toBe('revoked')
    expect(revoked.revokedAt).toBe(now)
  })

  it('is idempotent if already revoked (preserves original revokedAt)', () => {
    const originalTime = new Date('2024-06-01T12:00:00Z')
    const laterTime = new Date('2024-07-01T12:00:00Z')
    const alreadyRevoked = makeRecord({ status: 'revoked', revokedAt: originalTime })
    const result = revoke(alreadyRevoked, laterTime)
    expect(result.status).toBe('revoked')
    expect(result.revokedAt).toBe(originalTime)
    expect(result.revokedAt).not.toBe(laterTime)
  })
})

describe('consent.shouldReplaceConsent', () => {
  it('returns true when there is no existing consent', () => {
    expect(shouldReplaceConsent(null, 'v1')).toBe(true)
  })

  it('returns true when existing is revoked', () => {
    const record = makeRecord({ status: 'revoked' })
    expect(shouldReplaceConsent(record, 'v1')).toBe(true)
  })

  it('returns true when existing is expired', () => {
    const past = new Date('2020-01-01T00:00:00Z')
    const record = makeRecord({ expiresAt: past })
    expect(shouldReplaceConsent(record, 'v1')).toBe(true)
  })

  it('returns true when policy version differs', () => {
    const record = makeRecord({ policyVersion: 'v1' })
    expect(shouldReplaceConsent(record, 'v2')).toBe(true)
  })

  it('returns false when active, not expired and same policy version', () => {
    const future = new Date('2099-01-01T00:00:00Z')
    const record = makeRecord({ policyVersion: 'v1', expiresAt: future })
    expect(shouldReplaceConsent(record, 'v1')).toBe(false)
  })
})
