'use client'

import { useState, useEffect, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Smartphone, ArrowDownLeft, ArrowUpRight, CheckCircle2, AlertCircle,
  Clock, RefreshCw, ChevronRight, Loader2, Shield,
} from 'lucide-react'
import { apiGet, apiPost } from '@/components/wallet/lib/api'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultType?: 'deposit' | 'payout'
}

type Step = 'amount' | 'phone' | 'confirm' | 'processing' | 'success' | 'failed'

export function MobileMoneyModal({ open, onOpenChange, defaultType = 'deposit' }: Props) {
  const [step, setStep] = useState<Step>('amount')
  const [type, setType] = useState<'deposit' | 'payout'>(defaultType)
  const [amount, setAmount] = useState('')
  const [msisdn, setMsisdn] = useState('')
  const [detectedProvider, setDetectedProvider] = useState<string | null>(null)
  const [manualProvider, setManualProvider] = useState<string>('')
  const [providers, setProviders] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<any>(null)
  const [statusCheckCount, setStatusCheckCount] = useState(0)

  useEffect(() => {
    if (open) {
      apiGet('/mobile-money/providers').then(res => {
        const data = res?.data || res
        setProviders(data?.providers || [])
      }).catch(() => {})
      setStep('amount')
      setError('')
      setResult(null)
      setAmount('')
      setMsisdn('')
      setDetectedProvider(null)
      setManualProvider('')
      setType(defaultType)
    }
  }, [open, defaultType])

  // Detect provider from phone number
  const handlePhoneChange = (value: string) => {
    setMsisdn(value)
    setError('')
    // Auto-detect on 6+ digits
    if (value.replace(/\D/g, '').length >= 6) {
      // Call the API to detect, or use a local lookup
      const normalized = value.startsWith('+') ? value : '+' + value.replace(/\D/g, '')
      const provider = providers.find(p => {
        // Simple prefix matching for UI
        const prefixes: Record<string, string[]> = {
          'tnm_mpamba': ['+26599', '+2659', '+2651'],
          'airtel_money_mw': ['+26588', '+26599', '+2651'],
          'mpesa_tz': ['+2557', '+2556'],
          'mtc_maris': ['+2648'],
        }
        return (prefixes[p.id] || []).some(prefix => normalized.startsWith(prefix))
      })
      setDetectedProvider(provider?.id || null)
    } else {
      setDetectedProvider(null)
    }
  }

  const handleConfirm = async () => {
    setStep('processing')
    setError('')
    try {
      const endpoint = type === 'deposit' ? '/mobile-money/deposit' : '/mobile-money/payout'
      const res = await apiPost(endpoint, {
        msisdn,
        amount: parseFloat(amount),
        provider: manualProvider || detectedProvider || undefined,
      })
      const data = res?.data || res

      if (data?.status === 'FAILED') {
        setError(data?.rawProviderResponse?.error || 'Transaction failed')
        setStep('failed')
        return
      }

      setResult(data)

      // Start polling for status (simulated)
      if (data?.providerTransactionId) {
        pollStatus(data.providerTransactionId)
      }
    } catch (e: any) {
      setError(e.message)
      setStep('failed')
    }
  }

  const pollStatus = async (txId: string) => {
    const maxAttempts = 10
    for (let i = 0; i < maxAttempts; i++) {
      setStatusCheckCount(i + 1)
      await new Promise(r => setTimeout(r, 2000))
      try {
        const res = await apiGet(`/mobile-money/status?providerTransactionId=${encodeURIComponent(txId)}`)
        const data = res?.data || res
        if (data?.status === 'SUCCESSFUL') {
          setResult(prev => ({ ...prev, status: 'SUCCESSFUL' }))
          setStep('success')
          return
        }
        if (data?.status === 'FAILED') {
          setError('Transaction failed at the provider')
          setStep('failed')
          return
        }
      } catch {}
    }
    // Timeout — still processing
    setResult(prev => ({ ...prev, status: 'PENDING' }))
    setStep('success')
  }

  const selectedProvider = providers.find(p => p.id === (manualProvider || detectedProvider))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-[#00897B]" />
            Mobile Money {type === 'deposit' ? 'Top-up' : 'Withdrawal'}
          </DialogTitle>
        </DialogHeader>

        {/* Type toggle */}
        <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
          <button
            onClick={() => { setType('deposit'); setStep('amount') }}
            className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-md text-sm font-medium transition-all ${type === 'deposit' ? 'bg-white shadow text-[#00897B]' : 'text-gray-500'}`}
          >
            <ArrowDownLeft className="h-4 w-4" /> Top-up
          </button>
          <button
            onClick={() => { setType('payout'); setStep('amount') }}
            className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-md text-sm font-medium transition-all ${type === 'payout' ? 'bg-white shadow text-[#00897B]' : 'text-gray-500'}`}
          >
            <ArrowUpRight className="h-4 w-4" /> Withdraw
          </button>
        </div>

        {/* Step: Amount */}
        {step === 'amount' && (
          <div className="space-y-4">
            <div>
              <Label>Amount</Label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-lg">
                  {selectedProvider?.currency === 'MWK' ? 'K' : selectedProvider?.currency === 'TZS' ? 'TSh' : selectedProvider?.currency === 'NAD' ? 'N$' : 'R'}
                </span>
                <Input
                  type="number"
                  placeholder="0.00"
                  className="pl-10 text-lg"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && parseFloat(amount) > 0) setStep('phone') }}
                />
              </div>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button
              className="w-full bg-[#00897B] hover:bg-[#00897B]/90"
              onClick={() => {
                if (!amount || parseFloat(amount) <= 0) { setError('Enter a valid amount'); return }
                setError('')
                setStep('phone')
              }}
            >
              Continue <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}

        {/* Step: Phone number */}
        {step === 'phone' && (
          <div className="space-y-4">
            <div>
              <Label>Mobile Money Phone Number</Label>
              <Input
                type="tel"
                placeholder="+265 999 456 789"
                value={msisdn}
                onChange={(e) => handlePhoneChange(e.target.value)}
                className="text-lg"
                autoFocus
              />
            </div>

            {/* Detected provider */}
            {detectedProvider && (
              <Card className="bg-[#00897B]/5 border-[#00897B]/20">
                <CardContent className="py-3 flex items-center gap-2">
                  <span className="text-2xl">{selectedProvider?.logo}</span>
                  <div>
                    <p className="text-sm font-medium">{selectedProvider?.name}</p>
                    <p className="text-xs text-gray-500">
                      Fee: {selectedProvider?.feePercent}% · Settles in {selectedProvider?.averageSettlementTime}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Manual provider selection */}
            {!detectedProvider && (
              <div>
                <Label>Select Provider Manually</Label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {providers.map(p => (
                    <button
                      key={p.id}
                      onClick={() => setManualProvider(p.id)}
                      className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${manualProvider === p.id ? 'border-[#00897B] bg-[#00897B]/5' : 'border-gray-200'}`}
                    >
                      <span className="text-xl">{p.logo}</span>
                      <div className="text-left">
                        <p className="text-xs font-medium">{p.name}</p>
                        <p className="text-[10px] text-gray-400">{p.currency}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep('amount')}>Back</Button>
              <Button
                className="flex-1 bg-[#00897B] hover:bg-[#00897B]/90"
                disabled={!msisdn || (!detectedProvider && !manualProvider)}
                onClick={() => setStep('confirm')}
              >
                Continue <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Step: Confirm */}
        {step === 'confirm' && (
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">{type === 'deposit' ? 'Top-up amount' : 'Withdrawal amount'}</span>
                  <span className="text-lg font-bold">
                    {selectedProvider?.currency === 'MWK' ? 'K' : selectedProvider?.currency === 'TZS' ? 'TSh' : selectedProvider?.currency === 'NAD' ? 'N$' : 'R'} {parseFloat(amount).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Provider</span>
                  <span className="font-medium">{selectedProvider?.logo} {selectedProvider?.name}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Phone</span>
                  <span className="font-medium">{msisdn}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Fee ({selectedProvider?.feePercent}%)</span>
                  <span className="font-medium">
                    {selectedProvider?.currency === 'MWK' ? 'K' : selectedProvider?.currency === 'TZS' ? 'TSh' : selectedProvider?.currency === 'NAD' ? 'N$' : 'R'} {Math.round(parseFloat(amount) * (selectedProvider?.feePercent || 0) / 100).toLocaleString()}
                  </span>
                </div>
                <div className="border-t pt-3 flex items-center justify-between">
                  <span className="text-sm font-medium">{type === 'deposit' ? 'You receive' : 'You pay total'}</span>
                  <span className="text-lg font-bold text-[#00897B]">
                    {selectedProvider?.currency === 'MWK' ? 'K' : selectedProvider?.currency === 'TZS' ? 'TSh' : selectedProvider?.currency === 'NAD' ? 'N$' : 'R'} {(parseFloat(amount) - Math.round(parseFloat(amount) * (selectedProvider?.feePercent || 0) / 100)).toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-start gap-2 text-xs text-gray-500">
              <Shield className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p>
                You'll receive a prompt on your phone. Enter your {selectedProvider?.name} PIN to approve.
                This transaction is protected by idempotency — retrying won't double-charge.
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep('phone')}>Back</Button>
              <Button className="flex-1 bg-[#00897B] hover:bg-[#00897B]/90" onClick={handleConfirm}>
                {type === 'deposit' ? 'Top-up Now' : 'Withdraw Now'}
              </Button>
            </div>
          </div>
        )}

        {/* Step: Processing */}
        {step === 'processing' && (
          <div className="space-y-4 py-6 text-center">
            <div className="w-16 h-16 rounded-full bg-[#00897B]/10 flex items-center justify-center mx-auto">
              <Loader2 className="h-8 w-8 text-[#00897B] animate-spin" />
            </div>
            <div>
              <p className="text-lg font-bold">Check Your Phone</p>
              <p className="text-sm text-gray-500 mt-1">
                Enter your {selectedProvider?.name} PIN to approve the {type === 'deposit' ? 'top-up' : 'withdrawal'}.
              </p>
            </div>
            {result?.instruction && (
              <Card className="bg-amber-50 border-amber-200">
                <CardContent className="py-3 text-xs text-amber-700">
                  {result.instruction}
                </CardContent>
              </Card>
            )}
            <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
              <Clock className="h-3 w-3" />
              Checking status... ({statusCheckCount}/10)
            </div>
          </div>
        )}

        {/* Step: Success */}
        {step === 'success' && result && (
          <div className="space-y-4 py-6 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              {result.status === 'PENDING' ? (
                <Clock className="h-8 w-8 text-amber-500" />
              ) : (
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              )}
            </div>
            <div>
              <p className="text-lg font-bold">
                {result.status === 'PENDING' ? 'Still Processing' : 'Success!'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {result.status === 'PENDING'
                  ? 'Your transaction is still being processed. We\'ll notify you when it completes.'
                  : `${type === 'deposit' ? 'Top-up' : 'Withdrawal'} of ${result.amount} ${result.currency} was successful.`
                }
              </p>
            </div>
            {result.providerTransactionId && (
              <p className="text-xs text-gray-400 font-mono">Ref: {result.providerTransactionId}</p>
            )}
            <Button className="w-full bg-[#00897B] hover:bg-[#00897B]/90" onClick={() => onOpenChange(false)}>
              Done
            </Button>
          </div>
        )}

        {/* Step: Failed */}
        {step === 'failed' && (
          <div className="space-y-4 py-6 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            <div>
              <p className="text-lg font-bold">Transaction Failed</p>
              <p className="text-sm text-gray-500 mt-1">{error || 'Please try again.'}</p>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => { setStep('amount'); setError('') }}
            >
              <RefreshCw className="h-4 w-4 mr-2" /> Try Again
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
