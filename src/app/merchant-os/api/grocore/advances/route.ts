import { NextRequest } from 'next/server'
import { randomUUID } from 'crypto'
import { getRepository, GroCoreError, issueAdvance, PRESETS, money } from '@/lib/grocore'
import { getTenantId, handleError, ok, parseMoney } from '../_helpers'

export async function GET(request: NextRequest) {
  try {
    const tenantId = getTenantId(request)
    const { searchParams } = new URL(request.url)
    const subjectId = searchParams.get('subjectId') || undefined
    const advances = await getRepository().listAdvances(tenantId, subjectId)
    return ok({ items: advances, count: advances.length })
  } catch (e) { return handleError(e) }
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = getTenantId(request)
    const body = await request.json()
    if (!body.productCode) throw new GroCoreError('VALIDATION_ERROR', 'productCode is required')
    if (!body.subjectId) throw new GroCoreError('VALIDATION_ERROR', 'subjectId is required')
    if (!body.amount) throw new GroCoreError('VALIDATION_ERROR', 'amount is required')
    if (!body.eligibility) throw new GroCoreError('VALIDATION_ERROR', 'eligibility is required')
    const product = PRESETS[body.productCode]
    if (!product) throw new GroCoreError('VALIDATION_ERROR', `Unknown product: ${body.productCode}`)
    const amount = parseMoney(body.amount)
    const advance = issueAdvance({
      id: `adv-${randomUUID()}`, tenantId, subjectId: body.subjectId, product,
      amount: { cents: amount.cents, currency: amount.currency as any },
      eligibility: {
        tenureDays: body.eligibility.tenureDays || 0,
        activeMonths: body.eligibility.activeMonths || 0,
        averageMonthlySpend: parseMoney(body.eligibility.averageMonthlySpend || { cents: '0', currency: amount.currency }),
        hasOpenAdvance: body.eligibility.hasOpenAdvance || false,
      },
      deliveryMethod: body.deliveryMethod || 'direct_recharge',
      voucherSerial: body.voucherSerial,
      decisionId: body.decisionId,
    })
    const saved = await getRepository().saveAdvance(advance)
    return ok(saved, 201)
  } catch (e) { return handleError(e) }
}
