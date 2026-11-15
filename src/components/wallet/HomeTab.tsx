'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { apiGet, formatMoney } from '@/components/wallet/lib/api'
import {
  Wallet,
  QrCode,
  CreditCard,
  Send,
  Smartphone,
  TrendingUp,
  TrendingDown,
  Zap,
  Gift,
  Target,
  ChevronRight,
  Bell,
  Sparkles,
  Shield,
  Clock,
  DollarSign,
  Users,
  ShoppingCart,
  Receipt,
  ArrowUpRight,
  ArrowDownLeft,
  Loader2,
  AlertCircle
} from 'lucide-react'

interface HomeTabProps {
  onOpenPayPlus: () => void
  onOpenGrantPlus: () => void
  onOpenLaybye: () => void
  onOpenMTNMoMo: () => void
  onOpenQR: () => void
  onOpenSend: () => void
  onOpenTransactionHistory: () => void
  onOpenPayShap: () => void
  onOpenVouchers: () => void
  onOpenRemittance: () => void
  onOpenCards: () => void
  onOpenMobileMoney: () => void
}

interface RecentTransaction {
  id: string
  description: string
  amount: number
  direction: 'credit' | 'debit'
  createdAt: string
  status: string
  type?: string
}

export function HomeTab({
  onOpenPayPlus,
  onOpenGrantPlus,
  onOpenLaybye,
  onOpenMTNMoMo,
  onOpenQR,
  onOpenSend,
  onOpenTransactionHistory,
  onOpenPayShap,
  onOpenVouchers,
  onOpenRemittance,
  onOpenCards,
  onOpenMobileMoney,
}: HomeTabProps) {
  const [userName] = useState('Thabo')
  const [balanceCents, setBalanceCents] = useState<string | null>(null)
  const [balanceLoading, setBalanceLoading] = useState(true)
  const [balanceError, setBalanceError] = useState<string | null>(null)
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([])
  const [txLoading, setTxLoading] = useState(true)
  const [txError, setTxError] = useState<string | null>(null)

  // Fetch wallet balance from /api/consumer/wallet/balance
  useEffect(() => {
    let cancelled = false
    async function loadBalance() {
      setBalanceLoading(true)
      setBalanceError(null)
      try {
        const res = await apiGet<{ success?: boolean; data?: { balance?: { available?: string | number } } }>('/wallet/balance')
        if (cancelled) return
        const available = res?.data?.balance?.available
        setBalanceCents(available != null ? String(available) : null)
      } catch (err) {
        if (!cancelled) {
          setBalanceError(err instanceof Error ? err.message : 'Failed to load balance')
          setBalanceCents(null)
        }
      } finally {
        if (!cancelled) setBalanceLoading(false)
      }
    }
    loadBalance()
    return () => {
      cancelled = true
    }
  }, [])

  // Fetch recent transactions from /api/consumer/wallet/transactions
  useEffect(() => {
    let cancelled = false
    async function loadTransactions() {
      setTxLoading(true)
      setTxError(null)
      try {
        const res = await apiGet<{ success?: boolean; data?: { transactions?: any[] } | any[] }>('/wallet/transactions?limit=4')
        if (cancelled) return
        const raw = res?.data
        const list: any[] = Array.isArray(raw)
          ? raw
          : raw && Array.isArray((raw as any).transactions)
          ? (raw as any).transactions
          : []
        const mapped: RecentTransaction[] = list.slice(0, 4).map((tx) => ({
          id: String(tx.id || tx.reference || `TXN${Math.random()}`),
          description: String(tx.description || tx.counterparty?.name || 'Transaction'),
          amount: Number(tx.amount ?? tx.amountCents ?? 0) / 100,
          direction: tx.direction === 'credit' ? 'credit' : 'debit',
          createdAt: String(tx.createdAt || tx.completedAt || new Date().toISOString()),
          status: String(tx.status || 'completed'),
          type: String(tx.type || tx.transactionType || 'send'),
        }))
        setRecentTransactions(mapped)
      } catch (err) {
        if (!cancelled) {
          setTxError(err instanceof Error ? err.message : 'Failed to load transactions')
          setRecentTransactions([])
        }
      } finally {
        if (!cancelled) setTxLoading(false)
      }
    }
    loadTransactions()
    return () => {
      cancelled = true
    }
  }, [])

  const balanceDisplay = balanceCents
    ? formatMoney(balanceCents)
    : balanceLoading
    ? 'Loading...'
    : balanceError
    ? 'Unavailable'
    : 'R 0.00'

  const formatTxTime = (iso: string) => {
    const d = new Date(iso)
    const diffMs = Date.now() - d.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    if (diffMins < 60) return `${Math.max(1, diffMins)}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return d.toLocaleDateString('en-ZA')
  }

  // Mock data — kept for sections of the Home tab that don't have dedicated
  // API endpoints yet (savings pockets, special offers, smart insights).
  const savingsPockets = [
    { name: 'Emergency Fund', target: 10000, current: 6500, color: '#00897B' },
    { name: 'Holiday Savings', target: 5000, current: 2300, color: '#4CAF50' },
  ]

  const offers = [
    { id: 1, merchant: 'Shoprite', discount: '15%', category: 'Groceries', expires: '2 days' },
    { id: 2, merchant: 'Clicks', discount: '20%', category: 'Health', expires: '5 days' },
    { id: 3, merchant: 'Engen', discount: 'R2/L', category: 'Fuel', expires: '3 days' },
  ]

  return (
    <div className="space-y-4 pb-20">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-[#00897B] to-[#00695C] px-4 pt-6 pb-8 rounded-b-3xl">
        {/* User Greeting */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-teal-100 text-sm">Good morning,</p>
            <h1 className="text-white text-xl font-bold">{userName}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-white/20 text-white border-0 text-xs">
              <Shield className="h-3 w-3 mr-1" />
              L2 Verified
            </Badge>
            <button className="relative p-2">
              <Bell className="h-5 w-5 text-white" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
          </div>
        </div>

        {/* Balance Card */}
        <Card className="bg-white/10 backdrop-blur border-0">
          <CardContent className="p-4">
            <p className="text-teal-100 text-xs mb-1">Available Balance</p>
            {balanceLoading ? (
              <div className="flex items-center gap-2 mb-3">
                <Loader2 className="h-5 w-5 text-white animate-spin" />
                <span className="text-white/80 text-sm">Loading balance...</span>
              </div>
            ) : balanceError ? (
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="h-5 w-5 text-red-200" />
                <span className="text-red-100 text-sm">Unable to load balance</span>
              </div>
            ) : (
              <h2 className="text-white text-3xl font-bold mb-3">{balanceDisplay}</h2>
            )}
            <div className="flex items-center gap-2">
              <Badge className="bg-[#4CAF50]/20 text-green-300 border-0 text-xs">
                <TrendingUp className="h-3 w-3 mr-1" />
                +12.5% this month
              </Badge>
              <Badge className="bg-white/10 text-white border-0 text-xs">
                Gold Member
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Wallet Portfolio */}
      <div className="px-4">
        <button
          onClick={onOpenQR}
          className="w-full flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100 shadow-sm active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#E0F2F1] flex items-center justify-center">
              <Wallet className="h-5 w-5 text-[#00897B]" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-[#1A1A1A]">Wallet Portfolio</p>
              <p className="text-xs text-[#757575]">QR Card • 2 Linked Cards</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-[#757575]" />
        </button>
      </div>

      {/* Payment Hub */}
      <div className="px-4">
        <Card className="bg-white border border-gray-100 shadow-sm">
          <CardContent className="p-4">
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={onOpenQR}
                className="flex flex-col items-center p-2 rounded-lg hover:bg-[#E0F2F1] active:scale-95 transition-all"
              >
                <div className="w-9 h-9 rounded-lg bg-[#00897B] flex items-center justify-center mb-1">
                  <QrCode className="h-4 w-4 text-white" />
                </div>
                <span className="text-[10px] text-[#1A1A1A]">QR Pay</span>
              </button>
              <button
                onClick={onOpenCards}
                className="flex flex-col items-center p-2 rounded-lg hover:bg-[#E0F2F1] active:scale-95 transition-all"
              >
                <div className="w-9 h-9 rounded-lg bg-[#4CAF50] flex items-center justify-center mb-1">
                  <CreditCard className="h-4 w-4 text-white" />
                </div>
                <span className="text-[10px] text-[#1A1A1A]">Cards</span>
              </button>
              <button
                onClick={onOpenSend}
                className="flex flex-col items-center p-2 rounded-lg hover:bg-[#E0F2F1] active:scale-95 transition-all"
              >
                <div className="w-9 h-9 rounded-lg bg-[#00897B] flex items-center justify-center mb-1">
                  <Send className="h-4 w-4 text-white" />
                </div>
                <span className="text-[10px] text-[#1A1A1A]">Send</span>
              </button>
              <button
                onClick={onOpenMobileMoney}
                className="flex flex-col items-center p-2 rounded-lg hover:bg-[#E0F2F1] active:scale-95 transition-all"
              >
                <div className="w-9 h-9 rounded-lg bg-[#FFCC00] flex items-center justify-center mb-1">
                  <Smartphone className="h-4 w-4 text-black" />
                </div>
                <span className="text-[10px] text-[#1A1A1A]">MoMo</span>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pay+ Card */}
      <div className="px-4">
        <button
          onClick={onOpenPayPlus}
          className="w-full p-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl text-left active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-300" />
              <span className="text-white font-bold">Pay+</span>
            </div>
            <Badge className="bg-white/20 text-white border-0 text-xs">Earned Wage</Badge>
          </div>
          <p className="text-blue-100 text-sm mb-2">Access your earned wages instantly</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-xs">Available</p>
              <p className="text-white text-xl font-bold">R 5,536</p>
            </div>
            <div className="text-right">
              <p className="text-white/70 text-xs">Days Worked</p>
              <p className="text-white font-bold">18 / 22</p>
            </div>
          </div>
        </button>
      </div>

      {/* Grant+ Card */}
      <div className="px-4">
        <button
          onClick={onOpenGrantPlus}
          className="w-full p-4 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl text-left active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-white" />
              <span className="text-white font-bold">Grant+</span>
            </div>
            <Badge className="bg-white/20 text-white border-0 text-xs">SASSA</Badge>
          </div>
          <p className="text-orange-100 text-sm mb-2">Your social grant, simplified</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-xs">Next Payment</p>
              <p className="text-white font-bold">3 May 2025</p>
            </div>
            <Badge className="bg-green-400 text-green-900 border-0">R 2,090</Badge>
          </div>
        </button>
      </div>

      {/* Smart Insights */}
      <div className="px-4">
        <h3 className="text-sm font-semibold text-[#1A1A1A] mb-2">Smart Insights</h3>
        <div className="grid grid-cols-2 gap-2">
          <Card className="bg-white border border-gray-100">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown className="h-4 w-4 text-red-500" />
                <span className="text-xs text-[#757575]">Spending</span>
              </div>
              <p className="text-sm font-bold text-[#1A1A1A]">12% lower</p>
              <p className="text-[10px] text-[#757575]">vs last month</p>
            </CardContent>
          </Card>
          <Card className="bg-white border border-gray-100">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="h-4 w-4 text-yellow-500" />
                <span className="text-xs text-[#757575]">Electricity</span>
              </div>
              <p className="text-sm font-bold text-[#1A1A1A]">Low balance</p>
              <p className="text-[10px] text-[#757575]">Buy now</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* GroAI Smart Widget */}
      <div className="px-4">
        <Card className="bg-gradient-to-br from-[#0F766E] to-[#134E4A] border-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-white font-bold text-sm">GroAI Insights</p>
                <p className="text-teal-200 text-[10px]">Powered by spazabox.co.za + Groway Merchant OS</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="bg-white/10 rounded-lg p-3">
                <p className="text-white text-xs">
                  💡 You spent R1,240 on groceries this month. Shoprite (a Groway merchant) has 15% off on basics — save R186 by shopping there.
                </p>
              </div>
              <div className="bg-white/10 rounded-lg p-3">
                <p className="text-white text-xs">
                  📊 Your electricity usage is 20% higher than last month. Consider buying a R200 token now before month-end peak rates.
                </p>
              </div>
              <div className="bg-white/10 rounded-lg p-3">
                <p className="text-white text-xs">
                  💰 You could save R350/month by rounding up transactions to the nearest R10. Enable Auto-Save to start.
                </p>
              </div>
            </div>
            <button className="w-full mt-3 bg-white/20 hover:bg-white/30 rounded-lg py-2 text-white text-xs font-medium transition-colors">
              Ask GroAI for more insights →
            </button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Services */}
      <div className="px-4">
        <h3 className="text-sm font-semibold text-[#1A1A1A] mb-2">Quick Services</h3>
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={onOpenLaybye}
            className="flex flex-col items-center p-2 rounded-xl bg-[#E0F2F1] active:scale-95 transition-transform"
          >
            <ShoppingCart className="h-5 w-5 text-[#00897B] mb-1" />
            <span className="text-[10px] text-[#00897B]">Laybye</span>
          </button>
          <button
            onClick={onOpenMTNMoMo}
            className="flex flex-col items-center p-2 rounded-xl bg-[#FFF8E1] active:scale-95 transition-transform"
          >
            <Smartphone className="h-5 w-5 text-[#FF9800] mb-1" />
            <span className="text-[10px] text-[#FF9800]">MTN MoMo</span>
          </button>
          <button
            onClick={onOpenPayShap}
            className="flex flex-col items-center p-2 rounded-xl bg-[#E8F5E9] active:scale-95 transition-transform"
          >
            <DollarSign className="h-5 w-5 text-[#4CAF50] mb-1" />
            <span className="text-[10px] text-[#4CAF50]">PayShap</span>
          </button>
          <button
            onClick={onOpenVouchers}
            className="flex flex-col items-center p-2 rounded-xl bg-[#F3E5F5] active:scale-95 transition-transform"
          >
            <Gift className="h-5 w-5 text-[#9C27B0] mb-1" />
            <span className="text-[10px] text-[#9C27B0]">Vouchers</span>
          </button>
        </div>
      </div>

      {/* Special Offers */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-[#1A1A1A]">Special Offers</h3>
          <button className="text-xs text-[#00897B]">View All</button>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {offers.map((offer) => (
            <Card key={offer.id} className="flex-shrink-0 w-32 bg-white border border-gray-100">
              <CardContent className="p-3">
                <Badge className="bg-red-500 text-white border-0 text-xs mb-2">
                  {offer.discount} OFF
                </Badge>
                <p className="text-sm font-bold text-[#1A1A1A]">{offer.merchant}</p>
                <p className="text-[10px] text-[#757575]">{offer.category}</p>
                <p className="text-[10px] text-[#00897B] mt-1">Expires in {offer.expires}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Savings Pockets */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-[#1A1A1A]">Savings Pockets</h3>
          <button className="text-xs text-[#00897B]">+ Add New</button>
        </div>
        <div className="space-y-2">
          {savingsPockets.map((pocket, index) => (
            <Card key={index} className="bg-white border border-gray-100">
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4" style={{ color: pocket.color }} />
                    <span className="text-sm font-medium text-[#1A1A1A]">{pocket.name}</span>
                  </div>
                  <span className="text-xs text-[#757575]">
                    {Math.round((pocket.current / pocket.target) * 100)}%
                  </span>
                </div>
                <Progress
                  value={(pocket.current / pocket.target) * 100}
                  className="h-2 mb-1"
                />
                <div className="flex justify-between text-xs text-[#757575]">
                  <span>R {pocket.current.toLocaleString()}</span>
                  <span>R {pocket.target.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Financial Health Score */}
      <div className="px-4">
        <Card className="bg-white border border-gray-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#0F766E]/10 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-[#0F766E]" />
                </div>
                <h3 className="text-sm font-semibold text-[#1A1A1A]">Financial Health</h3>
              </div>
              <Badge className="bg-[#4CAF50]/20 text-[#4CAF50] border-0 text-xs">Good · 72/100</Badge>
            </div>
            {/* Health Score Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
              <div className="bg-gradient-to-r from-[#0F766E] to-[#4CAF50] h-2.5 rounded-full" style={{ width: '72%' }} />
            </div>
            {/* Breakdown */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <p className="text-[10px] text-[#757575]">Savings Rate</p>
                <p className="text-sm font-bold text-[#4CAF50]">18% of income</p>
              </div>
              <div>
                <p className="text-[10px] text-[#757575]">Debt-to-Income</p>
                <p className="text-sm font-bold text-[#FF9800]">28%</p>
              </div>
              <div>
                <p className="text-[10px] text-[#757575]">Emergency Fund</p>
                <p className="text-sm font-bold text-[#1A1A1A]">1.2 months</p>
              </div>
              <div>
                <p className="text-[10px] text-[#757575]">Credit Score</p>
                <p className="text-sm font-bold text-[#4CAF50]">682</p>
              </div>
            </div>
            {/* Investment Options */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-[#1A1A1A]">Grow Your Money</p>
              <button className="w-full flex items-center justify-between p-2 bg-[#E0F2F1] rounded-lg">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-[#0F766E]" />
                  <span className="text-xs font-medium text-[#0F766E]">Stokvel</span>
                </div>
                <span className="text-[10px] text-[#757575]">Earn up to 8% p.a.</span>
              </button>
              <button className="w-full flex items-center justify-between p-2 bg-[#E8F5E9] rounded-lg">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-[#4CAF50]" />
                  <span className="text-xs font-medium text-[#4CAF50]">ETFs</span>
                </div>
                <span className="text-[10px] text-[#757575]">From R50/month</span>
              </button>
              <button className="w-full flex items-center justify-between p-2 bg-[#F3E5F5] rounded-lg">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-[#9C27B0]" />
                  <span className="text-xs font-medium text-[#9C27B0]">Stocks</span>
                </div>
                <span className="text-[10px] text-[#757575]">JSE listed shares</span>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-[#1A1A1A]">Recent Activity</h3>
          <button
            onClick={onOpenTransactionHistory}
            className="text-xs text-[#00897B] font-medium"
          >
            View All
          </button>
        </div>
        <Card className="bg-white border border-gray-100">
          <CardContent className="p-0 divide-y divide-gray-100">
            {txLoading && (
              <div className="flex items-center justify-center p-6">
                <Loader2 className="h-5 w-5 text-[#00897B] animate-spin" />
              </div>
            )}
            {txError && !txLoading && (
              <div className="flex items-center gap-2 p-4">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <p className="text-sm text-red-600">{txError}</p>
              </div>
            )}
            {!txLoading && !txError && recentTransactions.length === 0 && (
              <div className="text-center p-6">
                <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-[#757575]">No recent transactions</p>
              </div>
            )}
            {!txLoading && !txError && recentTransactions.map((tx) => (
              <button
                key={tx.id}
                onClick={onOpenTransactionHistory}
                className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors active:bg-gray-100"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    tx.direction === 'credit' ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    {tx.direction === 'credit' ? (
                      <ArrowDownLeft className="h-4 w-4 text-green-600" />
                    ) : (
                      <ArrowUpRight className="h-4 w-4 text-gray-600" />
                    )}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-[#1A1A1A]">{tx.description}</p>
                    <p className="text-[10px] text-[#757575]">{formatTxTime(tx.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold ${
                    tx.direction === 'credit' ? 'text-green-600' : 'text-[#1A1A1A]'
                  }`}>
                    {tx.direction === 'credit' ? '+' : '-'}R {Math.abs(tx.amount).toFixed(2)}
                  </span>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Quick Access to Transaction History */}
      <div className="px-4">
        <button
          onClick={onOpenTransactionHistory}
          className="w-full p-4 bg-[#E0F2F1] rounded-xl flex items-center justify-between active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center gap-3">
            <Receipt className="h-5 w-5 text-[#00897B]" />
            <div className="text-left">
              <p className="text-sm font-medium text-[#1A1A1A]">View Transaction History</p>
              <p className="text-xs text-[#757575]">See all your purchases and payments</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-[#00897B]" />
        </button>
      </div>
    </div>
  )
}
