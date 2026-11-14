'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  ShieldCheck,
  ShieldAlert,
  Factory,
  Boxes,
  ScanLine,
  Link2,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Landmark,
  Copy,
} from 'lucide-react'

interface SapeStats {
  suppliers: { total: number; verified: number }
  products: number
  serials: { total: number; active: number; sold: number }
  pos: {
    verifications24h: number
    authentic24h: number
    failures24h: number
    authenticityRate: number
    avgLatencyMs: number
    maxLatencyMs: number
    slaCompliant: boolean
  }
  integrity: { openAnomalies: number; consumerScans: number; consumerReports: number; openReports: number }
  authority: { pendingNotifications: number }
  chain: { blocks: number; headHash: string | null; headNumber: number }
}

export function SAPEView() {
  const [stats, setStats] = useState<SapeStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Serialise form
  const [gtin, setGtin] = useState('')
  const [batch, setBatch] = useState('')
  const [expiry, setExpiry] = useState('')
  const [quantity, setQuantity] = useState('5')
  const [generatedSerials, setGeneratedSerials] = useState<string[]>([])
  const [serialBusy, setSerialBusy] = useState(false)

  // Verify console
  const [scanPayload, setScanPayload] = useState('')
  const [verifyResult, setVerifyResult] = useState<{ result: string; latencyMs: number; findings: { anomalyType: string; severity: string; description: string }[] } | null>(null)
  const [verifyBusy, setVerifyBusy] = useState(false)

  // Custody console
  const [custodyPayload, setCustodyPayload] = useState('')
  const [custodyType, setCustodyType] = useState('received')
  const [custodyLocation, setCustodyLocation] = useState('')
  const [custodyMsg, setCustodyMsg] = useState<string | null>(null)
  const [custodyBusy, setCustodyBusy] = useState(false)

  const loadStats = useCallback(async () => {
    try {
      const res = await fetch('/api/sape/stats', { cache: 'no-store' })
      const json = await res.json()
      if (json.success) setStats(json.data)
      else setError(json.error || 'Failed to load stats')
    } catch {
      setError('Network error loading SAPE stats')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  const generateSerials = async () => {
    setSerialBusy(true)
    setGeneratedSerials([])
    setError(null)
    try {
      const res = await fetch('/api/sape/serials/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gtin, batch, expiry: expiry || undefined, quantity: Number(quantity) || 1 }),
      })
      const json = await res.json()
      if (json.success) {
        setGeneratedSerials(json.data.serials.map((s: { gs1Payload: string }) => s.gs1Payload))
        loadStats()
      } else {
        setError(json.error || 'Serial generation failed')
      }
    } catch {
      setError('Network error generating serials')
    } finally {
      setSerialBusy(false)
    }
  }

  const runVerify = async () => {
    setVerifyBusy(true)
    setVerifyResult(null)
    try {
      const res = await fetch('/api/sape/pos/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload: scanPayload }),
      })
      const json = await res.json()
      if (json.success) setVerifyResult(json.data)
      else setError(json.error || 'Verification failed')
    } catch {
      setError('Network error during verification')
    } finally {
      setVerifyBusy(false)
    }
  }

  const recordCustody = async () => {
    setCustodyBusy(true)
    setCustodyMsg(null)
    try {
      const res = await fetch('/api/sape/custody', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload: custodyPayload, eventType: custodyType, location: custodyLocation || undefined }),
      })
      const json = await res.json()
      if (json.success) {
        setCustodyMsg(`Anchored in block #${json.data.block.blockNumber} · hash ${json.data.block.blockHash.slice(0, 16)}…`)
        loadStats()
      } else {
        setCustodyMsg(`Error: ${json.error}`)
      }
    } catch {
      setCustodyMsg('Network error recording custody event')
    } finally {
      setCustodyBusy(false)
    }
  }

  const resultColor = (r: string) =>
    r === 'AUTHENTIC' ? 'text-emerald-700' : r === 'RECALLED' ? 'text-red-700' : r === 'SUSPECT' ? 'text-amber-700' : 'text-gray-600'

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-emerald-100">
          <ShieldCheck className="w-6 h-6 text-emerald-700" />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">SAPE — Authentication &amp; Provenance</h1>
          <p className="text-sm text-gray-500">Anti-counterfeit engine · GS1 serialisation · hash-anchored custody</p>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 flex items-center gap-2 text-sm text-red-700">
            <AlertTriangle className="w-4 h-4" /> {error}
          </CardContent>
        </Card>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Verified suppliers</p>
                <p className="text-2xl font-bold">
                  {stats?.suppliers.verified ?? 0}
                  <span className="text-sm font-normal text-gray-400"> / {stats?.suppliers.total ?? 0}</span>
                </p>
              </div>
              <Factory className="w-8 h-8 text-gray-300" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Serials (active / sold)</p>
                <p className="text-2xl font-bold">
                  {stats?.serials.active ?? 0}
                  <span className="text-sm font-normal text-gray-400"> / {stats?.serials.sold ?? 0}</span>
                </p>
              </div>
              <Boxes className="w-8 h-8 text-gray-300" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">POS authenticity 24h</p>
                <p className="text-2xl font-bold text-emerald-700">{stats?.pos.authenticityRate ?? 100}%</p>
                <p className="text-xs text-gray-400">avg {stats?.pos.avgLatencyMs ?? 0}ms · SLA {stats?.pos.slaCompliant ? 'OK' : 'BREACH'}</p>
              </div>
              <ScanLine className="w-8 h-8 text-gray-300" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Chain blocks</p>
                <p className="text-2xl font-bold">{stats?.chain.headNumber ?? 0}</p>
                <p className="text-xs font-mono text-gray-400">{stats?.chain.headHash ?? '—'}</p>
              </div>
              <Link2 className="w-8 h-8 text-gray-300" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className={stats?.integrity.openAnomalies ? 'border-amber-200 bg-amber-50' : ''}>
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className={`w-5 h-5 ${stats?.integrity.openAnomalies ? 'text-amber-600' : 'text-gray-300'}`} />
            <div>
              <p className="text-sm font-semibold">{stats?.integrity.openAnomalies ?? 0} open anomalies</p>
              <p className="text-xs text-gray-500">duplicate sales · scan velocity · tampering</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm font-semibold">{stats?.integrity.openReports ?? 0} consumer reports</p>
              <p className="text-xs text-gray-500">{stats?.integrity.consumerScans ?? 0} consumer scans to date</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Landmark className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm font-semibold">{stats?.authority.pendingNotifications ?? 0} authority notices queued</p>
              <p className="text-xs text-gray-500">SAHPRA · NCC · SARS · SAPS (1h SLA)</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Working consoles */}
      <Tabs defaultValue="verify" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 max-w-xl">
          <TabsTrigger value="verify">POS Verify</TabsTrigger>
          <TabsTrigger value="serialise">Serialise</TabsTrigger>
          <TabsTrigger value="custody">Custody</TabsTrigger>
        </TabsList>

        <TabsContent value="verify" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Verification console</CardTitle>
              <CardDescription>Paste a scanned GS1 DataMatrix payload — target under 500ms.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-col md:flex-row gap-2">
                <Input
                  placeholder="010600123450001210BATCH1727040121SAPE-…"
                  value={scanPayload}
                  onChange={(e) => setScanPayload(e.target.value)}
                  className="font-mono text-xs"
                />
                <Button onClick={runVerify} disabled={verifyBusy || !scanPayload} className="md:w-40">
                  {verifyBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanLine className="w-4 h-4 mr-1" />}
                  Verify
                </Button>
              </div>
              {verifyResult && (
                <div className="rounded-lg border p-4 space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <p className={`text-lg font-bold ${resultColor(verifyResult.result)}`}>{verifyResult.result}</p>
                    <Badge variant={verifyResult.latencyMs < 500 ? 'secondary' : 'destructive'}>{verifyResult.latencyMs}ms</Badge>
                  </div>
                  {verifyResult.findings.length > 0 && (
                    <ul className="text-sm space-y-1">
                      {verifyResult.findings.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-gray-700">
                          <AlertTriangle className={`w-4 h-4 mt-0.5 ${f.severity === 'critical' || f.severity === 'high' ? 'text-red-500' : 'text-amber-500'}`} />
                          <span><span className="font-mono text-xs">{f.anomalyType}</span> — {f.description}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {verifyResult.findings.length === 0 && (
                    <p className="text-sm text-emerald-700 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Signature, registry and custody checks passed.</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="serialise" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Generate unit serials (GS1)</CardTitle>
              <CardDescription>AI(01) GTIN · AI(10) batch · AI(17) expiry · AI(21) serial — HMAC-signed payloads.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="gtin">GTIN</Label>
                  <Input id="gtin" placeholder="6001234500012" value={gtin} onChange={(e) => setGtin(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="batch">Batch</Label>
                  <Input id="batch" placeholder="BATCH-2026-04A" value={batch} onChange={(e) => setBatch(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="expiry">Expiry</Label>
                  <Input id="expiry" type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="qty">Quantity (max 500)</Label>
                  <Input id="qty" type="number" min={1} max={500} value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                </div>
              </div>
              <Button onClick={generateSerials} disabled={serialBusy || !gtin || !batch} className="w-full md:w-auto">
                {serialBusy ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Boxes className="w-4 h-4 mr-1" />}
                Generate &amp; sign serials
              </Button>
              {generatedSerials.length > 0 && (
                <ScrollArea className="h-48 rounded-md border">
                  <div className="p-3 space-y-2">
                    {generatedSerials.map((s, i) => (
                      <div key={i} className="flex items-center justify-between gap-2 text-xs font-mono bg-gray-50 rounded px-2 py-1.5">
                        <span className="break-all">{s}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 shrink-0"
                          onClick={() => navigator.clipboard?.writeText(s)}
                          aria-label="Copy payload"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="custody" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Record custody event</CardTitle>
              <CardDescription>Each event is hash-chained to the previous and anchored into a new chain block.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1 md:col-span-1">
                  <Label htmlFor="cpayload">Serial payload</Label>
                  <Input id="cpayload" placeholder="01060…21SAPE-…" value={custodyPayload} onChange={(e) => setCustodyPayload(e.target.value)} className="font-mono text-xs" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="ctype">Event type</Label>
                  <select
                    id="ctype"
                    value={custodyType}
                    onChange={(e) => setCustodyType(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {['manufactured', 'shipped', 'received', 'sold', 'returned', 'destroyed', 'recalled'].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="cloc">Location</Label>
                  <Input id="cloc" placeholder="Groway DC Cape Town" value={custodyLocation} onChange={(e) => setCustodyLocation(e.target.value)} />
                </div>
              </div>
              <Button onClick={recordCustody} disabled={custodyBusy || !custodyPayload} className="w-full md:w-auto">
                {custodyBusy ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Link2 className="w-4 h-4 mr-1" />}
                Record &amp; anchor
              </Button>
              {custodyMsg && <p className="text-sm text-gray-700 font-mono">{custodyMsg}</p>}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
