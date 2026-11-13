import { NextRequest } from 'next/server'
import { getRepository, GroCoreError, recover, PRESETS } from '@/lib/grocore'
import { getTenantId, handleError, ok, parseMoney } from '../../../_helpers'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const tenantId = getTenantId(request)
    const { id } = await params
    const body = await request.json()
    const advance = await getRepository().getAdvance(tenantId, id)
    if (!advance) throw new GroCoreError('ADVANCE_NOT_FOUND', `Advance ${id} not found`)
    const product = PRESETS[advance.product]
    if (!product) throw new GroCoreError('VALIDATION_ERROR', `Unknown product: ${advance.product}`)
    const topupAmount = parseMoney(body.topupAmount)
    const result = recover(advance, product, {
      topupAmount: { cents: topupAmount.cents, currency: topupAmount.currency as any },
      idempotencyKey: body.idempotencyKey || `rec-${Date.now()}`,
      source: body.source || 'topup_event',
    })
    await getRepository().saveAdvance(result.advance)
    return ok(result)
  } catch (e) { return handleError(e) }
}
