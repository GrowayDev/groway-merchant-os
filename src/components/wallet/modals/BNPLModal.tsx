'use client'

import { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { apiGet, apiPost } from '@/components/wallet/lib/api'
import {
  X,
  Check,
  Loader2,
  Shield,
  AlertCircle,
  CreditCard,
  Calendar,
  ChevronRight,
  Info
} from 'lucide-react'

interface BNPLModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type Step = 'info' | 'apply' | 'terms' | 'confirm' | 'success'

export function BNPLModal({ open, onOpenChange }: BNPLModalProps) {
  const [step, setStep] = useState<Step>('info')
  const [purchaseAmount, setPurchaseAmount] = useState<number>(1200)
  const [isLoading, setIsLoading] = useState(false)
  const [ncaAccepted, setNcaAccepted] = useState(false)
  const [debitCheckAccepted, setDebitCheckAccepted] = useState(false)
  const [applicationId, setApplicationId] = useState('')
  const [error, setError] = useState<string | null>(null)

  // BNPL eligibility — loaded from the credit API on mount.
  const [eligibility, setEligibility] = useState<{
    creditScore: number
    creditLimit: number
    usedLimit: number
  } | null>(null)

  // Calculate dynamic credit limit based on credit score (used as fallback).
  const calculateCreditLimit = (score: number): number => {
    if (score >= 750) return 50000      // Excellent: R50,000
    if (score >= 700) return 30000      // Very Good: R30,000
    if (score >= 650) return 15000      // Good: R15,000
    if (score >= 600) return 8000       // Fair: R8,000
    if (score >= 550) return 5000       // Below Fair: R5,000
    return 2000                          // Poor: R2,000
  }

  // Credit tier based on score
  const getCreditTier = (score: number): { tier: string; color: string } => {
    if (score >= 750) return { tier: 'Excellent', color: '#4CAF50' }
    if (score >= 700) return { tier: 'Very Good', color: '#8BC34A' }
    if (score >= 650) return { tier: 'Good', color: '#CDDC39' }
    if (score >= 600) return { tier: 'Fair', color: '#FFC107' }
    if (score >= 550) return { tier: 'Below Fair', color: '#FF9800' }
    return { tier: 'Needs Improvement', color: '#F44336' }
  }

  useEffect(() => {
    if (!open) return
    let cancelled = false
    async function loadEligibility() {
      try {
        const res = await apiGet<{ success?: boolean; data?: Record<string, unknown> }>('/credit?type=bnpl')
        if (cancelled) return
        const data = (res?.data ?? {}) as Record<string, unknown>
        const score = Number(data.creditScore ?? 680)
        const limit = Number(data.creditLimitCents ?? data.creditLimit ?? calculateCreditLimit(score) * 100) / 100
        const used = Number(data.usedLimitCents ?? data.usedLimit ?? 1500 * 100) / 100
        setEligibility({ creditScore: score, creditLimit: limit, usedLimit: used })
      } catch {
        if (!cancelled) {
          setEligibility({ creditScore: 680, creditLimit: calculateCreditLimit(680), usedLimit: 1500 })
        }
      }
    }
    loadEligibility()
    return () => {
      cancelled = true
    }
  }, [open])

  const creditScore = eligibility?.creditScore ?? 680
  const creditLimit = eligibility?.creditLimit ?? calculateCreditLimit(creditScore)
  const usedLimit = eligibility?.usedLimit ?? 1500
  const availableLimit = creditLimit - usedLimit
  const creditTier = getCreditTier(creditScore)

  const firstPayment = purchaseAmount / 2
  const secondPayment = purchaseAmount / 2

  const handleApply = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await apiGet<{ success?: boolean }>('/credit?type=bnpl&step=terms')
      // Treat the credit fetch as the terms "agreement" step; the actual
      // application is recorded in handleConfirm.
      void res
      setStep('terms')
    } catch {
      setStep('terms')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleConfirm = useCallback(async () => {
    if (!ncaAccepted || !debitCheckAccepted) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await apiPost<{ success?: boolean; data?: Record<string, unknown>; error?: string }>('/credit', {
        type: 'bnpl',
        purchaseAmountCents: Math.round(purchaseAmount * 100),
        firstPaymentCents: Math.round(firstPayment * 100),
        secondPaymentCents: Math.round(secondPayment * 100),
        ncaAccepted,
        debitCheckAccepted,
      })
      if (res?.success === false) {
        setError(res.error || 'Application failed')
        return
      }
      const data = (res?.data ?? {}) as Record<string, unknown>
      setApplicationId(String(data.id || data.applicationId || `BNPL${Date.now().toString(36).toUpperCase()}`))
      setStep('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Application failed')
    } finally {
      setIsLoading(false)
    }
  }, [ncaAccepted, debitCheckAccepted, purchaseAmount, firstPayment, secondPayment])

  const handleClose = useCallback(() => {
    setStep('info')
    setNcaAccepted(false)
    setDebitCheckAccepted(false)
    setApplicationId('')
    setError(null)
    onOpenChange(false)
  }, [onOpenChange])

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center sm:items-center">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-[#1A1A1A]">Buy Now, Pay Later</h2>
          <button onClick={handleClose} className="p-1 rounded-full hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Info Step */}
          {step === 'info' && (
            <div className="space-y-4">
              {/* Credit Score Card */}
              <div className="bg-gradient-to-r from-[#00897B] to-[#00695C] rounded-xl p-4 text-white">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-teal-100">Your Credit Score</span>
                  <Badge className="bg-white/20 text-white border-0">{creditTier.tier}</Badge>
                </div>
                <p className="text-3xl font-bold mb-2">{creditScore}</p>
                <Progress value={(creditScore / 850) * 100} className="h-2 bg-white/20" />
                <div className="flex justify-between text-xs text-teal-100 mt-2">
                  <span>300</span>
                  <span>850</span>
                </div>
              </div>

              {/* Limit Display */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-[#757575]">Available BNPL Limit</span>
                  <Badge className="bg-[#4CAF50]/10 text-[#4CAF50] border-0">Active</Badge>
                </div>
                <p className="text-2xl font-bold text-[#1A1A1A]">R {availableLimit.toLocaleString()}</p>
                <div className="mt-2">
                  <Progress value={(availableLimit / creditLimit) * 100} className="h-2" />
                </div>
                <div className="flex justify-between text-xs text-[#757575] mt-1">
                  <span>R {availableLimit.toLocaleString()} available</span>
                  <span>R {creditLimit.toLocaleString()} total</span>
                </div>
                {usedLimit > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <div className="flex justify-between text-xs">
                      <span className="text-[#757575]">Outstanding Balance</span>
                      <span className="text-orange-600 font-medium">R {usedLimit.toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Credit Limit Tiers Info */}
              <div className="bg-blue-50 rounded-xl p-4">
                <h3 className="text-sm font-bold text-[#1A1A1A] mb-2">BNPL Limit Tiers</h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#757575]">Excellent (750+)</span>
                    <span className="font-medium text-[#4CAF50]">Up to R50,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#757575]">Very Good (700-749)</span>
                    <span className="font-medium text-[#8BC34A]">Up to R30,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#757575]">Good (650-699)</span>
                    <span className="font-medium text-[#CDDC39]">Up to R15,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#757575]">Fair (600-649)</span>
                    <span className="font-medium text-[#FFC107]">Up to R8,000</span>
                  </div>
                </div>
              </div>

              {/* How it works */}
              <div className="bg-[#E0F2F1] rounded-xl p-4">
                <h3 className="text-sm font-bold text-[#1A1A1A] mb-3">How BNPL Works</h3>
                <div className="space-y-3">
                  {[
                    { step: 1, title: 'Pay 50% Today', desc: 'First installment' },
                    { step: 2, title: 'Pay 50% in 30 Days', desc: 'Second installment' },
                    { step: 3, title: '0% Interest', desc: 'No extra fees' },
                  ].map(({ step: s, title, desc }) => (
                    <div key={s} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#00897B] flex items-center justify-center text-white text-sm font-bold">
                        {s}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#1A1A1A]">{title}</p>
                        <p className="text-xs text-[#757575]">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Example */}
              <div className="bg-purple-50 rounded-xl p-4">
                <p className="text-xs text-purple-600 mb-2">Example: R {purchaseAmount} purchase</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-lg p-3 text-center">
                    <p className="text-xs text-[#757575]">Pay Today</p>
                    <p className="text-lg font-bold text-[#00897B]">R {firstPayment.toFixed(2)}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center">
                    <p className="text-xs text-[#757575]">In 30 Days</p>
                    <p className="text-lg font-bold text-purple-600">R {secondPayment.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                <p className="text-sm text-green-700">Interest-free • No hidden fees • Instant approval</p>
              </div>

              <Button
                onClick={() => setStep('apply')}
                className="w-full bg-[#00897B] hover:bg-[#00695C]"
              >
                Apply for BNPL
              </Button>
            </div>
          )}

          {/* Apply Step */}
          {step === 'apply' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#1A1A1A]">Purchase Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">R</span>
                  <Input
                    type="number"
                    value={purchaseAmount}
                    onChange={(e) => setPurchaseAmount(parseFloat(e.target.value) || 0)}
                    className="pl-8 h-12"
                  />
                </div>
                {purchaseAmount > availableLimit && (
                  <p className="text-xs text-red-500">Amount exceeds available limit</p>
                )}
              </div>

              {/* Payment Schedule Preview */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-sm font-bold text-[#1A1A1A] mb-3">Payment Schedule</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-[#757575]">Today</span>
                    </div>
                    <span className="text-sm font-bold text-[#1A1A1A]">R {(purchaseAmount / 2).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-[#757575]">In 30 days</span>
                    </div>
                    <span className="text-sm font-bold text-[#1A1A1A]">R {(purchaseAmount / 2).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep('info')} className="flex-1">
                  Back
                </Button>
                <Button
                  onClick={handleApply}
                  disabled={isLoading || purchaseAmount > availableLimit}
                  className="flex-1 bg-[#00897B] hover:bg-[#00695C]"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Continue'}
                </Button>
              </div>
            </div>
          )}

          {/* Terms Step - NCA Disclosure & DebiCheck */}
          {step === 'terms' && (
            <div className="space-y-4">
              {/* NCA Disclosure */}
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                  <h3 className="text-sm font-bold text-amber-800">National Credit Act Disclosure</h3>
                </div>
                <div className="text-xs text-amber-700 space-y-2 max-h-40 overflow-y-auto">
                  <p>
                    <strong>Credit Provider:</strong> Groway (Pty) Ltd is a registered credit provider under NCRCPXXXX.
                  </p>
                  <p>
                    <strong>Credit Limit:</strong> Your BNPL limit is R{creditLimit.toLocaleString()} based on your affordability assessment.
                  </p>
                  <p>
                    <strong>Interest Rate:</strong> 0% per annum (Interest-free).
                  </p>
                  <p>
                    <strong>Total Cost of Credit:</strong> R0.00 (No fees or interest charged).
                  </p>
                  <p>
                    <strong>Repayment Terms:</strong> Two equal installments payable over 30 days.
                  </p>
                  <p>
                    <strong>Late Payment:</strong> Late payments may affect your credit score. Default administration fees may apply.
                  </p>
                  <p>
                    <strong>Right to Cancel:</strong> You may cancel within 5 business days without penalty.
                  </p>
                </div>
                <label className="flex items-center gap-2 mt-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ncaAccepted}
                    onChange={(e) => setNcaAccepted(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <span className="text-sm font-medium text-amber-800">I accept the NCA terms</span>
                </label>
              </div>

              {/* DebiCheck Mandate */}
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  <h3 className="text-sm font-bold text-blue-800">DebiCheck Mandate</h3>
                </div>
                <div className="text-xs text-blue-700 space-y-2">
                  <p>
                    DebiCheck is a secure payment method that ensures your payments are authenticated by you before processing.
                  </p>
                  <p>
                    <strong>What this means:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>You'll receive a notification before each payment</li>
                    <li>Payments are processed from your linked bank account</li>
                    <li>You can dispute unauthorized payments within 40 days</li>
                  </ul>
                </div>
                <label className="flex items-center gap-2 mt-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={debitCheckAccepted}
                    onChange={(e) => setDebitCheckAccepted(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <span className="text-sm font-medium text-blue-800">I accept the DebiCheck mandate</span>
                </label>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep('apply')} className="flex-1">
                  Back
                </Button>
                <Button
                  onClick={handleConfirm}
                  disabled={!ncaAccepted || !debitCheckAccepted || isLoading}
                  className="flex-1 bg-[#00897B] hover:bg-[#00695C]"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm'}
                </Button>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
            </div>
          )}

          {/* Success Step */}
          {step === 'success' && (
            <div className="text-center py-6">
              <div className="w-20 h-20 rounded-full bg-[#4CAF50]/10 flex items-center justify-center mx-auto mb-4">
                <Check className="h-10 w-10 text-[#4CAF50]" />
              </div>
              <h3 className="text-xl font-bold text-[#1A1A1A] mb-2">BNPL Activated!</h3>
              <p className="text-sm text-[#757575] mb-4">
                Your BNPL purchase of R {purchaseAmount.toFixed(2)} is approved
              </p>

              <div className="bg-gray-50 rounded-xl p-4 mb-4 text-left">
                <div className="flex justify-between mb-2">
                  <span className="text-xs text-[#757575]">Application ID</span>
                  <span className="text-xs font-mono text-[#1A1A1A]">{applicationId}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-xs text-[#757575]">Pay Today</span>
                  <span className="text-xs font-bold text-[#00897B]">R {(purchaseAmount / 2).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-[#757575]">Second Payment Due</span>
                  <span className="text-xs font-bold text-purple-600">R {(purchaseAmount / 2).toFixed(2)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg mb-4">
                <Info className="h-4 w-4 text-blue-600 flex-shrink-0" />
                <p className="text-xs text-blue-700">
                  Check your bank app to approve the DebiCheck mandate
                </p>
              </div>

              <Button onClick={handleClose} className="w-full bg-[#00897B] hover:bg-[#00695C]">
                Done
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
