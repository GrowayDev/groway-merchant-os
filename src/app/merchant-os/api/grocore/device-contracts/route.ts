import { NextRequest } from 'next/server'
import { randomUUID } from 'crypto'
import { getRepository, GroCoreError, createContract, DeviceProduct } from '@/lib/grocore'
import { getTenantId, handleError, ok, parseMoney } from '../_helpers'

const DEVICE_PRODUCTS: Record<string, DeviceProduct> = {
  solar_kit: { id: 'solar_kit', name: 'Solar Home System', currency: 'ZAR', principal: { cents: 350000n, currency: 'ZAR' }, dailyPayment: { cents: 3500n, currency: 'ZAR' }, totalDays: 180, graceDays: 14 },
  phone: { id: 'phone', name: 'Smartphone', currency: 'ZAR', principal: { cents: 250000n, currency: 'ZAR' }, dailyPayment: { cents: 2500n, currency: 'ZAR' }, totalDays: 120, graceDays: 7 },
  fridge: { id: 'fridge', name: 'Refrigerator', currency: 'ZAR', principal: { cents: 500000n, currency: 'ZAR' }, dailyPayment: { cents: 5000n, currency: 'ZAR' }, totalDays: 120, graceDays: 14 },
}

export async function GET(request: NextRequest) {
  try {
    const tenantId = getTenantId(request)
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId') || undefined
    const contracts = await getRepository().listDeviceContracts(tenantId, customerId)
    return ok({ items: contracts, count: contracts.length })
  } catch (e) { return handleError(e) }
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = getTenantId(request)
    const body = await request.json()
    if (!body.customerId) throw new GroCoreError('VALIDATION_ERROR', 'customerId is required')
    if (!body.productId) throw new GroCoreError('VALIDATION_ERROR', 'productId is required')
    if (!body.deviceName) throw new GroCoreError('VALIDATION_ERROR', 'deviceName is required')
    const product = DEVICE_PRODUCTS[body.productId]
    if (!product) throw new GroCoreError('VALIDATION_ERROR', `Unknown product: ${body.productId}`)
    const contract = createContract({ id: `dev-${randomUUID()}`, tenantId, customerId: body.customerId, product, deviceName: body.deviceName, deviceImei: body.deviceImei })
    const saved = await getRepository().saveDeviceContract(contract)
    return ok(saved, 201)
  } catch (e) { return handleError(e) }
}
