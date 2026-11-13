import { NextRequest } from 'next/server'
import { getRepository, GroCoreError, decide, money, DecisionPolicy, DecisionFeatures } from '@/lib/grocore'
import { getTenantId, handleError, ok, parseMoney } from '../_helpers'

export async function GET(request: NextRequest) {
  try {
    const tenantId = getTenantId(request)
    const { searchParams } = new URL(request.url)
    const subjectId = searchParams.get('subjectId') || undefined
    const decisions = await getRepository().listDecisions(tenantId, subjectId)
    return ok({ items: decisions, count: decisions.length })
  } catch (e) { return handleError(e) }
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = getTenantId(request)
    const body = await request.json()
    if (!body.features) throw new GroCoreError('VALIDATION_ERROR', 'features is required')
    if (!body.policy) throw new GroCoreError('VALIDATION_ERROR', 'policy is required')
    if (!body.requestedAmount) throw new GroCoreError('VALIDATION_ERROR', 'requestedAmount is required')
    const f = body.features
    const p = body.policy
    const requestedAmount = parseMoney(body.requestedAmount)
    const features: DecisionFeatures = {
      tenureDays: f.tenureDays || 0, activeMonths: f.activeMonths || 0,
      averageMonthlySpend: parseMoney(f.averageMonthlySpend || { cents: '0', currency: requestedAmount.currency }),
      identityVerified: f.identityVerified ?? false, onBlocklist: f.onBlocklist ?? false,
      arrears: f.arrears ? parseMoney(f.arrears) : undefined, hasOpenAdvance: f.hasOpenAdvance ?? false,
      netMonthlyIncome: f.netMonthlyIncome ? parseMoney(f.netMonthlyIncome) : undefined,
      monthlyObligations: f.monthlyObligations ? parseMoney(f.monthlyObligations) : undefined,
    }
    const policy: DecisionPolicy = {
      policyVersion: p.policyVersion || 'v1', modelVersion: p.modelVersion || 'v1',
      product: p.product || 'grocredit', minTenureDays: p.minTenureDays || 90,
      minActiveMonths: p.minActiveMonths || 3,
      minSpendPerMonth: parseMoney(p.minSpendPerMonth || { cents: '2900', currency: requestedAmount.currency }),
      limitAsShareOfSpend: p.limitAsShareOfSpend ?? 0.3,
      hardCap: parseMoney(p.hardCap || { cents: '500000', currency: requestedAmount.currency }),
      maxAffordabilityRatio: p.maxAffordabilityRatio ?? 0.45,
      minRetainedIncome: p.minRetainedIncome ? parseMoney(p.minRetainedIncome) : undefined,
    }
    const result = decide(features, policy, { cents: requestedAmount.cents, currency: requestedAmount.currency as any })
    const saved = await getRepository().saveDecision({
      tenantId, subjectId: body.subjectId || 'unknown', subjectType: body.subjectType || 'customer',
      product: policy.product, amountCents: requestedAmount.cents, currency: requestedAmount.currency,
      outcome: result.outcome, approvedLimitCents: result.approvedLimit.cents,
      reasonCodes: result.reasonCodes, counterfactual: result.counterfactual ?? null,
      traceJson: JSON.stringify(result.trace), policyVersion: policy.policyVersion, modelVersion: policy.modelVersion,
    })
    return ok({ ...result, id: saved.id }, 201)
  } catch (e) { return handleError(e) }
}
