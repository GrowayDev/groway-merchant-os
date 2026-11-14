import { NextRequest } from 'next/server'
import { getRepository } from '@/lib/grocore/repository'
import { GroCoreError } from '@/lib/grocore/errors'
import {
  getTenantId,
  handleError,
  ok,
} from '@/app/merchant-os/api/grocore/_helpers'

// GET /merchant-os/api/grocore/entries/[entryId] - fetch a single entry (with lines)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ entryId: string }> },
) {
  try {
    const tenantId = getTenantId(request)
    const { entryId } = await params
    const repo = getRepository()
    const entry = await repo.getEntry(tenantId, entryId)
    if (!entry) {
      throw new GroCoreError(
        'NOT_FOUND',
        `Entry ${entryId} not found in tenant ${tenantId}`,
        { entryId, tenantId },
      )
    }
    return ok(entry)
  } catch (e) {
    return handleError(e)
  }
}
