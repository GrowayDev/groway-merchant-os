import { NextRequest } from 'next/server'
import { getRepository, GroCoreError, issueVoucher } from '@/lib/grocore'
import { getTenantId, handleError, ok, parseMoney } from '../_helpers'

export async function GET(request: NextRequest) {
  try {
    const tenantId = getTenantId(request)
    const { searchParams } = new URL(request.url)
    const filter: any = {}
    const product = searchParams.get('product'); if (product) filter.product = product
    const status = searchParams.get('status'); if (status) filter.status = status
    const msisdn = searchParams.get('recipientMsisdn'); if (msisdn) filter.recipientMsisdn = msisdn
    const vouchers = await getRepository().listVouchers(tenantId, Object.keys(filter).length > 0 ? filter : undefined)
    return ok({ items: vouchers, count: vouchers.length })
  } catch (e) { return handleError(e) }
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = getTenantId(request)
    const body = await request.json()
    if (!body.product) throw new GroCoreError('VALIDATION_ERROR', 'product is required')
    if (!body.supplier) throw new GroCoreError('VALIDATION_ERROR', 'supplier is required')
    if (!body.faceValue) throw new GroCoreError('VALIDATION_ERROR', 'faceValue is required')
    if (!body.cost) throw new GroCoreError('VALIDATION_ERROR', 'cost is required')
    const faceValue = parseMoney(body.faceValue)
    const cost = parseMoney(body.cost)
    const voucher = issueVoucher({
      tenantId, product: body.product, supplier: body.supplier,
      faceValue: { cents: faceValue.cents, currency: faceValue.currency as any },
      cost: { cents: cost.cents, currency: cost.currency as any },
      recipientMsisdn: body.recipientMsisdn, meterNumber: body.meterNumber,
      deliveryMethod: body.deliveryMethod || 'direct_recharge',
      advanceId: body.advanceId,
    })
    const saved = await getRepository().saveVoucher(voucher)
    return ok(saved, 201)
  } catch (e) { return handleError(e) }
}
