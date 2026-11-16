import { NextRequest } from 'next/server'
import { ok, error, getUserId } from '../../_lib/helpers'
import { orchestrator, PROVIDERS, detectProvider, normalizeMsisdn, PayoutRequest } from '@/lib/consumer-wallet/mobile-money-orchestrator'

// POST /api/consumer/mobile-money/payout — initiate a payout (withdrawal)
export async function POST(request: NextRequest) {
  try {
    const userId = getUserId(request)
    const body = await request.json()

    if (!body.msisdn) return error('Phone number is required', 400)
    if (!body.amount) return error('Amount is required', 400)

    const msisdn = normalizeMsisdn(body.msisdn)
    const amount = Number(body.amount)

    let provider = body.provider as string
    if (!provider) {
      const detected = detectProvider(msisdn)
      if (!detected) return error('Could not detect provider from phone number', 400)
      provider = detected
    }

    const providerInfo = PROVIDERS[provider as keyof typeof PROVIDERS]
    if (!providerInfo?.enabled) return error(`Provider ${provider} is not available`, 400)

    if (amount < providerInfo.minAmount) return error(`Minimum amount is ${providerInfo.minAmount} ${providerInfo.currency}`, 400)
    if (amount > providerInfo.maxAmount) return error(`Maximum amount is ${providerInfo.maxAmount} ${providerInfo.currency}`, 400)

    const idempotencyKey = `mm-payout-${userId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const reference = `GROWAY-PAY-${Date.now()}`

    const req: PayoutRequest = {
      idempotencyKey,
      provider: provider as any,
      amount,
      currency: providerInfo.currency,
      msisdn,
      reference,
    }

    const result = await orchestrator.payout(req)

    return ok({
      success: true,
      data: {
        ...result,
        providerName: providerInfo.name,
        providerLogo: providerInfo.logo,
        fee: result.fee,
        netAmount: amount - (result.fee || 0),
        instruction: `Payout initiated to ${msisdn} via ${providerInfo.name}. Funds will arrive within ${providerInfo.averageSettlementTime}.`,
        idempotencyKey,
        reference,
      },
    })
  } catch (e: any) {
    return error(e.message || 'Failed to initiate payout', 500)
  }
}
