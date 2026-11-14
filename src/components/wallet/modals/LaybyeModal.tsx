'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { apiGet, apiPost } from '@/components/wallet/lib/api'
import {
  ShoppingBag,
  CheckCircle2,
  Calendar,
  Clock,
  ChevronRight,
  Plus,
  Loader2,
  AlertCircle,
  Shield,
  FileText,
  Archive,
} from 'lucide-react'

interface LaybyeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface Laybye {
  id: string
  merchant: string
  item: string
  itemPrice: number
  deposit: number
  totalPaid: number
  remainingBalance: number
  instalmentAmount: number
  instalmentsPaid: number
  totalInstalments: number
  nextDueDate: string | null
  expiresAt: string | null
  status: string
  ncaProtected: boolean
  progress: number
  createdAt: string
}

interface LaybyeResult {
  laybyeId: string
  caseRef: string
  receiptNo: string
  merchant: string
  merchantId: string | null
  item: string
  itemPrice: number
  deposit: number
  totalPaid: number
  remainingBalance: number
  instalmentAmount: number
  instalmentsPaid: number
  totalInstalments: number
  lastInstalmentAmount: number
  nextDueDate: string
  expiresAt: string
  status: string
  ncaProtected: boolean
  schedule: { number: number; amount: number; dueDate: string; status: string }[]
  terms: string[]
  message: string
}

type Step = 'list' | 'create' | 'review' | 'agreement'

export function LaybyeModal({ open, onOpenChange }: LaybyeModalProps) {
  const [step, setStep] = useState<Step>('list')
  const [laybyes, setLaybyes] = useState<Laybye[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [merchantName, setMerchantName] = useState('')
  const [merchantId, setMerchantId] = useState('')
  const [itemName, setItemName] = useState('')
  const [itemPrice, setItemPrice] = useState<number>(0)
  const [depositAmount, setDepositAmount] = useState<number>(0)
  const [instalmentAmount, setInstalmentAmount] = useState<number>(0)

  const [result, setResult] = useState<LaybyeResult | null>(null)

  const loadLaybyes = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiGet<{ success?: boolean; data?: { laybyes?: Laybye[] } }>('/laybye')
      const data = res?.data ?? {}
      setLaybyes(Array.isArray(data.laybyes) ? data.laybyes : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load laybyes')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    loadLaybyes()
  }, [open, loadLaybyes])

  const remaining = useMemo(() => Math.max(0, itemPrice - depositAmount), [itemPrice, depositAmount])
  const projectedInstalments = useMemo(
    () => instalmentAmount > 0 ? Math.ceil(remaining / instalmentAmount) : 0,
    [remaining, instalmentAmount],
  )

  const activeLaybyes = laybyes.filter((l) => l.status === 'active' || l.status === 'pending')
  const completedLaybyes = laybyes.filter((l) => l.status === 'completed')

  const handleClose = () => {
    setStep('list')
    setMerchantName('')
    setMerchantId('')
    setItemName('')
    setItemPrice(0)
    setDepositAmount(0)
    setInstalmentAmount(0)
    setResult(null)
    setError(null)
    onOpenChange(false)
  }

  const handleConfirm = useCallback(async () => {
    if (!itemName.trim() || itemPrice <= 0 || depositAmount <= 0 || instalmentAmount <= 0) {
      setError('Please complete all fields')
      return
    }
    if (depositAmount > itemPrice) {
      setError('Deposit cannot exceed item price')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const res = await apiPost<{ success?: boolean; data?: LaybyeResult; error?: string }>('/laybye', {
        merchantId: merchantId || null,
        merchantName: merchantName || undefined,
        itemName: itemName.trim(),
        itemPrice,
        depositAmount,
        instalmentAmount,
      })
      if (res?.success === false) {
        setError(res.error || 'Laybye creation failed')
        return
      }
      setResult(res?.data ?? null)
      setStep('agreement')
      await loadLaybyes()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Laybye creation failed')
    } finally {
      setSaving(false)
    }
  }, [itemName, itemPrice, depositAmount, instalmentAmount, merchantId, merchantName, loadLaybyes])

  const pctFor = (l: Laybye) =>
    l.itemPrice > 0 ? Math.min(100, Math.round((l.totalPaid / l.itemPrice) * 100)) : 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-[#FF5722]" />
            Digital Laybye
          </DialogTitle>
          <DialogDescription>
            Pay off an item in instalments — NCA protected, with a digital agreement.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg">
            <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* List — repository of laybyes */}
        {step === 'list' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs text-[#757575]">
              <Archive className="h-3 w-3" />
              <span>Your laybye repository — all agreements in one place.</span>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 text-[#FF5722] animate-spin" />
              </div>
            ) : (
              <>
                <div>
                  <p className="text-xs font-semibold text-[#1A1A1A] mb-2">Active Laybyes</p>
                  {activeLaybyes.length === 0 ? (
                    <div className="text-center py-6 bg-gray-50 rounded-xl">
                      <ShoppingBag className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-xs text-[#757575]">No active laybyes</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {activeLaybyes.map((l) => (
                        <div
                          key={l.id}
                          className="p-3 bg-white rounded-xl border border-gray-200"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-[#1A1A1A]">{l.item}</span>
                            <Badge className="bg-orange-100 text-orange-700 border-0 text-[10px] capitalize">
                              {l.status}
                            </Badge>
                          </div>
                          <p className="text-[10px] text-[#757575] mb-2">{l.merchant}</p>
                          <Progress value={pctFor(l)} className="h-2 mb-1" />
                          <div className="flex justify-between text-[10px] text-[#757575]">
                            <span>R {l.totalPaid.toFixed(0)} / R {l.itemPrice.toFixed(0)}</span>
                            <span>{l.instalmentsPaid}/{l.totalInstalments} paid</span>
                          </div>
                          {l.nextDueDate && (
                            <div className="flex items-center gap-1 mt-1">
                              <Calendar className="h-3 w-3 text-[#FF5722]" />
                              <span className="text-[10px] text-[#FF5722]">
                                Next: {new Date(l.nextDueDate).toLocaleDateString('en-ZA')}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {completedLaybyes.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-[#1A1A1A] mb-2">Completed</p>
                    <div className="space-y-1">
                      {completedLaybyes.map((l) => (
                        <div
                          key={l.id}
                          className="p-2 bg-green-50 rounded-lg border border-green-200 flex items-center gap-2"
                        >
                          <CheckCircle2 className="h-3 w-3 text-green-600" />
                          <span className="text-xs text-[#1A1A1A]">{l.item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            <Button onClick={() => { setStep('create') }} className="w-full bg-[#FF5722] hover:bg-[#E64A19]">
              <Plus className="h-4 w-4 mr-2" /> Start New Laybye
            </Button>
          </div>
        )}

        {/* Create */}
        {step === 'create' && (
          <div className="space-y-4">
            <button onClick={() => setStep('list')} className="text-xs text-[#00897B]">
              ← Back to laybyes
            </button>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="lb-item">Item Name</Label>
                <Input id="lb-item" value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="Samsung TV" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lb-price">Item Price (R)</Label>
                <Input id="lb-price" type="number" min={1} value={itemPrice || ''} onChange={(e) => setItemPrice(Number(e.target.value) || 0)} placeholder="2000" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="lb-deposit">Deposit (R)</Label>
                <Input id="lb-deposit" type="number" min={1} value={depositAmount || ''} onChange={(e) => setDepositAmount(Number(e.target.value) || 0)} placeholder="200" />
                {itemPrice > 0 && (
                  <div className="flex gap-1 flex-wrap">
                    {[10, 15, 20, 25].map((pct) => (
                      <Button
                        key={pct}
                        size="sm"
                        variant="outline"
                        className="h-6 px-2 text-[10px]"
                        onClick={() => setDepositAmount(Math.round(itemPrice * pct / 100))}
                      >
                        {pct}%
                      </Button>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lb-inst">Instalment (R)</Label>
                <Input id="lb-inst" type="number" min={1} value={instalmentAmount || ''} onChange={(e) => setInstalmentAmount(Number(e.target.value) || 0)} placeholder="100" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="lb-merchant">Merchant ID (optional)</Label>
                <Input id="lb-merchant" value={merchantId} onChange={(e) => setMerchantId(e.target.value)} placeholder="mrc-xxx" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lb-mname">Merchant Name</Label>
                <Input id="lb-mname" value={merchantName} onChange={(e) => setMerchantName(e.target.value)} placeholder="Edgars / Ackermans" />
              </div>
            </div>

            {/* Live summary */}
            {itemPrice > 0 && depositAmount > 0 && instalmentAmount > 0 && (
              <Card className="bg-gray-50 border-gray-200">
                <CardContent className="p-3 text-xs space-y-1">
                  <Row label="Item Price" value={`R ${itemPrice.toFixed(2)}`} />
                  <Row label="Deposit" value={`R ${depositAmount.toFixed(2)}`} />
                  <Row label="Remaining" value={`R ${remaining.toFixed(2)}`} />
                  <Row label="Instalments" value={`${projectedInstalments} × R ${instalmentAmount.toFixed(2)}/week`} bold />
                </CardContent>
              </Card>
            )}

            <Button
              onClick={() => setStep('review')}
              disabled={!itemName.trim() || itemPrice <= 0 || depositAmount <= 0 || instalmentAmount <= 0 || depositAmount > itemPrice}
              className="w-full bg-[#FF5722] hover:bg-[#E64A19]"
            >
              Review Agreement <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}

        {/* Review + NCA Terms */}
        {step === 'review' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-[#1A1A1A]">Review Agreement</h3>

            <Card className="bg-gray-50 border-gray-200">
              <CardContent className="p-4 space-y-2 text-sm">
                <Row label="Item" value={itemName} bold />
                {merchantName && <Row label="Merchant" value={merchantName} />}
                <Row label="Item Price" value={`R ${itemPrice.toFixed(2)}`} />
                <Row label="Deposit" value={`R ${depositAmount.toFixed(2)}`} />
                <div className="border-t border-gray-100 my-2" />
                <Row label="Remaining Balance" value={`R ${remaining.toFixed(2)}`} bold />
                <Row label="Weekly Instalment" value={`R ${instalmentAmount.toFixed(2)}`} />
                <Row label="Total Instalments" value={`${projectedInstalments} weeks`} />
              </CardContent>
            </Card>

            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="h-4 w-4 text-amber-600" />
                  <p className="text-xs font-semibold text-amber-800">NCA Protected Laybye</p>
                </div>
                <ul className="text-[10px] text-amber-700 space-y-1 list-disc list-inside">
                  <li>Cancel within 48 hours for a full refund.</li>
                  <li>Up to 1% cancellation fee thereafter.</li>
                  <li>Item held for up to 6 months.</li>
                  <li>Merchant must release item once fully paid.</li>
                </ul>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('create')} className="flex-1">Back</Button>
              <Button
                onClick={handleConfirm}
                disabled={saving}
                className="flex-1 bg-[#FF5722] hover:bg-[#E64A19]"
              >
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                Create Laybye
              </Button>
            </div>
          </div>
        )}

        {/* Agreement */}
        {step === 'agreement' && result && (
          <div className="space-y-4">
            <div className="text-center py-3">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="h-7 w-7 text-green-600" />
              </div>
              <h3 className="text-base font-bold text-[#1A1A1A]">Laybye Agreement Created</h3>
              <p className="text-xs text-[#757575]">{result.message}</p>
            </div>

            <Card className="bg-white border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-[#FF5722]" />
                  <span className="text-sm font-bold text-[#1A1A1A]">Agreement</span>
                  <Badge className="bg-green-100 text-green-700 border-0 text-[10px] ml-auto capitalize">
                    {result.status}
                  </Badge>
                </div>

                <div className="space-y-1.5 text-xs">
                  <Row label="Agreement ID" value={result.laybyeId} mono bold />
                  <Row label="Reference" value={result.caseRef} mono />
                  <Row label="Receipt No" value={result.receiptNo} mono />
                  <div className="border-t border-gray-100 my-2" />
                  <Row label="Item" value={result.item} />
                  <Row label="Merchant" value={result.merchant} />
                  <Row label="Item Price" value={`R ${result.itemPrice.toFixed(2)}`} />
                  <Row label="Deposit Paid" value={`R ${result.deposit.toFixed(2)}`} bold />
                  <Row label="Remaining" value={`R ${result.remainingBalance.toFixed(2)}`} />
                  <Row label="Instalments" value={`${result.totalInstalments} × R ${result.instalmentAmount.toFixed(2)}`} />
                  <Row label="Next Due" value={new Date(result.nextDueDate).toLocaleDateString('en-ZA')} />
                  <Row label="Expires" value={new Date(result.expiresAt).toLocaleDateString('en-ZA')} />
                </div>
              </CardContent>
            </Card>

            <div>
              <p className="text-xs font-semibold text-[#1A1A1A] mb-2">Instalment Schedule</p>
              <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                {result.schedule.map((i) => (
                  <div
                    key={i.number}
                    className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-100"
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3 text-[#757575]" />
                      <span className="text-xs text-[#1A1A1A]">
                        #{i.number} — {new Date(i.dueDate).toLocaleDateString('en-ZA')}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-[#1A1A1A]">R {i.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            <Card className="bg-[#E0F2F1] border-[#00897B]">
              <CardContent className="p-3">
                <p className="text-[10px] font-semibold text-[#00897B] mb-1">Terms & Conditions</p>
                <ul className="text-[10px] text-[#1A1A1A] space-y-1 list-disc list-inside max-h-32 overflow-y-auto">
                  {result.terms.map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Button onClick={handleClose} className="w-full bg-[#FF5722] hover:bg-[#E64A19]">
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
