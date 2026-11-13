import { NextRequest } from 'next/server'
import { getRepository, GroCoreError } from '@/lib/grocore'
import { getTenantId, handleError, ok } from '../../_helpers'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const tenantId = getTenantId(request)
    const { id } = await params
    const advance = await getRepository().getAdvance(tenantId, id)
    if (!advance) throw new GroCoreError('ADVANCE_NOT_FOUND', `Advance ${id} not found`)
    return ok(advance)
  } catch (e) { return handleError(e) }
}
