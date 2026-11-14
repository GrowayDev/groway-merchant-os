'use client'

import { useEffect, useState } from 'react'
import {
  ArrowDownLeft,
  ArrowUpRight,
  Gift,
  Link2,
  Loader2,
  Plus,
  Receipt,
  Sparkles,
  Coins,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface WalletActivity {
  id: string
  activityType: string
  title: string
  description: string | null
  direction: string
  amount: number | null
  balanceAfter: number | null
  merchantName: string | null
  createdAt: string
}

const ICONS: Record<string, typeof Receipt> = {
  payment: Receipt,
  cashback: Gift,
  reward: Sparkles,
  refund: ArrowDownLeft,
  topup: Plus,
  link: Link2,
  unlink: Link2,
  loyalty_earn: Coins,
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

/**
 * Live consumer wallet activity feed.
 * Reads the shared ConsumerWalletActivity ledger — the same feed the
 * Merchant OS "Consumer Wallets" view uses on the merchant side, so
 * cashback issued by a linked store appears here instantly.
 *
 * Auth: uses the GoPay consumer token persisted by the wallet app
 * (localStorage `consumer_auth` / `consumer_token`), or dev ?userId=.
 */
export function WalletActivityFeed({ limit = 15 }: { limit?: number }) {
  const [activities, setActivities] = useState<WalletActivity[] | null>(null)
  const [balance, setBalance] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        // Token persisted by the consumer wallet app after PIN login
        let token: string | null = null
        try {
          const stored =
            window.localStorage.getItem('consumer_auth') ??
            window.localStorage.getItem('groway_consumer_session')
          if (stored) {
            const parsed = JSON.parse(stored)
            token =
              parsed?.accessToken ?? parsed?.session?.accessToken ?? parsed?.token ?? null
          }
        } catch {
          token = null
        }
        if (!token) token = window.localStorage.getItem('consumer_token')

        const headers: Record<string, string> = {}
        if (token) {
          headers.Authorization = `Bearer ${token}`
        } else {
          // Dev demo mode: no consumer JWT in storage — the dev proxy allows
          // this route through and the API resolves the demo ?userId= (the
          // fallback is disabled in production builds).
          headers['X-Dev-Bypass'] = 'true'
        }
        const url = token
          ? `/api/consumer/wallet/activities?limit=${limit}`
          : `/api/consumer/wallet/activities?limit=${limit}&userId=cu_wallet_thandi`
        const res = await fetch(url, { headers })
        const data = await res.json()
        if (cancelled) return
        if (data.success) {
          setActivities(data.activities ?? [])
          setBalance(data.wallet?.balance ?? null)
        } else {
          setError(data.error ?? 'Could not load activity')
        }
      } catch {
        if (!cancelled) setError('Could not load wallet activity')
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [limit])

  if (activities === null && !error) {
    return (
      <div className="flex items-center justify-center py-8 text-[#757575] text-sm">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading activity…
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-4">
        <Card className="bg-white border border-gray-100">
          <CardContent className="py-6 text-center text-xs text-[#757575]">{error}</CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div>
      {balance !== null && (
        <p className="text-center text-xs text-[#757575] mb-2">
          Live wallet balance:{' '}
          <span className="font-semibold text-[#00897B]">R {balance.toFixed(2)}</span>
        </p>
      )}
      <Card className="bg-white border border-gray-100">
        <CardContent className="p-0 divide-y divide-gray-100">
          {activities.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#757575]">
              No wallet activity yet — top up and make your first payment.
            </div>
          ) : (
            activities.map((a) => {
              const Icon = ICONS[a.activityType] ?? Receipt
              const isCredit = a.direction === 'credit'
              const isInfo = a.direction === 'info'
              return (
                <div
                  key={a.id}
                  className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isCredit ? 'bg-green-100' : isInfo ? 'bg-gray-100' : 'bg-[#E0F2F1]'
                      }`}
                    >
                      <Icon
                        className={`h-4 w-4 ${
                          isCredit ? 'text-green-600' : 'text-[#00897B]'
                        }`}
                      />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-[#1A1A1A]">{a.title}</p>
                      <p className="text-[10px] text-[#757575]">
                        {a.description ? `${a.description} · ` : ''}
                        {timeAgo(a.createdAt)}
                        {a.balanceAfter !== null
                          ? ` · bal R ${a.balanceAfter.toFixed(2)}`
                          : ''}
                      </p>
                    </div>
                  </div>
                  {a.amount !== null && (
                    <span
                      className={`text-sm font-bold ${
                        isCredit ? 'text-green-600' : isInfo ? 'text-[#757575]' : 'text-[#1A1A1A]'
                      }`}
                    >
                      {isCredit ? '+' : isInfo ? '' : '−'}R {a.amount.toFixed(2)}
                    </span>
                  )}
                </div>
              )
            })
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default WalletActivityFeed
