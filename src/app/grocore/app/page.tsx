'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Landmark, LayoutDashboard, BookOpen, ShieldCheck, Brain, Zap, Ticket,
  Grid3x3, CreditCard, Smartphone, LogOut, RefreshCw, ArrowRight, TrendingUp,
  AlertCircle, CheckCircle2, Plus, Trash2, Send, Lock, Unlock, X, Sparkles,
  MessageSquare, Wallet, ArrowDownLeft, ArrowUpRight, FileText, Calculator
} from 'lucide-react'
import { apiGet, apiPost, apiDelete, formatMoney, formatDate, formatDateTime, moneyCents } from './lib/api'

type ViewId = 'overview' | 'ledger' | 'consent' | 'decisioning' | 'advances' | 'vouchers' | 'capital' | 'gopay' | 'devices' | 'groai'

const navItems: { id: ViewId; label: string; icon: typeof LayoutDashboard; desc: string }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, desc: 'Dashboard summary' },
  { id: 'ledger', label: 'Ledger', icon: BookOpen, desc: 'Double-entry postings' },
  { id: 'consent', label: 'Consent', icon: ShieldCheck, desc: 'POPIA consent log' },
  { id: 'decisioning', label: 'Decisioning', icon: Brain, desc: 'Credit decisions' },
  { id: 'advances', label: 'Top-up Advances', icon: Zap, desc: 'Airtime & electricity' },
  { id: 'vouchers', label: 'Vouchers', icon: Ticket, desc: 'E-voucher engine' },
  { id: 'capital', label: 'Capital Grid', icon: Grid3x3, desc: 'Funding sources' },
  { id: 'gopay', label: 'GoPay Settlement', icon: CreditCard, desc: 'Payment captures' },
  { id: 'devices', label: 'Device Finance', icon: Smartphone, desc: 'M-KOPA contracts' },
  { id: 'groai', label: 'GroAI Assistant', icon: Sparkles, desc: 'Get help & guidance' },
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
        <nav className="w-60 flex-shrink-0 border-r border-slate-200 bg-slate-900 p-3 overflow-y-auto">
          <div className="space-y-1">
            {navItems.map((item) => (
              <button key={item.id} onClick={() => setActiveView(item.id)}
                className={`flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${activeView === item.id ? 'bg-[#0F766E]/10 text-[#0F766E]' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
                <item.icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <div>{item.label}</div>
                  {activeView === item.id && <div className="text-[10px] font-normal opacity-70 mt-0.5">{item.desc}</div>}
                </div>
              </button>
            ))}
          </div>
        </nav>

        <main className="flex-1 overflow-auto p-6">
          {activeView === 'overview' && <OverviewView onNavigate={setActiveView} />}
          {activeView === 'ledger' && <LedgerView />}
          {activeView === 'consent' && <ConsentView />}
          {activeView === 'decisioning' && <DecisioningView />}
          {activeView === 'advances' && <AdvancesView />}
          {activeView === 'vouchers' && <VouchersView />}
          {activeView === 'capital' && <CapitalView />}
          {activeView === 'gopay' && <GoPayView />}
          {activeView === 'devices' && <DeviceFinanceView />}
          {activeView === 'groai' && <GroAIView />}
        </main>
      </div>

      <footer className="mt-auto border-t border-slate-200 bg-white py-3">
        <div className="px-4 text-center text-xs text-slate-500">GroCore v1.0 — Financial OS | Money stored as integer minor units | Groway (Pty) Ltd</div>
      </footer>
    </div>
  )
}

// ============================================================
// Shared components
// ============================================================

function ViewHeader({ title, description, icon, onRefresh }: { title: string; description: string; icon: React.ReactNode; onRefresh?: () => void }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-[#0F766E]/10 p-2.5 text-[#0F766E]">{icon}</div>
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">{description}</p>
        </div>
      </div>
      {onRefresh && <Button variant="outline" size="sm" onClick={onRefresh}><RefreshCw className="h-4 w-4 mr-1" /> Refresh</Button>}
    </div>
  )
}

function KpiCard({ title, value, icon, subtitle }: { title: string; value: string | null; icon: React.ReactNode; subtitle?: string }) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">{title}</p>
            <div className="text-2xl font-bold mt-1">{value === null ? <Skeleton className="h-7 w-24" /> : value}</div>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <div className="rounded-lg bg-[#0F766E]/10 p-2 text-[#0F766E]">{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
}

function ErrorBanner({ error }: { error: string | null }) {
  if (!error) return null
  return (
    <Card className="border-amber-300 bg-amber-50 mb-4">
      <CardContent className="py-3 flex items-center gap-2 text-sm text-amber-900">
        <AlertCircle className="h-4 w-4 flex-shrink-0" /> {error}
      </CardContent>
    </Card>
  )
}

function EmptyState({ text }: { text: string }) {
  return <div className="py-8 text-center text-sm text-muted-foreground">{text}</div>
}

function SuccessToast({ message }: { message: string }) {
  if (!message) return null
  return (
    <Card className="border-green-300 bg-green-50 mb-4">
      <CardContent className="py-3 flex items-center gap-2 text-sm text-green-700">
        <CheckCircle2 className="h-4 w-4 flex-shrink-0" /> {message}
      </CardContent>
    </Card>
  )
}

const inputClass = "mt-1 w-full rounded-md border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"

// ============================================================
// 1. Overview View
// ============================================================
function OverviewView({ onNavigate }: { onNavigate: (v: ViewId) => void }) {
  const [loading, setLoading] = useState(true)
  const [capitalSources, setCapitalSources] = useState<any[]>([])
  const [advances, setAdvances] = useState<any[]>([])
  const [vouchers, setVouchers] = useState<any[]>([])
  const [entries, setEntries] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const [cap, adv, vch, ent] = await Promise.allSettled([
        apiGet('/capital-sources'), apiGet('/advances'), apiGet('/vouchers'), apiGet('/entries')
      ])
      if (cap.status === 'fulfilled') setCapitalSources(cap.value?.items ?? [])
      if (adv.status === 'fulfilled') setAdvances(adv.value?.items ?? [])
      if (vch.status === 'fulfilled') setVouchers(vch.value?.items ?? [])
      if (ent.status === 'fulfilled') setEntries(ent.value?.items ?? [])
    } catch (e: any) { setError(e.message) } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const deployedCents = capitalSources.reduce((s, c) => s + BigInt(moneyCents(c, "deployed")), 0n)
  const committedCents = capitalSources.reduce((s, c) => s + BigInt(moneyCents(c, "committed")), 0n)
  const openAdvances = advances.filter((a) => a.status === 'open')

  const quickLinks: { id: ViewId; label: string; icon: typeof LayoutDashboard; desc: string }[] = [
    { id: 'capital', label: 'Add Capital Source', icon: Grid3x3, desc: 'Fund your lending portfolio' },
    { id: 'advances', label: 'Issue Advance', icon: Zap, desc: 'Airtime, data, electricity' },
    { id: 'vouchers', label: 'Issue Voucher', icon: Ticket, desc: 'Serial + PIN + QR' },
    { id: 'ledger', label: 'Post Entry', icon: BookOpen, desc: 'Double-entry posting' },
    { id: 'decisioning', label: 'Run Decision', icon: Brain, desc: 'Credit assessment' },
    { id: 'devices', label: 'Create Contract', icon: Smartphone, desc: 'M-KOPA-style finance' },
  ]

  return (
    <div className="space-y-6">
      <ViewHeader title="Overview" description="GroCore financial services engine at a glance — monitor capital, advances, vouchers and ledger activity across your tenant." icon={<LayoutDashboard className="h-6 w-6" />} onRefresh={load} />
      <ErrorBanner error={error} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Capital Deployed" value={loading ? null : formatMoney(deployedCents)} icon={<Grid3x3 className="h-5 w-5" />} subtitle={`${capitalSources.length} sources · ${formatMoney(committedCents)} committed`} />
        <KpiCard title="Open Advances" value={loading ? null : String(openAdvances.length)} icon={<Zap className="h-5 w-5" />} subtitle={`${advances.length} total advances`} />
        <KpiCard title="Vouchers Issued" value={loading ? null : String(vouchers.length)} icon={<Ticket className="h-5 w-5" />} subtitle="all-time" />
        <KpiCard title="Ledger Entries" value={loading ? null : String(entries.length)} icon={<BookOpen className="h-5 w-5" />} subtitle="posted journal entries" />
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {quickLinks.map((link) => (
            <button key={link.id} onClick={() => onNavigate(link.id)}
              className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 text-left hover:border-[#0F766E] hover:shadow-sm transition-all">
              <div className="rounded-lg bg-[#0F766E]/10 p-2 text-[#0F766E]"><link.icon className="h-5 w-5" /></div>
              <div>
                <p className="text-sm font-medium">{link.label}</p>
                <p className="text-xs text-slate-500">{link.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Recent Advances</CardTitle><CardDescription>Latest top-up advances issued</CardDescription></CardHeader>
          <CardContent>
            {loading ? <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
             : advances.length === 0 ? <EmptyState text="No advances yet. Click 'Issue Advance' above." />
             : (
              <div className="max-h-64 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-background"><tr className="text-left text-muted-foreground"><th className="py-2 pr-2">Subject</th><th className="py-2 pr-2">Product</th><th className="py-2 pr-2">Principal</th><th className="py-2 pr-2">Status</th></tr></thead>
                  <tbody>{advances.slice(0, 10).map((a) => (
                    <tr key={a.id} className="border-t"><td className="py-2 pr-2 font-mono truncate max-w-[100px]">{a.subjectId}</td><td className="py-2 pr-2">{a.product}</td><td className="py-2 pr-2">{formatMoney(moneyCents(a, "principal"), a.currency)}</td><td className="py-2 pr-2"><Badge variant="outline" className="text-[10px]">{a.status}</Badge></td></tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Capital Sources</CardTitle><CardDescription>Funding sources for the lending portfolio</CardDescription></CardHeader>
          <CardContent>
            {loading ? <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
             : capitalSources.length === 0 ? <EmptyState text="No capital sources yet. Click 'Add Capital Source' above." />
             : (
              <div className="max-h-64 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-background"><tr className="text-left text-muted-foreground"><th className="py-2 pr-2">Name</th><th className="py-2 pr-2">Deployed</th><th className="py-2 pr-2">Status</th></tr></thead>
                  <tbody>{capitalSources.map((s) => (
                    <tr key={s.id} className="border-t"><td className="py-2 pr-2 font-medium">{s.name}</td><td className="py-2 pr-2">{formatMoney(moneyCents(s, "deployed"), s.currency)}</td><td className="py-2 pr-2"><Badge variant="outline" className="text-[10px]">{s.status}</Badge></td></tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ============================================================
// 2. Ledger View
// ============================================================
function LedgerView() {
  const [loading, setLoading] = useState(true)
  const [trialBalance, setTrialBalance] = useState<any[]>([])
  const [entries, setEntries] = useState<any[]>([])
  const [accounts, setAccounts] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState('')

  const [entryId, setEntryId] = useState('')
  const [description, setDescription] = useState('')
  const [debitAccount, setDebitAccount] = useState('')
  const [creditAccount, setCreditAccount] = useState('')
  const [amount, setAmount] = useState('1000')

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const [tb, ent, acc] = await Promise.allSettled([apiGet('/trial-balance'), apiGet('/entries'), apiGet('/accounts')])
      if (tb.status === 'fulfilled') setTrialBalance(tb.value?.rows ?? [])
      if (ent.status === 'fulfilled') setEntries(ent.value?.items ?? [])
      if (acc.status === 'fulfilled') setAccounts(acc.value?.items ?? [])
    } catch (e: any) { setError(e.message) } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const createAccounts = async () => {
    // Create default accounts if none exist
    if (accounts.length > 0) return accounts
    const defaults = [
      { code: '1000', name: 'Cash at Bank', kind: 'asset', subKind: 'cash', currency: 'ZAR' },
      { code: '1200', name: 'Loan Receivable', kind: 'asset', subKind: 'advance_receivable', currency: 'ZAR' },
      { code: '2100', name: 'Loan Payable', kind: 'liability', subKind: 'supplier_payable', currency: 'ZAR' },
      { code: '4000', name: 'Interest Income', kind: 'income', subKind: 'fee_income', currency: 'ZAR' },
      { code: '5000', name: 'Bad Debt Expense', kind: 'expense', subKind: 'bad_debt', currency: 'ZAR' },
    ]
    const created: any[] = []
    for (const d of defaults) {
      try { const r = await apiPost('/accounts', d); created.push(r) } catch {}
    }
    setAccounts(created)
    return created
  }

  const postEntry = async () => {
    setError(null); setSuccess('')
    try {
      const accs = await createAccounts()
      const debitAcc = accs.find(a => a.code === debitAccount)
      const creditAcc = accs.find(a => a.code === creditAccount)
      if (!debitAcc || !creditAcc) { setError('Select valid account codes (e.g. 1000, 2100)'); return }
      await apiPost('/entries', {
        entryId: entryId || `JE-${Date.now()}`,
        sourceType: 'manual', sourceId: `src-${Date.now()}`,
        description: description || 'Manual journal entry',
        lines: [
          { accountCode: debitAccount, amount: { cents: amount, currency: 'ZAR' } },
          { accountCode: creditAccount, amount: { cents: `-${amount}`, currency: 'ZAR' } },
        ],
      })
      setSuccess('Entry posted successfully!')
      setEntryId(''); setDescription(''); setAmount('1000')
      await load()
    } catch (e: any) { setError(e.message) }
  }

  return (
    <div className="space-y-6">
      <ViewHeader title="Double-Entry Ledger" description="Post balanced journal entries with idempotency keys. Every entry nets to zero per currency. Trial balance is computed from posted lines." icon={<BookOpen className="h-6 w-6" />} onRefresh={load} />
      <ErrorBanner error={error} />
      <SuccessToast message={success} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Post Balanced Entry</CardTitle><CardDescription>Lines must net to zero per currency. Debit is positive, credit is negative.</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Entry ID (idempotency)</Label><Input className={inputClass} value={entryId} onChange={(e) => setEntryId(e.target.value)} placeholder={`JE-${Date.now()}`} /></div>
              <div><Label>Description</Label><Input className={inputClass} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Manual journal entry" /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Debit Account</Label>
                <select className={inputClass} value={debitAccount} onChange={(e) => setDebitAccount(e.target.value)}>
                  <option value="">Select...</option>
                  {accounts.map((a) => <option key={a.id} value={a.code}>{a.code} — {a.name}</option>)}
                  {accounts.length === 0 && <option value="1000">1000 — Cash at Bank</option>}
                </select>
              </div>
              <div><Label>Credit Account</Label>
                <select className={inputClass} value={creditAccount} onChange={(e) => setCreditAccount(e.target.value)}>
                  <option value="">Select...</option>
                  {accounts.map((a) => <option key={a.id} value={a.code}>{a.code} — {a.name}</option>)}
                  {accounts.length === 0 && <option value="2100">2100 — Loan Payable</option>}
                </select>
              </div>
              <div><Label>Amount (cents)</Label><Input className={inputClass} type="number" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
            </div>
            <Button className="bg-[#0F766E] hover:bg-[#0F766E]/90" onClick={postEntry}><Plus className="h-4 w-4 mr-1" /> Post Entry</Button>
            {accounts.length === 0 && <p className="text-xs text-slate-400">Default accounts will be created automatically on first post.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Trial Balance</CardTitle><CardDescription>Net debit (positive) / credit (negative) per account</CardDescription></CardHeader>
          <CardContent>
            {loading ? <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
             : trialBalance.length === 0 ? <EmptyState text="No posted entries yet. Post an entry to see the trial balance." />
             : (
              <div className="max-h-72 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-background"><tr className="text-left text-muted-foreground"><th className="py-2 pr-2">Code</th><th className="py-2 pr-2">Name</th><th className="py-2 pr-2 text-right">Balance</th></tr></thead>
                  <tbody>{trialBalance.map((r, i) => (
                    <tr key={i} className="border-t"><td className="py-2 pr-2 font-mono">{r.accountCode}</td><td className="py-2 pr-2">{r.accountName}</td><td className={`py-2 pr-2 text-right font-mono ${BigInt(r.balanceCents) < 0n ? 'text-rose-600' : 'text-emerald-600'}`}>{formatMoney(r.balanceCents, r.currency)}</td></tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Recent Journal Entries</CardTitle></CardHeader>
        <CardContent>
          {loading ? <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
           : entries.length === 0 ? <EmptyState text="No entries posted yet." />
           : (
            <div className="max-h-72 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-background"><tr className="text-left text-muted-foreground"><th className="py-2 pr-2">Entry ID</th><th className="py-2 pr-2">Description</th><th className="py-2 pr-2">Source</th><th className="py-2 pr-2">Posted</th></tr></thead>
                <tbody>{entries.slice(0, 15).map((e) => (
                  <tr key={e.entry?.id || e.id} className="border-t"><td className="py-2 pr-2 font-mono">{e.entry?.entryId}</td><td className="py-2 pr-2">{e.entry?.description}</td><td className="py-2 pr-2">{e.entry?.sourceType}</td><td className="py-2 pr-2">{e.entry?.postedAt ? formatDateTime(e.entry.postedAt) : '-'}</td></tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================
// 3. Consent View
// ============================================================
function ConsentView() {
  const [loading, setLoading] = useState(true)
  const [consents, setConsents] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState('')

  const [subjectId, setSubjectId] = useState('')
  const [purpose, setPurpose] = useState('credit_use')
  const [policyVersion, setPolicyVersion] = useState('v1')

  const load = async () => {
    setLoading(true); setError(null)
    try { const data = await apiGet('/consents'); setConsents(data?.items ?? []) } catch (e: any) { setError(e.message) } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const grant = async () => {
    setError(null); setSuccess('')
    try {
      if (!subjectId) { setError('Subject ID is required'); return }
      await apiPost('/consents', { subjectId, purpose, policyVersion, subjectType: 'customer' })
      setSuccess(`Consent granted for ${subjectId} / ${purpose}`)
      setSubjectId(''); await load()
    } catch (e: any) { setError(e.message) }
  }

  const revoke = async (sid: string, purp: string) => {
    try { await apiDelete(`/consents/${encodeURIComponent(sid)}/${encodeURIComponent(purp)}`); setSuccess(`Consent revoked for ${sid}`); await load() } catch (e: any) { setError(e.message) }
  }

  return (
    <div className="space-y-6">
      <ViewHeader title="Consent Management" description="POPIA-compliant consent log. Every credit decision checks consent first. Consent is purpose-bound, revocable and expiring." icon={<ShieldCheck className="h-6 w-6" />} onRefresh={load} />
      <ErrorBanner error={error} />
      <SuccessToast message={success} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Grant Consent</CardTitle><CardDescription>Grant consent for a specific subject and purpose</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            <div><Label>Subject ID (phone, ID, or customer ID)</Label><Input className={inputClass} value={subjectId} onChange={(e) => setSubjectId(e.target.value)} placeholder="27821234567" /></div>
            <div><Label>Purpose</Label>
              <select className={inputClass} value={purpose} onChange={(e) => setPurpose(e.target.value)}>
                <option value="credit_use">Credit Use</option>
                <option value="topup_credit">Top-up Credit</option>
                <option value="marketing">Marketing</option>
                <option value="data_processing">Data Processing</option>
                <option value="device_finance">Device Finance</option>
              </select>
            </div>
            <div><Label>Policy Version</Label><Input className={inputClass} value={policyVersion} onChange={(e) => setPolicyVersion(e.target.value)} /></div>
            <Button className="bg-[#0F766E] hover:bg-[#0F766E]/90" onClick={grant}><ShieldCheck className="h-4 w-4 mr-1" /> Grant Consent</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Active Consents</CardTitle><CardDescription>All consent records — active, revoked and expired</CardDescription></CardHeader>
          <CardContent>
            {loading ? <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
             : consents.length === 0 ? <EmptyState text="No consents yet. Grant one above." />
             : (
              <div className="max-h-72 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-background"><tr className="text-left text-muted-foreground"><th className="py-2 pr-2">Subject</th><th className="py-2 pr-2">Purpose</th><th className="py-2 pr-2">Status</th><th className="py-2 pr-2">Action</th></tr></thead>
                  <tbody>{consents.map((c) => (
                    <tr key={c.id} className="border-t">
                      <td className="py-2 pr-2 font-mono">{c.subjectId}</td>
                      <td className="py-2 pr-2">{c.purpose}</td>
                      <td className="py-2 pr-2"><Badge variant="outline" className={`text-[10px] ${c.status === 'active' ? 'text-green-600 border-green-300' : 'text-red-600 border-red-300'}`}>{c.status}</Badge></td>
                      <td className="py-2 pr-2">{c.status === 'active' && <Button size="sm" variant="ghost" className="h-6 text-xs text-red-600" onClick={() => revoke(c.subjectId, c.purpose)}>Revoke</Button>}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ============================================================
// 4. Decisioning View
// ============================================================
function DecisioningView() {
  const [loading, setLoading] = useState(true)
  const [decisions, setDecisions] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<any>(null)

  const [subjectId, setSubjectId] = useState('')
  const [requestedAmount, setRequestedAmount] = useState('50000')
  const [tenureDays, setTenureDays] = useState('120')
  const [activeMonths, setActiveMonths] = useState('4')
  const [avgSpend, setAvgSpend] = useState('30000')
  const [identityVerified, setIdentityVerified] = useState(true)
  const [hasOpenAdvance, setHasOpenAdvance] = useState(false)

  const load = async () => {
    setLoading(true); setError(null)
    try { const data = await apiGet('/decisions'); setDecisions(data?.items ?? []) } catch (e: any) { setError(e.message) } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const runDecision = async () => {
    setError(null); setResult(null)
    try {
      const r = await apiPost('/decisions', {
        subjectId: subjectId || 'test-subject',
        subjectType: 'customer',
        requestedAmount: { cents: requestedAmount, currency: 'ZAR' },
        features: {
          tenureDays: parseInt(tenureDays), activeMonths: parseInt(activeMonths),
          averageMonthlySpend: { cents: avgSpend, currency: 'ZAR' },
          identityVerified, hasOpenAdvance, onBlocklist: false, arrears: null,
        },
        policy: {
          policyVersion: 'v1', modelVersion: 'v1', product: 'grocredit',
          minTenureDays: 90, minActiveMonths: 3,
          minSpendPerMonth: { cents: '2900', currency: 'ZAR' },
          limitAsShareOfSpend: 0.3, hardCap: { cents: '500000', currency: 'ZAR' },
          maxAffordabilityRatio: 0.45,
        },
      })
      setResult(r)
      await load()
    } catch (e: any) { setError(e.message) }
  }

  return (
    <div className="space-y-6">
      <ViewHeader title="Credit Decisioning" description="Consent-first credit decisions with hard stops, affordability checks, reason codes and full trace. Missing critical data means refer to a human, never a guess." icon={<Brain className="h-6 w-6" />} onRefresh={load} />
      <ErrorBanner error={error} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Run Decision</CardTitle><CardDescription>Enter subject features and requested amount</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Subject ID</Label><Input className={inputClass} value={subjectId} onChange={(e) => setSubjectId(e.target.value)} placeholder="27821234567" /></div>
              <div><Label>Requested Amount (cents)</Label><Input className={inputClass} type="number" value={requestedAmount} onChange={(e) => setRequestedAmount(e.target.value)} /></div>
              <div><Label>Tenure (days)</Label><Input className={inputClass} type="number" value={tenureDays} onChange={(e) => setTenureDays(e.target.value)} /></div>
              <div><Label>Active Months</Label><Input className={inputClass} type="number" value={activeMonths} onChange={(e) => setActiveMonths(e.target.value)} /></div>
              <div><Label>Avg Monthly Spend (cents)</Label><Input className={inputClass} type="number" value={avgSpend} onChange={(e) => setAvgSpend(e.target.value)} /></div>
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={identityVerified} onChange={(e) => setIdentityVerified(e.target.checked)} /> Identity Verified</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={hasOpenAdvance} onChange={(e) => setHasOpenAdvance(e.target.checked)} /> Has Open Advance</label>
            </div>
            <Button className="bg-[#0F766E] hover:bg-[#0F766E]/90" onClick={runDecision}><Brain className="h-4 w-4 mr-1" /> Run Decision</Button>
          </CardContent>
        </Card>

        {result && (
          <Card>
            <CardHeader><CardTitle className="text-base">Decision Result</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge className={result.outcome === 'approve' ? 'bg-green-600' : result.outcome === 'refer' ? 'bg-amber-500' : 'bg-red-600'}>{result.outcome.toUpperCase()}</Badge>
                {result.approvedLimit && <span className="text-sm">Limit: {formatMoney(result.approvedLimit.cents, result.approvedLimit.currency)}</span>}
              </div>
              <div><p className="text-xs font-semibold mb-1">Reason Codes</p><div className="flex flex-wrap gap-1">{result.reasonCodes?.map((r: string, i: number) => <Badge key={i} variant="outline" className="text-[10px]">{r}</Badge>)}</div></div>
              {result.counterfactual && <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded">{result.counterfactual}</div>}
              {result.trace?.steps && (
                <div>
                  <p className="text-xs font-semibold mb-1">Decision Trace</p>
                  <div className="space-y-1">{result.trace.steps.map((s: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-xs"><CheckCircle2 className={`h-3 w-3 ${s.passed ? 'text-green-600' : 'text-red-600'}`} /><span>{s.step}</span>{s.reason && <span className="text-slate-400">— {s.reason}</span>}</div>
                  ))}</div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Recent Decisions</CardTitle></CardHeader>
        <CardContent>
          {loading ? <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
           : decisions.length === 0 ? <EmptyState text="No decisions yet. Run one above." />
           : (
            <div className="max-h-72 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-background"><tr className="text-left text-muted-foreground"><th className="py-2 pr-2">Subject</th><th className="py-2 pr-2">Amount</th><th className="py-2 pr-2">Outcome</th><th className="py-2 pr-2">Reasons</th><th className="py-2 pr-2">Date</th></tr></thead>
                <tbody>{decisions.slice(0, 15).map((d) => (
                  <tr key={d.id} className="border-t"><td className="py-2 pr-2 font-mono">{d.subjectId}</td><td className="py-2 pr-2">{formatMoney(moneyCents(d, "amount"), d.currency)}</td><td className="py-2 pr-2"><Badge variant="outline" className={`text-[10px] ${d.outcome === 'approve' ? 'text-green-600 border-green-300' : d.outcome === 'refer' ? 'text-amber-600 border-amber-300' : 'text-red-600 border-red-300'}`}>{d.outcome}</Badge></td><td className="py-2 pr-2 text-[10px]">{d.reasonCodes}</td><td className="py-2 pr-2">{d.createdAt ? formatDate(d.createdAt) : '-'}</td></tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================
// 5. Top-up Advances View
// ============================================================
function AdvancesView() {
  const [loading, setLoading] = useState(true)
  const [advances, setAdvances] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState('')

  const [subjectId, setSubjectId] = useState('')
  const [productCode, setProductCode] = useState('sa_airtime')
  const [amount, setAmount] = useState('500')
  const [tenure, setTenure] = useState('120')
  const [activeMonths, setActiveMonths] = useState('4')
  const [avgSpend, setAvgSpend] = useState('3000')
  const [deliveryMethod, setDeliveryMethod] = useState('voucher_print')

  const load = async () => {
    setLoading(true); setError(null)
    try { const data = await apiGet('/advances'); setAdvances(data?.items ?? []) } catch (e: any) { setError(e.message) } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const issue = async () => {
    setError(null); setSuccess('')
    try {
      const r = await apiPost('/advances', {
        productCode, subjectId, amount: { cents: amount, currency: 'ZAR' },
        eligibility: { tenureDays: parseInt(tenure), activeMonths: parseInt(activeMonths), averageMonthlySpend: { cents: avgSpend, currency: 'ZAR' }, hasOpenAdvance: false },
        deliveryMethod,
      })
      setSuccess(`Advance issued: ${r.id} — Principal ${formatMoney(moneyCents(r, "principal"), r.currency)}, Fee ${formatMoney(moneyCents(r, "fee"), r.currency)}, Total due ${formatMoney(moneyCents(r, "totalDue"), r.currency)}`)
      setSubjectId(''); await load()
    } catch (e: any) { setError(e.message) }
  }

  const recover = async (id: string) => {
    try { await apiPost(`/advances/${id}/recover`, { topupAmount: { cents: '1000', currency: 'ZAR' }, idempotencyKey: `rec-${Date.now()}`, source: 'topup_event' }); setSuccess('Recovery applied'); await load() } catch (e: any) { setError(e.message) }
  }

  return (
    <div className="space-y-6">
      <ViewHeader title="Top-up Advances" description="Airtime, data and electricity advances with claw-back recovery. The advance plus a fee is taken back automatically on the next top-up. SA and Malawi market presets available." icon={<Zap className="h-6 w-6" />} onRefresh={load} />
      <ErrorBanner error={error} />
      <SuccessToast message={success} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Issue Advance</CardTitle><CardDescription>Check eligibility and issue a top-up advance</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Subject ID (MSISDN/meter)</Label><Input className={inputClass} value={subjectId} onChange={(e) => setSubjectId(e.target.value)} placeholder="27821234567" /></div>
              <div><Label>Product</Label>
                <select className={inputClass} value={productCode} onChange={(e) => setProductCode(e.target.value)}>
                  <option value="sa_airtime">SA Airtime (R5–R20)</option>
                  <option value="sa_electricity">SA Electricity (R50–R300)</option>
                  <option value="mw_airtime">MW Airtime (K50–K2000)</option>
                  <option value="mw_electricity">MW Electricity (K5000–K20000)</option>
                  <option value="merchant_float">Merchant Float (R100–R5000)</option>
                </select>
              </div>
              <div><Label>Amount (cents)</Label><Input className={inputClass} type="number" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
              <div><Label>Delivery Method</Label>
                <select className={inputClass} value={deliveryMethod} onChange={(e) => setDeliveryMethod(e.target.value)}>
                  <option value="direct_recharge">Direct Recharge</option>
                  <option value="voucher_print">Print Voucher</option>
                  <option value="voucher_qr">QR Voucher</option>
                </select>
              </div>
              <div><Label>Tenure (days)</Label><Input className={inputClass} type="number" value={tenure} onChange={(e) => setTenure(e.target.value)} /></div>
              <div><Label>Active Months</Label><Input className={inputClass} type="number" value={activeMonths} onChange={(e) => setActiveMonths(e.target.value)} /></div>
              <div><Label>Avg Monthly Spend (cents)</Label><Input className={inputClass} type="number" value={avgSpend} onChange={(e) => setAvgSpend(e.target.value)} /></div>
            </div>
            <Button className="bg-[#0F766E] hover:bg-[#0F766E]/90" onClick={issue}><Zap className="h-4 w-4 mr-1" /> Issue Advance</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Open & Historical Advances</CardTitle></CardHeader>
          <CardContent>
            {loading ? <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
             : advances.length === 0 ? <EmptyState text="No advances yet. Issue one above." />
             : (
              <div className="max-h-72 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-background"><tr className="text-left text-muted-foreground"><th className="py-2 pr-2">Subject</th><th className="py-2 pr-2">Product</th><th className="py-2 pr-2">Principal</th><th className="py-2 pr-2">Total Due</th><th className="py-2 pr-2">Paid</th><th className="py-2 pr-2">Status</th><th className="py-2 pr-2">Action</th></tr></thead>
                  <tbody>{advances.map((a) => (
                    <tr key={a.id} className="border-t">
                      <td className="py-2 pr-2 font-mono truncate max-w-[80px]">{a.subjectId}</td>
                      <td className="py-2 pr-2">{a.product}</td>
                      <td className="py-2 pr-2">{formatMoney(moneyCents(a, "principal"), a.currency)}</td>
                      <td className="py-2 pr-2">{formatMoney(moneyCents(a, "totalDue"), a.currency)}</td>
                      <td className="py-2 pr-2">{formatMoney(moneyCents(a, "paid"), a.currency)}</td>
                      <td className="py-2 pr-2"><Badge variant="outline" className={`text-[10px] ${a.status === 'open' ? 'text-amber-600 border-amber-300' : a.status === 'recovered' ? 'text-green-600 border-green-300' : 'text-red-600 border-red-300'}`}>{a.status}</Badge></td>
                      <td className="py-2 pr-2">{a.status === 'open' && <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => recover(a.id)}>Recover</Button>}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ============================================================
// 6. Vouchers View
// ============================================================
function VouchersView() {
  const [loading, setLoading] = useState(true)
  const [vouchers, setVouchers] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState('')

  const [product, setProduct] = useState('airtime')
  const [supplier, setSupplier] = useState('Vodacom')
  const [faceValue, setFaceValue] = useState('1000')
  const [cost, setCost] = useState('950')
  const [recipientMsisdn, setRecipientMsisdn] = useState('')
  const [deliveryMethod, setDeliveryMethod] = useState('voucher_print')

  const load = async () => {
    setLoading(true); setError(null)
    try { const data = await apiGet('/vouchers'); setVouchers(data?.items ?? []) } catch (e: any) { setError(e.message) } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const issue = async () => {
    setError(null); setSuccess('')
    try {
      const r = await apiPost('/vouchers', {
        product, supplier, faceValue: { cents: faceValue, currency: 'ZAR' }, cost: { cents: cost, currency: 'ZAR' },
        recipientMsisdn: recipientMsisdn || undefined, deliveryMethod,
      })
      setSuccess(`Voucher issued: ${r.serial}${r.pin ? ` · PIN: ${r.pin}` : ''}${r.qrPayload ? ' · QR generated' : ''}`)
      setRecipientMsisdn(''); await load()
    } catch (e: any) { setError(e.message) }
  }

  const redeem = async (serial: string) => {
    try { await apiPost(`/vouchers/${encodeURIComponent(serial)}/redeem`); setSuccess(`Voucher ${serial} redeemed`); await load() } catch (e: any) { setError(e.message) }
  }

  return (
    <div className="space-y-6">
      <ViewHeader title="Voucher Engine" description="Issue e-vouchers with serial numbers, PINs and QR codes. Supports airtime, data, electricity and ISP bundles across 29 vendors. Direct recharge, print or QR delivery." icon={<Ticket className="h-6 w-6" />} onRefresh={load} />
      <ErrorBanner error={error} />
      <SuccessToast message={success} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Issue Voucher</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Product</Label>
                <select className={inputClass} value={product} onChange={(e) => setProduct(e.target.value)}>
                  <option value="airtime">Airtime</option>
                  <option value="data">Data</option>
                  <option value="electricity">Electricity</option>
                  <option value="isp_bundle">ISP Bundle</option>
                </select>
              </div>
              <div><Label>Supplier</Label>
                <select className={inputClass} value={supplier} onChange={(e) => setSupplier(e.target.value)}>
                  <option>Vodacom</option><option>MTN</option><option>Cell C</option><option>Telkom</option>
                  <option>Eskom</option><option>City Power</option><option>Octotel</option><option>Fibrehoods</option>
                </select>
              </div>
              <div><Label>Face Value (cents)</Label><Input className={inputClass} type="number" value={faceValue} onChange={(e) => setFaceValue(e.target.value)} /></div>
              <div><Label>Cost (cents)</Label><Input className={inputClass} type="number" value={cost} onChange={(e) => setCost(e.target.value)} /></div>
              <div><Label>Recipient MSISDN</Label><Input className={inputClass} value={recipientMsisdn} onChange={(e) => setRecipientMsisdn(e.target.value)} placeholder="27821234567" /></div>
              <div><Label>Delivery Method</Label>
                <select className={inputClass} value={deliveryMethod} onChange={(e) => setDeliveryMethod(e.target.value)}>
                  <option value="direct_recharge">Direct Recharge</option>
                  <option value="voucher_print">Print Voucher (PIN)</option>
                  <option value="voucher_qr">QR Voucher (PIN + QR)</option>
                </select>
              </div>
            </div>
            <Button className="bg-[#0F766E] hover:bg-[#0F766E]/90" onClick={issue}><Ticket className="h-4 w-4 mr-1" /> Issue Voucher</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Voucher Inventory</CardTitle></CardHeader>
          <CardContent>
            {loading ? <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
             : vouchers.length === 0 ? <EmptyState text="No vouchers yet. Issue one above." />
             : (
              <div className="max-h-72 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-background"><tr className="text-left text-muted-foreground"><th className="py-2 pr-2">Serial</th><th className="py-2 pr-2">Product</th><th className="py-2 pr-2">Face Value</th><th className="py-2 pr-2">Status</th><th className="py-2 pr-2">Action</th></tr></thead>
                  <tbody>{vouchers.map((v) => (
                    <tr key={v.id} className="border-t">
                      <td className="py-2 pr-2 font-mono text-[10px]">{v.serial}</td>
                      <td className="py-2 pr-2">{v.product}</td>
                      <td className="py-2 pr-2">{formatMoney(moneyCents(v, "faceValue"), v.currency)}</td>
                      <td className="py-2 pr-2"><Badge variant="outline" className={`text-[10px] ${v.status === 'issued' ? 'text-green-600 border-green-300' : v.status === 'redeemed' ? 'text-blue-600 border-blue-300' : 'text-red-600 border-red-300'}`}>{v.status}</Badge></td>
                      <td className="py-2 pr-2">{v.status === 'issued' && <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => redeem(v.serial)}>Redeem</Button>}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ============================================================
// 7. Capital Grid View
// ============================================================
function CapitalView() {
  const [loading, setLoading] = useState(true)
  const [sources, setSources] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState('')

  const [name, setName] = useState('')
  const [type, setType] = useState('lender')
  const [committed, setCommitted] = useState('1000000')
  const [costBps, setCostBps] = useState('250')
  const [currency, setCurrency] = useState('ZAR')

  const [allocAmount, setAllocAmount] = useState('500000')

  const load = async () => {
    setLoading(true); setError(null)
    try { const data = await apiGet('/capital-sources'); setSources(data?.items ?? []) } catch (e: any) { setError(e.message) } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const create = async () => {
    setError(null); setSuccess('')
    try {
      await apiPost('/capital-sources', {
        name: name || 'New Source', type, currency,
        committed: { cents: committed, currency },
        costRateBps: parseInt(costBps) || 0, startDate: new Date().toISOString(),
      })
      setSuccess(`Capital source '${name || 'New Source'}' created!`)
      setName(''); await load()
    } catch (e: any) { setError(e.message) }
  }

  const allocate = async () => {
    setError(null); setSuccess('')
    try {
      const r = await apiPost('/capital-sources/allocate', { amount: { cents: allocAmount, currency } })
      setSuccess(`Allocated ${formatMoney(allocAmount, currency)} across ${r.allocations?.length || 0} source(s)`)
      await load()
    } catch (e: any) { setError(e.message) }
  }

  const committedCents = sources.reduce((s, c) => s + BigInt(moneyCents(c, "committed")), 0n)
  const deployedCents = sources.reduce((s, c) => s + BigInt(moneyCents(c, "deployed")), 0n)

  return (
    <div className="space-y-6">
      <ViewHeader title="Capital Funding Grid" description="Track capital sources (lenders, balance sheet, supplier credit, grants) that fund the lending portfolio. The cheapest-source allocator picks the lowest-cost available source first per currency." icon={<Grid3x3 className="h-6 w-6" />} onRefresh={load} />
      <ErrorBanner error={error} />
      <SuccessToast message={success} />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <KpiCard title="Total Sources" value={loading ? null : String(sources.length)} icon={<Grid3x3 className="h-5 w-5" />} />
        <KpiCard title="Total Committed" value={loading ? null : formatMoney(committedCents)} icon={<TrendingUp className="h-5 w-5" />} />
        <KpiCard title="Total Deployed" value={loading ? null : formatMoney(deployedCents)} icon={<Zap className="h-5 w-5" />} />
        <KpiCard title="Available" value={loading ? null : formatMoney(committedCents - deployedCents)} icon={<Wallet className="h-5 w-5" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Create Capital Source</CardTitle><CardDescription>Add a new funding source to the grid</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Name</Label><Input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. DFI Catalytic Fund" /></div>
              <div><Label>Type</Label>
                <select className={inputClass} value={type} onChange={(e) => setType(e.target.value)}>
                  <option value="lender">Lender</option>
                  <option value="groway_balance_sheet">Groway Balance Sheet</option>
                  <option value="supplier_credit">Supplier Credit</option>
                  <option value="grant">Grant</option>
                </select>
              </div>
              <div><Label>Currency</Label>
                <select className={inputClass} value={currency} onChange={(e) => setCurrency(e.target.value)}>
                  <option value="ZAR">ZAR (Rand)</option>
                  <option value="MWK">MWK (Kwacha)</option>
                  <option value="USD">USD (Dollar)</option>
                </select>
              </div>
              <div><Label>Committed (cents)</Label><Input className={inputClass} type="number" value={committed} onChange={(e) => setCommitted(e.target.value)} /></div>
              <div><Label>Cost Rate (bps annual)</Label><Input className={inputClass} type="number" value={costBps} onChange={(e) => setCostBps(e.target.value)} placeholder="250 = 2.5%" /></div>
            </div>
            <Button className="bg-[#0F766E] hover:bg-[#0F766E]/90" onClick={create}><Plus className="h-4 w-4 mr-1" /> Create Source</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Allocate Capital</CardTitle><CardDescription>The allocator picks the cheapest available source first</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Amount (cents)</Label><Input className={inputClass} type="number" value={allocAmount} onChange={(e) => setAllocAmount(e.target.value)} /></div>
              <div><Label>Currency</Label>
                <select className={inputClass} value={currency} onChange={(e) => setCurrency(e.target.value)}>
                  <option value="ZAR">ZAR</option>
                  <option value="MWK">MWK</option>
                  <option value="USD">USD</option>
                </select>
              </div>
            </div>
            <Button variant="outline" onClick={allocate}><Calculator className="h-4 w-4 mr-1" /> Allocate</Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Capital Sources</CardTitle></CardHeader>
        <CardContent>
          {loading ? <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
           : sources.length === 0 ? <EmptyState text="No capital sources yet. Create one above." />
           : (
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-background"><tr className="text-left text-muted-foreground"><th className="py-2 pr-2">Name</th><th className="py-2 pr-2">Type</th><th className="py-2 pr-2">Currency</th><th className="py-2 pr-2">Committed</th><th className="py-2 pr-2">Deployed</th><th className="py-2 pr-2">Available</th><th className="py-2 pr-2">Cost</th><th className="py-2 pr-2">Status</th></tr></thead>
                <tbody>{sources.map((s) => (
                  <tr key={s.id} className="border-t">
                    <td className="py-2 pr-2 font-medium">{s.name}</td>
                    <td className="py-2 pr-2">{s.type}</td>
                    <td className="py-2 pr-2">{s.currency}</td>
                    <td className="py-2 pr-2">{formatMoney(moneyCents(s, "committed"), s.currency)}</td>
                    <td className="py-2 pr-2">{formatMoney(moneyCents(s, "deployed"), s.currency)}</td>
                    <td className="py-2 pr-2">{formatMoney(moneyCents(s, "available") ?? (BigInt(s.committedCents) - BigInt(s.deployedCents)), s.currency)}</td>
                    <td className="py-2 pr-2">{s.costRateBps} bps</td>
                    <td className="py-2 pr-2"><Badge variant="outline" className={`text-[10px] ${s.status === 'active' ? 'text-green-600 border-green-300' : s.status === 'exhausted' ? 'text-amber-600 border-amber-300' : 'text-red-600 border-red-300'}`}>{s.status}</Badge></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================
// 8. GoPay Settlement View
// ============================================================
function GoPayView() {
  const [loading, setLoading] = useState(true)
  const [captures, setCaptures] = useState<any[]>([])
  const [settlements, setSettlements] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState('')

  const [merchantId, setMerchantId] = useState('demo-merchant')
  const [captureId, setCaptureId] = useState('')
  const [amount, setAmount] = useState('5000')
  const [fee, setFee] = useState('150')
  const [paymentMethod, setPaymentMethod] = useState('qr')
  const [liveMode, setLiveMode] = useState(false)

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const [cap, set] = await Promise.allSettled([apiGet('/gopay/captures'), apiGet('/gopay/settlements')])
      if (cap.status === 'fulfilled') setCaptures(cap.value?.items ?? [])
      if (set.status === 'fulfilled') setSettlements(set.value?.items ?? [])
    } catch (e: any) { setError(e.message) } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const createCapture = async () => {
    setError(null); setSuccess('')
    try {
      const r = await apiPost('/gopay/captures', {
        merchantId, captureId: captureId || `cap-${Date.now()}`,
        amount: { cents: amount, currency: 'ZAR' }, fee: { cents: fee, currency: 'ZAR' },
        paymentMethod, liveMode,
      })
      setSuccess(`Capture created: ${r.captureId} — ${formatMoney(moneyCents(r, "amount"), r.currency)}`)
      setCaptureId(''); await load()
    } catch (e: any) { setError(e.message) }
  }

  const createSettlement = async () => {
    setError(null); setSuccess('')
    try {
      const ids = captures.filter(c => c.status === 'captured').map(c => c.captureId)
      if (ids.length === 0) { setError('No captured transactions to settle'); return }
      const r = await apiPost('/gopay/settlements', { captureIds: ids })
      setSuccess(`Settlement batch created: ${r.batchId}`)
      await load()
    } catch (e: any) { setError(e.message) }
  }

  return (
    <div className="space-y-6">
      <ViewHeader title="GoPay Settlement" description="Payment capture, fee deduction, settlement batching and payout. Live mode is disabled until licensing is settled — the settlement split refuses to run while liveMode is off (Wave 2 gate)." icon={<CreditCard className="h-6 w-6" />} onRefresh={load} />
      <ErrorBanner error={error} />
      <SuccessToast message={success} />

      <Card className="border-amber-300 bg-amber-50">
        <CardContent className="py-3 flex items-center gap-2 text-sm text-amber-900">
          <AlertCircle className="h-4 w-4" /> GoPay live mode is OFF. Settlement splitting is disabled until licensing is settled. Captures can be recorded but not settled.
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Record Capture</CardTitle><CardDescription>Record a payment capture from a supported rail</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Merchant ID</Label><Input className={inputClass} value={merchantId} onChange={(e) => setMerchantId(e.target.value)} /></div>
              <div><Label>Capture ID</Label><Input className={inputClass} value={captureId} onChange={(e) => setCaptureId(e.target.value)} placeholder={`cap-${Date.now()}`} /></div>
              <div><Label>Amount (cents)</Label><Input className={inputClass} type="number" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
              <div><Label>Fee (cents)</Label><Input className={inputClass} type="number" value={fee} onChange={(e) => setFee(e.target.value)} /></div>
              <div><Label>Payment Method</Label>
                <select className={inputClass} value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                  <option value="qr">QR</option><option value="payshap">PayShap</option><option value="card">Card</option><option value="instant_eft">Instant EFT</option>
                </select>
              </div>
              <div><Label>Live Mode</Label><label className="flex items-center gap-2 mt-2 text-sm"><input type="checkbox" checked={liveMode} onChange={(e) => setLiveMode(e.target.checked)} /> Enable live mode</label></div>
            </div>
            <Button className="bg-[#0F766E] hover:bg-[#0F766E]/90" onClick={createCapture}><Plus className="h-4 w-4 mr-1" /> Record Capture</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Create Settlement Batch</CardTitle><CardDescription>Aggregate captures into a settlement batch</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-slate-600">This will aggregate all captured (non-settled, non-reversed) transactions into a single settlement batch.</p>
            <Button variant="outline" onClick={createSettlement}><Calculator className="h-4 w-4 mr-1" /> Create Settlement</Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Captures</CardTitle></CardHeader>
          <CardContent>
            {loading ? <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
             : captures.length === 0 ? <EmptyState text="No captures yet." />
             : (
              <div className="max-h-72 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-background"><tr className="text-left text-muted-foreground"><th className="py-2 pr-2">Capture ID</th><th className="py-2 pr-2">Amount</th><th className="py-2 pr-2">Fee</th><th className="py-2 pr-2">Method</th><th className="py-2 pr-2">Status</th></tr></thead>
                  <tbody>{captures.map((c) => (
                    <tr key={c.id} className="border-t"><td className="py-2 pr-2 font-mono text-[10px]">{c.captureId}</td><td className="py-2 pr-2">{formatMoney(moneyCents(c, "amount"), c.currency)}</td><td className="py-2 pr-2">{formatMoney(moneyCents(c, "fee"), c.currency)}</td><td className="py-2 pr-2">{c.paymentMethod}</td><td className="py-2 pr-2"><Badge variant="outline" className="text-[10px]">{c.status}</Badge></td></tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Settlements</CardTitle></CardHeader>
          <CardContent>
            {loading ? <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
             : settlements.length === 0 ? <EmptyState text="No settlements yet." />
             : (
              <div className="max-h-72 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-background"><tr className="text-left text-muted-foreground"><th className="py-2 pr-2">Batch ID</th><th className="py-2 pr-2">Gross</th><th className="py-2 pr-2">Fee</th><th className="py-2 pr-2">Net</th><th className="py-2 pr-2">Status</th></tr></thead>
                  <tbody>{settlements.map((s) => (
                    <tr key={s.id} className="border-t"><td className="py-2 pr-2 font-mono text-[10px]">{s.batchId}</td><td className="py-2 pr-2">{formatMoney(moneyCents(s, "gross"), s.currency)}</td><td className="py-2 pr-2">{formatMoney(moneyCents(s, "fee"), s.currency)}</td><td className="py-2 pr-2">{formatMoney(moneyCents(s, "net"), s.currency)}</td><td className="py-2 pr-2"><Badge variant="outline" className="text-[10px]">{s.status}</Badge></td></tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ============================================================
// 9. Device Finance View
// ============================================================
function DeviceFinanceView() {
  const [loading, setLoading] = useState(true)
  const [contracts, setContracts] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState('')

  const [customerId, setCustomerId] = useState('')
  const [productId, setProductId] = useState('solar_kit')
  const [deviceName, setDeviceName] = useState('')
  const [deviceImei, setDeviceImei] = useState('')

  const load = async () => {
    setLoading(true); setError(null)
    try { const data = await apiGet('/device-contracts'); setContracts(data?.items ?? []) } catch (e: any) { setError(e.message) } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const create = async () => {
    setError(null); setSuccess('')
    try {
      const r = await apiPost('/device-contracts', { customerId, productId, deviceName: deviceName || 'Device', deviceImei: deviceImei || undefined })
      setSuccess(`Contract created: ${r.id} — ${r.deviceName} · ${formatMoney(moneyCents(r, "dailyPayment"), r.currency)}/day for ${r.totalDays} days`)
      setCustomerId(''); setDeviceName(''); setDeviceImei(''); await load()
    } catch (e: any) { setError(e.message) }
  }

  const recordPayment = async (id: string, dailyPayment: string) => {
    try { await apiPost(`/device-contracts/${id}/payments`, { amount: { cents: dailyPayment, currency: 'ZAR' }, idempotencyKey: `pay-${Date.now()}` }); setSuccess('Payment recorded'); await load() } catch (e: any) { setError(e.message) }
  }

  const products: { id: string; name: string; principal: string; daily: string; days: number }[] = [
    { id: 'solar_kit', name: 'Solar Home System', principal: 'R3,500', daily: 'R35', days: 180 },
    { id: 'phone', name: 'Smartphone', principal: 'R2,500', daily: 'R25', days: 120 },
    { id: 'fridge', name: 'Refrigerator', principal: 'R5,000', daily: 'R50', days: 120 },
  ]

  return (
    <div className="space-y-6">
      <ViewHeader title="Device Finance" description="M-KOPA-style daily-payment contracts. The device is locked until the contract is paid off. If payments stop for the grace period, the device is repossessed." icon={<Smartphone className="h-6 w-6" />} onRefresh={load} />
      <ErrorBanner error={error} />
      <SuccessToast message={success} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Create Contract</CardTitle><CardDescription>Create a new device finance contract</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Customer ID</Label><Input className={inputClass} value={customerId} onChange={(e) => setCustomerId(e.target.value)} placeholder="cust-001" /></div>
              <div><Label>Product</Label>
                <select className={inputClass} value={productId} onChange={(e) => setProductId(e.target.value)}>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name} — {p.principal} ({p.daily}/day × {p.days})</option>)}
                </select>
              </div>
              <div><Label>Device Name</Label><Input className={inputClass} value={deviceName} onChange={(e) => setDeviceName(e.target.value)} placeholder="Solar Home System 200W" /></div>
              <div><Label>Device IMEI (optional)</Label><Input className={inputClass} value={deviceImei} onChange={(e) => setDeviceImei(e.target.value)} placeholder="356938035643809" /></div>
            </div>
            <Button className="bg-[#0F766E] hover:bg-[#0F766E]/90" onClick={create}><Plus className="h-4 w-4 mr-1" /> Create Contract</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Available Products</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {products.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                  <div><p className="text-sm font-medium">{p.name}</p><p className="text-xs text-slate-500">{p.principal} · {p.daily}/day · {p.days} days</p></div>
                  <Badge variant="outline" className="text-[10px]">ID: {p.id}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Active Contracts</CardTitle></CardHeader>
        <CardContent>
          {loading ? <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
           : contracts.length === 0 ? <EmptyState text="No contracts yet. Create one above." />
           : (
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-background"><tr className="text-left text-muted-foreground"><th className="py-2 pr-2">Customer</th><th className="py-2 pr-2">Device</th><th className="py-2 pr-2">Principal</th><th className="py-2 pr-2">Paid</th><th className="py-2 pr-2">Progress</th><th className="py-2 pr-2">Status</th><th className="py-2 pr-2">Action</th></tr></thead>
                <tbody>{contracts.map((c) => {
                  const pct = Number(moneyCents(c, "paid")) ? Math.min(100, Math.round(Number(moneyCents(c, "paid")) / Number(moneyCents(c, "principal")) * 100)) : 0
                  return (
                    <tr key={c.id} className="border-t">
                      <td className="py-2 pr-2 font-mono">{c.customerId}</td>
                      <td className="py-2 pr-2">{c.deviceName}</td>
                      <td className="py-2 pr-2">{formatMoney(moneyCents(c, "principal"), c.currency)}</td>
                      <td className="py-2 pr-2">{formatMoney(moneyCents(c, "paid"), c.currency)}</td>
                      <td className="py-2 pr-2 w-32"><div className="w-full bg-slate-200 rounded-full h-1.5"><div className="bg-[#0F766E] h-1.5 rounded-full" style={{ width: `${pct}%` }} /></div><span className="text-[9px] text-slate-400">{pct}% · {c.daysPaid}/{c.totalDays} days</span></td>
                      <td className="py-2 pr-2"><Badge variant="outline" className={`text-[10px] ${c.status === 'active' ? 'text-amber-600 border-amber-300' : c.status === 'paid_off' ? 'text-green-600 border-green-300' : 'text-red-600 border-red-300'}`}>{c.locked && c.status === 'active' ? '🔒 locked' : c.status}</Badge></td>
                      <td className="py-2 pr-2">{c.status === 'active' && <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => recordPayment(c.id, c.dailyPaymentCents)}>Pay {formatMoney(moneyCents(c, "dailyPayment"), c.currency)}</Button>}</td>
                    </tr>
                  )
                })}</tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================
// 10. GroAI Assistant View
// ============================================================
function GroAIView() {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    { role: 'assistant', content: "Hi! I'm GroAI, your GroCore assistant. I can help you navigate each module, explain how the financial engine works, and guide you through creating capital sources, issuing advances, posting ledger entries and more. What would you like to do?" }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages])

  const send = async () => {
    if (!input.trim()) return
    const userMsg = input.trim()
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setInput('')
    setLoading(true)

    // Simulated GroAI response based on keywords
    const response = getGroAIResponse(userMsg)
    await new Promise(r => setTimeout(r, 500))
    setMessages(prev => [...prev, { role: 'assistant', content: response }])
    setLoading(false)
  }

  const suggestions = [
    "How do I create a capital source?",
    "How do I issue a top-up advance?",
    "Explain the double-entry ledger",
    "How does device finance work?",
    "What is the consent module for?",
  ]

  return (
    <div className="space-y-6">
      <ViewHeader title="GroAI Assistant" description="Get help navigating GroCore. Ask about any module, workflow or financial concept. GroAI guides you through each step." icon={<Sparkles className="h-6 w-6" />} />

      <Card className="flex flex-col" style={{ height: 'calc(100vh - 280px)', minHeight: '400px' }}>
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-lg px-4 py-2 ${m.role === 'user' ? 'bg-[#0F766E] text-white' : 'bg-slate-100 text-slate-800'}`}>
                {m.role === 'assistant' && <div className="flex items-center gap-1 mb-1 text-xs text-slate-500"><Sparkles className="h-3 w-3" /> GroAI</div>}
                <p className="text-sm whitespace-pre-wrap">{m.content}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate-100 rounded-lg px-4 py-3 text-sm text-slate-400"><span className="animate-pulse">GroAI is typing...</span></div>
            </div>
          )}
        </div>
        <div className="border-t border-slate-200 p-3">
          <div className="flex gap-2">
            <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder="Ask GroAI anything about GroCore..." className="flex-1" />
            <Button className="bg-[#0F766E] hover:bg-[#0F766E]/90" onClick={send} disabled={loading}><Send className="h-4 w-4" /></Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {suggestions.map((s, i) => (
              <button key={i} onClick={() => { setInput(s); }} className="text-xs rounded-full border border-slate-200 px-3 py-1 text-slate-600 hover:border-[#0F766E] hover:text-[#0F766E] transition-colors">{s}</button>
            ))}
          </div>
        </div>
      </Card>
    </div>
  )
}

function getGroAIResponse(question: string): string {
  const q = question.toLowerCase()
  if (q.includes('capital') && (q.includes('create') || q.includes('add') || q.includes('source'))) {
    return `To create a capital source:

1. Click "Capital Grid" in the sidebar
2. Fill in the "Create Capital Source" form:
   - Name: e.g. "DFI Catalytic Fund"
   - Type: Lender, Groway Balance Sheet, Supplier Credit, or Grant
   - Currency: ZAR, MWK, or USD
   - Committed: the total amount available (in cents, e.g. 1000000 = R10,000)
   - Cost Rate: annual cost in basis points (e.g. 250 = 2.5% per year)
3. Click "Create Source"

The source will appear in the table below. You can then use "Allocate Capital" to deploy funds from the cheapest available source.`
  }
  if (q.includes('advance') && (q.includes('issue') || q.includes('create'))) {
    return `To issue a top-up advance:

1. Click "Top-up Advances" in the sidebar
2. Fill in the form:
   - Subject ID: the customer's phone number or meter number
   - Product: SA Airtime, SA Electricity, MW Airtime, MW Electricity, or Merchant Float
   - Amount: must be within the product's menu (e.g. SA Airtime: R5–R20)
   - Delivery Method: Direct Recharge, Print Voucher, or QR Voucher
3. Enter eligibility info: tenure days, active months, average monthly spend
4. Click "Issue Advance"

The engine checks eligibility (30% share-of-spend cap), calculates the fee, and creates the advance. You can then recover it via the "Recover" button when the customer tops up.`
  }
  if (q.includes('ledger') || q.includes('entry') || q.includes('journal')) {
    return `The Double-Entry Ledger is the core of GroCore:

• Every entry must net to zero per currency (debit = credit)
• Debits are positive, credits are negative
• Each entry has an idempotency key to prevent duplicates
• Reversals are new entries, never mutations
• Trial balance is computed from posted lines

To post an entry:
1. Click "Ledger" in the sidebar
2. Select a debit account and credit account (e.g. 1000 Cash at Bank / 2100 Loan Payable)
3. Enter the amount in cents
4. Click "Post Entry"

Default accounts (1000 Cash, 1200 Loan Receivable, 2100 Loan Payable, 4000 Interest Income, 5000 Bad Debt) are created automatically on first post.`
  }
  if (q.includes('device') || q.includes('m-kopa') || q.includes('solar')) {
    return `Device Finance uses the M-KOPA model:

• A customer gets a productive asset (solar kit, phone, fridge) on a daily-payment contract
• The device is LOCKED until fully paid off
• If payments stop for the grace period (7-14 days), the device is repossessed
• Each payment reduces the principal and increments daysPaid
• Once totalDays payments are made (or principal is fully paid), the device unlocks

Available products:
- Solar Home System: R3,500 principal, R35/day for 180 days
- Smartphone: R2,500 principal, R25/day for 120 days  
- Refrigerator: R5,000 principal, R50/day for 120 days

To create a contract, go to "Device Finance" and fill in the customer ID, select a product, and click "Create Contract". Then use the "Pay" button to record daily payments.`
  }
  if (q.includes('consent')) {
    return `The Consent module is POPIA-compliant:

• Every credit decision checks consent FIRST
• Consent is purpose-bound (credit_use, topup_credit, marketing, etc.)
• Consent is revocable at any time
• Consent can have an expiry date
• Each consent has a policy version for audit trails

To grant consent:
1. Click "Consent" in the sidebar
2. Enter the Subject ID (phone, ID, or customer ID)
3. Select the purpose
4. Click "Grant Consent"

To revoke, click the "Revoke" button next to any active consent.`
  }
  if (q.includes('voucher')) {
    return `The Voucher Engine issues e-vouchers with:

• Unique serial number (format: GC-PRODUCT-DATE-RANDOM)
• 12-digit PIN for printed vouchers
• QR payload for QR vouchers
• Direct recharge for immediate delivery

Products: Airtime, Data, Electricity, ISP Bundles
Suppliers: Vodacom, MTN, Cell C, Telkom, Eskom, City Power, etc.

To issue a voucher, go to "Vouchers", select product/supplier, enter face value and cost, choose delivery method, and click "Issue Voucher".`
  }
  if (q.includes('gopay') || q.includes('settlement')) {
    return `GoPay Settlement handles payment acquiring:

• Captures: record incoming payments (QR, PayShap, card, instant EFT)
• Settlements: aggregate captures into batches for payout
• Settlement split: gross - fee - repayment = net payout
• Live mode GATE: settlement splitting is disabled while liveMode is off (Wave 2 — licensing gate)

To use: record captures first, then create a settlement batch from all captured transactions.`
  }
  if (q.includes('decision') || q.includes('credit')) {
    return `Credit Decisioning runs a strict pipeline:

1. Consent check — no consent = decline
2. Identity verification — must be verified
3. Blocklist check — must not be on blocklist
4. Tenure check — minimum days on file
5. Activity check — minimum active months
6. Spend check — minimum monthly spend
7. Open advance check — one open advance at a time
8. Arrears check — no outstanding arrears
9. Affordability — DTI ratio must be within cap
10. Limit calculation — 30% of average monthly spend, capped at hardCap

Missing income/obligations data = REFER to human (never a guess).`
  }
  return `I can help with:

• **Capital Grid** — creating funding sources and allocating capital
• **Ledger** — posting balanced double-entry journal entries
• **Consent** — granting and revoking POPIA consent
• **Decisioning** — running credit decisions with reason codes
• **Top-up Advances** — issuing airtime/electricity advances with claw-back
• **Vouchers** — issuing e-vouchers with serial, PIN and QR
• **GoPay** — recording payment captures and settlements
• **Device Finance** — M-KOPA-style daily-payment contracts

Ask me about any of these modules, or click one of the suggestion buttons below!`
}
