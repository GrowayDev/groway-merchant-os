import { NextRequest } from 'next/server'
import { ok, error, getUserId } from '../../_lib/helpers'
import { orchestrator, PROVIDERS, detectProvider, normalizeMsisdn, DepositRequest } from '@/lib/consumer-wallet/mobile-money-orchestrator'

// GET /api/consumer/mobile-money/providers — list available providers
export async function GET(request: NextRequest) {
  const providers = Object.values(PROVIDERS).filter(p => p.enabled)
  return ok({ providers })
}

// POST /api/consumer/mobile-money/deposit — initiate a deposit (top-up)
export async function POST(request: NextRequest) {
  try {
    const userId = getUserId(request)
    const body = await request.json()

    if (!body.msisdn) return error('Phone number is required', 400)
    if (!body.amount) return error('Amount is required', 400)

    const msisdn = normalizeMsisdn(body.msisdn)
    const amount = Number(body.amount)

    // Detect provider from phone number, or use the one provided
    let provider = body.provider as string
    if (!provider) {
      const detected = detectProvider(msisdn)
      if (!detected) return error('Could not detect provider from phone number. Please select a provider manually.', 400)
      provider = detected
    }

    const providerInfo = PROVIDERS[provider as keyof typeof PROVIDERS]
    if (!providerInfo?.enabled) return error(`Provider ${provider} is not available`, 400)

    if (amount < providerInfo.minAmount) return error(`Minimum amount is ${providerInfo.minAmount} ${providerInfo.currency}`, 400)
    if (amount > providerInfo.maxAmount) return error(`Maximum amount is ${providerInfo.maxAmount} ${providerInfo.currency}`, 400)

    const idempotencyKey = `mm-deposit-${userId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const reference = `GROWAY-DEP-${Date.now()}`

    const req: DepositRequest = {
      idempotencyKey,
      provider: provider as any,
      amount,
      currency: providerInfo.currency,
      msisdn,
      reference,
      description: body.description || 'Groway wallet top-up',
    }

    const result = await orchestrator.deposit(req)

    return ok({
      success: true,
      data: {
        ...result,
        providerName: providerInfo.name,
        providerLogo: providerInfo.logo,
        fee: result.fee,
        netAmount: amount - (result.fee || 0),
        instruction: `Check your phone for a ${providerInfo.name} prompt. Dial ${providerInfo.ussdCode} if you don't receive it.`,
        idempotencyKey,
        reference,
      },
    })
  } catch (e: any) {
    return error(e.message || 'Failed to initiate deposit', 500)
  }
}
