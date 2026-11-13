import { NextRequest } from 'next/server'
import { randomUUID } from 'crypto'
import { getRepository, GroCoreError, captureCurrency } from '@/lib/grocore'
import { getTenantId, handleError, ok, parseMoney } from '../../_helpers'

export async function GET(request: NextRequest) {
  try {
    const tenantId = getTenantId(request)
    const { searchParams } = new URL(request.url)
    const merchantId = searchParams.get('merchantId') || undefined
    const captures = await getRepository().listGoPayCaptures(tenantId, merchantId)
    return ok({ items: captures, count: captures.length })
  } catch (e) { return handleError(e) }
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = getTenantId(request)
    const body = await request.json()
    if (!body.merchantId) throw new GroCoreError('VALIDATION_ERROR', 'merchantId is required')
    if (!body.captureId) throw new GroCoreError('VALIDATION_ERROR', 'captureId is required')
    if (!body.amount) throw new GroCoreError('VALIDATION_ERROR', 'amount is required')
    const amount = parseMoney(body.amount)
    const fee = parseMoney(body.fee || { cents: '0', currency: amount.currency })
    const capture = {
      id: `cap-${randomUUID()}`, tenantId, merchantId: body.merchantId, captureId: body.captureId,
      amount: { cents: amount.cents, currency: amount.currency as any },
      fee: { cents: fee.cents, currency: fee.currency as any },
      paymentMethod: body.paymentMethod || 'qr', status: 'captured' as const,
      settlementId: null, liveMode: body.liveMode ?? false, createdAt: new Date(),
    }
    const saved = await getRepository().saveGoPayCapture(capture)
    return ok(saved, 201)
  } catch (e) { return handleError(e) }
}
