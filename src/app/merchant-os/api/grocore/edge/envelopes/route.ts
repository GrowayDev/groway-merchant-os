import { NextRequest } from 'next/server'
import {
  GroCoreError,
  buildEnvelope,
  verifyEnvelope,
  EnvelopePayload,
  SignedEnvelope,
} from '@/lib/grocore'
import { getTenantId, handleError, ok } from '../../_helpers'

/**
 * Edge envelope build + verify endpoint.
 *
 * The task spec lists both operations against this single route file. We
 * dispatch on `body.action`:
 *   - `build` (default) — build a signed envelope using a fake test signer
 *     that returns a placeholder base64 signature.
 *   - `verify`           — verify an envelope against a fake test verifier
 *     (which always returns true) so the tenant / expiry / payload-tamper
 *     checks are the only gates.
 *
 * In production the signer and verifier would be Ed25519 backed by KMS; this
 * testing endpoint exists so the back office and hubs can exercise the full
 * build -> verify round-trip without key material.
 */

interface BuildEnvelopeBody {
  action?: 'build' | 'verify'
  payload?: {
    subjectId?: string
    product?: string
    approvedLimitCents?: string | number | bigint
    currency?: string
    issuedAt?: number
    expiresAt?: number
    keyId?: string
  }
}

interface VerifyEnvelopeBody {
  action?: 'build' | 'verify'
  envelope?: SignedEnvelope
}

/**
 * Fake signer for testing: returns a deterministic placeholder signature
 * derived from the payload bytes. This is NOT secure and is only used so the
 * build -> verify round trip can be exercised without key material.
 */
function fakeSigner(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64')
}

/** Fake verifier: always returns true. Tenant / expiry / tamper checks still run. */
function fakeVerifier(
  _bytes: Uint8Array,
  _signature: string,
  _keyId: string,
): boolean {
  return true
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = getTenantId(request)
    const body = (await request.json()) as BuildEnvelopeBody | VerifyEnvelopeBody
    const action = body.action ?? 'build'

    if (action === 'verify') {
      const verifyBody = body as VerifyEnvelopeBody
      if (!verifyBody.envelope) {
        throw new GroCoreError('VALIDATION_ERROR', 'envelope is required for verify')
      }
      const payload = verifyEnvelope(
        verifyBody.envelope,
        fakeVerifier,
        tenantId,
      )
      return ok({ valid: true, payload })
    }

    if (action !== 'build') {
      throw new GroCoreError(
        'VALIDATION_ERROR',
        `action must be 'build' or 'verify', got ${action}`,
      )
    }

    const buildBody = body as BuildEnvelopeBody
    if (!buildBody.payload) {
      throw new GroCoreError('VALIDATION_ERROR', 'payload is required for build')
    }
    const p = buildBody.payload
    if (!p.subjectId) {
      throw new GroCoreError('VALIDATION_ERROR', 'payload.subjectId is required')
    }
    if (!p.product) {
      throw new GroCoreError('VALIDATION_ERROR', 'payload.product is required')
    }
    if (p.approvedLimitCents === undefined || p.approvedLimitCents === null) {
      throw new GroCoreError('VALIDATION_ERROR', 'payload.approvedLimitCents is required')
    }
    const limitCents =
      typeof p.approvedLimitCents === 'bigint'
        ? p.approvedLimitCents
        : typeof p.approvedLimitCents === 'number'
          ? BigInt(Math.trunc(p.approvedLimitCents))
          : BigInt(String(p.approvedLimitCents).trim())

    const now = Date.now()
    const payload: EnvelopePayload = {
      tenantId,
      subjectId: p.subjectId,
      product: p.product,
      approvedLimitCents: limitCents,
      currency: p.currency ?? 'ZAR',
      issuedAt: p.issuedAt ?? now,
      expiresAt: p.expiresAt ?? now + 24 * 60 * 60 * 1000,
      keyId: p.keyId ?? 'test-key-1',
    }
    const envelope: SignedEnvelope = buildEnvelope(payload, fakeSigner)
    return ok(envelope, 201)
  } catch (e) {
    return handleError(e)
  }
}
