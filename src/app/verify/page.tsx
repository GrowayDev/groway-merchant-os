'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Loader2,
  MapPin,
  Calendar,
  ScanBarcode,
  Flag,
  Search,
} from 'lucide-react'

interface VerifyData {
  verdict: 'AUTHENTIC' | 'SUSPECT' | 'RECALLED' | 'UNKNOWN' | 'INVALID'
  headline: string
  detail: string
  product?: { name: string; gtin?: string | null; brand?: string | null }
  origin?: {
    manufacturer?: string | null
    country?: string | null
    region?: string | null
    harvestDate?: string | null
    certificates?: string[]
    story?: string | null
  } | null
  batch?: string | null
  expiry?: string | null
  custodyTrail?: { eventType: string; location: string | null; at: string; hash: string }[]
  chainIntegrity?: { signatureOk: boolean; openAnomalies: number }
  latencyMs?: number
}

interface ReportState {
  sent: boolean
  type: string
  description: string
  contact: string
}

const VERDICT_STYLES: Record<string, { icon: typeof ShieldCheck; bg: string; text: string; border: string }> = {
  AUTHENTIC: { icon: ShieldCheck, bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
  SUSPECT: { icon: ShieldAlert, bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
  RECALLED: { icon: ShieldX, bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-200' },
  UNKNOWN: { icon: ShieldAlert, bg: 'bg-gray-50', text: 'text-gray-800', border: 'border-gray-200' },
  INVALID: { icon: ShieldX, bg: 'bg-gray-50', text: 'text-gray-800', border: 'border-gray-200' },
}

export default function ConsumerVerifyPage() {
  const [code, setCode] = useState('')
  const [data, setData] = useState<VerifyData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [report, setReport] = useState<ReportState>({ sent: false, type: 'counterfeit-suspected', description: '', contact: '' })

  const verify = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!code.trim()) return
    setLoading(true)
    setError(null)
    setData(null)
    setReport({ sent: false, type: 'counterfeit-suspected', description: '', contact: '' })
    try {
      const res = await fetch(`/api/sape/verify/${encodeURIComponent(code.trim())}`, { cache: 'no-store' })
      const json = await res.json()
      if (json.success) setData(json.data)
      else setError(json.error || 'Verification failed')
    } catch {
      setError('Network error — please try again')
    } finally {
      setLoading(false)
    }
  }

  const submitReport = async () => {
    try {
      const res = await fetch('/api/sape/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload: code.trim(), reportType: report.type, description: report.description, contact: report.contact || undefined }),
      })
      const json = await res.json()
      if (json.success) setReport((r) => ({ ...r, sent: true }))
    } catch {
      /* keep form open on error */
    }
  }

  const style = data ? VERDICT_STYLES[data.verdict] ?? VERDICT_STYLES.INVALID : null
  const VerdictIcon = style?.icon ?? ShieldCheck

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-emerald-50 to-white">
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-10 md:py-16">
        <header className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-emerald-100 mb-4">
            <ShieldCheck className="w-10 h-10 text-emerald-700" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Is your product genuine?</h1>
          <p className="text-gray-600 mt-2 text-sm md:text-base">
            Scan or type the SAPE code on the pack — we check the registry, signature and full custody trail.
          </p>
        </header>

        <form onSubmit={verify} className="flex flex-col sm:flex-row gap-2 mb-6">
          <div className="relative flex-1">
            <ScanBarcode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. 010600123450001210BATCH-2026-04A1727040121SAPE-…"
              className="pl-9 font-mono text-xs h-12"
              aria-label="Product code"
            />
          </div>
          <Button type="submit" disabled={loading || !code.trim()} className="h-12 px-6">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4 mr-1" />}
            Verify
          </Button>
        </form>

        {error && (
          <Card className="border-red-200 bg-red-50 mb-6">
            <CardContent className="p-4 text-sm text-red-700">{error}</CardContent>
          </Card>
        )}

        {data && style && (
          <div className="space-y-4">
            <Card className={`${style.border} ${style.bg}`}>
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <VerdictIcon className={`w-8 h-8 ${style.text} shrink-0`} />
                  <div className="flex-1">
                    <p className={`font-bold text-lg ${style.text}`}>{data.headline}</p>
                    <p className="text-sm text-gray-700 mt-1">{data.detail}</p>
                    {data.latencyMs !== undefined && (
                      <Badge variant="secondary" className="mt-2">checked in {data.latencyMs}ms</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {data.product && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{data.product.name}</CardTitle>
                  {data.product.brand && <CardDescription>Brand: {data.product.brand} · GTIN {data.product.gtin}</CardDescription>}
                </CardHeader>
                <CardContent className="space-y-3">
                  {(data.batch || data.expiry) && (
                    <div className="flex flex-wrap gap-2 text-sm">
                      {data.batch && <Badge variant="outline">Batch: {data.batch}</Badge>}
                      {data.expiry && (
                        <Badge variant="outline" className="gap-1">
                          <Calendar className="w-3 h-3" /> Best before: {String(data.expiry).slice(0, 10)}
                        </Badge>
                      )}
                    </div>
                  )}
                  {data.origin && (
                    <div className="rounded-lg bg-gray-50 p-3 text-sm space-y-1">
                      <p className="font-semibold flex items-center gap-1"><MapPin className="w-4 h-4 text-emerald-700" /> Origin</p>
                      <p className="text-gray-700">
                        {data.origin.manufacturer ?? 'Unknown manufacturer'}
                        {data.origin.region ? ` · ${data.origin.region}` : ''}
                        {data.origin.country ? `, ${data.origin.country}` : ''}
                      </p>
                      {data.origin.story && <p className="text-gray-600 italic">&ldquo;{data.origin.story}&rdquo;</p>}
                      {data.origin.certificates && data.origin.certificates.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {data.origin.certificates.map((c, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">{c}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {data.custodyTrail && data.custodyTrail.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold mb-2">Journey of this unit</p>
                      <ol className="space-y-2">
                        {data.custodyTrail.map((e, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <span className="mt-1 w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
                            <span>
                              <span className="font-medium capitalize">{e.eventType}</span>
                              {e.location ? ` — ${e.location}` : ''}
                              <span className="block text-xs text-gray-400 font-mono">
                                {new Date(e.at).toLocaleString('en-ZA')} · {e.hash}
                              </span>
                            </span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Report section — shown for non-authentic, until submitted */}
            {data.verdict !== 'AUTHENTIC' && !report.sent && (
              <Card className="border-amber-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Flag className="w-4 h-4 text-amber-600" /> Report this product
                  </CardTitle>
                  <CardDescription>
                    Your report alerts the merchant and queues an NCC notification within 1 hour. Anonymous is OK.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="rtype">Issue type</Label>
                    <select
                      id="rtype"
                      value={report.type}
                      onChange={(e) => setReport((r) => ({ ...r, type: e.target.value }))}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="counterfeit-suspected">Suspected counterfeit</option>
                      <option value="tampering">Tampering / resealing</option>
                      <option value="wrong-product">Wrong product in packaging</option>
                      <option value="adverse-reaction">Adverse reaction</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="rdesc">What did you notice?</Label>
                    <textarea
                      id="rdesc"
                      value={report.description}
                      onChange={(e) => setReport((r) => ({ ...r, description: e.target.value }))}
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      placeholder="Blurred batch printing, broken seal, wrong weight…"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="rcontact">Contact (optional)</Label>
                    <Input id="rcontact" value={report.contact} onChange={(e) => setReport((r) => ({ ...r, contact: e.target.value }))} placeholder="Email or phone — leave blank to stay anonymous" />
                  </div>
                  <Button onClick={submitReport} disabled={report.description.length < 5} className="w-full sm:w-auto">
                    Submit report
                  </Button>
                </CardContent>
              </Card>
            )}
            {report.sent && (
              <Card className="border-emerald-200 bg-emerald-50">
                <CardContent className="p-4 text-sm text-emerald-800 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5" /> Report received — thank you. Regulators have been notified.
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>

      <footer className="border-t bg-white py-4 mt-auto">
        <div className="max-w-2xl mx-auto px-4 text-center text-xs text-gray-500">
          SAPE — SPZABOX Authentication &amp; Provenance Engine · part of the Groway Merchant OS
        </div>
      </footer>
    </div>
  )
}
