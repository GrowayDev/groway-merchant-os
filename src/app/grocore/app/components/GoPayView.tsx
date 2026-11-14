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
import { Landmark, Loader2 } from 'lucide-react'
import { apiGet, apiPost, formatMoney, formatTime, toNumber } from '../lib/api'

interface CaptureRecord {
  id?: string
  reference?: string
  merchant?: string
  amountCents?: string | number | null
  currency?: string
  channel?: string
  status?: string
  createdAt?: string
}

interface SettlementRecord {
  id?: string
  reference?: string
  merchant?: string
  amountCents?: string | number | null
  currency?: string
  status?: string
  settledAt?: string
  createdAt?: string
}

interface GoPayPayload {
  captures?: CaptureRecord[]
  settlements?: SettlementRecord[]
}

export function GoPayView() {
  const [data, setData] = useState<GoPayPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [merchant, setMerchant] = useState('')
  const [amount, setAmount] = useState('')
  const [channel, setChannel] = useState('card')
  const [submitting, setSubmitting] = useState(false)

  const reload = () => {
    setLoading(true)
    apiGet<GoPayPayload>('/gopay')
      .then((payload) => {
        setData(payload)
        setError(null)
      })
      .catch((err: unknown) => {
        console.warn('GoPay load failed:', err)
        setError('Unable to load GoPay data right now.')
        setData(null)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    reload()
  }, [])

  const handleCapture = async (e: React.FormEvent) => {
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
      await apiPost('/gopay/captures', {
        merchant,
        amountCents: String(cents),
        currency: 'ZAR',
        channel,
      })
      toast.success('Capture created')
      setMerchant('')
      setAmount('')
      reload()
    } catch (err) {
      console.error('Create capture failed:', err)
      toast.error('Failed to create capture')
    } finally {
      setSubmitting(false)
    }
  }

  const statusBadge = (status?: string) => {
    if (!status) return null
    const lower = status.toLowerCase()
    const variant =
      lower === 'captured' || lower === 'settled'
        ? 'bg-[#0F766E] text-white hover:bg-[#0F766E]'
        : lower === 'pending'
        ? 'bg-amber-500 text-white hover:bg-amber-500'
        : lower === 'failed'
        ? 'bg-red-600 text-white hover:bg-red-600'
        : 'bg-slate-200 text-slate-700 hover:bg-slate-200'
    return <Badge className={variant}>{status}</Badge>
  }

  const captures = data?.captures ?? []
  const settlements = data?.settlements ?? []

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">GoPay settlement</h2>
        <p className="text-sm text-slate-600">
          Capture, batch, and settle transactions with split payouts.
        </p>
      </div>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <Landmark className="h-4 w-4 text-[#0F766E]" />
            Create capture
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleCapture}
            className="grid grid-cols-1 gap-4 sm:grid-cols-4"
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
              <Label htmlFor="channel">Channel</Label>
              <Input
                id="channel"
                placeholder="card | wallet | cash"
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
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
            <div className="sm:col-span-4">
              <Button
                type="submit"
                className="bg-[#0F766E] text-white hover:bg-[#0F6258]"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Capturing...
                  </>
                ) : (
                  'Create capture'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-slate-900">
            Captures
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
          ) : captures.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              No items yet
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Merchant</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {captures.map((item, idx) => (
                  <TableRow key={item.id ?? idx}>
                    <TableCell className="font-mono text-xs">
                      {item.reference ?? '—'}
                    </TableCell>
                    <TableCell className="font-medium text-slate-900">
                      {item.merchant ?? '—'}
                    </TableCell>
                    <TableCell className="text-slate-700">
                      {item.channel ?? '—'}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(item.amountCents, item.currency)}
                    </TableCell>
                    <TableCell>{statusBadge(item.status)}</TableCell>
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

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-slate-900">
            Settlements
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
          ) : settlements.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              No items yet
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Merchant</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Settled</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {settlements.map((item, idx) => (
                  <TableRow key={item.id ?? idx}>
                    <TableCell className="font-mono text-xs">
                      {item.reference ?? '—'}
                    </TableCell>
                    <TableCell className="font-medium text-slate-900">
                      {item.merchant ?? '—'}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(
                        toNumber(item.amountCents) > 0
                          ? item.amountCents
                          : 0,
                        item.currency
                      )}
                    </TableCell>
                    <TableCell>{statusBadge(item.status)}</TableCell>
                    <TableCell className="text-xs text-slate-500">
                      {formatTime(item.settledAt ?? item.createdAt)}
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
