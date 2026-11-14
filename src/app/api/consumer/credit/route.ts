import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getUserId, ok, error, serialize } from '../_lib/helpers'
import { LOAN_PURPOSES, EMPLOYMENT_STATUSES, INCOME_BANDS, LOAN_TYPES, DEBT_COUNSELLING_PROVIDERS, generateCaseRef } from '@/lib/consumer-wallet/catalog'

// GET /api/consumer/credit/catalog — return all dropdown data
export async function GET(request: NextRequest) {
  return ok({
    loanTypes: LOAN_TYPES,
    loanPurposes: LOAN_PURPOSES,
    employmentStatuses: EMPLOYMENT_STATUSES,
    incomeBands: INCOME_BANDS,
    debtCounsellingProviders: DEBT_COUNSELLING_PROVIDERS,
  })
}

// POST /api/consumer/credit/applications — submit a loan application
export async function POST(request: NextRequest) {
  try {
    const userId = getUserId(request)
    const body = await request.json()

    // Validate required fields
    if (!body.loanType) return error('Loan type is required', 400)
    if (!body.purpose) return error('Purpose is required', 400)
    if (!body.amount) return error('Amount is required', 400)
    if (!body.term) return error('Term is required', 400)
    if (!body.employmentStatus) return error('Employment status is required', 400)

    // Generate case reference
    const caseRef = generateCaseRef('LOAN')

    // Calculate qualifying intelligence
    const amount = Number(body.amount)
    const term = Number(body.term)
    const monthlyIncome = Number(body.monthlyIncome || 0)
    const employmentStatus = body.employmentStatus

    // Qualifying criteria checks
    interface Check { check: string; passed: boolean; reason?: string; score?: number; ratio?: string }
    const checks: Check[] = []
    const empData = EMPLOYMENT_STATUSES.find(e => e.value === employmentStatus)
    if (empData && monthlyIncome < empData.minIncome) {
      checks.push({ check: 'income_vs_employment', passed: false, reason: `Income below minimum for ${empData.label}` })
    } else {
      checks.push({ check: 'income_vs_employment', passed: true })
    }

    // Affordability check (monthly instalment should be < 30% of income)
    const estimatedInterestRate = 24 // 24% annual
    const monthlyInstalment = Math.round((amount * (1 + estimatedInterestRate / 100 * term / 12)) / term)
    const affordabilityRatio = monthlyIncome > 0 ? monthlyInstalment / monthlyIncome : 1
    const affordabilityPassed = affordabilityRatio <= 0.3
    checks.push({ check: 'affordability', passed: affordabilityPassed, reason: affordabilityPassed ? undefined : `Instalment ${monthlyInstalment} exceeds 30% of income`, ratio: affordabilityRatio.toFixed(2) })

    // Credit score check (mock — in production would pull from bureau)
    const creditScore = body.creditScore || 650
    const creditScorePassed = creditScore >= 550
    checks.push({ check: 'credit_score', passed: creditScorePassed, score: creditScore, reason: creditScorePassed ? undefined : `Score ${creditScore} below 550 threshold` })

    // NCA affordability assessment
    const ncaPassed = affordabilityPassed && creditScorePassed
    checks.push({ check: 'nca_affordability', passed: ncaPassed, reason: ncaPassed ? 'NCA affordability assessment passed' : 'NCA affordability assessment failed' })

    // Determine pre-qualification outcome
    const allPassed = checks.every(c => c.passed)
    const preQualified = allPassed && ncaPassed
    const qualifiedAmount = preQualified ? Math.min(amount, monthlyIncome * 3) : 0

    // GroAI pre-qualification insight
    let groaiInsight = ''
    if (preQualified) {
      groaiInsight = `✅ You are pre-qualified! Based on your income of R${monthlyIncome}/month and credit score of ${creditScore}, you qualify for up to R${qualifiedAmount}. Your estimated monthly instalment is R${monthlyInstalment} at ${estimatedInterestRate}% interest over ${term} months. The instalment represents ${(affordabilityRatio * 100).toFixed(1)}% of your income, which is within the NCA affordability threshold of 30%.`
    } else {
      const failedChecks = checks.filter(c => !c.passed).map(c => c.reason || c.check)
      groaiInsight = `⚠️ Pre-qualification not met. Issues: ${failedChecks.join('; ')}. Consider reducing the loan amount, increasing the term, or improving your credit score. If you are struggling with debt, speak to one of our NCR-registered debt counsellors — they can help restructure your debt under the National Credit Act.`
    }

    // Create the application in the database
    const application = await db.consumerLoanApplication.create({
      data: {
        id: `loan-app-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        userId,
        lenderId: body.provider || 'grocredit',
        lenderName: body.provider || 'grocredit',
        amount: amount,
        term: term,
        loanType: body.loanType,
        purpose: body.purpose,
        status: 'pending',
        updatedAt: new Date(),
      },
    }).catch(() => null)

    // Store full application details as a transaction
    let transaction: any = null
    try {
      transaction = await db.consumerTransaction.create({
        data: {
          id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          userId,
          idempotencyKey: caseRef,
          transactionType: 'loan_application',
          direction: 'none',
          amountCents: BigInt(Math.round(amount * 100)),
          feeCents: BigInt(0),
          netAmountCents: BigInt(0),
          status: 'pending',
          paymentMethod: 'internal',
          description: `Loan: ${body.loanType} - ${body.purpose} - ${caseRef} - PreQualified: ${preQualified} - Instalment: ${monthlyInstalment}`,
          reference: caseRef,
          counterpartyType: 'lender',
          counterpartyName: body.provider || 'grocredit',
          updatedAt: new Date(),
        },
      })
    } catch (e) {
      // Transaction creation is optional
    }

    return ok({
      success: true,
      caseRef,
      applicationId: application?.id || caseRef,
      status: 'pending',
        updatedAt: new Date(),
      preQualified,
      qualifiedAmount,
      estimatedInterestRate,
      monthlyInstalment,
      affordabilityRatio: affordabilityRatio.toFixed(4),
      checks,
      groaiInsight,
      debtCounsellingAvailable: !preQualified,
      debtCounsellingProviders: !preQualified ? DEBT_COUNSELLING_PROVIDERS : undefined,
      submittedAt: new Date().toISOString(),
    }, 201)
  } catch (e: any) {
    console.error('Credit application error:', e)
    return error(e.message || 'Failed to submit application', 500)
  }
}
