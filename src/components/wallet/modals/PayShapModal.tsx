'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { apiPost } from '@/components/wallet/lib/api'
import {
  X,
  Check,
  Loader2,
  Phone,
  Mail,
  CreditCard,
  User,
  ChevronRight,
  ArrowRight,
  AlertCircle
} from 'lucide-react'

interface PayShapModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type Step = 'input' | 'lookup' | 'amount' | 'confirm' | 'success'

export function PayShapModal({ open, onOpenChange }: PayShapModalProps) {
  const [step, setStep] = useState<Step>('input')
  const [proxyType, setProxyType] = useState<'phone' | 'id' | 'email'>('phone')
  const [proxyId, setProxyId] = useState('')
  const [amount, setAmount] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(false)
  const [recipient, setRecipient] = useState<{ name: string; bank: string } | null>(null)
  const [transactionId, setTransactionId] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleLookup = useCallback(async () => {
    if (!proxyId.trim()) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await apiPost<{ success?: boolean; data?: Record<string, unknown>; error?: string }>('/payshap', {
        action: 'lookup',
        proxyType,
        proxyId,
      })
      if (res?.success === false) {
        setError(res.error || 'Recipient not found')
        return
      }
      const data = (res?.data ?? {}) as Record<string, unknown>
      setRecipient({
        name: String(data.name || data.recipientName || 'PayShap Recipient'),
        bank: String(data.bank || data.bankName || 'FNB'),
      })
      setStep('amount')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lookup failed')
    } finally {
      setIsLoading(false)
    }
  }, [proxyId, proxyType])

  const handleConfirm = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await apiPost<{ success?: boolean; data?: Record<string, unknown>; error?: string }>('/payshap', {
        action: 'send',
        proxyType,
        proxyId,
        recipientName: recipient?.name,
        bank: recipient?.bank,
        amountCents: Math.round(amount * 100),
        currency: 'ZAR',
      })
      if (res?.success === false) {
        setError(res.error || 'Payment failed')
        return
      }
      const data = (res?.data ?? {}) as Record<string, unknown>
      setTransactionId(String(data.id || data.reference || `PS${Date.now().toString(36).toUpperCase()}`))
      setStep('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed')
    } finally {
      setIsLoading(false)
    }
  }, [proxyType, proxyId, recipient, amount])

  const handleClose = useCallback(() => {
    setStep('input')
    setProxyType('phone')
    setProxyId('')
    setAmount(0)
    setRecipient(null)
    setTransactionId('')
    setError(null)
    onOpenChange(false)
  }, [onOpenChange])

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center sm:items-center">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-[#1A1A1A]">PayShap</h2>
          <button onClick={handleClose} className="p-1 rounded-full hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-3 bg-[#E0F2F1] flex items-center justify-center gap-2">
          <div className="w-8 h-8 rounded bg-[#00897B] flex items-center justify-center">
            <span className="text-white font-bold text-xs">PS</span>
          </div>
          <span className="text-sm font-medium text-[#00897B]">Instant payments to any bank</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {step === 'input' && (
            <div className="space-y-4">
              <p className="text-sm text-[#757575]">Pay using a Proxy ID (phone, SA ID, or email)</p>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { type: 'phone' as const, icon: Phone, label: 'Phone' },
                  { type: 'id' as const, icon: CreditCard, label: 'SA ID' },
                  { type: 'email' as const, icon: Mail, label: 'Email' },
                ].map(({ type, icon: Icon, label }) => (
                  <button
                    key={type}
                    onClick={() => setProxyType(type)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
                      proxyType === type
                        ? 'border-[#00897B] bg-[#E0F2F1]'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${proxyType === type ? 'text-[#00897B]' : 'text-gray-500'}`} />
                    <span className="text-xs">{label}</span>
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#1A1A1A]">
                  {proxyType === 'phone' ? 'Phone Number' : proxyType === 'id' ? 'SA ID Number' : 'Email Address'}
                </label>
                <Input
                  type={proxyType === 'email' ? 'email' : 'text'}
                  placeholder={
                    proxyType === 'phone' ? 'e.g., 082 123 4567'
                    : proxyType === 'id' ? 'e.g., 8001015009087'
                    : 'e.g., john@email.com'
                  }
                  value={proxyId}
                  onChange={(e) => setProxyId(e.target.value)}
                  className="h-12"
                />
              </div>

              <Button
                onClick={handleLookup}
                disabled={!proxyId.trim() || isLoading}
                className="w-full bg-[#00897B] hover:bg-[#00695C]"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Look Up Recipient'}
              </Button>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
            </div>
          )}

          {step === 'amount' && recipient && (
            <div className="space-y-4">
              <div className="bg-[#E0F2F1] rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
                    <User className="h-6 w-6 text-[#00897B]" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#1A1A1A]">{recipient.name}</p>
                    <p className="text-xs text-[#757575]">{recipient.bank} • PayShap Verified</p>
                  </div>
                  <Check className="h-5 w-5 text-[#4CAF50] ml-auto" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#1A1A1A]">Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg text-[#757575]">R</span>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={amount || ''}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    className="h-14 pl-10 text-2xl font-bold"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                {[100, 500, 1000].map((value) => (
                  <button
                    key={value}
                    onClick={() => setAmount(value)}
                    className="flex-1 py-2 bg-gray-100 rounded-lg text-sm font-medium hover:bg-gray-200"
                  >
                    R{value}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep('input')} className="flex-1">
                  Back
                </Button>
                <Button
                  onClick={() => setStep('confirm')}
                  disabled={amount <= 0}
                  className="flex-1 bg-[#00897B] hover:bg-[#00695C]"
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {step === 'confirm' && recipient && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <p className="text-3xl font-bold text-[#1A1A1A]">R {amount.toFixed(2)}</p>
                <p className="text-sm text-[#757575]">to {recipient.name}</p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-[#757575]">Recipient</span>
                  <span className="text-sm font-medium text-[#1A1A1A]">{recipient.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-[#757575]">Bank</span>
                  <span className="text-sm font-medium text-[#1A1A1A]">{recipient.bank}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-[#757575]">Payment Type</span>
                  <Badge className="bg-[#00897B]/10 text-[#00897B] border-0">PayShap Instant</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-[#757575]">Fee</span>
                  <span className="text-sm font-medium text-[#4CAF50]">FREE</span>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-700">Payment reflects instantly</span>
              </div>

              {error && (
                <p className="text-sm text-red-500 text-center">{error}</p>
              )}

              <Button
                onClick={handleConfirm}
                disabled={isLoading}
                className="w-full bg-[#00897B] hover:bg-[#00695C] h-12"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>Pay R {amount.toFixed(2)} <ArrowRight className="h-4 w-4 ml-2" /></>
                )}
              </Button>

              <Button variant="outline" onClick={() => setStep('amount')} className="w-full">
                Back
              </Button>
            </div>
          )}

          {step === 'success' && recipient && (
            <div className="text-center py-6">
              <div className="w-20 h-20 rounded-full bg-[#4CAF50]/10 flex items-center justify-center mx-auto mb-4">
                <Check className="h-10 w-10 text-[#4CAF50]" />
              </div>
              <h3 className="text-xl font-bold text-[#1A1A1A] mb-2">Payment Sent!</h3>
              <p className="text-sm text-[#757575] mb-4">
                R {amount.toFixed(2)} sent to {recipient.name}
              </p>
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <p className="text-xs text-[#757575] mb-1">Transaction ID</p>
                <p className="text-sm font-mono font-medium text-[#1A1A1A]">{transactionId}</p>
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
