import { NextRequest } from 'next/server'
import { orchestrator, MobileMoneyProvider } from '@/lib/consumer-wallet/mobile-money-orchestrator'

// POST /api/consumer/mobile-money/webhook/:provider
export async function POST(request: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  try {
    const { provider } = await params
    const body = await request.json()
    orchestrator.processWebhook(provider as MobileMoneyProvider, body)
    return new Response(JSON.stringify({ received: true }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  } catch {
    return new Response(JSON.stringify({ received: true }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  }
}
