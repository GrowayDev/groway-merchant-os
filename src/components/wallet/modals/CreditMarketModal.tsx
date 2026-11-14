'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Sparkles, CheckCircle2, AlertCircle, FileText, Phone, ExternalLink, ChevronRight } from 'lucide-react'
import { apiGet, apiPost, formatMoney } from '@/components/wallet/lib/api'

interface Props {
  open: boolean
  onClose: () => void
}

type Step = 'form' | 'submitting' | 'result' | 'debt_counselling'

export function CreditMarketModal({ open, onClose }: Props) {
  const [step, setStep] = useState<Step>('form')
  const [catalog, setCatalog] = useState<any>(null)
  const [error, setError] = useState('')
  const [result, setResult] = useState<any>(null)

  // Form fields
  const [loanType, setLoanType] = useState('personal')
  const [purpose, setPurpose] = useState('')
  const [amount, setAmount] = useState('')
  const [term, setTerm] = useState('12')
  const [employmentStatus, setEmploymentStatus] = useState('')
  const [incomeBand, setIncomeBand] = useState('')
  const [customIncome, setCustomIncome] = useState('')
  const [creditScore, setCreditScore] = useState('650')

  useEffect(() => {
    if (open && !catalog) {
      apiGet('/credit/catalog').then(setCatalog).catch(() => {})
    }
  }, [open])

  const selectedLoanType = catalog?.loanTypes?.find((t: any) => t.value === loanType)
  const selectedPurpose = catalog?.loanPurposes?.find((p: any) => p.value === purpose)
  const selectedEmployment = catalog?.employmentStatuses?.find((e: any) => e.value === employmentStatus)
  const selectedIncomeBand = catalog?.incomeBands?.find((b: any) => b.value === incomeBand)

  const actualIncome = incomeBand === 'custom' ? Number(customIncome) : (selectedIncomeBand ? (selectedIncomeBand.min + selectedIncomeBand.max) / 2 : 0)

  const submit = async () => {
    setError('')
    if (!purpose) { setError('Please select a purpose for the loan'); return }
    if (!amount) { setError('Please enter a loan amount'); return }
    if (!employmentStatus) { setError('Please select your employment status'); return }
    if (incomeBand === 'custom' && !customIncome) { setError('Please enter your monthly income'); return }

    setStep('submitting')
    try {
      const r = await apiPost('/credit', {
        loanType, purpose, amount: Number(amount), term: Number(term),
        employmentStatus, monthlyIncome: actualIncome,
        creditScore: Number(creditScore),
      })
      setResult(r)
      setStep('result')
    } catch (e: any) {
      setError(e.message)
      setStep('form')
    }
  }

  const reset = () => {
    setStep('form'); setResult(null); setError('')
    setPurpose(''); setAmount(''); setEmploymentStatus(''); setIncomeBand(''); setCustomIncome('')
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">💳</span> Credit & Loans
          </DialogTitle>
        </DialogHeader>

        {step === 'form' && (
          <div className="space-y-4">
            {/* Explainer */}
            <Card className="bg-[#0F766E]/5 border-[#0F766E]/20">
              <CardContent className="py-3">
                <div className="flex items-start gap-2">
                  <Sparkles className="h-4 w-4 text-[#0F766E] mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-slate-600">
                    Apply for a personal or business loan. We check your affordability and credit score
                    to pre-qualify you instantly. All loans are NCA-compliant.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Loan Type */}
            <div>
              <Label>Loan Type</Label>
              <select className="mt-1 w-full rounded-md border px-3 py-2 text-sm" value={loanType} onChange={(e) => setLoanType(e.target.value)}>
                {catalog?.loanTypes?.map((t: any) => <option key={t.value} value={t.value}>{t.label} — {t.desc} (max R{t.maxAmount})</option>)}
              </select>
              {selectedLoanType && (
                <p className="text-xs text-slate-500 mt-1">Available terms: {selectedLoanType.terms.map((t: number) => `${t} months`).join(', ')}</p>
              )}
            </div>

            {/* Purpose */}
            <div>
              <Label>Purpose of Loan</Label>
              <select className="mt-1 w-full rounded-md border px-3 py-2 text-sm" value={purpose} onChange={(e) => setPurpose(e.target.value)}>
                <option value="">Select purpose...</option>
                {catalog?.loanPurposes?.map((p: any) => <option key={p.value} value={p.value}>{p.label} — {p.desc}</option>)}
              </select>
            </div>

            {/* Amount + Term */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Amount (R)</Label>
                <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="50000" />
              </div>
              <div>
                <Label>Term (months)</Label>
                <select className="mt-1 w-full rounded-md border px-3 py-2 text-sm" value={term} onChange={(e) => setTerm(e.target.value)}>
                  {selectedLoanType?.terms?.map((t: number) => <option key={t} value={t}>{t} months</option>)}
                </select>
              </div>
            </div>

            {/* Employment Status */}
            <div>
              <Label>Employment Status</Label>
              <select className="mt-1 w-full rounded-md border px-3 py-2 text-sm" value={employmentStatus} onChange={(e) => setEmploymentStatus(e.target.value)}>
                <option value="">Select...</option>
                {catalog?.employmentStatuses?.map((e: any) => <option key={e.value} value={e.value}>{e.label}</option>)}
              </select>
            </div>

            {/* Monthly Income */}
            <div>
              <Label>Monthly Income</Label>
              <select className="mt-1 w-full rounded-md border px-3 py-2 text-sm" value={incomeBand} onChange={(e) => setIncomeBand(e.target.value)}>
                <option value="">Select income band...</option>
                {catalog?.incomeBands?.map((b: any) => <option key={b.value} value={b.value}>{b.label}</option>)}
              </select>
              {incomeBand === 'custom' && (
                <Input className="mt-2" type="number" value={customIncome} onChange={(e) => setCustomIncome(e.target.value)} placeholder="Enter monthly income in R" />
              )}
            </div>

            {/* Credit Score */}
            <div>
              <Label>Estimated Credit Score (550-850)</Label>
              <input type="range" min="550" max="850" value={creditScore} onChange={(e) => setCreditScore(e.target.value)} className="w-full" />
              <div className="flex justify-between text-xs text-slate-500">
                <span>550 (Poor)</span><span className="font-medium">{creditScore}</span><span>850 (Excellent)</span>
              </div>
            </div>

            {error && <div className="text-sm text-red-600 flex items-center gap-1"><AlertCircle className="h-4 w-4" />{error}</div>}

            <Button className="w-full bg-[#0F766E] hover:bg-[#0F766E]/90" onClick={submit}>Submit Application</Button>
          </div>
        )}

        {step === 'submitting' && (
          <div className="py-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0F766E] mx-auto mb-4" />
            <p className="text-sm text-slate-600">Assessing your application...</p>
            <p className="text-xs text-slate-400 mt-1">Running affordability checks, credit score assessment and NCA compliance</p>
          </div>
        )}

        {step === 'result' && result && (
          <div className="space-y-4">
            {/* Case Reference */}
            <Card className="bg-slate-900 text-white">
              <CardContent className="py-4">
                <p className="text-xs opacity-70">Case Reference Number</p>
                <p className="text-lg font-bold font-mono">{result.caseRef}</p>
                <p className="text-xs opacity-70 mt-1">Submitted: {new Date(result.submittedAt).toLocaleString()}</p>
              </CardContent>
            </Card>

            {/* Pre-Qualification Result */}
            <div className={`rounded-lg p-4 ${result.preQualified ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                {result.preQualified ? <CheckCircle2 className="h-5 w-5 text-green-600" /> : <AlertCircle className="h-5 w-5 text-amber-600" />}
                <span className="font-semibold">{result.preQualified ? 'Pre-Qualified!' : 'Not Pre-Qualified'}</span>
              </div>
              {result.preQualified ? (
                <div className="text-sm space-y-1">
                  <p>✅ Qualified Amount: <strong>{formatMoney(BigInt(result.qualifiedAmount * 100))}</strong></p>
                  <p>📊 Estimated Interest Rate: <strong>{result.estimatedInterestRate}%</strong></p>
                  <p>💰 Monthly Instalment: <strong>{formatMoney(BigInt(result.monthlyInstalment * 100))}</strong></p>
                  <p>⚖️ Affordability Ratio: <strong>{(Number(result.affordabilityRatio) * 100).toFixed(1)}%</strong> (NCA limit: 30%)</p>
                </div>
              ) : (
                <p className="text-sm">Your application requires further review. See the qualifying criteria below.</p>
              )}
            </div>

            {/* GroAI Insight */}
            <Card className="border-[#0F766E]/30 bg-[#0F766E]/5">
              <CardContent className="py-3">
                <div className="flex items-start gap-2">
                  <Sparkles className="h-4 w-4 text-[#0F766E] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-[#0F766E] mb-1">GroAI Pre-Qualification Insight</p>
                    <p className="text-xs text-slate-700">{result.groaiInsight}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Qualifying Criteria */}
            <div>
              <p className="text-sm font-semibold mb-2">Qualifying Criteria</p>
              <div className="space-y-1">
                {result.checks?.map((c: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <CheckCircle2 className={`h-3 w-3 ${c.passed ? 'text-green-600' : 'text-red-600'}`} />
                    <span className="font-medium">{c.check.replace(/_/g, ' ')}</span>
                    {c.reason && <span className="text-slate-500">— {c.reason}</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Debt Counselling */}
            {result.debtCounsellingAvailable && (
              <Card className="border-amber-200 bg-amber-50">
                <CardContent className="py-3">
                  <div className="flex items-start gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-amber-900">Struggling with Debt?</p>
                      <p className="text-xs text-amber-700">Speak to an NCR-registered debt counsellor. They can help you restructure your debt under the National Credit Act.</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="mt-2" onClick={() => setStep('debt_counselling')}>View Debt Counsellors</Button>
                </CardContent>
              </Card>
            )}

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={reset}>New Application</Button>
              <Button variant="outline" className="flex-1" onClick={onClose}>Close</Button>
            </div>
          </div>
        )}

        {step === 'debt_counselling' && (
          <div className="space-y-3">
            <h3 className="font-semibold">NCR-Registered Debt Counsellors</h3>
            <p className="text-xs text-slate-500">These providers are registered with the National Credit Regulator and can help you with debt review, debt restructuring and debt mediation.</p>
            {result?.debtCounsellingProviders?.map((dc: any) => (
              <Card key={dc.id}>
                <CardContent className="py-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-sm">{dc.name}</p>
                      <p className="text-xs text-slate-500">NCR Reg: {dc.ncrReg}</p>
                      <div className="flex gap-3 mt-2 text-xs">
                        <a href={`tel:${dc.phone}`} className="flex items-center gap-1 text-[#0F766E]"><Phone className="h-3 w-3" />{dc.phone}</a>
                        <a href={`mailto:${dc.email}`} className="flex items-center gap-1 text-[#0F766E]"><FileText className="h-3 w-3" />Email</a>
                        <a href={dc.url} target="_blank" className="flex items-center gap-1 text-[#0F766E]"><ExternalLink className="h-3 w-3" />Website</a>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            <Button variant="outline" className="w-full" onClick={() => setStep('result')}>Back to Results</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
