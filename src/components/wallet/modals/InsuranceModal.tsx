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
import { apiGet, apiPost, formatMoney } from '@/components/wallet/lib/api'
import {
  Shield,
  ShieldCheck,
  Heart,
  Car,
  Home,
  Building,
  Plane,
  Stethoscope,
  Briefcase,
  Ribbon,
  Check,
  Loader2,
  AlertCircle,
  Star,
  FileText,
  Phone,
  ChevronRight,
} from 'lucide-react'

interface InsuranceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface Category {
  value: string
  label: string
  icon: string
  desc: string
  requiresMedical: boolean
}

interface Provider {
  id: string
  name: string
  categories: string[]
  phone: string
}

interface PolicyResult {
  policyNo: string
  caseRef: string
  receiptNo: string
  category: string
  categoryLabel: string
  categoryIcon: string
  provider: string
  providerId: string
  providerPhone: string
  coverAmount: string
  premium: string
  nextPaymentDate: string
  startDate: string
  status: string
  beneficiaries: unknown[]
  requiresMedical: boolean
  terms: string[]
  message: string
}

type Step = 'browse' | 'details' | 'review' | 'policy'

const CATEGORY_ICONS: Record<string, typeof Heart> = {
  funeral: Heart,
  life: ShieldCheck,
  health: Stethoscope,
  vehicle: Car,
  home: Home,
  business: Building,
  travel: Plane,
  gap: Stethoscope,
  income_protection: Briefcase,
  dread_disease: Ribbon,
}

// Crude premium calculator — ~0.5% to ~3% of cover per month, varies by category.
function estimatePremium(coverRand: number, category: string): number {
  if (coverRand <= 0) return 0
  const rateMap: Record<string, number> = {
    funeral: 0.012,
    life: 0.018,
    health: 0.025,
    vehicle: 0.028,
    home: 0.008,
    business: 0.015,
    travel: 0.05,
    gap: 0.04,
    income_protection: 0.022,
    dread_disease: 0.030,
  }
  const rate = rateMap[category] ?? 0.015
  return Math.max(50, Math.round(coverRand * rate))
}

export function InsuranceModal({ open, onOpenChange }: InsuranceModalProps) {
  const [step, setStep] = useState<Step>('browse')
  const [categories, setCategories] = useState<Category[]>([])
  const [providers, setProviders] = useState<Provider[]>([])
  const [explainer, setExplainer] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedProviderId, setSelectedProviderId] = useState<string>('')
  const [coverRand, setCoverRand] = useState<number>(50000)
  const [monthlyPremium, setMonthlyPremium] = useState<number>(0)
  const [fullName, setFullName] = useState('')
  const [idNumber, setIdNumber] = useState('')

  const [policy, setPolicy] = useState<PolicyResult | null>(null)

  const loadCatalog = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiGet<{ success?: boolean; data?: { categories?: Category[]; providers?: Provider[]; explainer?: string } }>('/insurance')
      const data = res?.data ?? {}
      setCategories(Array.isArray(data.categories) ? data.categories : [])
      setProviders(Array.isArray(data.providers) ? data.providers : [])
      setExplainer(data.explainer ?? '')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load insurance catalog')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    loadCatalog()
  }, [open, loadCatalog])

  // Premium is auto-calculated unless the user overrides it.
  const computedPremium = useMemo(
    () => estimatePremium(coverRand, selectedCategory),
    [coverRand, selectedCategory],
  )

  useEffect(() => {
    setMonthlyPremium(computedPremium)
  }, [computedPremium])

  const filteredProviders = useMemo(
    () => providers.filter((p) => p.categories.includes(selectedCategory as never)),
    [providers, selectedCategory],
  )

  const selectedCategoryMeta = categories.find((c) => c.value === selectedCategory)
  const selectedProvider = providers.find((p) => p.id === selectedProviderId)

  const handleClose = () => {
    setStep('browse')
    setSelectedCategory('')
    setSelectedProviderId('')
    setCoverRand(50000)
    setMonthlyPremium(0)
    setFullName('')
    setIdNumber('')
    setPolicy(null)
    setError(null)
    onOpenChange(false)
  }

  const handleApply = useCallback(async () => {
    if (!selectedCategory || !selectedProviderId) return
    if (coverRand <= 0) {
      setError('Cover amount must be greater than 0')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const res = await apiPost<{ success?: boolean; data?: PolicyResult; error?: string }>('/insurance', {
        category: selectedCategory,
        providerId: selectedProviderId,
        coverAmount: Math.round(coverRand * 100),
        monthlyPremium: Math.round(monthlyPremium * 100),
        details: {
          fullName,
          idNumber,
        },
      })
      if (res?.success === false) {
        setError(res.error || 'Application failed')
        return
      }
      setPolicy(res?.data ?? null)
      setStep('policy')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Application failed')
    } finally {
      setSaving(false)
    }
  }, [selectedCategory, selectedProviderId, coverRand, monthlyPremium, fullName, idNumber])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-[#00897B]" />
            Insurance
          </DialogTitle>
          <DialogDescription>
            Cover for every stage of life — funeral, life, health, vehicle, home and more.
          </DialogDescription>
        </DialogHeader>

        {explainer && (
          <div className="flex items-start gap-2 p-3 bg-[#E0F2F1] rounded-lg">
            <ShieldCheck className="h-4 w-4 text-[#00897B] flex-shrink-0 mt-0.5" />
            <p className="text-xs text-[#1A1A1A]">{explainer}</p>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg">
            <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Browse categories */}
        {step === 'browse' && (
          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 text-[#00897B] animate-spin" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2">
                  {categories.map((cat) => {
                    const Icon = CATEGORY_ICONS[cat.value] ?? Shield
                    return (
                      <button
                        key={cat.value}
                        onClick={() => {
                          setSelectedCategory(cat.value)
                          setSelectedProviderId('')
                          setStep('details')
                        }}
                        className="p-3 rounded-xl border border-gray-200 hover:border-[#00897B] text-left transition-all"
                      >
                        <div className="w-10 h-10 rounded-lg bg-[#E0F2F1] flex items-center justify-center mb-2">
                          <Icon className="h-5 w-5 text-[#00897B]" />
                        </div>
                        <p className="text-sm font-medium text-[#1A1A1A]">{cat.label}</p>
                        <p className="text-[10px] text-[#757575] mt-0.5 line-clamp-2">{cat.desc}</p>
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* Enter details */}
        {step === 'details' && selectedCategoryMeta && (
          <div className="space-y-4">
            <button onClick={() => setStep('browse')} className="text-xs text-[#00897B]">
              ← Back to categories
            </button>

            <Card className="bg-[#E0F2F1] border-[#00897B]">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{selectedCategoryMeta.icon}</span>
                  <div>
                    <p className="text-sm font-bold text-[#1A1A1A]">{selectedCategoryMeta.label}</p>
                    <p className="text-[10px] text-[#757575]">{selectedCategoryMeta.desc}</p>
                  </div>
                </div>
                {selectedCategoryMeta.requiresMedical && (
                  <p className="text-[10px] text-[#FF5722] mt-2">
                    This cover may require a medical questionnaire or exam.
                  </p>
                )}
              </CardContent>
            </Card>

            <div className="space-y-2">
              <Label>Provider</Label>
              <Select
                value={selectedProviderId}
                onValueChange={setSelectedProviderId}
              >
                <SelectTrigger><SelectValue placeholder="Select insurer" /></SelectTrigger>
                <SelectContent>
                  {filteredProviders.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {filteredProviders.length === 0 && (
                <p className="text-xs text-[#FF5722]">No providers offer this category.</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="ins-cover">Cover Amount (R)</Label>
              <Input
                id="ins-cover"
                type="number"
                min={1000}
                step={1000}
                value={coverRand || ''}
                onChange={(e) => setCoverRand(Number(e.target.value) || 0)}
              />
              <div className="flex gap-2 flex-wrap">
                {[10000, 50000, 100000, 250000].map((amt) => (
                  <Button
                    key={amt}
                    variant="outline"
                    size="sm"
                    onClick={() => setCoverRand(amt)}
                    className={coverRand === amt ? 'border-[#00897B] bg-[#E0F2F1]' : ''}
                  >
                    R{amt.toLocaleString()}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ins-premium">Monthly Premium (R) — auto-calculated</Label>
              <Input
                id="ins-premium"
                type="number"
                min={1}
                value={monthlyPremium || ''}
                onChange={(e) => setMonthlyPremium(Number(e.target.value) || 0)}
              />
              <p className="text-[10px] text-[#757575]">
                Based on cover amount and category. You can override if you have a quoted premium.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ins-name">Full Name</Label>
              <Input id="ins-name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jane Mokoena" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ins-id">ID Number</Label>
              <Input id="ins-id" value={idNumber} onChange={(e) => setIdNumber(e.target.value)} placeholder="9001015000088" />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('browse')} className="flex-1">Back</Button>
              <Button
                onClick={() => setStep('review')}
                disabled={!selectedProviderId || coverRand <= 0 || monthlyPremium <= 0}
                className="flex-1 bg-[#00897B] hover:bg-[#00695C]"
              >
                Review <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Review + confirm */}
        {step === 'review' && selectedCategoryMeta && selectedProvider && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-[#1A1A1A]">Review Your Application</h3>

            <Card className="bg-gray-50 border-gray-200">
              <CardContent className="p-4 space-y-2 text-sm">
                <Row label="Cover" value={selectedCategoryMeta.label} />
                <Row label="Provider" value={selectedProvider.name} />
                <Row label="Cover Amount" value={formatMoney(Math.round(coverRand * 100))} />
                <Row label="Monthly Premium" value={formatMoney(Math.round(monthlyPremium * 100))} bold />
                <Row label="Applicant" value={fullName || '—'} />
                <Row label="ID Number" value={idNumber || '—'} />
              </CardContent>
            </Card>

            <div className="bg-amber-50 rounded-lg p-3">
              <p className="text-xs font-semibold text-amber-800 mb-1">No credit check required</p>
              <p className="text-[11px] text-amber-700">
                Insurance premiums are based on cover amount, age and risk profile — not your credit history.
                You can subscribe regardless of your credit score.
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('details')} className="flex-1">Back</Button>
              <Button
                onClick={handleApply}
                disabled={saving}
                className="flex-1 bg-[#00897B] hover:bg-[#00695C]"
              >
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
                Apply Now
              </Button>
            </div>
          </div>
        )}

        {/* Policy document */}
        {step === 'policy' && policy && (
          <div className="space-y-4">
            <div className="text-center py-3">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
                <Check className="h-7 w-7 text-green-600" />
              </div>
              <h3 className="text-base font-bold text-[#1A1A1A]">Policy Submitted</h3>
              <p className="text-xs text-[#757575]">{policy.message}</p>
            </div>

            <Card className="bg-white border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-[#00897B]" />
                    <span className="text-sm font-bold text-[#1A1A1A]">Policy Schedule</span>
                  </div>
                  <Badge className="bg-amber-100 text-amber-700 border-0 capitalize">
                    {policy.status.replace('_', ' ')}
                  </Badge>
                </div>

                <div className="space-y-1.5 text-xs">
                  <Row label="Policy No" value={policy.policyNo} bold mono />
                  <Row label="Reference" value={policy.caseRef} mono />
                  <Row label="Receipt No" value={policy.receiptNo} mono />
                  <div className="border-t border-gray-100 my-2" />
                  <Row label="Cover" value={`${policy.categoryIcon} ${policy.categoryLabel}`} />
                  <Row label="Provider" value={policy.provider} />
                  <Row label="Cover Amount" value={formatMoney(policy.coverAmount)} bold />
                  <Row label="Monthly Premium" value={formatMoney(policy.premium)} bold />
                  <Row label="Start Date" value={policy.startDate} />
                  <Row label="Next Premium" value={policy.nextPaymentDate} />
                  {policy.requiresMedical && (
                    <p className="text-[10px] text-[#FF5722] mt-1">
                      Medical questionnaire may be required before activation.
                    </p>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-[10px] text-[#757575] mb-1">Provider Contact</p>
                  <div className="flex items-center gap-1">
                    <Phone className="h-3 w-3 text-[#757575]" />
                    <span className="text-xs text-[#1A1A1A]">{policy.providerPhone}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="p-3">
                <p className="text-xs font-semibold text-amber-800 mb-1">Terms & Conditions</p>
                <ul className="text-[10px] text-amber-700 space-y-1 list-disc list-inside max-h-32 overflow-y-auto">
                  {policy.terms.map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Button onClick={handleClose} className="w-full bg-[#00897B] hover:bg-[#00695C]">
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
    <div className="flex justify-between">
      <span className="text-[#757575]">{label}</span>
      <span className={`${bold ? 'font-bold' : 'font-medium'} text-[#1A1A1A] ${mono ? 'font-mono' : ''}`}>
        {value}
      </span>
    </div>
  )
}
