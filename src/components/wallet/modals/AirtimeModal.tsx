'use client'

import { useState, useCallback, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { apiPost, formatMoney } from '@/components/wallet/lib/api'
import {
  Smartphone,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  ChevronRight,
  Info,
  Signal,
  Phone,
} from 'lucide-react'

interface AirtimeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type Provider = {
  id: string
  name: string
  country: 'ZA' | 'MW'
  voiceDenominations: number[]
  dataBundles: { id: string; name: string; price: number; validity: string }[]
}

type Step = 'provider' | 'phone' | 'select' | 'confirm' | 'result'

type VoiceResult = {
  receiptNo: string
  pin: string
  amountCents: string | bigint | number
  provider: { id: string; name: string; country: string }
  phoneNumber: string
  type: 'voice'
  voucherExpiry?: string
  instructions?: string[]
  createdAt?: string
}

type DataResult = {
  receiptNo: string
  directRecharge: true
  amountCents: string | bigint | number
  provider: { id: string; name: string; country: string }
  phoneNumber: string
  type: 'data'
  bundle: { id: string; name: string; price: number; validity: string } | null
  instructions?: string[]
  createdAt?: string
}

type PurchaseResult = VoiceResult | DataResult

// Fallback providers (mirrors the catalog so the modal works before GET resolves)
const FALLBACK_PROVIDERS: Provider[] = [
  {
    id: 'vodacom',
    name: 'Vodacom',
    country: 'ZA',
    voiceDenominations: [5, 10, 15, 20, 29, 30, 50, 110, 275, 299, 500, 1000],
    dataBundles: [
      { id: 'vc-1gb', name: '1GB Data', price: 49, validity: '30 days' },
      { id: 'vc-2gb', name: '2GB Data', price: 89, validity: '30 days' },
      { id: 'vc-5gb', name: '5GB Data', price: 199, validity: '30 days' },
      { id: 'vc-1gb-daily', name: '1GB Daily', price: 12, validity: '1 day' },
    ],
  },
  {
    id: 'mtn',
    name: 'MTN',
    country: 'ZA',
    voiceDenominations: [5, 10, 15, 20, 30, 50, 100, 200, 500, 1000],
    dataBundles: [
      { id: 'mtn-1gb', name: '1GB Data', price: 49, validity: '30 days' },
      { id: 'mtn-2gb', name: '2GB Data', price: 85, validity: '30 days' },
      { id: 'mtn-5gb', name: '5GB Data', price: 199, validity: '30 days' },
    ],
  },
  {
    id: 'cellc',
    name: 'Cell C',
    country: 'ZA',
    voiceDenominations: [5, 10, 20, 30, 50, 100, 200, 500, 1000],
    dataBundles: [
      { id: 'cc-1gb', name: '1GB Data', price: 45, validity: '30 days' },
      { id: 'cc-2gb', name: '2GB Data', price: 79, validity: '30 days' },
    ],
  },
  {
    id: 'telkom',
    name: 'Telkom',
    country: 'ZA',
    voiceDenominations: [5, 10, 15, 25, 35, 50, 100, 200, 500],
    dataBundles: [
      { id: 'tk-1gb', name: '1GB Data', price: 35, validity: '30 days' },
      { id: 'tk-5gb', name: '5GB Data', price: 149, validity: '30 days' },
    ],
  },
  {
    id: 'airtel-mw',
    name: 'Airtel Malawi',
    country: 'MW',
    voiceDenominations: [50, 100, 200, 500, 1000, 2000, 5000],
    dataBundles: [
      { id: 'am-1gb', name: '1GB Data', price: 500, validity: '7 days' },
      { id: 'am-2gb', name: '2GB Data', price: 900, validity: '30 days' },
    ],
  },
  {
    id: 'tnm-mw',
    name: 'TNM',
    country: 'MW',
    voiceDenominations: [50, 100, 200, 500, 1000, 2000, 5000],
    dataBundles: [
      { id: 'tnm-1gb', name: '1GB Data', price: 500, validity: '7 days' },
      { id: 'tnm-2gb', name: '2GB Data', price: 900, validity: '30 days' },
    ],
  },
]

export function AirtimeModal({ open, onOpenChange }: AirtimeModalProps) {
  const [tab, setTab] = useState<'voice' | 'data'>('voice')
  const [providers] = useState<Provider[]>(FALLBACK_PROVIDERS)
  const [step, setStep] = useState<Step>('provider')
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [selectedDenomination, setSelectedDenomination] = useState<number | null>(null)
  const [selectedBundle, setSelectedBundle] = useState<Provider['dataBundles'][number] | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<PurchaseResult | null>(null)
  const [copied, setCopied] = useState(false)

  const phoneValid = useMemo(() => {
    const digits = phoneNumber.replace(/\D/g, '')
    return digits.length >= 9 && digits.length <= 13
  }, [phoneNumber])

  const providersByCountry = useMemo(() => {
    const g: Record<string, Provider[]> = { ZA: [], MW: [] }
    for (const p of providers) g[p.country]?.push(p)
    return g
  }, [providers])

  const resetFlow = useCallback(() => {
    setStep('provider')
    setSelectedProvider(null)
    setPhoneNumber('')
    setSelectedDenomination(null)
    setSelectedBundle(null)
    setResult(null)
    setError(null)
  }, [])

  const handleTabChange = useCallback((value: string) => {
    setTab(value as 'voice' | 'data')
    resetFlow()
  }, [resetFlow])

  const handleBuy = useCallback(async () => {
    if (!selectedProvider || !phoneValid) return
    if (tab === 'voice' && !selectedDenomination) return
    if (tab === 'data' && !selectedBundle) return

    setIsLoading(true)
    setError(null)
    try {
      const body: Record<string, unknown> = {
        providerId: selectedProvider.id,
        phoneNumber,
        type: tab,
      }
      if (tab === 'voice') {
        body.amountCents = Math.round((selectedDenomination as number) * 100)
      } else {
        body.bundleId = selectedBundle?.id
      }

      const res = await apiPost<PurchaseResult & { success?: boolean; error?: string }>(
        '/airtime',
        body,
      )
      if (res?.success === false) {
        setError(res.error || 'Airtime purchase failed')
        return
      }
      setResult(res)
      setStep('result')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Airtime purchase failed')
    } finally {
      setIsLoading(false)
    }
  }, [selectedProvider, phoneValid, tab, selectedDenomination, selectedBundle])

  const copyPin = useCallback(async () => {
    if (!result || result.type !== 'voice') return
    try {
      await navigator.clipboard.writeText(result.pin)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore
    }
  }, [result])

  const handleClose = useCallback(() => {
    resetFlow()
    onOpenChange(false)
  }, [resetFlow, onOpenChange])

  const currency = selectedProvider?.country === 'MW' ? 'MWK' : 'ZAR'

  // Helper to render the provider grid (reused in both tabs)
  const renderProviderGrid = () => (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-medium">Select network</Label>
        <p className="text-xs text-muted-foreground mt-1">
          {tab === 'voice' ? 'Voice airtime PIN voucher' : 'Data bundle (direct recharge)'}
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
          <div className="grid grid-cols-2 gap-2">
            {providersByCountry[country]?.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setSelectedProvider(p)
                  setStep('phone')
                }}
                className="flex flex-col items-start gap-1 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-accent/40 transition-colors text-left"
              >
                <Smartphone className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{p.name}</span>
                <span className="text-[11px] text-muted-foreground">
                  {tab === 'voice'
                    ? `${p.voiceDenominations.length} denominations`
                    : `${p.dataBundles.length} bundles`}
                </span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )

  const renderPhoneStep = () => (
    <div className="space-y-4">
      <button onClick={() => setStep('provider')} className="text-xs text-primary hover:underline">
        ← Change network
      </button>

      <Card className="py-3">
        <CardContent className="px-4">
          <div className="flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">{selectedProvider?.name}</span>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone number</Label>
        <Input
          id="phone"
          type="tel"
          placeholder="e.g. 082 123 4567"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          className="h-12 text-base"
        />
        {phoneNumber && !phoneValid && (
          <p className="text-xs text-destructive flex items-center gap-1">
            <AlertCircle className="h-3 w-3" /> Enter a valid phone number.
          </p>
        )}
      </div>

      <div className="flex gap-2">
        <Button variant="outline" onClick={() => setStep('provider')} className="flex-1">
          Back
        </Button>
        <Button
          onClick={() => setStep('select')}
          disabled={!phoneValid}
          className="flex-1"
        >
          Continue
        </Button>
      </div>
    </div>
  )

  const renderSelectStep = () => {
    if (!selectedProvider) return null
    if (tab === 'voice') {
      return (
        <div className="space-y-4">
          <button onClick={() => setStep('phone')} className="text-xs text-primary hover:underline">
            ← Back
          </button>

          <div className="space-y-2">
            <Label>Select denomination</Label>
            <div className="grid grid-cols-3 gap-2">
              {selectedProvider.voiceDenominations.map((value) => (
                <button
                  key={value}
                  onClick={() => {
                    setSelectedDenomination(value)
                    setStep('confirm')
                  }}
                  className={`py-3 rounded-lg text-sm font-medium transition-colors border ${
                    selectedDenomination === value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-muted/40 hover:bg-accent/40'
                  }`}
                >
                  {selectedProvider.country === 'MW' ? `K${value}` : `R${value}`}
                </button>
              ))}
            </div>
          </div>
        </div>
      )
    }
    return (
      <div className="space-y-4">
        <button onClick={() => setStep('phone')} className="text-xs text-primary hover:underline">
          ← Back
        </button>

        <div className="space-y-2">
          <Label>Select data bundle</Label>
          <div className="space-y-1.5">
            {selectedProvider.dataBundles.map((b) => (
              <button
                key={b.id}
                onClick={() => {
                  setSelectedBundle(b)
                  setStep('confirm')
                }}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-accent/40 transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <Signal className="h-4 w-4 text-primary" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{b.name}</span>
                    <span className="text-[11px] text-muted-foreground">
                      Valid {b.validity}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">
                    {selectedProvider.country === 'MW' ? `K${b.price}` : `R${b.price}`}
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const renderConfirmStep = () => {
    if (!selectedProvider) return null
    const amountCents =
      tab === 'voice'
        ? Math.round((selectedDenomination as number) * 100)
        : Math.round((selectedBundle?.price ?? 0) * 100)

    return (
      <div className="space-y-4">
        <div className="text-center">
          <p className="text-3xl font-bold tabular-nums">
            {formatMoney(BigInt(amountCents), currency)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {selectedProvider.name} • {tab === 'voice' ? 'Voice airtime' : selectedBundle?.name}
          </p>
        </div>

        <Card className="py-3 bg-muted/40">
          <CardContent className="px-4 space-y-2">
            <Row label="Network" value={selectedProvider.name} />
            <Row label="Phone" value={phoneNumber} mono />
            <Row label="Type" value={tab === 'voice' ? 'Voice (PIN voucher)' : 'Data (direct recharge)'} />
            {tab === 'voice' ? (
              <Row
                label="Denomination"
                value={selectedProvider.country === 'MW'
                  ? `K${selectedDenomination}`
                  : `R${selectedDenomination}`}
              />
            ) : (
              <>
                <Row label="Bundle" value={selectedBundle?.name ?? ''} />
                <Row label="Validity" value={selectedBundle?.validity ?? ''} />
              </>
            )}
            <Row label="Fee" value="FREE" className="text-emerald-600" />
          </CardContent>
        </Card>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-xs">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Button onClick={handleBuy} disabled={isLoading} className="w-full h-12">
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Processing…
            </>
            ) : tab === 'voice' ? (
              <>Buy Airtime</>
            ) : (
              <>Buy Data Bundle</>
            )}
        </Button>

        <Button variant="outline" onClick={() => setStep('select')} className="w-full">
          Back
        </Button>
      </div>
    )
  }

  const renderResult = () => {
    if (!result || !selectedProvider) return null

    return (
      <div className="space-y-4">
        <div className="text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-2">
            <Check className="h-7 w-7 text-emerald-600" />
          </div>
          <h3 className="text-base font-bold">
            {result.type === 'voice' ? 'Voucher Issued' : 'Direct Recharge Complete'}
          </h3>
          <p className="text-xs text-muted-foreground">
            {formatMoney(BigInt(String(result.amountCents)), currency)} •{' '}
            {selectedProvider.name}
          </p>
        </div>

        {/* Voice: PIN voucher */}
        {result.type === 'voice' && (
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <Badge className="bg-emerald-600 text-white border-0 text-[10px]">
                AIRTIME PIN
              </Badge>
              <span className="text-[10px] text-emerald-700">Dial *100*PIN#</span>
            </div>
            <p className="text-xl font-mono font-bold text-emerald-700 text-center tracking-[0.25em] break-all">
              {result.pin}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-3 border-emerald-300 text-emerald-700 hover:bg-emerald-100"
              onClick={copyPin}
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3" /> Copied
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" /> Copy PIN
                </>
              )}
            </Button>
          </div>
        )}

        {/* Data: direct recharge confirmation */}
        {result.type === 'data' && (
          <div className="rounded-lg bg-sky-50 border border-sky-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <Badge className="bg-sky-600 text-white border-0 text-[10px]">
                DIRECT RECHARGE
              </Badge>
              <span className="text-[10px] text-sky-700">No PIN needed</span>
            </div>
            <div className="flex items-center gap-2 justify-center text-sky-700">
              <Signal className="h-5 w-5" />
              <p className="text-sm font-medium">
                {result.bundle?.name ?? 'Data bundle'} pushed to {result.phoneNumber}
              </p>
            </div>
            <p className="text-[11px] text-sky-600 text-center mt-2">
              Valid for {result.bundle?.validity ?? '30 days'} — you&apos;ll receive an SMS
              confirmation within 60 seconds.
            </p>
          </div>
        )}

        {/* Receipt details */}
        <Card className="py-3 bg-muted/40">
          <CardContent className="px-4 space-y-2">
            <Row label="Receipt no." value={result.receiptNo} mono />
            <Row label="Network" value={selectedProvider.name} />
            <Row label="Phone" value={result.phoneNumber} mono />
            <Row
              label="Type"
              value={result.type === 'voice' ? 'Voice airtime' : 'Data bundle'}
            />
            {result.type === 'voice' && (
              <Row label="PIN" value={result.pin} mono />
            )}
            {result.type === 'data' && result.bundle && (
              <>
                <Row label="Bundle" value={result.bundle.name} />
                <Row label="Validity" value={result.bundle.validity} />
              </>
            )}
            <Row label="Amount" value={formatMoney(BigInt(String(result.amountCents)), currency)} />
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
            <p className="text-xs font-medium text-muted-foreground">How to use</p>
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
    )
  }

  // Active step rendering — depends on tab
  const renderActiveStep = () => {
    if (step === 'result') return renderResult()
    if (step === 'confirm') return renderConfirmStep()
    if (step === 'select') return renderSelectStep()
    if (step === 'phone') return renderPhoneStep()
    return renderProviderGrid()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? null : handleClose())}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
              <Smartphone className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <DialogTitle className="text-base">Airtime &amp; Data</DialogTitle>
              <DialogDescription className="text-xs">
                Vodacom, MTN, Cell C, Telkom, Airtel, TNM
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Explainer for voice vs data */}
        {step === 'provider' && (
          <div className="flex items-start gap-2 rounded-md bg-muted/40 border border-border p-3 text-xs text-muted-foreground">
            <Info className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
            <p>
              <strong>Voice airtime</strong> issues a PIN voucher you redeem by dialing{' '}
              <code className="font-mono">*100*PIN#</code>.{' '}
              <strong>Data bundles</strong> are pushed straight to your number — no PIN needed.
            </p>
          </div>
        )}

        {/* Tabs only show on provider step so the flow stays single-purpose */}
        {step === 'provider' ? (
          <Tabs value={tab} onValueChange={handleTabChange}>
            <TabsList className="w-full">
              <TabsTrigger value="voice" className="flex-1 gap-1.5">
                <Phone className="h-3.5 w-3.5" /> Voice Airtime
              </TabsTrigger>
              <TabsTrigger value="data" className="flex-1 gap-1.5">
                <Signal className="h-3.5 w-3.5" /> Data Bundles
              </TabsTrigger>
            </TabsList>
            <TabsContent value="voice" className="mt-4">
              {renderActiveStep()}
            </TabsContent>
            <TabsContent value="data" className="mt-4">
              {renderActiveStep()}
            </TabsContent>
          </Tabs>
        ) : (
          <div className="space-y-1">
            <Badge variant="outline" className="text-[10px] mb-3">
              {tab === 'voice' ? 'Voice Airtime' : 'Data Bundle'}
            </Badge>
            {renderActiveStep()}
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
