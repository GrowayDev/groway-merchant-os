import { NextRequest } from 'next/server'
import { getRepository } from '@/lib/grocore/repository'
import { GroCoreError } from '@/lib/grocore/errors'
import {
  getTenantId,
  handleError,
  ok,
} from '@/app/merchant-os/api/grocore/_helpers'

// GET /merchant-os/api/grocore/accounts/[code] - fetch a single account by code
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  try {
    const tenantId = getTenantId(request)
    const { code } = await params
    const repo = getRepository()
    const account = await repo.getAccountByCode(tenantId, code)
    if (!account) {
      throw new GroCoreError(
        'NOT_FOUND',
        `Account ${code} not found in tenant ${tenantId}`,
        { code, tenantId },
      )
    }
    return ok(account)
  } catch (e) {
    return handleError(e)
  }
}
