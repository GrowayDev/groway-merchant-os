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
  Zap,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  ChevronRight,
  Info,
} from 'lucide-react'

interface ElectricityModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type Provider = {
  id: string
  name: string
  country: 'ZA' | 'MW'
  type: string
  sts: boolean
}

type Step = 'provider' | 'meter' | 'amount' | 'confirm' | 'result'

type PurchaseResult = {
  receiptNo: string
  stsToken: string
  meterNumber: string
  amountCents: string | bigint | number
  provider: { id: string; name: string; country: string; sts: boolean }
  unitsKwh?: string
  instructions?: string[]
  createdAt?: string
}

// Fallback providers grouped by country — used only if the API hasn't loaded yet
const FALLBACK_PROVIDERS: Provider[] = [
  { id: 'za-eskom', name: 'Eskom Prepaid', country: 'ZA', type: 'electricity', sts: true },
  { id: 'za-joburg', name: 'City Power Johannesburg', country: 'ZA', type: 'electricity', sts: true },
  { id: 'za-cape', name: 'City of Cape Town', country: 'ZA', type: 'electricity', sts: true },
  { id: 'za-ekurhuleni', name: 'City of Ekurhuleni', country: 'ZA', type: 'electricity', sts: true },
  { id: 'za-tshwane', name: 'City of Tshwane', country: 'ZA', type: 'electricity', sts: true },
  { id: 'za-ethkwini', name: 'eThekwini Electricity', country: 'ZA', type: 'electricity', sts: true },
  { id: 'mw-escom', name: 'ESCOM Malawi', country: 'MW', type: 'electricity', sts: true },
  { id: 'mw-lilongwe', name: 'Lilongwe City Council', country: 'MW', type: 'electricity', sts: true },
  { id: 'mw-blantyre', name: 'Blantyre City Council', country: 'MW', type: 'electricity', sts: true },
]

const QUICK_AMOUNTS = [50, 100, 200, 500, 1000]

export function ElectricityModal({ open, onOpenChange }: ElectricityModalProps) {
  const [step, setStep] = useState<Step>('provider')
  const [providers, setProviders] = useState<Provider[]>(FALLBACK_PROVIDERS)
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null)
  const [meterNumber, setMeterNumber] = useState('')
  const [amountRands, setAmountRands] = useState<number>(0)
  const [phone, setPhone] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<PurchaseResult | null>(null)
  const [copied, setCopied] = useState(false)

  const meterValid = useMemo(() => {
    const digits = meterNumber.replace(/\D/g, '')
    return digits.length === 11 || digits.length === 20
  }, [meterNumber])

  const providersByCountry = useMemo(() => {
    const grouped: Record<string, Provider[]> = { ZA: [], MW: [] }
    for (const p of providers) grouped[p.country]?.push(p)
    return grouped
  }, [providers])

  const handleBuy = useCallback(async () => {
    if (!selectedProvider || !meterValid || amountRands <= 0) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await apiPost<PurchaseResult & { success?: boolean; error?: string }>(
        '/bills/electricity',
        {
          providerId: selectedProvider.id,
          meterNumber,
          phone,
          amountCents: Math.round(amountRands * 100),
        },
      )
      if (res?.success === false) {
        setError(res.error || 'Electricity purchase failed')
        return
      }
      setResult(res)
      setStep('result')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Electricity purchase failed')
    } finally {
      setIsLoading(false)
    }
  }, [selectedProvider, meterNumber, meterValid, amountRands, phone])

  const copyToken = useCallback(async () => {
    if (!result?.stsToken) return
    try {
      await navigator.clipboard.writeText(result.stsToken)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore
    }
  }, [result])

  const handleClose = useCallback(() => {
    setStep('provider')
    setSelectedProvider(null)
    setMeterNumber('')
    setAmountRands(0)
    setPhone('')
    setResult(null)
    setError(null)
    onOpenChange(false)
  }, [onOpenChange])

  const formatToken = (token: string) => {
    if (!token) return ''
    return token.replace(/(.{4})/g, '$1 ').trim()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? null : handleClose())}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
              <Zap className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <DialogTitle className="text-base">Buy Prepaid Electricity</DialogTitle>
              <DialogDescription className="text-xs">
                STS recharge token delivered instantly
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* STS explainer — always visible until result step */}
        {step !== 'result' && (
          <div className="flex items-start gap-2 rounded-md bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900">
            <Info className="h-4 w-4 mt-0.5 flex-shrink-0 text-amber-600" />
            <p>
              <strong>STS (Standard Transfer Specification)</strong> is the global
              standard for prepaid electricity meters. Your 20-digit recharge
              token is generated instantly.
            </p>
          </div>
        )}

        {/* Step: provider selection */}
        {step === 'provider' && (
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Select provider</Label>
              <p className="text-xs text-muted-foreground mt-1">
                Grouped by country — South Africa &amp; Malawi
              </p>
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
                  {providersByCountry[country]?.map((provider) => (
                    <button
                      key={provider.id}
                      onClick={() => {
                        setSelectedProvider(provider)
                        setStep('meter')
                      }}
                      className="w-full flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-accent/40 transition-colors text-left"
                    >
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-amber-500" />
                        <span className="text-sm font-medium">{provider.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {provider.sts && (
                          <Badge className="bg-amber-100 text-amber-700 border-0 text-[10px]">
                            STS
                          </Badge>
                        )}
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Step: meter number */}
        {step === 'provider_to_meter_placeholder' && null}

        {step === 'meter' && selectedProvider && (
          <div className="space-y-4">
            <button
              onClick={() => setStep('provider')}
              className="text-xs text-primary hover:underline"
            >
              ← Change provider
            </button>

            <Card className="py-3">
              <CardContent className="px-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-amber-500" />
                    <span className="text-sm font-medium">{selectedProvider.name}</span>
                  </div>
                  <Badge className="bg-amber-100 text-amber-700 border-0 text-[10px]">STS</Badge>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <Label htmlFor="meter-number">Meter number</Label>
              <Input
                id="meter-number"
                inputMode="numeric"
                placeholder="e.g. 04123456789 (11 digits) or 20-digit meter"
                value={meterNumber}
                onChange={(e) => setMeterNumber(e.target.value)}
                className="font-mono text-base tracking-wider h-12"
              />
              <p className="text-xs text-muted-foreground">
                Must be <strong>11 or 20 digits</strong> — check the number printed on your prepaid meter.
              </p>
              {meterNumber && !meterValid && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> Invalid length — enter 11 or 20 digits.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="For SMS receipt"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-11"
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('provider')} className="flex-1">
                Back
              </Button>
              <Button
                onClick={() => setStep('amount')}
                disabled={!meterValid}
                className="flex-1"
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step: amount */}
        {step === 'amount' && selectedProvider && (
          <div className="space-y-4">
            <button
              onClick={() => setStep('meter')}
              className="text-xs text-primary hover:underline"
            >
              ← Back to meter
            </button>

            <div className="space-y-2">
              <Label>Amount</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  R
                </span>
                <Input
                  type="number"
                  min={10}
                  step={1}
                  placeholder="0.00"
                  value={amountRands || ''}
                  onChange={(e) => setAmountRands(parseFloat(e.target.value) || 0)}
                  className="pl-8 h-12 text-lg font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {QUICK_AMOUNTS.map((value) => (
                <button
                  key={value}
                  onClick={() => setAmountRands(value)}
                  className={`py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    amountRands === value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground hover:bg-accent'
                  }`}
                >
                  R{value}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('meter')} className="flex-1">
                Back
              </Button>
              <Button
                onClick={() => setStep('confirm')}
                disabled={amountRands < 10}
                className="flex-1"
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step: confirm */}
        {step === 'confirm' && selectedProvider && (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-3xl font-bold tabular-nums">
                {formatMoney(BigInt(Math.round(amountRands * 100)))}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {selectedProvider.name} • Prepaid electricity
              </p>
            </div>

            <Card className="py-3 bg-muted/40">
              <CardContent className="px-4 space-y-2">
                <Row label="Provider" value={selectedProvider.name} />
                <Row label="Meter number" value={meterNumber} mono />
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

            <Button
              onClick={handleBuy}
              disabled={isLoading}
              className="w-full h-12"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Generating STS token…
                </>
              ) : (
                <>Buy Electricity</>
              )}
            </Button>

            <Button variant="outline" onClick={() => setStep('amount')} className="w-full">
              Back
            </Button>
          </div>
        )}

        {/* Step: result with STS token */}
        {step === 'result' && result && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-2">
                <Check className="h-7 w-7 text-emerald-600" />
              </div>
              <h3 className="text-base font-bold">Electricity Purchased</h3>
              <p className="text-xs text-muted-foreground">
                {formatMoney(BigInt(String(result.amountCents)))} •{' '}
                {result.provider.name}
              </p>
            </div>

            {/* STS token — large, copyable */}
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <Badge className="bg-amber-500 text-white border-0 text-[10px]">
                  STS RECHARGE TOKEN
                </Badge>
                <span className="text-[10px] text-amber-700">Key into meter</span>
              </div>
              <p className="text-xl font-mono font-bold text-amber-700 text-center tracking-[0.2em] break-all">
                {formatToken(result.stsToken)}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-3 border-amber-300 text-amber-700 hover:bg-amber-100"
                onClick={copyToken}
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" /> Copy token
                  </>
                )}
              </Button>
            </div>

            {/* Receipt details */}
            <Card className="py-3 bg-muted/40">
              <CardContent className="px-4 space-y-2">
                <Row label="Receipt no." value={result.receiptNo} mono />
                <Row label="Meter number" value={result.meterNumber} mono />
                <Row label="Provider" value={result.provider.name} />
                {result.unitsKwh && (
                  <Row label="Units" value={`${result.unitsKwh} kWh`} />
                )}
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
                <p className="text-xs font-medium text-muted-foreground">How to load your token</p>
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
      <span
        className={`font-medium ${mono ? 'font-mono' : ''} ${className ?? ''}`}
      >
        {value}
      </span>
    </div>
  )
}
