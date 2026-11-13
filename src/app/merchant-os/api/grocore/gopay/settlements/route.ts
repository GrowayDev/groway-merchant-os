import { NextRequest } from 'next/server'
import { getRepository, GroCoreError, aggregateSettlement } from '@/lib/grocore'
import { getTenantId, handleError, ok } from '../../_helpers'

export async function GET(request: NextRequest) {
  try {
    const tenantId = getTenantId(request)
    const { searchParams } = new URL(request.url)
    const merchantId = searchParams.get('merchantId') || undefined
    const settlements = await getRepository().listGoPaySettlements(tenantId, merchantId)
    return ok({ items: settlements, count: settlements.length })
  } catch (e) { return handleError(e) }
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = getTenantId(request)
    const body = await request.json()
    if (!body.captureIds || !Array.isArray(body.captureIds)) throw new GroCoreError('VALIDATION_ERROR', 'captureIds array is required')
    const allCaptures = await getRepository().listGoPayCaptures(tenantId)
    const captures = allCaptures.filter(c => body.captureIds.includes(c.captureId))
    if (captures.length === 0) throw new GroCoreError('VALIDATION_ERROR', 'No matching captures found')
    const settlement = aggregateSettlement(tenantId, captures[0].merchantId, captures)
    const saved = await getRepository().saveGoPaySettlement(settlement)
    return ok(saved, 201)
  } catch (e) { return handleError(e) }
}
