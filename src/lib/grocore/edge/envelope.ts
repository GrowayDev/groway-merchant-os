import { createPrivateKey, createPublicKey, generateKeyPairSync, sign, verify, KeyObject } from 'node:crypto';

export interface EnvelopePayload {
  envelopeId: string; subject: string; tenant: string; product: string;
  maxOfflineAmountMinor: string; currency: string;
  validFrom: string; expiresAt: string; policyVersion: string; modelVersion: string;
  alg: 'Ed25519'; kid: string;
}
export interface SignedEnvelope { payload: EnvelopePayload; signature: string }

const canonical = (p: EnvelopePayload) =>
  JSON.stringify(Object.fromEntries(Object.entries(p).sort(([a], [b]) => (a < b ? -1 : 1))));

export function newKeyPair() {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519');
  return { publicKey, privateKey };
}
export const exportPublic = (k: KeyObject) => k.export({ type: 'spki', format: 'pem' }).toString();
export const importPublic = (pem: string) => createPublicKey(pem);
export const importPrivate = (pem: string) => createPrivateKey(pem);

export function signEnvelope(payload: EnvelopePayload, privateKey: KeyObject): SignedEnvelope {
  return { payload, signature: sign(null, Buffer.from(canonical(payload)), privateKey).toString('base64') };
}

export type VerifyResult = { ok: true } | { ok: false; reason: 'UNKNOWN_KEY' | 'BAD_SIGNATURE' | 'NOT_YET_VALID' | 'EXPIRED' | 'WRONG_TENANT' };

/** What an edge node runs before every offline decision: signature, validity window, tenant, key ID. */
export function verifyEnvelope(env: SignedEnvelope, keys: Map<string, KeyObject>, tenant: string, now = new Date()): VerifyResult {
  const key = keys.get(env.payload.kid);
  if (!key) return { ok: false, reason: 'UNKNOWN_KEY' };
  if (!verify(null, Buffer.from(canonical(env.payload)), key, Buffer.from(env.signature, 'base64'))) return { ok: false, reason: 'BAD_SIGNATURE' };
  if (env.payload.tenant !== tenant) return { ok: false, reason: 'WRONG_TENANT' };
  if (now < new Date(env.payload.validFrom)) return { ok: false, reason: 'NOT_YET_VALID' };
  if (now >= new Date(env.payload.expiresAt)) return { ok: false, reason: 'EXPIRED' };
  return { ok: true };
}

/** Tracks offline spend against the envelope cap; reported to the core on sync. */
export class EdgeSpendTracker {
  private spent = new Map<string, bigint>();
  tryReserve(env: SignedEnvelope, amount: bigint): boolean {
    const cap = BigInt(env.payload.maxOfflineAmountMinor);
    const next = (this.spent.get(env.payload.envelopeId) ?? 0n) + amount;
    if (amount <= 0n || next > cap) return false;
    this.spent.set(env.payload.envelopeId, next);
    return true;
  }
  spentFor(id: string) { return this.spent.get(id) ?? 0n; }
}
