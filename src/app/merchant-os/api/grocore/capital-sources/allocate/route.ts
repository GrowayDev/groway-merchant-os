import { NextRequest } from 'next/server'
import { getRepository, allocateCapital, applyAllocations, summariseGrid } from '@/lib/grocore'
import { getTenantId, handleError, ok, parseMoney } from '../../_helpers'

export async function POST(request: NextRequest) {
  try {
    const tenantId = getTenantId(request)
    const body = await request.json()
    if (!body.amount) throw new Error('amount is required')
    const amount = parseMoney(body.amount)
    const sources = await getRepository().listCapitalSources(tenantId)
    const allocations = allocateCapital(sources, { cents: amount.cents, currency: amount.currency as any })
    const updated = applyAllocations(allocations)
    for (const [, source] of updated) { await getRepository().saveCapitalSource(source) }
    const summary = summariseGrid(Array.from(updated.values()))
    return ok({ allocations, summary })
  } catch (e) { return handleError(e) }
}
