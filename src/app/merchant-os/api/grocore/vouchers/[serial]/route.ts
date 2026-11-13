import { NextRequest } from 'next/server'
import { getRepository, GroCoreError } from '@/lib/grocore'
import { getTenantId, handleError, ok } from '../../_helpers'

export async function GET(request: NextRequest, { params }: { params: Promise<{ serial: string }> }) {
  try {
    const tenantId = getTenantId(request)
    const { serial } = await params
    const voucher = await getRepository().getVoucher(tenantId, serial)
    if (!voucher) throw new GroCoreError('VOUCHER_NOT_FOUND', `Voucher ${serial} not found`)
    return ok(voucher)
  } catch (e) { return handleError(e) }
}
