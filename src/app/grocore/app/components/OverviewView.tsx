'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  Wallet,
  Zap,
  Ticket,
  Landmark,
  Activity,
} from 'lucide-react'
import { apiGet, formatMoney, toNumber } from '../lib/api'

interface KpiPayload {
  capitalDeployed?: string | number | null
  openAdvances?: string | number | null
  vouchersIssued?: string | number | null
  pendingSettlements?: string | number | null
}

interface ActivityItem {
  id?: string
  description?: string
  amount?: string | number | null
  currency?: string
  createdAt?: string
  type?: string
}

interface OverviewPayload {
  kpis?: KpiPayload
  activity?: ActivityItem[]
}

const kpiCards = [
  {
    key: 'capitalDeployed',
    label: 'Capital deployed',
    icon: Wallet,
  },
  {
    key: 'openAdvances',
    label: 'Open advances',
    icon: Zap,
  },
  {
    key: 'vouchersIssued',
    label: 'Vouchers issued',
    icon: Ticket,
  },
  {
    key: 'pendingSettlements',
    label: 'Pending settlements',
    icon: Landmark,
  },
] as const

function formatTime(value?: string): string {
  if (!value) return '—'
  try {
    return new Intl.DateTimeFormat('en-ZA', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value))
  } catch {
    return value
  }
}

export function OverviewView() {
  const [data, setData] = useState<OverviewPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    apiGet<OverviewPayload>('/overview')
      .then((payload) => {
        if (cancelled) return
        setData(payload)
        setError(null)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        console.warn('Overview load failed:', err)
        setError('Unable to load overview right now.')
      })
      .finally(() => {
        if (cancelled) return
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const kpis = data?.kpis ?? {}

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Overview</h2>
        <p className="text-sm text-slate-600">
          Snapshot of capital, credit, and settlement across this tenant.
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((card) => {
          const raw = kpis[card.key]
          const isCount = card.key === 'openAdvances' || card.key === 'vouchersIssued'
          return (
            <Card key={card.key} className="border-slate-200">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    {card.label}
                  </p>
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-[#F0FDFA] text-[#0F766E]">
                    <card.icon className="h-4 w-4" />
                  </span>
                </div>
                {loading ? (
                  <Skeleton className="mt-3 h-7 w-28" />
                ) : (
                  <p className="mt-3 text-2xl font-bold text-slate-900">
                    {isCount
                      ? new Intl.NumberFormat('en-ZA').format(toNumber(raw))
                      : formatMoney(raw)}
                  </p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Recent activity */}
      <Card className="border-slate-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base font-semibold text-slate-900">
            Recent activity
          </CardTitle>
          <Activity className="h-4 w-4 text-slate-400" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : error ? (
            <p className="py-8 text-center text-sm text-slate-500">{error}</p>
          ) : !data?.activity || data.activity.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              No items yet
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {data.activity.map((item, idx) => (
                <li
                  key={item.id ?? idx}
                  className="flex items-center justify-between py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {item.description ?? item.type ?? 'Activity'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatTime(item.createdAt)}
                    </p>
                  </div>
                  <div className="ml-4 shrink-0 text-right">
                    {item.amount !== undefined && (
                      <Badge
                        variant="outline"
                        className="border-slate-200 text-slate-700"
                      >
                        {formatMoney(item.amount, item.currency)}
                      </Badge>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
