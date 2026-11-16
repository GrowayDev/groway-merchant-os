import { NextRequest } from 'next/server'
import { ok, error } from '../../_lib/helpers'
import { orchestrator } from '@/lib/consumer-wallet/mobile-money-orchestrator'

// GET /api/consumer/mobile-money/status?providerTransactionId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const providerTxId = searchParams.get('providerTransactionId')
    if (!providerTxId) return error('providerTransactionId is required', 400)

    const status = await orchestrator.getStatus(providerTxId)
    return ok({ status, providerTransactionId: providerTxId })
  } catch (e: any) {
    return error(e.message, 500)
  }
}
