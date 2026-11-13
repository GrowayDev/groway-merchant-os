import { GroCoreError } from './errors'
export interface EnvelopePayload { tenantId: string; subjectId: string; product: string; approvedLimitCents: bigint; currency: string; issuedAt: number; expiresAt: number; keyId: string }
export interface SignedEnvelope { payload: EnvelopePayload; signature: string; payloadJson: string }
export function canonicalPayloadJson(p: EnvelopePayload): string { return JSON.stringify({ tenantId: p.tenantId, subjectId: p.subjectId, product: p.product, approvedLimitCents: p.approvedLimitCents.toString(), currency: p.currency, issuedAt: p.issuedAt, expiresAt: p.expiresAt, keyId: p.keyId }) }
export function buildEnvelope(payload: EnvelopePayload, signer: (bytes: Uint8Array) => string): SignedEnvelope { const j = canonicalPayloadJson(payload); return { payload, signature: signer(new TextEncoder().encode(j)), payloadJson: j } }
export function verifyEnvelope(env: SignedEnvelope, verifier: (bytes: Uint8Array, sig: string, keyId: string) => boolean, expectedTenantId: string, now: Date = new Date()): EnvelopePayload {
  if (canonicalPayloadJson(env.payload) !== env.payloadJson) throw new GroCoreError('EDGE_SIGNATURE_INVALID', 'Payload mismatch')
  if (env.payload.tenantId !== expectedTenantId) throw new GroCoreError('TENANT_MISMATCH', 'Tenant mismatch')
  if (env.payload.expiresAt < now.getTime()) throw new GroCoreError('EDGE_ENVELOPE_EXPIRED', 'Envelope expired')
  if (!verifier(new TextEncoder().encode(env.payloadJson), env.signature, env.payload.keyId)) throw new GroCoreError('EDGE_SIGNATURE_INVALID', 'Signature verification failed')
  return env.payload
}
export class SpendTracker { private spent = new Map<string, bigint>(); constructor(private cap: bigint) {} private key(t: string, s: string, p: string) { return `${t}|${s}|${p}` } spend(tenantId: string, subjectId: string, product: string, amountCents: bigint): bigint { const k = this.key(tenantId, subjectId, product); const current = this.spent.get(k) ?? 0n; const next = current + amountCents; if (next > this.cap) throw new GroCoreError('EDGE_CAP_EXCEEDED', `Cap exceeded: ${next} > ${this.cap}`); this.spent.set(k, next); return this.cap - next } remaining(tenantId: string, subjectId: string, product: string): bigint { return this.cap - (this.spent.get(this.key(tenantId, subjectId, product)) ?? 0n) } }
