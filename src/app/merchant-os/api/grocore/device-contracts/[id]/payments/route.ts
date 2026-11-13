import { NextRequest } from 'next/server'
import { getRepository, GroCoreError, applyPayment } from '@/lib/grocore'
import { getTenantId, handleError, ok, parseMoney } from '../../../_helpers'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const tenantId = getTenantId(request)
    const { id } = await params
    const body = await request.json()
    const contract = await getRepository().getDeviceContract(tenantId, id)
    if (!contract) throw new GroCoreError('DEVICE_CONTRACT_NOT_FOUND', `Contract ${id} not found`)
    const amount = parseMoney(body.amount || { cents: contract.dailyPayment.cents.toString(), currency: contract.currency })
    const result = applyPayment(contract, {
      idempotencyKey: body.idempotencyKey || `pay-${Date.now()}`,
      amount: { cents: amount.cents, currency: amount.currency as any },
    })
    await getRepository().saveDeviceContract(result.contract)
    return ok(result)
  } catch (e) { return handleError(e) }
}
