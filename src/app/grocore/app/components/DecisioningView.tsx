'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Brain, Loader2 } from 'lucide-react'
import { apiGet, apiPost, formatMoney, formatTime } from '../lib/api'

interface DecisionRecord {
  id?: string
  reference?: string
  consumer?: string
  consumerName?: string
  amountCents?: string | number | null
  currency?: string
  outcome?: string
  score?: string | number | null
  reason?: string
  createdAt?: string
}

interface DecisioningPayload {
  decisions?: DecisionRecord[]
}

export function DecisioningView() {
  const [items, setItems] = useState<DecisionRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [consumer, setConsumer] = useState('')
  const [amount, setAmount] = useState('')
  const [purpose, setPurpose] = useState('topup')
  const [submitting, setSubmitting] = useState(false)

  const reload = () => {
    setLoading(true)
    apiGet<DecisioningPayload>('/decisioning')
      .then((payload) => {
        setItems(payload?.decisions ?? [])
        setError(null)
      })
      .catch((err: unknown) => {
        console.warn('Decisioning load failed:', err)
        setError('Unable to load decisions right now.')
        setItems([])
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    reload()
  }, [])

  const handleRun = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!consumer || !amount) {
      toast.error('Consumer and amount are required')
      return
    }
    const cents = Math.round(Number(amount) * 100)
    if (Number.isNaN(cents) || cents <= 0) {
      toast.error('Amount must be a positive number')
      return
    }
    setSubmitting(true)
    try {
      const result = await apiPost<{ outcome?: string; reference?: string }>(
        '/decisioning/run',
        {
          consumer,
          amountCents: String(cents),
          currency: 'ZAR',
          purpose,
        }
      )
      toast.success(
        `Decision: ${result?.outcome ?? 'completed'}${
          result?.reference ? ` (${result.reference})` : ''
        }`
      )
      setConsumer('')
      setAmount('')
      reload()
    } catch (err) {
      console.error('Decision run failed:', err)
      toast.error('Failed to run decision')
    } finally {
      setSubmitting(false)
    }
  }

  const outcomeBadge = (outcome?: string) => {
    if (!outcome) return null
    const lower = outcome.toLowerCase()
    const variant =
      lower === 'approved' || lower === 'accept'
        ? 'bg-[#0F766E] text-white hover:bg-[#0F766E]'
        : lower === 'declined' || lower === 'reject'
        ? 'bg-red-600 text-white hover:bg-red-600'
        : 'bg-amber-500 text-white hover:bg-amber-500'
    return <Badge className={variant}>{outcome}</Badge>
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Decisioning</h2>
        <p className="text-sm text-slate-600">
          Run affordability and risk decisions with explicit consumer consent.
        </p>
      </div>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <Brain className="h-4 w-4 text-[#0F766E]" />
            Run decision
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleRun}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2"
          >
            <div className="space-y-2">
              <Label htmlFor="consumer">Consumer</Label>
              <Input
                id="consumer"
                placeholder="consumer-id or msisdn"
                value={consumer}
                onChange={(e) => setConsumer(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="purpose">Purpose</Label>
              <Input
                id="purpose"
                placeholder="topup | advance | device"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="amount">Amount (ZAR)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <div className="sm:col-span-2">
              <Button
                type="submit"
                className="bg-[#0F766E] text-white hover:bg-[#0F6258]"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Running...
                  </>
                ) : (
                  'Run decision'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-slate-900">
            Recent decisions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : error ? (
            <p className="py-8 text-center text-sm text-slate-500">{error}</p>
          ) : items.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              No items yet
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Consumer</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Outcome</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, idx) => (
                  <TableRow key={item.id ?? idx}>
                    <TableCell className="font-mono text-xs">
                      {item.reference ?? '—'}
                    </TableCell>
                    <TableCell className="font-medium text-slate-900">
                      {item.consumerName ?? item.consumer ?? '—'}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(item.amountCents, item.currency)}
                    </TableCell>
                    <TableCell>{outcomeBadge(item.outcome)}</TableCell>
                    <TableCell className="text-right tabular-nums text-slate-700">
                      {item.score !== null && item.score !== undefined
                        ? Number(item.score).toFixed(2)
                        : '—'}
                    </TableCell>
                    <TableCell className="text-slate-700">
                      {item.reason ?? '—'}
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">
                      {formatTime(item.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
