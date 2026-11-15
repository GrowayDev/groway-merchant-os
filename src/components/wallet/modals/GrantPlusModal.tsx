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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { apiGet, apiPost } from '@/components/wallet/lib/api'
import {
  Users,
  CheckCircle2,
  Calendar,
  ChevronRight,
  Loader2,
  AlertCircle,
  Download,
  FileText,
} from 'lucide-react'

interface GrantPlusModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface GrantType {
  value: string
  label: string
  amount: number
  frequency: string
  desc: string
  perChild?: boolean
  ageReq?: number
}

interface PaymentDate {
  month: string
  date: string
}

interface GrantResult {
  applicationRef: string
  caseRef: string
  receiptNo: string
  grantType: string
  grantName: string
  grantDesc: string
  estimatedAmount: number
  beneficiaries: number
  nextPaymentDate: string
  status: string
  submittedAt: string
  processingDays: number
  paymentCalendar: PaymentDate[]
  terms: string[]
  message: string
}

type Step = 'explainer' | 'apply' | 'review' | 'success'

export function GrantPlusModal({ open, onOpenChange }: GrantPlusModalProps) {
  const [step, setStep] = useState<Step>('explainer')
  const [grantTypes, setGrantTypes] = useState<GrantType[]>([])
  const [paymentDates, setPaymentDates] = useState<PaymentDate[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [grantType, setGrantType] = useState('')
  const [idNumber, setIdNumber] = useState('')
  const [children, setChildren] = useState<number>(1)

  const [result, setResult] = useState<GrantResult | null>(null)

  const loadCatalog = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiGet<{ success?: boolean; data?: { grantTypes?: GrantType[]; paymentDates2026?: PaymentDate[] } }>('/grant')
      const data = res?.data ?? {}
      setGrantTypes(Array.isArray(data.grantTypes) ? data.grantTypes : [])
      setPaymentDates(Array.isArray(data.paymentDates2026) ? data.paymentDates2026 : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load grant data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    loadCatalog()
  }, [open, loadCatalog])

  const selectedGrant = grantTypes.find((g) => g.value === grantType)
  const estimatedAmount = useMemo(() => {
    if (!selectedGrant) return 0
    return selectedGrant.perChild ? selectedGrant.amount * Math.max(1, children) : selectedGrant.amount
  }, [selectedGrant, children])

  const handleClose = () => {
    setStep('explainer')
    setGrantType('')
    setIdNumber('')
    setChildren(1)
    setResult(null)
    setError(null)
    onOpenChange(false)
  }

  const handleApply = useCallback(async () => {
    if (!grantType) {
      setError('Please select a grant type')
      return
    }
    if (!idNumber || idNumber.length < 6) {
      setError('Please enter a valid ID number')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const res = await apiPost<{ success?: boolean; data?: GrantResult; error?: string }>('/grant', {
        grantType,
        idNumber,
        children,
      })
      if (res?.success === false) {
        setError(res.error || 'Application failed')
        return
      }
      setResult(res?.data ?? null)
      setStep('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Application failed')
    } finally {
      setSaving(false)
    }
  }, [grantType, idNumber, children])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-[#FF9800]" />
            Grant+ for SASSA
          </DialogTitle>
          <DialogDescription>
            Apply for South African Social Security Agency grants.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg">
            <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Explainer */}
        {step === 'explainer' && (
          <div className="space-y-4">
            <Card className="bg-orange-50 border-orange-200">
              <CardContent className="p-3">
                <p className="text-xs text-orange-800">
                  Grant+ helps you apply for SASSA grants. The South African Social Security Agency
                  pays grants monthly. Grant types include Old Age, Disability, Child Support, Foster
                  Child, Care Dependency, War Veterans, Grant-in-Aid and Social Relief of Distress.
                </p>
              </CardContent>
            </Card>

            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 text-[#FF9800] animate-spin" />
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-[#1A1A1A] mb-2">Available Grants</p>
                {grantTypes.map((g) => (
                  <button
                    key={g.value}
                    onClick={() => { setGrantType(g.value); setStep('apply') }}
                    className="w-full p-2.5 rounded-xl bg-white border border-gray-200 text-left hover:border-[#FF9800] transition-colors flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium text-[#1A1A1A]">{g.label}</p>
                      <p className="text-[10px] text-[#757575]">{g.desc}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-[#FF9800]">R{g.amount.toLocaleString('en-ZA')}</p>
                      <p className="text-[9px] text-[#757575]">/{g.frequency}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Payment calendar */}
            {paymentDates.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-[#1A1A1A] mb-2">2026 Payment Calendar</p>
                <div className="grid grid-cols-3 gap-1 max-h-32 overflow-y-auto">
                  {paymentDates.map((p) => (
                    <div key={p.month} className="p-1.5 rounded bg-gray-50 border border-gray-100 text-center">
                      <p className="text-[9px] text-[#757575]">{p.month.split(' ')[0]}</p>
                      <p className="text-[10px] font-bold text-[#1A1A1A]">
                        {new Date(p.date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Apply form */}
        {step === 'apply' && selectedGrant && (
          <div className="space-y-4">
            <button onClick={() => setStep('explainer')} className="text-xs text-[#FF9800]">
              ← Back to grant types
            </button>

            <Card className="bg-orange-50 border-orange-200">
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-[#1A1A1A]">{selectedGrant.label}</span>
                  <Badge className="bg-[#FF9800]/20 text-[#FF9800] border-0">
                    R{selectedGrant.amount}/mo
                  </Badge>
                </div>
                <p className="text-[10px] text-[#757575]">{selectedGrant.desc}</p>
                {selectedGrant.ageReq && (
                  <p className="text-[10px] text-[#FF5722] mt-1">Age requirement: {selectedGrant.ageReq}+ years.</p>
                )}
              </CardContent>
            </Card>

            <div className="space-y-2">
              <Label htmlFor="g-id">SA ID Number</Label>
              <Input
                id="g-id"
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                placeholder="9001015000088"
                maxLength={13}
              />
            </div>

            {selectedGrant.perChild && (
              <div className="space-y-2">
                <Label htmlFor="g-children">Number of Children</Label>
                <Input
                  id="g-children"
                  type="number"
                  min={1}
                  max={10}
                  value={children}
                  onChange={(e) => setChildren(Math.max(1, Number(e.target.value) || 1))}
                />
                <p className="text-[10px] text-[#757575]">
                  Child Support Grant is paid per child.
                </p>
              </div>
            )}

            <Card className="bg-gray-50 border-gray-200">
              <CardContent className="p-3 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-[#757575]">Estimated Amount</span>
                  <span className="font-bold text-[#1A1A1A]">R {estimatedAmount.toLocaleString('en-ZA')}/month</span>
                </div>
                {selectedGrant.perChild && (
                  <div className="flex justify-between">
                    <span className="text-[#757575]">Beneficiaries</span>
                    <span className="font-medium text-[#1A1A1A]">{children} child(ren)</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('explainer')} className="flex-1">Back</Button>
              <Button
                onClick={() => setStep('review')}
                disabled={!idNumber || idNumber.length < 6}
                className="flex-1 bg-[#FF9800] hover:bg-[#F57C00]"
              >
                Review <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Review */}
        {step === 'review' && selectedGrant && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-[#1A1A1A]">Review Application</h3>

            <Card className="bg-gray-50 border-gray-200">
              <CardContent className="p-4 space-y-2 text-sm">
                <Row label="Grant" value={selectedGrant.label} bold />
                <Row label="ID Number" value={idNumber} mono />
                {selectedGrant.perChild && <Row label="Children" value={String(children)} />}
                <div className="border-t border-gray-100 my-2" />
                <Row label="Estimated Amount" value={`R ${estimatedAmount.toLocaleString('en-ZA')}/mo`} bold />
              </CardContent>
            </Card>

            <div className="bg-orange-50 rounded-lg p-3">
              <p className="text-[11px] text-orange-700">
                By submitting, you confirm the information is correct. SASSA will verify your ID and conduct a means test.
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('apply')} className="flex-1">Back</Button>
              <Button
                onClick={handleApply}
                disabled={saving}
                className="flex-1 bg-[#FF9800] hover:bg-[#F57C00]"
              >
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                Submit Application
              </Button>
            </div>
          </div>
        )}

        {/* Success */}
        {step === 'success' && result && (
          <div className="space-y-4">
            <div className="text-center py-3">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="h-7 w-7 text-green-600" />
              </div>
              <h3 className="text-base font-bold text-[#1A1A1A]">Application Submitted</h3>
              <p className="text-xs text-[#757575]">{result.message}</p>
            </div>

            <Card className="bg-white border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-[#FF9800]" />
                  <span className="text-sm font-bold text-[#1A1A1A]">Application Summary</span>
                  <Badge className="bg-amber-100 text-amber-700 border-0 text-[10px] ml-auto capitalize">
                    {result.status}
                  </Badge>
                </div>
                <div className="space-y-1.5 text-xs">
                  <Row label="Application Ref" value={result.applicationRef} mono bold />
                  <Row label="Reference" value={result.caseRef} mono />
                  <Row label="Receipt No" value={result.receiptNo} mono />
                  <div className="border-t border-gray-100 my-2" />
                  <Row label="Grant" value={result.grantName} />
                  <Row label="Estimated Amount" value={`R ${result.estimatedAmount.toLocaleString('en-ZA')}/mo`} bold />
                  <Row label="Beneficiaries" value={String(result.beneficiaries)} />
                  <Row label="Processing" value={`~${result.processingDays} days`} />
                  <div className="border-t border-gray-100 my-2" />
                  <div className="flex items-center justify-between">
                    <span className="text-[#757575]">Next Payment Date</span>
                    <span className="font-bold text-[#FF9800]">
                      {new Date(result.nextPaymentDate).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Mini calendar */}
            {result.paymentCalendar.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-[#1A1A1A] mb-2">2026 Payment Calendar</p>
                <div className="grid grid-cols-4 gap-1 max-h-32 overflow-y-auto">
                  {result.paymentCalendar.map((p) => (
                    <div
                      key={p.month}
                      className={`p-1.5 rounded border text-center ${
                        p.date === result.nextPaymentDate
                          ? 'bg-[#FF9800]/20 border-[#FF9800]'
                          : 'bg-gray-50 border-gray-100'
                      }`}
                    >
                      <Calendar className="h-2.5 w-2.5 mx-auto text-[#757575]" />
                      <p className="text-[9px] text-[#757575] mt-0.5">{p.month.split(' ')[0].slice(0, 3)}</p>
                      <p className="text-[10px] font-bold text-[#1A1A1A]">
                        {new Date(p.date).getDate()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Card className="bg-[#E0F2F1] border-[#00897B]">
              <CardContent className="p-3">
                <p className="text-[10px] font-semibold text-[#00897B] mb-1">Terms</p>
                <ul className="text-[10px] text-[#1A1A1A] space-y-1 list-disc list-inside max-h-32 overflow-y-auto">
                  {result.terms.map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Button onClick={handleClose} className="w-full bg-[#FF9800] hover:bg-[#F57C00]">
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
