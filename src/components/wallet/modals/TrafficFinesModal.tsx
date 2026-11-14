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
  Car,
  Check,
  Loader2,
  AlertCircle,
  ChevronRight,
  Info,
} from 'lucide-react'

interface TrafficFinesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type Authority = {
  id: string
  name: string
  country: 'ZA' | 'MW'
  desc?: string
}

type Step = 'authority' | 'details' | 'amount' | 'confirm' | 'result'

type PaymentResult = {
  receiptNo: string
  fineNumber: string
  vehicleReg?: string
  amountCents: string | bigint | number
  authority: { id: string; name: string; country: string; desc?: string }
  instructions?: string[]
  createdAt?: string
}

const FALLBACK_AUTHORITIES: Authority[] = [
  { id: 'za-rtia', name: 'RTIA (AARTO)', country: 'ZA', desc: 'Road Traffic Infringement Agency' },
  { id: 'za-joburg-metro', name: 'Johannesburg Metro Police', country: 'ZA' },
  { id: 'za-cape-traffic', name: 'City of Cape Town Traffic', country: 'ZA' },
  { id: 'mw-lilongwe-traffic', name: 'Lilongwe Traffic Police', country: 'MW' },
  { id: 'mw-blantyre-traffic', name: 'Blantyre Traffic Police', country: 'MW' },
]

export function TrafficFinesModal({ open, onOpenChange }: TrafficFinesModalProps) {
  const [step, setStep] = useState<Step>('authority')
  const [authorities] = useState<Authority[]>(FALLBACK_AUTHORITIES)
  const [selected, setSelected] = useState<Authority | null>(null)
  const [fineNumber, setFineNumber] = useState('')
  const [vehicleReg, setVehicleReg] = useState('')
  const [amountRands, setAmountRands] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<PaymentResult | null>(null)

  const fineValid = useMemo(
    () => fineNumber.trim().length >= 4 && fineNumber.trim().length <= 40,
    [fineNumber],
  )

  const grouped = useMemo(() => {
    const g: Record<string, Authority[]> = { ZA: [], MW: [] }
    for (const a of authorities) g[a.country]?.push(a)
    return g
  }, [authorities])

  const handlePay = useCallback(async () => {
    if (!selected || !fineValid || amountRands <= 0) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await apiPost<PaymentResult & { success?: boolean; error?: string }>(
        '/bills/traffic-fines',
        {
          authorityId: selected.id,
          fineNumber,
          vehicleReg,
          amountCents: Math.round(amountRands * 100),
        },
      )
      if (res?.success === false) {
        setError(res.error || 'Traffic fine payment failed')
        return
      }
      setResult(res)
      setStep('result')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Traffic fine payment failed')
    } finally {
      setIsLoading(false)
    }
  }, [selected, fineNumber, fineValid, vehicleReg, amountRands])

  const handleClose = useCallback(() => {
    setStep('authority')
    setSelected(null)
    setFineNumber('')
    setVehicleReg('')
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
            <div className="w-9 h-9 rounded-lg bg-rose-50 flex items-center justify-center">
              <Car className="h-5 w-5 text-rose-600" />
            </div>
            <div>
              <DialogTitle className="text-base">Pay Traffic Fine</DialogTitle>
              <DialogDescription className="text-xs">
                AARTO / Metro Police / Malawi Traffic Police
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {step !== 'result' && (
          <div className="flex items-start gap-2 rounded-md bg-rose-50 border border-rose-200 p-3 text-xs text-rose-900">
            <Info className="h-4 w-4 mt-0.5 flex-shrink-0 text-rose-600" />
            <p>
              Pay your traffic fine before the <strong>court date</strong> on the
              infringement notice to avoid additional fees. AARTO payments reflect
              on the eNatis system within 48 hours.
            </p>
          </div>
        )}

        {/* Step: select authority */}
        {step === 'authority' && (
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Select issuing authority</Label>
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
                  {grouped[country]?.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => {
                        setSelected(a)
                        setStep('details')
                      }}
                      className="w-full flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-accent/40 transition-colors text-left"
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{a.name}</span>
                        {a.desc && (
                          <span className="text-[11px] text-muted-foreground">{a.desc}</span>
                        )}
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Step: details — fine number + vehicle reg */}
        {step === 'details' && selected && (
          <div className="space-y-4">
            <button
              onClick={() => setStep('authority')}
              className="text-xs text-primary hover:underline"
            >
              ← Change authority
            </button>

            <Card className="py-3">
              <CardContent className="px-4">
                <span className="text-xs text-muted-foreground">Issuing authority</span>
                <p className="text-sm font-medium">{selected.name}</p>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <Label htmlFor="fine-number">Fine / infringement number</Label>
              <Input
                id="fine-number"
                placeholder="e.g. AARTO-2024-0012345"
                value={fineNumber}
                onChange={(e) => setFineNumber(e.target.value)}
                className="font-mono text-base h-12"
              />
              <p className="text-xs text-muted-foreground">
                Found on your infringement notice — 4 to 40 characters.
              </p>
              {fineNumber && !fineValid && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> Must be between 4 and 40 characters.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="vehicle-reg">Vehicle registration (optional)</Label>
              <Input
                id="vehicle-reg"
                placeholder="e.g. GP 123 ABC"
                value={vehicleReg}
                onChange={(e) => setVehicleReg(e.target.value)}
                className="h-11 uppercase font-mono"
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('authority')} className="flex-1">
                Back
              </Button>
              <Button
                onClick={() => setStep('amount')}
                disabled={!fineValid}
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
              <Label>Fine amount</Label>
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
              <p className="text-xs text-muted-foreground">
                Enter the amount on your infringement notice. Min R5.
              </p>
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
                {selected.name} • Fine {fineNumber}
              </p>
            </div>

            <Card className="py-3 bg-muted/40">
              <CardContent className="px-4 space-y-2">
                <Row label="Authority" value={selected.name} />
                <Row label="Fine no." value={fineNumber} mono />
                {vehicleReg && <Row label="Vehicle reg." value={vehicleReg} mono />}
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
                <>Pay Fine</>
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
              <h3 className="text-base font-bold">Fine Paid</h3>
              <p className="text-xs text-muted-foreground">
                {formatMoney(BigInt(String(result.amountCents)))} •{' '}
                {result.authority.name}
              </p>
            </div>

            <Card className="py-3 bg-muted/40">
              <CardContent className="px-4 space-y-2">
                <Row label="Receipt no." value={result.receiptNo} mono />
                <Row label="Fine no." value={result.fineNumber} mono />
                {result.vehicleReg && (
                  <Row label="Vehicle reg." value={result.vehicleReg} mono />
                )}
                <Row label="Authority" value={result.authority.name} />
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
