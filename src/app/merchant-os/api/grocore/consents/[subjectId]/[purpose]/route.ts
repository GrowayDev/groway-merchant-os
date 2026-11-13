import { NextRequest } from 'next/server'
import { getRepository, GroCoreError, revoke } from '@/lib/grocore'
import { getTenantId, handleError, ok } from '../../../_helpers'

export async function GET(request: NextRequest, { params }: { params: Promise<{ subjectId: string; purpose: string }> }) {
  try {
    const tenantId = getTenantId(request)
    const { subjectId, purpose } = await params
    const consent = await getRepository().getConsent(tenantId, subjectId, purpose)
    if (!consent) throw new GroCoreError('CONSENT_MISSING', `No consent for ${purpose}`)
    return ok(consent)
  } catch (e) { return handleError(e) }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ subjectId: string; purpose: string }> }) {
  try {
    const tenantId = getTenantId(request)
    const { subjectId, purpose } = await params
    const consent = await getRepository().getConsent(tenantId, subjectId, purpose)
    if (!consent) throw new GroCoreError('CONSENT_MISSING', `No consent for ${purpose}`)
    const revoked = revoke(consent)
    const saved = await getRepository().saveConsent(revoked)
    return ok(saved)
  } catch (e) { return handleError(e) }
}
