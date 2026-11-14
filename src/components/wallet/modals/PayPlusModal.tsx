'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { apiGet, apiPost } from '@/components/wallet/lib/api'
import {
  Zap,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ShieldCheck,
  Download,
  ChevronRight,
} from 'lucide-react'

interface PayPlusModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface Provider {
  id: string
  name: string
  bank: string
  ncrReg: string
  maxAmount: number
  serviceFee: number
}

interface PayPlusResult {
  agreementRef: string
  caseRef: string
  receiptNo: string
  provider: string
  providerId: string
  bank: string
  ncrReg: string
  amountCents: string
  amount: number
  serviceFeeCents: string
  serviceFee: number
  totalRepayableCents: string
  totalRepayable: number
  status: string
  approvedAt: string
  repaymentDate: string
  terms: string[]
  message: string
}

type Step = 'explainer' | 'apply' | 'terms' | 'otp' | 'success'

export function PayPlusModal({ open, onOpenChange }: PayPlusModalProps) {
  const [step, setStep] = useState<Step>('explainer')
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [providerId, setProviderId] = useState('')
  const [amount, setAmount] = useState<number>(1000)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [otp, setOtp] = useState('')
  const [sentOtp, setSentOtp] = useState('')

  const [result, setResult] = useState<PayPlusResult | null>(null)

  const loadCatalog = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiGet<{ success?: boolean; data?: { providers?: Provider[] } }>('/payplus')
      const data = res?.data ?? {}
      const list = Array.isArray(data.providers) ? data.providers : []
      setProviders(list)
      if (list.length > 0 && !providerId) setProviderId(list[0].id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load Pay+ providers')
    } finally {
      setLoading(false)
    }
  }, [providerId])

  useEffect(() => {
    if (!open) return
    loadCatalog()
  }, [open, loadCatalog])

  const selectedProvider = providers.find((p) => p.id === providerId)
  const totalRepayable = useMemo(
    () => (selectedProvider ? amount + selectedProvider.serviceFee : amount),
    [amount, selectedProvider],
  )

  const handleClose = () => {
    setStep('explainer')
    setProviderId('')
    setAmount(1000)
    setAcceptedTerms(false)
    setOtp('')
    setSentOtp('')
    setResult(null)
    setError(null)
    onOpenChange(false)
  }

  const sendOtp = useCallback(() => {
    // Mock OTP — in production this would call the SMS gateway.
    const code = String(Math.floor(1000 + Math.random() * 9000))
    setSentOtp(code)
    setStep('otp')
  }, [])

  const handleConfirm = useCallback(async () => {
    if (otp.length !== 4) {
      setError('Enter the 4-digit OTP')
      return
    }
    // For demo, accept any 4-digit code, but prefer the sent one.
    if (sentOtp && otp !== sentOtp) {
      setError('Incorrect OTP. Please check and try again.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const res = await apiPost<{ success?: boolean; data?: PayPlusResult; error?: string }>('/payplus', {
        providerId,
        amount,
      })
      if (res?.success === false) {
        setError(res.error || 'Pay+ application failed')
        return
      }
      setResult(res?.data ?? null)
      setStep('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Pay+ application failed')
    } finally {
      setSaving(false)
    }
  }, [otp, sentOtp, providerId, amount])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-[#FFC107]" />
            Pay+ Cash Advance
          </DialogTitle>
          <DialogDescription>
            Short-term cash advance from your bank — NCR compliant.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg">
            <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {step === 'explainer' && (
          <div className="space-y-4">
            <Card className="bg-[#FFF8E1] border-[#FFC107]">
              <CardContent className="p-4">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="h-5 w-5 text-[#FFC107] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-[#1A1A1A]">NCR Compliant</p>
                    <p className="text-xs text-[#757575] mt-1">
                      Pay+ is a short-term cash advance. The fee is a <strong>service fee</strong>,
                      NOT interest — this is NCR compliant under the easy category.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 text-[#FFC107] animate-spin" />
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-[#1A1A1A]">Registered Providers</p>
                {providers.map((p) => (
                  <div key={p.id} className="p-3 rounded-xl bg-white border border-gray-100">
                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <p className="text-sm font-medium text-[#1A1A1A]">{p.name}</p>
                        <p className="text-[10px] text-[#757575]">{p.bank} • NCR {p.ncrReg}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        Max R{p.maxAmount.toLocaleString()}
                      </Badge>
                    </div>
                    <p className="text-[10px] text-[#FFC107]">Flat fee: R{p.serviceFee.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            )}

            <Button onClick={() => setStep('apply')} className="w-full bg-[#FFC107] hover:bg-[#FFB300] text-[#1A1A1A]">
              Apply Now
            </Button>
          </div>
        )}

        {step === 'apply' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Provider</Label>
              <Select value={providerId} onValueChange={setProviderId}>
                <SelectTrigger><SelectValue placeholder="Select provider" /></SelectTrigger>
                <SelectContent>
                  {providers.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} — {p.bank}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedProvider && (
                <p className="text-[10px] text-[#757575]">
                  Max R{selectedProvider.maxAmount.toLocaleString()} • Flat fee R{selectedProvider.serviceFee.toFixed(2)} • NCR {selectedProvider.ncrReg}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="pp-amount">Amount (R)</Label>
              <Input
                id="pp-amount"
                type="number"
                min={1}
                max={selectedProvider?.maxAmount}
                value={amount || ''}
                onChange={(e) => setAmount(Number(e.target.value) || 0)}
              />
              {selectedProvider && amount > selectedProvider.maxAmount && (
                <p className="text-xs text-[#FF5722]">
                  Exceeds max of R{selectedProvider.maxAmount.toLocaleString()}.
                </p>
              )}
              <div className="flex gap-2 flex-wrap">
                {[500, 1000, 2000, 3000].map((amt) => (
                  <Button
                    key={amt}
                    variant="outline"
                    size="sm"
                    onClick={() => setAmount(amt)}
                    className={amount === amt ? 'border-[#FFC107] bg-[#FFF8E1]' : ''}
                  >
                    R{amt}
                  </Button>
                ))}
              </div>
            </div>

            {/* Fee breakdown */}
            {amount > 0 && selectedProvider && (
              <Card className="bg-gray-50 border-gray-200">
                <CardContent className="p-3 text-xs space-y-1">
                  <Row label="Advance Amount" value={`R ${amount.toFixed(2)}`} />
                  <Row label="Service Fee (NOT interest)" value={`R ${selectedProvider.serviceFee.toFixed(2)}`} />
                  <div className="border-t border-gray-100 my-1" />
                  <Row label="Total Repayable" value={`R ${totalRepayable.toFixed(2)}`} bold />
                </CardContent>
              </Card>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('explainer')} className="flex-1">Back</Button>
              <Button
                onClick={() => setStep('terms')}
                disabled={!providerId || amount <= 0 || (selectedProvider && amount > selectedProvider.maxAmount)}
                className="flex-1 bg-[#FFC107] hover:bg-[#FFB300] text-[#1A1A1A]"
              >
                Continue <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {step === 'terms' && selectedProvider && (
          <div className="space-y-4">
            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="p-3">
                <p className="text-xs font-semibold text-amber-800 mb-1">Terms & Conditions</p>
                <ul className="text-[10px] text-amber-700 space-y-1 list-disc list-inside max-h-48 overflow-y-auto">
                  <li>Pay+ is regulated under the National Credit Act (NCA).</li>
                  <li>The fee of R{selectedProvider.serviceFee.toFixed(2)} is a flat <strong>service fee</strong>, not interest.</li>
                  <li>{selectedProvider.name} is NCR-registered ({selectedProvider.ncrReg}).</li>
                  <li>Repayment is collected via DebiCheck on your next payday.</li>
                  <li>You can cancel within 5 business days for a full fee refund.</li>
                  <li>Total repayable: R{totalRepayable.toFixed(2)}.</li>
                </ul>
              </CardContent>
            </Card>

            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded border-gray-300"
              />
              <span className="text-xs text-[#1A1A1A]">
                I accept the Terms & Conditions and authorise a DebiCheck mandate for repayment.
              </span>
            </label>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('apply')} className="flex-1">Back</Button>
              <Button
                onClick={sendOtp}
                disabled={!acceptedTerms}
                className="flex-1 bg-[#FFC107] hover:bg-[#FFB300] text-[#1A1A1A]"
              >
                Send OTP
              </Button>
            </div>
          </div>
        )}

        {step === 'otp' && (
          <div className="space-y-4">
            <p className="text-sm text-[#1A1A1A] text-center">
              Enter the 4-digit OTP sent to your registered phone.
            </p>
            {sentOtp && (
              <p className="text-[10px] text-[#757575] text-center bg-yellow-50 rounded p-1">
                Demo OTP: <span className="font-mono font-bold">{sentOtp}</span>
              </p>
            )}

            <div className="flex justify-center">
              <InputOTP maxLength={4} value={otp} onChange={setOtp}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('terms')} className="flex-1">Back</Button>
              <Button
                onClick={handleConfirm}
                disabled={saving || otp.length !== 4}
                className="flex-1 bg-[#FFC107] hover:bg-[#FFB300] text-[#1A1A1A]"
              >
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                Confirm
              </Button>
            </div>
          </div>
        )}

        {step === 'success' && result && (
          <div className="space-y-4">
            <div className="text-center py-3">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="h-7 w-7 text-green-600" />
              </div>
              <h3 className="text-base font-bold text-[#1A1A1A]">Advance Approved</h3>
              <p className="text-xs text-[#757575]">{result.message}</p>
            </div>

            <Card className="bg-white border-gray-200">
              <CardContent className="p-4">
                <div className="space-y-1.5 text-xs">
                  <Row label="Agreement Ref" value={result.agreementRef} mono bold />
                  <Row label="Reference" value={result.caseRef} mono />
                  <Row label="Receipt No" value={result.receiptNo} mono />
                  <div className="border-t border-gray-100 my-2" />
                  <Row label="Provider" value={`${result.provider} (${result.bank})`} />
                  <Row label="NCR Reg" value={result.ncrReg} />
                  <Row label="Amount" value={`R ${result.amount.toFixed(2)}`} bold />
                  <Row label="Service Fee" value={`R ${result.serviceFee.toFixed(2)}`} />
                  <div className="border-t border-gray-100 my-2" />
                  <Row label="Total Repayable" value={`R ${result.totalRepayable.toFixed(2)}`} bold />
                  <Row label="Repayment Date" value={result.repaymentDate} />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#FFF8E1] border-[#FFC107]">
              <CardContent className="p-3">
                <p className="text-[10px] font-semibold text-[#FFC107] mb-1">Terms</p>
                <ul className="text-[10px] text-[#1A1A1A] space-y-1 list-disc list-inside max-h-32 overflow-y-auto">
                  {result.terms.map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Button
              onClick={handleClose}
              className="w-full bg-[#FFC107] hover:bg-[#FFB300] text-[#1A1A1A]"
            >
              <Download className="h-4 w-4 mr-2" /> Save Proof & Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function Row({ label, value, bold, mono }: { label: string; value: string; bold?: boolean; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-[#757575] flex-shrink-0">{label}</span>
      <span className={`${bold ? 'font-bold' : 'font-medium'} text-[#1A1A1A] ${mono ? 'font-mono text-[11px]' : ''} text-right`}>
        {value}
      </span>
    </div>
  )
}
