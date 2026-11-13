import { GroCoreError } from './errors'
export type ConsentStatus = 'active' | 'revoked' | 'expired'
export interface ConsentRecord { id: string; tenantId: string; subjectId: string; subjectType: 'customer' | 'merchant' | 'msisdn' | 'meter'; purpose: string; status: ConsentStatus; grantedAt: Date; revokedAt?: Date | null; expiresAt?: Date | null; policyVersion: string; evidence?: string | null }
export function isActive(record: ConsentRecord, now: Date = new Date()): boolean {
  if (record.status === 'revoked') return false
  if (record.expiresAt && record.expiresAt.getTime() < now.getTime()) return false
  return record.status === 'active'
}
export function requireConsent(record: ConsentRecord | null | undefined, purpose: string, now: Date = new Date()): ConsentRecord {
  if (!record) throw new GroCoreError('CONSENT_MISSING', `No consent for purpose ${purpose}`)
  if (record.status === 'revoked') throw new GroCoreError('CONSENT_REVOKED', `Consent revoked for ${purpose}`)
  if (record.expiresAt && record.expiresAt.getTime() < now.getTime()) throw new GroCoreError('CONSENT_EXPIRED', `Consent expired for ${purpose}`)
  if (record.status !== 'active') throw new GroCoreError('CONSENT_MISSING', `Consent not active for ${purpose}`)
  return record
}
export function revoke(record: ConsentRecord, now: Date = new Date()): ConsentRecord { return record.status === 'revoked' ? record : { ...record, status: 'revoked', revokedAt: now } }
export function shouldReplaceConsent(existing: ConsentRecord | null, newPolicyVersion: string): boolean { if (!existing) return true; if (existing.status === 'revoked') return true; if (existing.expiresAt && existing.expiresAt.getTime() < Date.now()) return true; if (existing.policyVersion !== newPolicyVersion) return true; return false }
export const PURPOSES = { CREDIT_USE: 'credit_use', TOPUP_CREDIT: 'topup_credit', MARKETING: 'marketing', DATA_PROCESSING: 'data_processing', EWA: 'earned_wage_access', DEVICE_FINANCE: 'device_finance' } as const
