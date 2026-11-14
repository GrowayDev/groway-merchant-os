'use client'
import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ShieldCheck, ScanLine, CheckCircle2, AlertTriangle, Bell, Clock, Factory, Truck, Store, Building2 } from 'lucide-react'
import { toast } from 'sonner'

const NODE_ICONS: Record<string, any> = { Manufacturer: Factory, Distributor: Truck, Wholesaler: Building2, Retailer: Store }
const AUTHORITY_COLORS: Record<string, string> = { SAHPRA: 'bg-rose-100 text-rose-700 border-rose-200', SAPS: 'bg-blue-100 text-blue-700 border-blue-200', SARS: 'bg-amber-100 text-amber-700 border-amber-200' }

export function SapeView() {
  const [stats, setStats] = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])
  const [alerts, setAlerts] = useState<any[]>([])
  const [scanning, setScanning] = useState<string | null>(null)
  const [result, setResult] = useState<any>(null)
  const [chainStep, setChainStep] = useState(0)
  const [loading, setLoading] = useState(true)

  const getHeaders = useCallback(() => {
    const h: Record<string, string> = {}
    if (typeof window !== 'undefined') { const s = localStorage.getItem('groway_session'); if (s) { try { const sess = JSON.parse(s); if (sess?.token) h['Authorization'] = `Bearer ${sess.token}` } catch {} } }
    return h
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const h = getHeaders()
      const [s, p, a] = await Promise.allSettled([
        fetch('/merchant-os/api/sape/stats', { headers: h }),
        fetch('/merchant-os/api/sape/products', { headers: h }),
        fetch('/merchant-os/api/sape/alerts', { headers: h }),
      ])
      if (s.status === 'fulfilled' && s.value.ok) { const d = await s.value.json(); if (d.success) setStats(d.stats) }
      if (p.status === 'fulfilled' && p.value.ok) { const d = await p.value.json(); if (d.success) setProducts(d.products || []) }
      if (a.status === 'fulfilled' && a.value.ok) { const d = await a.value.json(); if (d.success) setAlerts(d.alerts || []) }
    } catch (e) { console.error('SAPE load:', e) } finally { setLoading(false) }
  }, [getHeaders])

  useEffect(() => { void load() }, [load])
  useEffect(() => { if (!result) { setChainStep(0); return }; setChainStep(0); (result.custodyChain || []).forEach((_: any, i: number) => setTimeout(() => setChainStep(i + 1), 250 * (i + 1))) }, [result])

  const scan = async (gtin: string) => {
    setScanning(gtin); setResult(null)
    try {
      const res = await fetch('/merchant-os/api/sape/verify', { method: 'POST', headers: { ...getHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify({ gtin }) })
      const d = await res.json()
      setTimeout(() => { setResult(d); setScanning(null); if (d.result === 'counterfeit') toast.error('Counterfeit detected — authorities notified'); else if (d.result === 'authentic') toast.success(`Authentic · ${d.verifyMs}ms`); void load() }, 1100)
    } catch { setScanning(null); toast.error('Scan failed') }
  }

  if (loading) return <div className="flex-1 flex items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" /></div>

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="border-b bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 text-white px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-white/15 backdrop-blur flex items-center justify-center"><ShieldCheck className="h-6 w-6" /></div>
          <div><h1 className="text-xl font-bold">SAPE</h1><p className="text-xs text-emerald-100/90">Supply-chain Authentication & Product Enforcement</p></div>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            <Stat label="Products Registered" value={stats?.totalProducts ?? 0} icon={<ShieldCheck className="h-4 w-4" />} accent="emerald" />
            <Stat label="Total Scans" value={stats?.totalVerifications ?? 0} icon={<ScanLine className="h-4 w-4" />} accent="slate" />
            <Stat label="Authentic" value={stats?.authenticCount ?? 0} icon={<CheckCircle2 className="h-4 w-4" />} accent="emerald" />
            <Stat label="Counterfeits Blocked" value={stats?.counterfeitCount ?? 0} icon={<AlertTriangle className="h-4 w-4" />} accent="rose" />
            <Stat label="Open Alerts" value={stats?.openAlerts ?? 0} icon={<Bell className="h-4 w-4" />} accent="amber" />
            <Stat label="Avg Verify" value={`${stats?.avgVerifyMs ?? 0}ms`} icon={<Clock className="h-4 w-4" />} accent="teal" />
            <Stat label="Authority Alerts" value={stats?.authorityNotifications ?? 0} icon={<ShieldCheck className="h-4 w-4" />} accent="rose" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card><CardHeader className="bg-white border-b"><CardTitle className="text-base flex items-center gap-2"><ScanLine className="h-4 w-4 text-emerald-600" /> Live POS Verification</CardTitle></CardHeader>
                <CardContent className="p-6">
                  {scanning ? (
                    <div className="rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50/60 p-6 text-center"><div className="flex items-center justify-center gap-3"><ScanLine className="h-5 w-5 text-emerald-600 animate-pulse" /><span className="text-sm text-emerald-700 font-medium">Scanning barcode at POS…</span></div><div className="mt-3 h-1 w-48 mx-auto bg-emerald-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 animate-pulse" style={{ width: '70%' }} /></div></div>
                  ) : result ? (
                    <div className={`rounded-xl p-5 border-2 ${result.result === 'authentic' ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50'}`}>
                      <div className="flex items-start gap-4">
                        <div className={`h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0 ${result.result === 'authentic' ? 'bg-emerald-600' : 'bg-rose-600'}`}>{result.result === 'authentic' ? <CheckCircle2 className="h-7 w-7 text-white" /> : <AlertTriangle className="h-7 w-7 text-white" />}</div>
                        <div className="flex-1">
                          <div className={`text-lg font-bold ${result.result === 'authentic' ? 'text-emerald-800' : 'text-rose-800'}`}>{result.result === 'authentic' ? 'AUTHENTIC — Verified' : 'COUNTERFEIT DETECTED'}</div>
                          <div className="text-sm text-slate-600 mt-1">{result.productName}</div>
                          {result.authorityNotified && <div className="mt-3 flex items-center gap-2 flex-wrap"><span className="text-xs font-medium text-rose-700">Authority Notified:</span>{result.notifiedAuthorities?.split(',').map((a: string) => <Badge key={a} variant="outline" className={`text-xs ${AUTHORITY_COLORS[a] || ''}`}><Bell className="h-3 w-3 mr-1" />{a}</Badge>)}</div>}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-8 text-center"><ScanLine className="h-8 w-8 text-slate-400 mx-auto" /><p className="text-sm text-slate-500 mt-2">Select a product below and click <strong>Authenticate at POS</strong></p></div>
                  )}
                  {result && result.custodyChain && result.custodyChain.length > 0 && (
                    <div className="mt-6"><div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Signed Custody Chain</div><div className="flex items-stretch gap-0 overflow-x-auto pb-2">
                      {result.custodyChain.map((node: any, i: number) => { const Icon = NODE_ICONS[node.node] || Building2; const revealed = i < chainStep; const broken = !node.signed; return (
                        <div key={i} className="flex items-stretch">
                          <div className={`flex flex-col items-center text-center transition-all duration-500 ${revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`} style={{ minWidth: 140 }}>
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center mb-2 ${broken ? 'bg-rose-100 text-rose-600 ring-2 ring-rose-300' : 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-300'}`}><Icon className="h-5 w-5" /></div>
                            <div className="text-xs font-semibold text-slate-700">{node.node}</div><div className="text-[10px] text-slate-500 leading-tight mt-0.5">{node.party}</div>
                            <Badge variant="outline" className={`text-[10px] py-0 px-1.5 mt-1 ${broken ? 'border-rose-200 bg-rose-50 text-rose-600' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>{broken ? 'Unsigned' : 'Signed'}</Badge>
                          </div>
                          {i < result.custodyChain.length - 1 && <div className="flex items-center justify-center px-1"><div className={`h-0.5 w-8 ${result.custodyChain[i + 1].signed && node.signed ? 'bg-emerald-400' : 'bg-rose-400'}`} /></div>}
                        </div>
                      )})}
                    </div></div>
                  )}
                </CardContent>
              </Card>
              <Card><CardHeader className="bg-white border-b"><CardTitle className="text-base flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-600" /> Authenticated Product Registry</CardTitle></CardHeader>
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {products.map((p: any) => (
                      <div key={p.id} className="rounded-lg border p-3 hover:shadow-sm">
                        <div className="flex items-start justify-between gap-2"><div className="flex-1 min-w-0"><div className="text-sm font-semibold text-slate-800 truncate">{p.productName}</div><div className="text-xs text-slate-500 mt-0.5">{p.manufacturer}</div><div className="flex items-center gap-2 mt-2 flex-wrap"><Badge variant="outline" className="text-[10px] py-0 px-1.5 font-mono">{p.gtin}</Badge>{p.category && <Badge variant="outline" className="text-[10px] py-0 px-1.5">{p.category}</Badge>}{p.riskProfile === 'high_risk' && <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-amber-200 bg-amber-50 text-amber-700">High Risk</Badge>}</div></div></div>
                        <Button size="sm" onClick={() => scan(p.gtin)} disabled={scanning !== null} className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs"><ScanLine className="h-3.5 w-3.5 mr-1" />Authenticate</Button>
                      </div>
                    ))}
                    <div className="rounded-lg border-2 border-dashed border-rose-200 bg-rose-50/40 p-3">
                      <div className="text-sm font-semibold text-rose-800">Counterfeit Sample (Unregistered)</div><div className="text-xs text-rose-600 mt-0.5">Unknown supplier — Naledi lot</div>
                      <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-mono border-rose-200 bg-rose-50 text-rose-700 mt-2">6009999900010</Badge>
                      <Button size="sm" onClick={() => scan('6009999900010')} disabled={scanning !== null} className="bg-rose-600 hover:bg-rose-700 text-white h-8 text-xs mt-2"><ScanLine className="h-3.5 w-3.5 mr-1" />Scan Suspicious Sample</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            <Card><CardHeader className="bg-white border-b"><CardTitle className="text-base flex items-center gap-2"><Bell className="h-4 w-4 text-rose-600" /> Authority Notification Feed</CardTitle></CardHeader>
              <CardContent className="p-0"><ScrollArea className="h-[420px]">
                {alerts.length === 0 ? <div className="p-6 text-center text-sm text-slate-500">No alerts yet. Scan a counterfeit product to trigger an authority notification.</div> :
                  <div className="divide-y">{alerts.map((a: any) => (
                    <div key={a.id} className="p-4 hover:bg-slate-50">
                      <div className="flex items-start justify-between gap-2 mb-1"><Badge variant="outline" className={`text-[10px] py-0 px-1.5 ${AUTHORITY_COLORS[a.notifiedAuthority] || ''}`}>{a.notifiedAuthority}</Badge><span className="text-[10px] text-slate-400">{new Date(a.notifiedAt).toLocaleString()}</span></div>
                      <p className="text-xs text-slate-700 leading-relaxed">{a.message}</p>
                      {a.location && <p className="text-[10px] text-slate-400 mt-1">📍 {a.location}</p>}
                    </div>
                  ))}</div>}
              </ScrollArea></CardContent>
            </Card>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
function Stat({ label, value, icon, accent }: { label: string; value: string | number; icon: React.ReactNode; accent: string }) {
  const colors: Record<string, string> = { emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700', teal: 'border-teal-200 bg-teal-50 text-teal-700', slate: 'border-slate-200 bg-slate-50 text-slate-700', rose: 'border-rose-200 bg-rose-50 text-rose-700', amber: 'border-amber-200 bg-amber-50 text-amber-700' }
  return <div className={`rounded-lg border p-3 ${colors[accent]}`}><div className="flex items-center gap-1.5 mb-1 opacity-80">{icon}</div><div className="text-2xl font-bold tracking-tight">{value}</div><div className="text-[10px] uppercase tracking-wider opacity-70 leading-tight mt-0.5">{label}</div></div>
}
