import { NextRequest } from 'next/server'
import { randomUUID } from 'crypto'
import { getRepository, GroCoreError } from '@/lib/grocore'
import { getTenantId, handleError, ok } from '../_helpers'

export async function GET(request: NextRequest) {
  try {
    const tenantId = getTenantId(request)
    const { searchParams } = new URL(request.url)
    const subjectId = searchParams.get('subjectId') || undefined
    const consents = await getRepository().listConsents(tenantId, subjectId)
    return ok({ items: consents, count: consents.length })
  } catch (e) { return handleError(e) }
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = getTenantId(request)
    const body = await request.json()
    if (!body.subjectId) throw new GroCoreError('VALIDATION_ERROR', 'subjectId is required')
    if (!body.purpose) throw new GroCoreError('VALIDATION_ERROR', 'purpose is required')
    const existing = await getRepository().getConsent(tenantId, body.subjectId, body.purpose)
    if (existing && existing.status === 'active' && existing.policyVersion === (body.policyVersion || 'v1')) { return ok(existing) }
    const record = {
      id: existing?.id || `con-${randomUUID()}`, tenantId, subjectId: body.subjectId,
      subjectType: body.subjectType || 'customer', purpose: body.purpose, status: 'active' as const,
      grantedAt: new Date(), revokedAt: null, expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      policyVersion: body.policyVersion || 'v1', evidence: body.evidence,
    }
    const saved = await getRepository().saveConsent(record)
    return ok(saved, 201)
  } catch (e) { return handleError(e) }
}
