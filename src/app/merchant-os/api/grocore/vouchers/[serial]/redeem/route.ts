import { NextRequest } from 'next/server'
import { getRepository, GroCoreError, redeemVoucher } from '@/lib/grocore'
import { getTenantId, handleError, ok } from '../../../_helpers'

export async function POST(request: NextRequest, { params }: { params: Promise<{ serial: string }> }) {
  try {
    const tenantId = getTenantId(request)
    const { serial } = await params
    const voucher = await getRepository().getVoucher(tenantId, serial)
    if (!voucher) throw new GroCoreError('VOUCHER_NOT_FOUND', `Voucher ${serial} not found`)
    const redeemed = redeemVoucher(voucher)
    const saved = await getRepository().saveVoucher(redeemed)
    return ok(saved)
  } catch (e) { return handleError(e) }
}
