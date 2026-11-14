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
import { Ticket, Loader2 } from 'lucide-react'
import { apiGet, apiPost, formatMoney, formatTime, toNumber } from '../lib/api'

interface VoucherRecord {
  id?: string
  code?: string
  reference?: string
  consumer?: string
  faceValueCents?: string | number | null
  redeemedCents?: string | number | null
  currency?: string
  status?: string
  expiresAt?: string
  createdAt?: string
}

interface VouchersPayload {
  vouchers?: VoucherRecord[]
}

export function VouchersView() {
  const [items, setItems] = useState<VoucherRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actioningId, setActioningId] = useState<string | null>(null)

  const [consumer, setConsumer] = useState('')
  const [amount, setAmount] = useState('')
  const [purpose, setPurpose] = useState('grant')
  const [submitting, setSubmitting] = useState(false)

  const reload = () => {
    setLoading(true)
    apiGet<VouchersPayload>('/vouchers')
      .then((payload) => {
        setItems(payload?.vouchers ?? [])
        setError(null)
      })
      .catch((err: unknown) => {
        console.warn('Vouchers load failed:', err)
        setError('Unable to load vouchers right now.')
        setItems([])
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    reload()
  }, [])

  const handleIssue = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount) {
      toast.error('Face value is required')
      return
    }
    const cents = Math.round(Number(amount) * 100)
    if (Number.isNaN(cents) || cents <= 0) {
      toast.error('Amount must be a positive number')
      return
    }
    setSubmitting(true)
    try {
      await apiPost('/vouchers', {
        consumer: consumer || undefined,
        purpose,
        faceValueCents: String(cents),
        currency: 'ZAR',
      })
      toast.success('Voucher issued')
      setConsumer('')
      setAmount('')
      reload()
    } catch (err) {
      console.error('Issue voucher failed:', err)
      toast.error('Failed to issue voucher')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRedeem = async (id: string) => {
    setActioningId(id)
    try {
      await apiPost(`/vouchers/${id}/redeem`, {})
      toast.success('Voucher redeemed')
      reload()
    } catch (err) {
      console.error('Redeem voucher failed:', err)
      toast.error('Failed to redeem voucher')
    } finally {
      setActioningId(null)
    }
  }

  const statusBadge = (status?: string) => {
    if (!status) return null
    const lower = status.toLowerCase()
    const variant =
      lower === 'issued' || lower === 'active'
        ? 'bg-[#0F766E] text-white hover:bg-[#0F766E]'
        : lower === 'redeemed'
        ? 'bg-slate-400 text-white hover:bg-slate-400'
        : lower === 'expired'
        ? 'bg-red-600 text-white hover:bg-red-600'
        : 'bg-amber-500 text-white hover:bg-amber-500'
    return <Badge className={variant}>{status}</Badge>
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Vouchers</h2>
        <p className="text-sm text-slate-600">
          Digital vouchers and grants with full audit trail down to the minor
          unit.
        </p>
      </div>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <Ticket className="h-4 w-4 text-[#0F766E]" />
            Issue voucher
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleIssue}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2"
          >
            <div className="space-y-2">
              <Label htmlFor="consumer">Consumer (optional)</Label>
              <Input
                id="consumer"
                placeholder="consumer-id or msisdn"
                value={consumer}
                onChange={(e) => setConsumer(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="purpose">Purpose</Label>
              <Input
                id="purpose"
                placeholder="grant | loyalty | promo"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="amount">Face value (ZAR)</Label>
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
                    Issuing...
                  </>
                ) : (
                  'Issue voucher'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-slate-900">
            Vouchers
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
                  <TableHead>Code</TableHead>
                  <TableHead>Consumer</TableHead>
                  <TableHead className="text-right">Face value</TableHead>
                  <TableHead className="text-right">Redeemed</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, idx) => {
                  const id = item.id ?? String(idx)
                  const isRedeemable =
                    (item.status ?? '').toLowerCase() === 'issued' ||
                    (item.status ?? '').toLowerCase() === 'active'
                  return (
                    <TableRow key={id}>
                      <TableCell className="font-mono text-xs">
                        {item.code ?? item.reference ?? '—'}
                      </TableCell>
                      <TableCell className="text-slate-700">
                        {item.consumer ?? '—'}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(item.faceValueCents, item.currency)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(item.redeemedCents, item.currency)}
                      </TableCell>
                      <TableCell>{statusBadge(item.status)}</TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {formatTime(item.expiresAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 border-[#0F766E] text-[#0F766E] hover:bg-[#F0FDFA]"
                          disabled={
                            !isRedeemable ||
                            actioningId === id ||
                            toNumber(item.faceValueCents) <= 0
                          }
                          onClick={() => handleRedeem(id)}
                        >
                          {actioningId === id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            'Redeem'
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
