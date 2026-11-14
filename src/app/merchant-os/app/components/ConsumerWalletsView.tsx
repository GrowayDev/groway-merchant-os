'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Wallet,
  Link2,
  Unlink,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Gift,
  Sparkles,
  Receipt,
  Phone,
  RefreshCw,
  Loader2,
  Coins,
  TrendingUp,
  Users,
  Info,
} from 'lucide-react'

interface LinkedWallet {
  linkId: string
  linkedAt: string
  lastActivityAt: string | null
  consumerUserId: string
  name: string
  phone: string
  kycLevel: number
  accountStatus: string
  loyaltyTier: string
  loyaltyPoints: number
  crmCustomerId: string | null
  walletBalance: number
}

interface WalletActivity {
  id: string
  activityType: string
  title: string
  description: string | null
  direction: string
  amount: number | null
  merchantDirection: 'in' | 'out' | 'info'
  consumerName: string
  consumerPhone: string | null
  merchantTitle: string
  createdAt: string
}

interface Summary {
  linkedWallets: number
  totalBalanceHeld: number
  walletPayments30d: { count: number; total: number }
  creditsIssuedThisMonth: { count: number; total: number }
}

const TIER_COLORS: Record<string, string> = {
  bronze: 'bg-amber-100 text-amber-800 border-amber-200',
  silver: 'bg-gray-100 text-gray-700 border-gray-200',
  gold: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  platinum: 'bg-teal-50 text-teal-800 border-teal-200',
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

const ACTIVITY_ICONS: Record<string, typeof Receipt> = {
  payment: Receipt,
  cashback: Gift,
  reward: Sparkles,
  refund: ArrowDownLeft,
  topup: Plus,
  link: Link2,
  unlink: Unlink,
  loyalty_earn: Coins,
}

export function ConsumerWalletsView() {
  const [wallets, setWallets] = useState<LinkedWallet[]>([])
  const [activities, setActivities] = useState<WalletActivity[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [statusMsg, setStatusMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

  // Link dialog state
  const [linkOpen, setLinkOpen] = useState(false)
  const [linkPhone, setLinkPhone] = useState('')
  const [linkName, setLinkName] = useState('')

  // Credit dialog state
  const [creditOpen, setCreditOpen] = useState(false)
  const [creditTarget, setCreditTarget] = useState<LinkedWallet | null>(null)
  const [creditAmount, setCreditAmount] = useState('')
  const [creditType, setCreditType] = useState('cashback')
  const [creditNote, setCreditNote] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [linkRes, actRes, sumRes] = await Promise.all([
        fetch('/merchant-os/api/wallet/link'),
        fetch('/merchant-os/api/wallet/activities?limit=40'),
        fetch('/merchant-os/api/wallet/summary'),
      ])
      const linkData = await linkRes.json()
      const actData = await actRes.json()
      const sumData = await sumRes.json()
      if (linkData.success) setWallets(linkData.wallets ?? [])
      if (actData.success) setActivities(actData.activities ?? [])
      if (sumData.success) setSummary(sumData.summary)
    } catch {
      setStatusMsg({ kind: 'err', text: 'Could not reach the wallet service. Is the server running?' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleLink = async () => {
    if (!linkPhone.trim()) return
    setBusy(true)
    setStatusMsg(null)
    try {
      const res = await fetch('/merchant-os/api/wallet/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: linkPhone, name: linkName || undefined }),
      })
      const data = await res.json()
      if (data.success) {
        setStatusMsg({ kind: 'ok', text: data.message ?? 'Wallet linked' })
        setLinkOpen(false)
        setLinkPhone('')
        setLinkName('')
        await load()
      } else {
        setStatusMsg({ kind: 'err', text: data.error ?? 'Link failed' })
      }
    } catch {
      setStatusMsg({ kind: 'err', text: 'Network error while linking wallet' })
    } finally {
      setBusy(false)
    }
  }

  const handleUnlink = async (w: LinkedWallet) => {
    setBusy(true)
    try {
      const res = await fetch('/merchant-os/api/wallet/link', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkId: w.linkId }),
      })
      const data = await res.json()
      if (data.success) {
        setStatusMsg({ kind: 'ok', text: `${w.name}'s wallet unlinked` })
        await load()
      } else {
        setStatusMsg({ kind: 'err', text: data.error ?? 'Unlink failed' })
      }
    } finally {
      setBusy(false)
    }
  }

  const handleCredit = async () => {
    if (!creditTarget || !creditAmount) return
    setBusy(true)
    setStatusMsg(null)
    try {
      const res = await fetch('/merchant-os/api/wallet/credit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          linkId: creditTarget.linkId,
          amount: Number(creditAmount),
          type: creditType,
          note: creditNote || undefined,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setStatusMsg({ kind: 'ok', text: data.message })
        setCreditOpen(false)
        setCreditAmount('')
        setCreditNote('')
        await load()
      } else {
        setStatusMsg({ kind: 'err', text: data.error ?? 'Credit failed' })
      }
    } catch {
      setStatusMsg({ kind: 'err', text: 'Network error while crediting wallet' })
    } finally {
      setBusy(false)
    }
  }

  const openCredit = (w: LinkedWallet) => {
    setCreditTarget(w)
    setCreditType('cashback')
    setCreditAmount('')
    setCreditNote('')
    setCreditOpen(true)
  }

  const kpis = useMemo(
    () => [
      { label: 'Linked Wallets', value: String(summary?.linkedWallets ?? 0), icon: Users, hint: 'GoPay wallets connected to your CRM' },
      { label: 'Customer Balance Held', value: `R${(summary?.totalBalanceHeld ?? 0).toFixed(2)}`, icon: Wallet, hint: 'Across all linked consumer wallets' },
      { label: 'Wallet Payments (30d)', value: `R${(summary?.walletPayments30d?.total ?? 0).toFixed(2)}`, icon: TrendingUp, hint: `${summary?.walletPayments30d?.count ?? 0} in-store wallet payments` },
      { label: 'Credits This Month', value: `R${(summary?.creditsIssuedThisMonth?.total ?? 0).toFixed(2)}`, icon: Gift, hint: `${summary?.creditsIssuedThisMonth?.count ?? 0} cashback / rewards / refunds` },
    ],
    [summary]
  )

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-gray-900 flex items-center gap-2">
            <Wallet className="h-6 w-6 text-[#00897B]" />
            Consumer Wallets
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Link customer GoPay wallets to your CRM, issue cashback &amp; rewards, and watch wallet
            payments land in your store in real time.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" className="bg-[#00897B] hover:bg-[#00796B] text-white" onClick={() => setLinkOpen(true)}>
            <Link2 className="h-4 w-4 mr-1" />
            Link Wallet
          </Button>
        </div>
      </div>

      {statusMsg && (
        <div
          className={`flex items-start gap-2 rounded-lg border p-3 text-sm ${
            statusMsg.kind === 'ok'
              ? 'border-green-200 bg-green-50 text-green-800'
              : 'border-red-200 bg-red-50 text-red-800'
          }`}
        >
          {statusMsg.kind === 'ok' ? <Info className="h-4 w-4 mt-0.5" /> : <Info className="h-4 w-4 mt-0.5" />}
          <span>{statusMsg.text}</span>
          <button className="ml-auto text-xs underline" onClick={() => setStatusMsg(null)}>
            dismiss
          </button>
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">{k.label}</span>
                <k.icon className="h-4 w-4 text-[#00897B]" />
              </div>
              <div className="text-2xl font-semibold text-gray-900 mt-2">{k.value}</div>
              <p className="text-[11px] text-gray-400 mt-1">{k.hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 md:gap-6">
        {/* Linked wallets */}
        <Card className="xl:col-span-3">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Linked Customer Wallets</CardTitle>
            <CardDescription>
              Customers whose GoPay wallet is connected to your store via mobile number
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12 text-gray-400 text-sm">
                <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading wallets…
              </div>
            ) : wallets.length === 0 ? (
              <div className="text-center py-12 px-6">
                <Wallet className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500 font-medium">No wallets linked yet</p>
                <p className="text-xs text-gray-400 mt-1">
                  Ask customers to register in the Groway consumer wallet app, then link them here
                  by mobile number.
                </p>
                <Button size="sm" className="mt-4 bg-[#00897B] hover:bg-[#00796B] text-white" onClick={() => setLinkOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" /> Link your first wallet
                </Button>
              </div>
            ) : (
              <div className="max-h-[420px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-gray-50 border-b border-gray-100">
                    <tr className="text-left text-xs text-gray-500">
                      <th className="px-4 py-2.5 font-medium">Customer</th>
                      <th className="px-4 py-2.5 font-medium">Tier</th>
                      <th className="px-4 py-2.5 font-medium text-right">Wallet Balance</th>
                      <th className="px-4 py-2.5 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wallets.map((w) => (
                      <tr key={w.linkId} className="border-b border-gray-50 hover:bg-gray-50/60">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{w.name}</div>
                          <div className="text-xs text-gray-400 flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {w.phone} · last activity{' '}
                            {w.lastActivityAt ? timeAgo(w.lastActivityAt) : '—'}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={`text-[10px] capitalize ${TIER_COLORS[w.loyaltyTier] ?? ''}`}>
                            {w.loyaltyTier}
                          </Badge>
                          <div className="text-[11px] text-gray-400 mt-1">{w.loyaltyPoints} pts</div>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900">
                          R{w.walletBalance.toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => openCredit(w)}>
                              <Gift className="h-3.5 w-3.5 mr-1" /> Credit
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 text-xs text-gray-400 hover:text-red-600"
                              disabled={busy}
                              onClick={() => handleUnlink(w)}
                            >
                              <Unlink className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity feed */}
        <Card className="xl:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Wallet Activity</CardTitle>
            <CardDescription>Live feed from your linked consumer wallets</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12 text-gray-400 text-sm">
                <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading activity…
              </div>
            ) : activities.length === 0 ? (
              <div className="text-center py-12 px-6">
                <Receipt className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No wallet activity yet</p>
                <p className="text-xs text-gray-400 mt-1">
                  Payments and credits for your store will appear here.
                </p>
              </div>
            ) : (
              <ul className="max-h-[420px] overflow-y-auto divide-y divide-gray-50">
                {activities.map((a) => {
                  const Icon = ACTIVITY_ICONS[a.activityType] ?? Receipt
                  const isIn = a.merchantDirection === 'in'
                  const isOut = a.merchantDirection === 'out'
                  return (
                    <li key={a.id} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50/60">
                      <div
                        className={`mt-0.5 rounded-full p-2 ${
                          isIn
                            ? 'bg-green-50 text-green-700'
                            : isOut
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {a.merchantTitle}
                          </span>
                          {a.amount !== null && (
                            <span
                              className={`text-sm font-semibold whitespace-nowrap ${
                                isIn ? 'text-green-700' : isOut ? 'text-amber-700' : 'text-gray-500'
                              }`}
                            >
                              {isIn ? '+' : isOut ? '−' : ''}R{a.amount.toFixed(2)}
                            </span>
                          )}
                        </div>
                        {a.description && (
                          <p className="text-xs text-gray-500 truncate">{a.description}</p>
                        )}
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          {a.consumerPhone} · {timeAgo(a.createdAt)}
                        </p>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Link dialog */}
      <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Link a consumer wallet</DialogTitle>
            <DialogDescription>
              Enter the customer&apos;s mobile number. They must be registered in the Groway
              consumer wallet app (GoPay). A CRM customer record is created automatically.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1.5">
              <Label htmlFor="link-phone">Mobile number</Label>
              <Input
                id="link-phone"
                placeholder="082 123 4567 or +27821234567"
                value={linkPhone}
                onChange={(e) => setLinkPhone(e.target.value)}
                inputMode="tel"
              />
            </div>
            <p className="text-xs text-gray-400">
              Demo wallets: +27 82 123 4567 (Thandi), +27 83 234 5678 (Sipho), +27 72 678 9012
              (David) — consumer PIN 1234.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button className="bg-[#00897B] hover:bg-[#00796B] text-white" onClick={handleLink} disabled={busy || !linkPhone.trim()}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Link2 className="h-4 w-4 mr-1" />}
              Link wallet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Credit dialog */}
      <Dialog open={creditOpen} onOpenChange={setCreditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Credit {creditTarget?.name}&apos;s wallet
            </DialogTitle>
            <DialogDescription>
              Current balance R{creditTarget?.walletBalance.toFixed(2)} · {creditTarget?.phone}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="credit-amount">Amount (ZAR)</Label>
                <Input
                  id="credit-amount"
                  type="number"
                  min="1"
                  step="0.50"
                  placeholder="25.00"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                  inputMode="decimal"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={creditType} onValueChange={setCreditType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cashback">Cashback</SelectItem>
                    <SelectItem value="reward">Loyalty reward</SelectItem>
                    <SelectItem value="refund">Refund</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="credit-note">Note (optional)</Label>
              <Input
                id="credit-note"
                placeholder="e.g. Loyalty promo — thanks for your visit"
                value={creditNote}
                onChange={(e) => setCreditNote(e.target.value)}
                maxLength={280}
              />
            </div>
            <p className="text-xs text-gray-400">
              The credit lands instantly in the customer&apos;s wallet and appears in their app
              activity feed.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreditOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button
              className="bg-[#00897B] hover:bg-[#00796B] text-white"
              onClick={handleCredit}
              disabled={busy || !creditAmount || Number(creditAmount) <= 0}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <ArrowUpRight className="h-4 w-4 mr-1" />}
              Credit wallet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ConsumerWalletsView
