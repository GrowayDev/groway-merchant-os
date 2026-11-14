import { NextRequest, NextResponse } from 'next/server'
import { getMerchantIdWithDevFallback } from '@/lib/auth-context'
import { ConsentService } from '@/lib/grocore/consent/consent'
import { DecisionOrchestrator, Policy, FeatureStore } from '@/lib/grocore/decisioning/orchestrator'
const consent = new ConsentService()
const policy: Policy = { version: '1.0.0', modelVersion: '1.0.0', minTenureDays: 30, minLimit: 50000n, maxLimit: 5000000n, limitShareOfSalesBps: 2000 }
const features: FeatureStore = { async get() { return { sales_30d_minor: 15000000n, tenure_days: 45, arrears_minor: 0n, kyc_verified: 1 } as any } }
const orch = new DecisionOrchestrator(consent, features, policy)
export async function POST(request: NextRequest) {
  try { const t = await getMerchantIdWithDevFallback(request); if (!t) return NextResponse.json({ success: false, error: 'Auth required' }, { status: 401 })
    const { subject } = await request.json()
    const d = await orch.decide(subject || t)
    const fmt = (c: bigint) => { const n = c < 0n; const a = n ? -c : c; const w = (a / 100n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','); return `${n ? '-' : ''}R${w}.${(a % 100n).toString().padStart(2, '0')}` }
    return NextResponse.json({ success: true, data: { subject: subject || t, outcome: d.outcome, limitMinor: d.limit.toString(), limitDisplay: fmt(d.limit), reasonCodes: d.reasonCodes, explanation: d.explanation, counterfactual: d.counterfactual, trace: d.trace, versions: d.versions } })
  } catch (e) { return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 }) }
}
