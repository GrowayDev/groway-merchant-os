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
import { CreditCard, Loader2 } from 'lucide-react'
import { apiGet, apiPost, formatMoney, formatTime, toNumber } from '../lib/api'

interface DeviceContract {
  id?: string
  reference?: string
  merchant?: string
  device?: string
  deviceLabel?: string
  principalCents?: string | number | null
  paidCents?: string | number | null
  outstandingCents?: string | number | null
  currency?: string
  termMonths?: number
  status?: string
  createdAt?: string
}

interface DeviceFinancePayload {
  contracts?: DeviceContract[]
}

export function DeviceFinanceView() {
  const [items, setItems] = useState<DeviceContract[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actioningId, setActioningId] = useState<string | null>(null)

  const [merchant, setMerchant] = useState('')
  const [device, setDevice] = useState('')
  const [principal, setPrincipal] = useState('')
  const [termMonths, setTermMonths] = useState('12')
  const [submitting, setSubmitting] = useState(false)

  const reload = () => {
    setLoading(true)
    apiGet<DeviceFinancePayload>('/device-finance')
      .then((payload) => {
        setItems(payload?.contracts ?? [])
        setError(null)
      })
      .catch((err: unknown) => {
        console.warn('Device finance load failed:', err)
        setError('Unable to load device finance right now.')
        setItems([])
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    reload()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!merchant || !device || !principal) {
      toast.error('Merchant, device, and principal are required')
      return
    }
    const cents = Math.round(Number(principal) * 100)
    if (Number.isNaN(cents) || cents <= 0) {
      toast.error('Principal must be a positive number')
      return
    }
    const term = Number(termMonths)
    if (Number.isNaN(term) || term <= 0) {
      toast.error('Term must be a positive number of months')
      return
    }
    setSubmitting(true)
    try {
      await apiPost('/device-finance', {
        merchant,
        device,
        principalCents: String(cents),
        currency: 'ZAR',
        termMonths: term,
      })
      toast.success('Device finance contract created')
      setMerchant('')
      setDevice('')
      setPrincipal('')
      setTermMonths('12')
      reload()
    } catch (err) {
      console.error('Create device contract failed:', err)
      toast.error('Failed to create contract')
    } finally {
      setSubmitting(false)
    }
  }

  const handlePayment = async (id: string) => {
    setActioningId(id)
    try {
      await apiPost(`/device-finance/${id}/payments`, {})
      toast.success('Payment recorded')
      reload()
    } catch (err) {
      console.error('Record payment failed:', err)
      toast.error('Failed to record payment')
    } finally {
      setActioningId(null)
    }
  }

  const statusBadge = (status?: string) => {
    if (!status) return null
    const lower = status.toLowerCase()
    const variant =
      lower === 'active'
        ? 'bg-[#0F766E] text-white hover:bg-[#0F766E]'
        : lower === 'paid' || lower === 'settled'
        ? 'bg-slate-400 text-white hover:bg-slate-400'
        : lower === 'defaulted'
        ? 'bg-red-600 text-white hover:bg-red-600'
        : 'bg-amber-500 text-white hover:bg-amber-500'
    return <Badge className={variant}>{status}</Badge>
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Device finance</h2>
        <p className="text-sm text-slate-600">
          Installment contracts for SmartPole terminals and merchant hardware.
        </p>
      </div>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <CreditCard className="h-4 w-4 text-[#0F766E]" />
            Create contract
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleCreate}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2"
          >
            <div className="space-y-2">
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
              <Label htmlFor="device">Device</Label>
              <Input
                id="device"
                placeholder="smartpole serial / model"
                value={device}
                onChange={(e) => setDevice(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="principal">Principal (ZAR)</Label>
              <Input
                id="principal"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={principal}
                onChange={(e) => setPrincipal(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="termMonths">Term (months)</Label>
              <Input
                id="termMonths"
                type="number"
                min="1"
                placeholder="12"
                value={termMonths}
                onChange={(e) => setTermMonths(e.target.value)}
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
                    Creating...
                  </>
                ) : (
                  'Create contract'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-slate-900">
            Contracts
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
                  <TableHead>Device</TableHead>
                  <TableHead className="text-right">Principal</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="text-right">Outstanding</TableHead>
                  <TableHead>Term</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, idx) => {
                  const id = item.id ?? String(idx)
                  const isActive =
                    (item.status ?? '').toLowerCase() === 'active'
                  return (
                    <TableRow key={id}>
                      <TableCell className="font-mono text-xs">
                        {item.reference ?? '—'}
                      </TableCell>
                      <TableCell className="font-medium text-slate-900">
                        {item.merchant ?? '—'}
                      </TableCell>
                      <TableCell className="text-slate-700">
                        {item.deviceLabel ?? item.device ?? '—'}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(item.principalCents, item.currency)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(item.paidCents, item.currency)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(item.outstandingCents, item.currency)}
                      </TableCell>
                      <TableCell className="text-slate-700">
                        {item.termMonths ? `${item.termMonths} mo` : '—'}
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
                            !isActive ||
                            actioningId === id ||
                            toNumber(item.outstandingCents) <= 0
                          }
                          onClick={() => handlePayment(id)}
                        >
                          {actioningId === id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            'Payment'
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
