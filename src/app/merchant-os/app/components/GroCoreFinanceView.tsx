'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowRight, Landmark, BookOpen, ShieldCheck, Brain, Zap, Ticket, Grid3x3, CreditCard, Smartphone, ExternalLink } from 'lucide-react'

const BASE = '/merchant-os/api/grocore'

async function apiGet<T = any>(path: string, tenantId = 'demo-tenant'): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { headers: { 'x-tenant-id': tenantId } })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

function formatMoney(cents: string | bigint, currency = 'ZAR'): string {
  const c = typeof cents === 'string' ? BigInt(cents) : cents
  const n = Number(c) / 100
  return new Intl.NumberFormat('en-ZA', { style: 'currency', currency }).format(n)
}

interface KpiData {
  capitalDeployedCents?: bigint
  openAdvances?: number
  vouchersIssued?: number
  pendingSettlements?: number
}

interface AccountRow {
  accountCode: string
  accountName: string
  currency: string
  balanceCents: string
}

interface AdvanceRow {
  id: string
  subjectId: string
  product: string
  principalCents: string
  feeCents: string
  totalDueCents: string
  paidCents: string
  status: string
  dueAt: string
}

interface VoucherRow {
  serial: string
  product: string
  supplier: string
  faceValueCents: string
  status: string
  deliveryMethod: string
  recipientMsisdn?: string | null
  meterNumber?: string | null
}

interface SettlementRow {
  batchId: string
  merchantId: string
  grossCents: string
  feeCents: string
  netCents: string
  status: string
  scheduledAt: string
}

/**
 * GroCoreFinanceView — an embedded view of the GroCore financial services
 * engine inside the Merchant OS. It surfaces the most useful KPIs and
 * recent activity, with a CTA to open the full GroCore dashboard at
 * /grocore/app.
 */
export function GroCoreFinanceView() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [capitalSources, setCapitalSources] = useState<any[]>([])
  const [advances, setAdvances] = useState<AdvanceRow[]>([])
  const [vouchers, setVouchers] = useState<VoucherRow[]>([])
  const [settlements, setSettlements] = useState<SettlementRow[]>([])
  const [accounts, setAccounts] = useState<any[]>([])
  const [trialBalance, setTrialBalance] = useState<AccountRow[]>([])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [cap, adv, vch, set, acc, tb] = await Promise.allSettled([
          apiGet('/capital-sources'),
          apiGet('/advances'),
          apiGet('/vouchers'),
          apiGet('/gopay/settlements'),
          apiGet('/accounts'),
          apiGet('/trial-balance'),
        ])
        if (cancelled) return
        if (cap.status === 'fulfilled') setCapitalSources(cap.value?.items ?? [])
        if (adv.status === 'fulfilled') setAdvances(adv.value?.items ?? [])
        if (vch.status === 'fulfilled') setVouchers(vch.value?.items ?? [])
        if (set.status === 'fulfilled') setSettlements(set.value?.items ?? [])
        if (acc.status === 'fulfilled') setAccounts(acc.value?.items ?? [])
        if (tb.status === 'fulfilled') setTrialBalance(tb.value?.rows ?? [])
      } catch (e: any) {
        setError(e.message || 'Failed to load GroCore data')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const deployedCents = capitalSources.reduce(
    (sum, s) => sum + BigInt(s.deployedCents ?? 0),
    0n,
  )
  const openAdvances = advances.filter((a) => a.status === 'open')
  const vouchersIssued = vouchers.length
  const pendingSettlements = settlements.filter((s) => s.status === 'pending').length

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Landmark className="h-6 w-6 text-[#00897B]" />
            <h1 className="text-2xl font-bold">GroCore</h1>
            <Badge variant="outline" className="text-[10px] border-[#00897B]/30 text-[#00897B]">
              Financial Services Engine
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Double-entry ledger, consent-driven decisioning, GoPay settlement,
            top-up advances, capital funding grid, voucher engine and device
            finance — all in one module.
          </p>
        </div>
        <Link href="/grocore/app" target="_blank">
          <Button className="bg-[#00897B] hover:bg-[#00897B]/90">
            Open GroCore Dashboard <ExternalLink className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </div>

      {/* Error banner */}
      {error && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="py-3 text-sm text-amber-900">
            Could not reach GroCore API: {error}. Showing cached data only.
          </CardContent>
        </Card>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Capital Deployed"
          value={loading ? null : formatMoney(deployedCents)}
          icon={<Grid3x3 className="h-5 w-5" />}
          subtitle={`${capitalSources.length} sources`}
        />
        <KpiCard
          title="Open Advances"
          value={loading ? null : String(openAdvances.length)}
          icon={<Zap className="h-5 w-5" />}
          subtitle={`${advances.length} total`}
        />
        <KpiCard
          title="Vouchers Issued"
          value={loading ? null : String(vouchersIssued)}
          icon={<Ticket className="h-5 w-5" />}
          subtitle="all-time"
        />
        <KpiCard
          title="Pending Settlements"
          value={loading ? null : String(pendingSettlements)}
          icon={<CreditCard className="h-5 w-5" />}
          subtitle="GoPay batches"
        />
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <FeatureCard
          icon={<BookOpen className="h-5 w-5" />}
          title="Ledger"
          description="Double-entry postings, balanced entries, idempotency, trial balance."
          href="/grocore/app"
        />
        <FeatureCard
          icon={<ShieldCheck className="h-5 w-5" />}
          title="Consent"
          description="Purpose-bound, revocable, expiring consent log for every credit decision."
          href="/grocore/app"
        />
        <FeatureCard
          icon={<Brain className="h-5 w-5" />}
          title="Decisioning"
          description="Consent-first credit decisions with reason codes, counterfactuals and full trace."
          href="/grocore/app"
        />
        <FeatureCard
          icon={<Smartphone className="h-5 w-5" />}
          title="Device Finance"
          description="M-KOPA-style daily-payment contracts with device locking and repossession."
          href="/grocore/app"
        />
      </div>

      {/* Recent advances + Trial balance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Top-up Advances</CardTitle>
            <CardDescription>
              Airtime, data, electricity and merchant float advances.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-8 w-full" />)}
              </div>
            ) : advances.length === 0 ? (
              <div className="text-sm text-muted-foreground py-6 text-center">
                No advances yet. Issue one from the GroCore dashboard.
              </div>
            ) : (
              <div className="max-h-72 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-background">
                    <tr className="text-left text-muted-foreground">
                      <th className="py-2 pr-2">Subject</th>
                      <th className="py-2 pr-2">Product</th>
                      <th className="py-2 pr-2">Principal</th>
                      <th className="py-2 pr-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {advances.slice(0, 10).map((a) => (
                      <tr key={a.id} className="border-t">
                        <td className="py-2 pr-2 font-mono truncate max-w-[100px]">{a.subjectId}</td>
                        <td className="py-2 pr-2">{a.product}</td>
                        <td className="py-2 pr-2">{formatMoney(a.principalCents)}</td>
                        <td className="py-2 pr-2">
                          <Badge variant="outline" className="text-[10px]">{a.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Trial Balance</CardTitle>
            <CardDescription>
              Net debit/credit position per ledger account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-8 w-full" />)}
              </div>
            ) : trialBalance.length === 0 ? (
              <div className="text-sm text-muted-foreground py-6 text-center">
                No posted entries yet. Post a balanced entry to see the trial balance.
              </div>
            ) : (
              <div className="max-h-72 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-background">
                    <tr className="text-left text-muted-foreground">
                      <th className="py-2 pr-2">Code</th>
                      <th className="py-2 pr-2">Name</th>
                      <th className="py-2 pr-2">Cur</th>
                      <th className="py-2 pr-2 text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trialBalance.slice(0, 20).map((r) => (
                      <tr key={r.accountCode} className="border-t">
                        <td className="py-2 pr-2 font-mono">{r.accountCode}</td>
                        <td className="py-2 pr-2 truncate max-w-[140px]">{r.accountName}</td>
                        <td className="py-2 pr-2">{r.currency}</td>
                        <td className={`py-2 pr-2 text-right font-mono ${BigInt(r.balanceCents) < 0n ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {formatMoney(r.balanceCents, r.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Footer CTA */}
      <Card className="bg-slate-900 border-slate-900 text-slate-50">
        <CardContent className="py-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold mb-1">Open the full GroCore dashboard</h3>
            <p className="text-sm text-slate-300">
              Access the complete ledger, consent, decisioning, advances, vouchers,
              capital grid, GoPay settlements and device finance modules.
            </p>
          </div>
          <Link href="/grocore/app" target="_blank">
            <Button variant="secondary">
              Launch Dashboard <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}

function KpiCard({
  title,
  value,
  icon,
  subtitle,
}: {
  title: string
  value: string | null
  icon: React.ReactNode
  subtitle?: string
}) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">{title}</p>
            <div className="text-2xl font-bold mt-1">
              {value === null ? <Skeleton className="h-7 w-24" /> : value}
            </div>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <div className="rounded-lg bg-[#00897B]/10 p-2 text-[#00897B]">{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
}

function FeatureCard({
  icon,
  title,
  description,
  href,
}: {
  icon: React.ReactNode
  title: string
  description: string
  href: string
}) {
  return (
    <Link href={href} target="_blank">
      <Card className="hover:shadow-md transition-shadow h-full">
        <CardContent className="pt-5">
          <div className="rounded-lg bg-[#00897B]/10 p-2 text-[#00897B] inline-block mb-2">
            {icon}
          </div>
          <h3 className="font-semibold text-sm">{title}</h3>
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        </CardContent>
      </Card>
    </Link>
  )
}
