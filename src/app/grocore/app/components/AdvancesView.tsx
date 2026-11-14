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
import { Zap, Loader2 } from 'lucide-react'
import { apiGet, apiPost, formatMoney, formatTime, toNumber } from '../lib/api'

interface AdvanceRecord {
  id?: string
  reference?: string
  merchant?: string
  merchantName?: string
  principalCents?: string | number | null
  recoveredCents?: string | number | null
  outstandingCents?: string | number | null
  currency?: string
  status?: string
  createdAt?: string
}

interface AdvancesPayload {
  advances?: AdvanceRecord[]
}

export function AdvancesView() {
  const [items, setItems] = useState<AdvanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actioningId, setActioningId] = useState<string | null>(null)

  const [merchant, setMerchant] = useState('')
  const [amount, setAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const reload = () => {
    setLoading(true)
    apiGet<AdvancesPayload>('/advances')
      .then((payload) => {
        setItems(payload?.advances ?? [])
        setError(null)
      })
      .catch((err: unknown) => {
        console.warn('Advances load failed:', err)
        setError('Unable to load advances right now.')
        setItems([])
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    reload()
  }, [])

  const handleIssue = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!merchant || !amount) {
      toast.error('Merchant and amount are required')
      return
    }
    const cents = Math.round(Number(amount) * 100)
    if (Number.isNaN(cents) || cents <= 0) {
      toast.error('Amount must be a positive number')
      return
    }
    setSubmitting(true)
    try {
      await apiPost('/advances', {
        merchant,
        principalCents: String(cents),
        currency: 'ZAR',
      })
      toast.success('Advance issued')
      setMerchant('')
      setAmount('')
      reload()
    } catch (err) {
      console.error('Issue advance failed:', err)
      toast.error('Failed to issue advance')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRecover = async (id: string) => {
    setActioningId(id)
    try {
      await apiPost(`/advances/${id}/recover`, {})
      toast.success('Recovery applied')
      reload()
    } catch (err) {
      console.error('Recover advance failed:', err)
      toast.error('Failed to recover advance')
    } finally {
      setActioningId(null)
    }
  }

  const statusBadge = (status?: string) => {
    if (!status) return null
    const lower = status.toLowerCase()
    const variant =
      lower === 'open' || lower === 'active'
        ? 'bg-[#0F766E] text-white hover:bg-[#0F766E]'
        : lower === 'closed' || lower === 'settled'
        ? 'bg-slate-400 text-white hover:bg-slate-400'
        : 'bg-amber-500 text-white hover:bg-amber-500'
    return <Badge className={variant}>{status}</Badge>
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Top-up advances</h2>
        <p className="text-sm text-slate-600">
          Short-term working capital advances, recovered from daily settlement.
        </p>
      </div>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <Zap className="h-4 w-4 text-[#0F766E]" />
            Issue advance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleIssue}
            className="grid grid-cols-1 gap-4 sm:grid-cols-3"
          >
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="merchant">Merchant</Label>
              <Input
                id="merchant"
                placeholder="merchant-id"
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
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
            <div className="sm:col-span-3">
              <Button
                type="submit"
                className="bg-[#0F766E] text-white hover:bg-[#0F6258]"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Issuing...
                  </>
                ) : (
                  'Issue advance'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-slate-900">
            Advances
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
                  <TableHead>Merchant</TableHead>
                  <TableHead className="text-right">Principal</TableHead>
                  <TableHead className="text-right">Recovered</TableHead>
                  <TableHead className="text-right">Outstanding</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, idx) => {
                  const id = item.id ?? String(idx)
                  const isOpen =
                    (item.status ?? '').toLowerCase() === 'open' ||
                    (item.status ?? '').toLowerCase() === 'active'
                  return (
                    <TableRow key={id}>
                      <TableCell className="font-mono text-xs">
                        {item.reference ?? '—'}
                      </TableCell>
                      <TableCell className="font-medium text-slate-900">
                        {item.merchantName ?? item.merchant ?? '—'}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(item.principalCents, item.currency)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(item.recoveredCents, item.currency)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(item.outstandingCents, item.currency)}
                      </TableCell>
                      <TableCell>{statusBadge(item.status)}</TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {formatTime(item.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 border-[#0F766E] text-[#0F766E] hover:bg-[#F0FDFA]"
                          disabled={
                            !isOpen ||
                            actioningId === id ||
                            toNumber(item.outstandingCents) <= 0
                          }
                          onClick={() => handleRecover(id)}
                        >
                          {actioningId === id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            'Recover'
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
