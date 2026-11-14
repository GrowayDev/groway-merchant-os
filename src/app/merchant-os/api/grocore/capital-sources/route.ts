import { NextRequest } from 'next/server'
import { randomUUID } from 'crypto'
import { getRepository, GroCoreError, CapitalSource } from '@/lib/grocore'
import { getTenantId, handleError, ok, parseMoney } from '../_helpers'

export async function GET(request: NextRequest) {
  try {
    const tenantId = getTenantId(request)
    const sources = await getRepository().listCapitalSources(tenantId)
    return ok({ items: sources, count: sources.length })
  } catch (e) { return handleError(e) }
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = getTenantId(request)
    const body = await request.json()
    if (!body.name) throw new GroCoreError('VALIDATION_ERROR', 'name is required')
    if (!body.type) throw new GroCoreError('VALIDATION_ERROR', 'type is required')
    if (!body.currency) throw new GroCoreError('VALIDATION_ERROR', 'currency is required')
    if (!body.committed) throw new GroCoreError('VALIDATION_ERROR', 'committed amount is required')
    const committed = parseMoney(body.committed)
    const source: CapitalSource = {
      id: body.id || `cap-${randomUUID()}`,
      tenantId,
      name: body.name,
      type: body.type,
      currency: body.currency,
      committed: { cents: committed.cents, currency: committed.currency as any },
      deployed: { cents: BigInt(0), currency: committed.currency as any },
      costRateBps: body.costRateBps || 0,
      status: body.status || 'active',
      startDate: body.startDate ? new Date(body.startDate) : new Date(),
      endDate: body.endDate ? new Date(body.endDate) : null,
    }
    const saved = await getRepository().saveCapitalSource(source)
    return ok(saved, 201)
  } catch (e) { return handleError(e) }
}
