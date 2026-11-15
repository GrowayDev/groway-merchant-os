'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { apiGet, apiPost } from '@/components/wallet/lib/api'
import {
  Calendar,
  ShoppingBag,
  Check,
  Loader2,
  AlertCircle,
  Store,
  ChevronRight,
  Info,
  ShieldCheck,
} from 'lucide-react'

interface BNPLModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface Provider {
  id: string
  name: string
  desc: string
  maxAmount: number
  terms: number[]
}

interface Instalment {
  number: number
  amount: number
  dueDate: string
  status: string
}

interface PlanResult {
  planId: string
  caseRef: string
  receiptNo: string
  provider: string
  providerId: string
  providerDesc: string
  itemDescription: string
  merchant: string
  merchantId: string | null
  purchaseAmount: number
  instalmentAmount: number
  totalInstalments: number
  paidInstalments: number
  nextDueDate: string | null
  status: string
  interestRate: number
  instalments: Instalment[]
  terms: string[]
  message: string
}

type Step = 'explainer' | 'apply' | 'review' | 'plan'

export function BNPLModal({ open, onOpenChange }: BNPLModalProps) {
  const [step, setStep] = useState<Step>('explainer')
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [providerId, setProviderId] = useState('')
  const [purchaseAmount, setPurchaseAmount] = useState<number>(1200)
  const [itemDescription, setItemDescription] = useState('')
  const [merchantId, setMerchantId] = useState('')
  const [merchantName, setMerchantName] = useState('')

  const [plan, setPlan] = useState<PlanResult | null>(null)

  const loadCatalog = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiGet<{ success?: boolean; data?: { providers?: Provider[] } }>('/bnpl')
      const data = res?.data ?? {}
      const list = Array.isArray(data.providers) ? data.providers : []
      setProviders(list)
      if (list.length > 0 && !providerId) setProviderId(list[0].id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load BNPL providers')
    } finally {
      setLoading(false)
    }
  }, [providerId])

  useEffect(() => {
    if (!open) return
    loadCatalog()
  }, [open, loadCatalog])

  const selectedProvider = providers.find((p) => p.id === providerId)

  const term = selectedProvider ? selectedProvider.terms[0] : 3
  const instalmentPreview = useMemo(
    () => purchaseAmount > 0 && term > 0 ? purchaseAmount / term : 0,
    [purchaseAmount, term],
  )

  const handleClose = () => {
    setStep('explainer')
    setProviderId('')
    setPurchaseAmount(1200)
    setItemDescription('')
    setMerchantId('')
    setMerchantName('')
    setPlan(null)
    setError(null)
    onOpenChange(false)
  }

  const handleConfirm = useCallback(async () => {
    if (!providerId || purchaseAmount <= 0) return
    setSaving(true)
    setError(null)
    try {
      const res = await apiPost<{ success?: boolean; data?: PlanResult; error?: string }>('/bnpl', {
        providerId,
        purchaseAmount,
        itemDescription: itemDescription || 'BNPL purchase',
        merchantId: merchantId || null,
        merchantName: merchantName || undefined,
      })
      if (res?.success === false) {
        setError(res.error || 'Plan creation failed')
        return
      }
      setPlan(res?.data ?? null)
      setStep('plan')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Plan creation failed')
    } finally {
      setSaving(false)
    }
  }, [providerId, purchaseAmount, itemDescription, merchantId, merchantName])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-[#9C27B0]" />
            Buy Now, Pay Later
          </DialogTitle>
          <DialogDescription>
            Split a purchase into 3-6 interest-free instalments.
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
            <div className="bg-[#E0F2F1] rounded-xl p-4">
              <h3 className="text-sm font-bold text-[#1A1A1A] mb-2">How BNPL Works</h3>
              <div className="space-y-2 text-xs text-[#1A1A1A]">
                <p>Buy Now, Pay Later lets you split a purchase into interest-free instalments.</p>
                <ul className="list-disc list-inside space-y-1 text-[#757575]">
                  <li>0% interest with most providers when paid on time.</li>
                  <li>Payments are auto-debited via DebiCheck.</li>
                  <li>Linked to your Merchant OS merchant where applicable.</li>
                  <li>Late payments may affect your credit score.</li>
                </ul>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 text-[#9C27B0] animate-spin" />
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-[#1A1A1A]">Available Providers</p>
                {providers.map((p) => (
                  <div key={p.id} className="p-3 rounded-xl bg-white border border-gray-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-[#1A1A1A]">{p.name}</p>
                        <p className="text-[10px] text-[#757575]">{p.desc}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        Max R{p.maxAmount.toLocaleString('en-ZA')}
                      </Badge>
                    </div>
                    <div className="flex gap-1 mt-2">
                      {p.terms.map((t) => (
                        <Badge key={t} className="bg-[#9C27B0]/10 text-[#9C27B0] border-0 text-[10px]">
                          {t} × instalments
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Button onClick={() => setStep('apply')} className="w-full bg-[#9C27B0] hover:bg-[#7B1FA2]">
              Apply for BNPL
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
                      {p.name} — {p.desc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedProvider && (
                <p className="text-[10px] text-[#757575]">
                  Max R{selectedProvider.maxAmount.toLocaleString('en-ZA')} • {selectedProvider.terms.join(' or ')} instalments
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="bnpl-item">Item Description</Label>
              <Input
                id="bnpl-item"
                value={itemDescription}
                onChange={(e) => setItemDescription(e.target.value)}
                placeholder="e.g. Samsung 43-inch Smart TV"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bnpl-amount">Purchase Amount (R)</Label>
              <Input
                id="bnpl-amount"
                type="number"
                min={1}
                value={purchaseAmount || ''}
                onChange={(e) => setPurchaseAmount(Number(e.target.value) || 0)}
              />
              {selectedProvider && purchaseAmount > selectedProvider.maxAmount && (
                <p className="text-xs text-[#FF5722]">
                  Exceeds {selectedProvider.name} max of R{selectedProvider.maxAmount.toLocaleString('en-ZA')}.
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label htmlFor="bnpl-merchant">Merchant ID (optional)</Label>
                <Input
                  id="bnpl-merchant"
                  value={merchantId}
                  onChange={(e) => setMerchantId(e.target.value)}
                  placeholder="mrc-xxx"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bnpl-mname">Merchant Name</Label>
                <Input
                  id="bnpl-mname"
                  value={merchantName}
                  onChange={(e) => setMerchantName(e.target.value)}
                  placeholder="Game / Makro / Takealot"
                />
              </div>
            </div>

            {/* Instalment Preview */}
            {purchaseAmount > 0 && selectedProvider && (
              <Card className="bg-gray-50 border-gray-200">
                <CardContent className="p-3">
                  <p className="text-[10px] text-[#757575] mb-1 uppercase">Instalment Preview</p>
                  <p className="text-sm font-bold text-[#1A1A1A]">
                    {term} payments of R {instalmentPreview.toFixed(2)}
                  </p>
                  <p className="text-[10px] text-[#4CAF50] mt-1">0% interest — pay on time, pay nothing extra.</p>
                </CardContent>
              </Card>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('explainer')} className="flex-1">Back</Button>
              <Button
                onClick={() => setStep('review')}
                disabled={!providerId || purchaseAmount <= 0 || (selectedProvider && purchaseAmount > selectedProvider.maxAmount)}
                className="flex-1 bg-[#9C27B0] hover:bg-[#7B1FA2]"
              >
                Review <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {step === 'review' && selectedProvider && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-[#1A1A1A]">Review Your Plan</h3>

            <Card className="bg-gray-50 border-gray-200">
              <CardContent className="p-4 space-y-2 text-sm">
                <Row label="Provider" value={selectedProvider.name} />
                <Row label="Item" value={itemDescription || 'BNPL purchase'} />
                <Row label="Purchase Amount" value={`R ${purchaseAmount.toLocaleString('en-ZA')}`} bold />
                {merchantName && <Row label="Merchant" value={merchantName} />}
                <div className="border-t border-gray-100 my-2" />
                <Row label="Instalments" value={`${term} × R ${instalmentPreview.toFixed(2)}`} />
                <Row label="Interest" value="0%" />
                <Row label="Total Repayable" value={`R ${purchaseAmount.toLocaleString('en-ZA')}`} bold />
              </CardContent>
            </Card>

            <div className="bg-amber-50 rounded-lg p-3 flex items-start gap-2">
              <ShieldCheck className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-700">
                By confirming, you agree to a DebiCheck mandate. Payments are auto-debited from your bank account on the due dates.
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('apply')} className="flex-1">Back</Button>
              <Button
                onClick={handleConfirm}
                disabled={saving}
                className="flex-1 bg-[#9C27B0] hover:bg-[#7B1FA2]"
              >
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                Confirm Plan
              </Button>
            </div>
          </div>
        )}

        {step === 'plan' && plan && (
          <div className="space-y-4">
            <div className="text-center py-3">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
                <Check className="h-7 w-7 text-green-600" />
              </div>
              <h3 className="text-base font-bold text-[#1A1A1A]">Plan Created</h3>
              <p className="text-xs text-[#757575]">{plan.message}</p>
            </div>

            <Card className="bg-white border-gray-200">
              <CardContent className="p-4">
                <div className="space-y-1.5 text-xs">
                  <Row label="Plan ID" value={plan.planId} mono bold />
                  <Row label="Reference" value={plan.caseRef} mono />
                  <Row label="Receipt No" value={plan.receiptNo} mono />
                  <div className="border-t border-gray-100 my-2" />
                  <Row label="Provider" value={plan.provider} />
                  <Row label="Item" value={plan.itemDescription} />
                  {plan.merchant && <Row label="Merchant" value={plan.merchant} />}
                  <Row label="Purchase" value={`R ${plan.purchaseAmount.toLocaleString('en-ZA')}`} bold />
                  <Row label="Next Due" value={plan.nextDueDate ? new Date(plan.nextDueDate).toLocaleDateString('en-ZA') : '—'} />
                </div>
              </CardContent>
            </Card>

            <div>
              <p className="text-xs font-semibold text-[#1A1A1A] mb-2">Instalment Schedule</p>
              <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                {plan.instalments.map((i) => (
                  <div
                    key={i.number}
                    className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-100"
                  >
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3 text-[#757575]" />
                      <span className="text-xs text-[#1A1A1A]">
                        #{i.number} — {new Date(i.dueDate).toLocaleDateString('en-ZA')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#1A1A1A]">R {i.amount.toFixed(2)}</span>
                      <Badge className="bg-amber-100 text-amber-700 border-0 text-[10px] capitalize">
                        {i.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Card className="bg-[#E0F2F1] border-[#00897B]">
              <CardContent className="p-3">
                <p className="text-[10px] font-semibold text-[#00897B] mb-1">Terms</p>
                <ul className="text-[10px] text-[#1A1A1A] space-y-1 list-disc list-inside">
                  {plan.terms.map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Button onClick={handleClose} className="w-full bg-[#9C27B0] hover:bg-[#7B1FA2]">
              Done
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
