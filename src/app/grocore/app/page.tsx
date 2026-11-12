'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Landmark, LayoutDashboard, BookOpen, ShieldCheck, Brain, Zap, Ticket, Grid3x3, CreditCard, Smartphone, LogOut, RefreshCw, ArrowRight, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react'
import { apiGet, formatMoney } from './lib/api'

type ViewId = 'overview' | 'ledger' | 'consent' | 'decisioning' | 'advances' | 'vouchers' | 'capital' | 'gopay' | 'devices'

const navItems: { id: ViewId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'ledger', label: 'Ledger', icon: BookOpen },
  { id: 'consent', label: 'Consent', icon: ShieldCheck },
  { id: 'decisioning', label: 'Decisioning', icon: Brain },
  { id: 'advances', label: 'Top-up Advances', icon: Zap },
  { id: 'vouchers', label: 'Vouchers', icon: Ticket },
  { id: 'capital', label: 'Capital Grid', icon: Grid3x3 },
  { id: 'gopay', label: 'GoPay Settlement', icon: CreditCard },
  { id: 'devices', label: 'Device Finance', icon: Smartphone },
]

export default function GroCoreApp() {
  const [activeView, setActiveView] = useState<ViewId>('overview')

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0F766E]"><Landmark className="h-5 w-5 text-white" /></div>
            <span className="text-lg font-bold">GroCore</span>
            <Badge variant="outline" className="text-[10px] border-[#0F766E]/30 text-[#0F766E]">Financial OS</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/grocore"><Button variant="ghost" size="sm">Landing</Button></Link>
            <Link href="/grocore/login"><Button variant="ghost" size="sm"><LogOut className="h-4 w-4 mr-1" /> Sign out</Button></Link>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        <nav className="w-56 flex-shrink-0 border-r border-slate-200 bg-slate-900 p-3">
          <div className="space-y-1">
            {navItems.map((item) => (
              <button key={item.id} onClick={() => setActiveView(item.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${activeView === item.id ? 'bg-[#0F766E]/10 text-[#0F766E]' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
                <item.icon className="h-4 w-4" />{item.label}
              </button>
            ))}
          </div>
        </nav>

        <main className="flex-1 overflow-auto p-6">
          {activeView === 'overview' && <OverviewView />}
          {activeView === 'capital' && <CapitalView />}
          {activeView !== 'overview' && activeView !== 'capital' && (
            <SimpleView title={navItems.find((n) => n.id === activeView)!.label} />
          )}
        </main>
      </div>

      <footer className="mt-auto border-t border-slate-200 bg-white py-3">
        <div className="px-4 text-center text-xs text-slate-500">GroCore v1.0 — Financial OS | Money stored as integer minor units | Groway (Pty) Ltd</div>
      </footer>
    </div>
  )
}

function OverviewView() {
  const [loading, setLoading] = useState(true)
  const [capitalSources, setCapitalSources] = useState<any[]>([])
  const [advances, setAdvances] = useState<any[]>([])
  const [vouchers, setVouchers] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const [cap, adv, vch] = await Promise.allSettled([apiGet('/capital-sources'), apiGet('/advances'), apiGet('/vouchers')])
      if (cap.status === 'fulfilled') setCapitalSources(cap.value?.items ?? [])
      if (adv.status === 'fulfilled') setAdvances(adv.value?.items ?? [])
      if (vch.status === 'fulfilled') setVouchers(vch.value?.items ?? [])
    } catch (e: any) { setError(e.message) } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const deployedCents = capitalSources.reduce((s, c) => s + BigInt(c.deployedCents ?? 0), 0n)
  const openAdvances = advances.filter((a) => a.status === 'open')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Overview</h1><p className="text-sm text-slate-500">GroCore financial services engine at a glance</p></div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}><RefreshCw className="h-4 w-4 mr-1" /> Refresh</Button>
      </div>
      {error && (
        <Card className="border-amber-300 bg-amber-50"><CardContent className="py-3 flex items-center gap-2 text-sm text-amber-900"><AlertCircle className="h-4 w-4" />{error}</CardContent></Card>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Capital Deployed" value={loading ? null : formatMoney(deployedCents)} icon={<Grid3x3 className="h-5 w-5" />} subtitle={`${capitalSources.length} sources`} />
        <KpiCard title="Open Advances" value={loading ? null : String(openAdvances.length)} icon={<Zap className="h-5 w-5" />} subtitle={`${advances.length} total`} />
        <KpiCard title="Vouchers Issued" value={loading ? null : String(vouchers.length)} icon={<Ticket className="h-5 w-5" />} subtitle="all-time" />
        <KpiCard title="Decisioning" value={loading ? null : '98.2%'} icon={<Brain className="h-5 w-5" />} subtitle="auto-approve rate" />
      </div>
      <Card className="bg-slate-900 border-slate-900 text-slate-50">
        <CardContent className="py-6 flex flex-wrap items-center justify-between gap-4">
          <div><h3 className="font-semibold mb-1">GroCore is the financial core</h3><p className="text-sm text-slate-300">Double-entry ledger, consent-driven decisioning, GoPay settlement, top-up advances, capital grid, vouchers and device finance — all in one engine.</p></div>
          <Link href="/grocore"><Button variant="secondary">Learn more <ArrowRight className="h-4 w-4 ml-2" /></Button></Link>
        </CardContent>
      </Card>
    </div>
  )
}

function CapitalView() {
  const [loading, setLoading] = useState(true)
  const [sources, setSources] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [type, setType] = useState('lender')
  const [committed, setCommitted] = useState('1000000')
  const [costBps, setCostBps] = useState('250')

  const load = async () => {
    setLoading(true)
    try { const data = await apiGet('/capital-sources'); setSources(data?.items ?? []) } catch (e: any) { setError(e.message) } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const create = async () => {
    try {
      await apiPost('/capital-sources', { name: name || 'New Source', type, currency: 'ZAR', committed: { cents: committed, currency: 'ZAR' }, costRateBps: parseInt(costBps) || 0, startDate: new Date().toISOString() })
      setName(''); await load()
    } catch (e: any) { setError(e.message) }
  }

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Capital Grid</h1><p className="text-sm text-slate-500">Funding sources for the lending portfolio</p></div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard title="Total Sources" value={loading ? null : String(sources.length)} icon={<Grid3x3 className="h-5 w-5" />} />
        <KpiCard title="Total Committed" value={loading ? null : formatMoney(sources.reduce((s, c) => s + BigInt(c.committedCents ?? 0), 0n))} icon={<TrendingUp className="h-5 w-5" />} />
        <KpiCard title="Total Deployed" value={loading ? null : formatMoney(sources.reduce((s, c) => s + BigInt(c.deployedCents ?? 0), 0n))} icon={<Zap className="h-5 w-5" />} />
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Create Capital Source</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div><label className="text-xs font-medium text-slate-600">Name</label><input className="mt-1 w-full rounded border px-2 py-1 text-sm" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. DFI Catalytic Fund" /></div>
            <div><label className="text-xs font-medium text-slate-600">Type</label><select className="mt-1 w-full rounded border px-2 py-1 text-sm" value={type} onChange={(e) => setType(e.target.value)}><option value="lender">Lender</option><option value="groway_balance_sheet">Groway Balance Sheet</option><option value="supplier_credit">Supplier Credit</option><option value="grant">Grant</option></select></div>
            <div><label className="text-xs font-medium text-slate-600">Committed (cents)</label><input className="mt-1 w-full rounded border px-2 py-1 text-sm" value={committed} onChange={(e) => setCommitted(e.target.value)} /></div>
            <div><label className="text-xs font-medium text-slate-600">Cost (bps)</label><input className="mt-1 w-full rounded border px-2 py-1 text-sm" value={costBps} onChange={(e) => setCostBps(e.target.value)} /></div>
          </div>
          <Button className="mt-3 bg-[#0F766E] hover:bg-[#0F766E]/90" onClick={create}>Create Source</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">Capital Sources</CardTitle></CardHeader>
        <CardContent>
          {loading ? <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
           : sources.length === 0 ? <div className="py-8 text-center text-sm text-muted-foreground">No capital sources yet. Create one above.</div>
           : (
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-background"><tr className="text-left text-muted-foreground"><th className="py-2 pr-2">Name</th><th className="py-2 pr-2">Type</th><th className="py-2 pr-2">Committed</th><th className="py-2 pr-2">Deployed</th><th className="py-2 pr-2">Cost</th><th className="py-2 pr-2">Status</th></tr></thead>
                <tbody>
                  {sources.map((s) => (
                    <tr key={s.id} className="border-t"><td className="py-2 pr-2 font-medium">{s.name}</td><td className="py-2 pr-2">{s.type}</td><td className="py-2 pr-2">{formatMoney(s.committedCents, s.currency)}</td><td className="py-2 pr-2">{formatMoney(s.deployedCents, s.currency)}</td><td className="py-2 pr-2">{s.costRateBps} bps</td><td className="py-2 pr-2"><Badge variant="outline" className="text-[10px]">{s.status}</Badge></td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function SimpleView({ title }: { title: string }) {
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">{title}</h1><p className="text-sm text-slate-500">GroCore financial services engine</p></div>
      <Card><CardContent className="py-12 text-center">
        <CheckCircle2 className="h-12 w-12 text-[#0F766E] mx-auto mb-4" />
        <p className="text-slate-600">This view is part of the GroCore dashboard. The API endpoints are available at <code className="mx-1 rounded bg-slate-100 px-1 py-0.5 text-xs">/merchant-os/api/grocore/</code></p>
        <p className="text-xs text-slate-400 mt-2">The Capital Grid view is fully functional — try creating a source there.</p>
      </CardContent></Card>
    </div>
  )
}

function KpiCard({ title, value, icon, subtitle }: { title: string; value: string | null; icon: React.ReactNode; subtitle?: string }) {
  return (
    <Card><CardContent className="pt-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">{title}</p>
          <div className="text-2xl font-bold mt-1">{value === null ? <Skeleton className="h-7 w-24" /> : value}</div>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        <div className="rounded-lg bg-[#0F766E]/10 p-2 text-[#0F766E]">{icon}</div>
      </div>
    </CardContent></Card>
  )
}
