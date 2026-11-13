import { Money, money, lte, gte, min as minMoney } from './currency'
import { GroCoreError } from './errors'
export type DecisionOutcome = 'approve' | 'refer' | 'decline'
export type ProductCode = 'grocredit' | 'topup_airtime' | 'topup_data' | 'topup_electricity' | 'merchant_float' | 'device_finance' | 'ewa'
export interface DecisionFeatures { tenureDays: number; averageMonthlySpend: Money; activeMonths: number; identityVerified: boolean; onBlocklist: boolean; arrears?: Money; hasOpenAdvance: boolean; netMonthlyIncome?: Money; monthlyObligations?: Money }
export interface DecisionPolicy { policyVersion: string; modelVersion: string; product: ProductCode; minTenureDays: number; minActiveMonths: number; minSpendPerMonth: Money; limitAsShareOfSpend: number; hardCap: Money; maxAffordabilityRatio: number; minRetainedIncome?: Money }
export interface DecisionTrace { policyVersion: string; modelVersion: string; steps: Array<{ step: string; passed: boolean; reason?: string }> }
export interface DecisionResult { outcome: DecisionOutcome; approvedLimit: Money; reasonCodes: string[]; counterfactual?: string; trace: DecisionTrace }
export function decide(features: DecisionFeatures, policy: DecisionPolicy, requestedAmount: Money): DecisionResult {
  const trace: DecisionTrace['steps'] = []; const reasonCodes: string[] = []
  const identityOk = features.identityVerified; trace.push({ step: 'identity_check', passed: identityOk, reason: identityOk ? undefined : 'identity_not_verified' }); if (!identityOk) reasonCodes.push('IDENTITY_NOT_VERIFIED')
  const notBlocked = !features.onBlocklist; trace.push({ step: 'blocklist_check', passed: notBlocked, reason: notBlocked ? undefined : 'on_blocklist' }); if (!notBlocked) reasonCodes.push('ON_BLOCKLIST')
  const tenureOk = features.tenureDays >= policy.minTenureDays; trace.push({ step: 'tenure_check', passed: tenureOk }); if (!tenureOk) reasonCodes.push('INSUFFICIENT_TENURE')
  const activeOk = features.activeMonths >= policy.minActiveMonths; trace.push({ step: 'active_months_check', passed: activeOk }); if (!activeOk) reasonCodes.push('INSUFFICIENT_ACTIVITY')
  const spendOk = gte(features.averageMonthlySpend, policy.minSpendPerMonth); trace.push({ step: 'min_spend_check', passed: spendOk }); if (!spendOk) reasonCodes.push('BELOW_MIN_SPEND')
  const noOpenAdvance = !features.hasOpenAdvance; trace.push({ step: 'open_advance_check', passed: noOpenAdvance }); if (!noOpenAdvance) reasonCodes.push('OPEN_ADVANCE_EXISTS')
  const noArrears = !features.arrears || features.arrears.cents === 0n; trace.push({ step: 'arrears_check', passed: noArrears }); if (!noArrears) reasonCodes.push('HAS_ARREARS')
  if ([identityOk, notBlocked, tenureOk, activeOk, spendOk, noOpenAdvance, noArrears].some(v => !v)) {
    return { outcome: 'decline', approvedLimit: money(0n, requestedAmount.currency), reasonCodes, counterfactual: 'Re-apply once conditions are met.', trace: { policyVersion: policy.policyVersion, modelVersion: policy.modelVersion, steps: trace } }
  }
  let affordabilityOk = true
  if (features.netMonthlyIncome && features.monthlyObligations) {
    const proposedRatio = Number(features.monthlyObligations.cents + requestedAmount.cents) / Number(features.netMonthlyIncome.cents)
    affordabilityOk = proposedRatio <= policy.maxAffordabilityRatio; trace.push({ step: 'affordability_check', passed: affordabilityOk }); if (!affordabilityOk) reasonCodes.push('AFFORDABILITY_FAIL')
  } else { trace.push({ step: 'affordability_check', passed: false, reason: 'missing_income' }); reasonCodes.push('AFFORDABILITY_MISSING'); return { outcome: 'refer', approvedLimit: money(0n, requestedAmount.currency), reasonCodes, trace: { policyVersion: policy.policyVersion, modelVersion: policy.modelVersion, steps: trace } } }
  if (!affordabilityOk) return { outcome: 'decline', approvedLimit: money(0n, requestedAmount.currency), reasonCodes, trace: { policyVersion: policy.policyVersion, modelVersion: policy.modelVersion, steps: trace } }
  const shareLimit = money((features.averageMonthlySpend.cents * BigInt(Math.round(policy.limitAsShareOfSpend * 1000))) / 1000n, requestedAmount.currency)
  const approvedLimit = minMoney(minMoney(shareLimit, policy.hardCap), requestedAmount)
  if (approvedLimit.cents === 0n) return { outcome: 'decline', approvedLimit: money(0n, requestedAmount.currency), reasonCodes: ['ZERO_LIMIT'], trace: { policyVersion: policy.policyVersion, modelVersion: policy.modelVersion, steps: trace } }
  return { outcome: 'approve', approvedLimit, reasonCodes: ['APPROVED'], trace: { policyVersion: policy.policyVersion, modelVersion: policy.modelVersion, steps: trace } }
}
export function requireApproval(result: DecisionResult): DecisionResult { if (result.outcome !== 'approve') throw new GroCoreError(result.outcome === 'decline' ? 'DECISION_DECLINE' : 'DECISION_REFER', `Decision was ${result.outcome}: ${result.reasonCodes.join(', ')}`); return result }
