import { NextRequest } from 'next/server'
import { getRepository } from '@/lib/grocore/repository'
import { GroCoreError } from '@/lib/grocore/errors'
import {
  getTenantId,
  handleError,
  ok,
} from '@/app/merchant-os/api/grocore/_helpers'

// GET /merchant-os/api/grocore/device-contracts/[id] - fetch a single device contract with payments
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const tenantId = getTenantId(request)
    const { id } = await params
    const repo = getRepository()
    const contract = await repo.getDeviceContract(tenantId, id)
    if (!contract) {
      throw new GroCoreError('DEVICE_CONTRACT_NOT_FOUND', `Contract ${id} not found`, { id })
    }
    return ok(contract)
  } catch (e) {
    return handleError(e)
  }
}
