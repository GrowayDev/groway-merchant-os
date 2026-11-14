'use client'

import { useState, useCallback, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { apiPost, formatMoney } from '@/components/wallet/lib/api'
import {
  Building2,
  Check,
  Loader2,
  AlertCircle,
  ChevronRight,
  Info,
} from 'lucide-react'

interface MunicipalBillsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type Municipality = {
  id: string
  name: string
  country: 'ZA' | 'MW'
  province: string
}

type Step = 'select' | 'details' | 'amount' | 'confirm' | 'result'

type PaymentResult = {
  receiptNo: string
  accountNumber: string
  amountCents: string | bigint | number
  municipality: { id: string; name: string; country: string; province: string }
  billType: string
  instructions?: string[]
  createdAt?: string
}

const FALLBACK_MUNICIPALITIES: Municipality[] = [
  { id: 'za-joburg', name: 'City of Johannesburg', country: 'ZA', province: 'Gauteng' },
  { id: 'za-cape', name: 'City of Cape Town', country: 'ZA', province: 'Western Cape' },
  { id: 'za-ekurhuleni', name: 'City of Ekurhuleni', country: 'ZA', province: 'Gauteng' },
  { id: 'za-tshwane', name: 'City of Tshwane', country: 'ZA', province: 'Gauteng' },
  { id: 'za-ethkwini', name: 'eThekwini Municipality', country: 'ZA', province: 'KwaZulu-Natal' },
  { id: 'mw-lilongwe', name: 'Lilongwe City Council', country: 'MW', province: 'Central Region' },
  { id: 'mw-blantyre', name: 'Blantyre City Council', country: 'MW', province: 'Southern Region' },
]

const BILL_TYPES = [
  { id: 'rates', label: 'Property Rates' },
  { id: 'water', label: 'Water & Sanitation' },
  { id: 'electricity', label: 'Electricity' },
  { id: 'refuse', label: 'Refuse Removal' },
  { id: 'other', label: 'Other' },
] as const

export function MunicipalBillsModal({ open, onOpenChange }: MunicipalBillsModalProps) {
  const [step, setStep] = useState<Step>('select')
  const [municipalities] = useState<Municipality[]>(FALLBACK_MUNICIPALITIES)
  const [selected, setSelected] = useState<Municipality | null>(null)
  const [accountNumber, setAccountNumber] = useState('')
  const [billType, setBillType] = useState<string>('rates')
  const [amountRands, setAmountRands] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<PaymentResult | null>(null)

  const accountValid = useMemo(
    () => accountNumber.trim().length >= 5 && accountNumber.trim().length <= 30,
    [accountNumber],
  )

  const grouped = useMemo(() => {
    const g: Record<string, Municipality[]> = { ZA: [], MW: [] }
    for (const m of municipalities) g[m.country]?.push(m)
    return g
  }, [municipalities])

  const handlePay = useCallback(async () => {
    if (!selected || !accountValid || amountRands <= 0) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await apiPost<PaymentResult & { success?: boolean; error?: string }>(
        '/bills/municipal',
        {
          municipalityId: selected.id,
          accountNumber,
          billType,
          amountCents: Math.round(amountRands * 100),
        },
      )
      if (res?.success === false) {
        setError(res.error || 'Municipal bill payment failed')
        return
      }
      setResult(res)
      setStep('result')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Municipal payment failed')
    } finally {
      setIsLoading(false)
    }
  }, [selected, accountNumber, accountValid, billType, amountRands])

  const handleClose = useCallback(() => {
    setStep('select')
    setSelected(null)
    setAccountNumber('')
    setBillType('rates')
    setAmountRands(0)
    setResult(null)
    setError(null)
    onOpenChange(false)
  }, [onOpenChange])

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? null : handleClose())}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <DialogTitle className="text-base">Pay Municipal Bill</DialogTitle>
              <DialogDescription className="text-xs">
                Rates, water, electricity &amp; refuse — SA &amp; Malawi metros
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {step !== 'result' && (
          <div className="flex items-start gap-2 rounded-md bg-sky-50 border border-sky-200 p-3 text-xs text-sky-900">
            <Info className="h-4 w-4 mt-0.5 flex-shrink-0 text-sky-600" />
            <p>
              Municipal payments post to your account within <strong>2 business days</strong>.
              Keep your receipt number for any queries with the municipality.
            </p>
          </div>
        )}

        {/* Step: select municipality */}
        {step === 'select' && (
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Select municipality</Label>
              <p className="text-xs text-muted-foreground mt-1">Grouped by country</p>
            </div>

            {(['ZA', 'MW'] as const).map((country) => (
              <div key={country} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {country === 'ZA' ? 'South Africa' : 'Malawi'}
                  </Badge>
                  <div className="h-px bg-border flex-1" />
                </div>
                <div className="space-y-1.5">
                  {grouped[country]?.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        setSelected(m)
                        setStep('details')
                      }}
                      className="w-full flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-accent/40 transition-colors text-left"
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{m.name}</span>
                        <span className="text-[11px] text-muted-foreground">{m.province}</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Step: enter account + bill type */}
        {step === 'details' && selected && (
          <div className="space-y-4">
            <button
              onClick={() => setStep('select')}
              className="text-xs text-primary hover:underline"
            >
              ← Change municipality
            </button>

            <Card className="py-3">
              <CardContent className="px-4">
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">Municipality</span>
                  <span className="text-sm font-medium">{selected.name}</span>
                  <span className="text-[11px] text-muted-foreground">{selected.province}</span>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <Label htmlFor="account">Municipal account number</Label>
              <Input
                id="account"
                placeholder="e.g. 7001234567"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="font-mono text-base h-12"
              />
              <p className="text-xs text-muted-foreground">
                5 to 30 characters — usually printed on your monthly statement.
              </p>
              {accountNumber && !accountValid && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> Must be between 5 and 30 characters.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Bill type</Label>
              <div className="grid grid-cols-2 gap-2">
                {BILL_TYPES.map((bt) => (
                  <button
                    key={bt.id}
                    onClick={() => setBillType(bt.id)}
                    className={`py-2 px-3 rounded-lg text-xs font-medium transition-colors border ${
                      billType === bt.id
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-muted/40 hover:bg-accent/40'
                    }`}
                  >
                    {bt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('select')} className="flex-1">
                Back
              </Button>
              <Button
                onClick={() => setStep('amount')}
                disabled={!accountValid}
                className="flex-1"
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step: amount */}
        {step === 'amount' && selected && (
          <div className="space-y-4">
            <button
              onClick={() => setStep('details')}
              className="text-xs text-primary hover:underline"
            >
              ← Back
            </button>

            <div className="space-y-2">
              <Label>Amount to pay</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  R
                </span>
                <Input
                  type="number"
                  min={5}
                  step={1}
                  placeholder="0.00"
                  value={amountRands || ''}
                  onChange={(e) => setAmountRands(parseFloat(e.target.value) || 0)}
                  className="pl-8 h-12 text-lg font-medium"
                />
              </div>
              <p className="text-xs text-muted-foreground">Minimum R5.00</p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('details')} className="flex-1">
                Back
              </Button>
              <Button
                onClick={() => setStep('confirm')}
                disabled={amountRands < 5}
                className="flex-1"
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step: confirm */}
        {step === 'confirm' && selected && (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-3xl font-bold tabular-nums">
                {formatMoney(BigInt(Math.round(amountRands * 100)))}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {selected.name} •{' '}
                {BILL_TYPES.find((b) => b.id === billType)?.label ?? billType}
              </p>
            </div>

            <Card className="py-3 bg-muted/40">
              <CardContent className="px-4 space-y-2">
                <Row label="Municipality" value={selected.name} />
                <Row label="Account no." value={accountNumber} mono />
                <Row
                  label="Bill type"
                  value={BILL_TYPES.find((b) => b.id === billType)?.label ?? billType}
                />
                <Row label="Amount" value={formatMoney(BigInt(Math.round(amountRands * 100)))} />
                <Row label="Fee" value="FREE" className="text-emerald-600" />
              </CardContent>
            </Card>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-xs">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button onClick={handlePay} disabled={isLoading} className="w-full h-12">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Submitting payment…
                </>
              ) : (
                <>Pay Now</>
              )}
            </Button>

            <Button variant="outline" onClick={() => setStep('amount')} className="w-full">
              Back
            </Button>
          </div>
        )}

        {/* Step: result */}
        {step === 'result' && result && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-2">
                <Check className="h-7 w-7 text-emerald-600" />
              </div>
              <h3 className="text-base font-bold">Payment Submitted</h3>
              <p className="text-xs text-muted-foreground">
                {formatMoney(BigInt(String(result.amountCents)))} •{' '}
                {result.municipality.name}
              </p>
            </div>

            <Card className="py-3 bg-muted/40">
              <CardContent className="px-4 space-y-2">
                <Row label="Receipt no." value={result.receiptNo} mono />
                <Row label="Account no." value={result.accountNumber} mono />
                <Row label="Municipality" value={result.municipality.name} />
                <Row label="Bill type" value={result.billType} />
                <Row
                  label="Date"
                  value={new Date(result.createdAt ?? Date.now()).toLocaleString('en-ZA', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                />
                <div className="flex justify-between pt-1 border-t border-border mt-2">
                  <span className="text-xs text-muted-foreground">Status</span>
                  <Badge className="bg-emerald-100 text-emerald-700 border-0">Completed</Badge>
                </div>
              </CardContent>
            </Card>

            {result.instructions && result.instructions.length > 0 && (
              <div className="rounded-md bg-muted/40 p-3 space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">What happens next</p>
                <ul className="text-xs space-y-1">
                  {result.instructions.map((line, i) => (
                    <li key={i} className="text-muted-foreground">
                      {i + 1}. {line}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Button onClick={handleClose} className="w-full h-11">
              Done
            </Button>

            <p className="text-[10px] text-center text-muted-foreground">
              Transaction saved to your records
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function Row({
  label,
  value,
  mono,
  className,
}: {
  label: string
  value: string
  mono?: boolean
  className?: string
}) {
  return (
    <div className="flex justify-between items-center text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-medium ${mono ? 'font-mono' : ''} ${className ?? ''}`}>
        {value}
      </span>
    </div>
  )
}
