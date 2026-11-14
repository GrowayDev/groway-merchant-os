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
import { Grid3x3, Loader2 } from 'lucide-react'
import { apiGet, apiPost, formatMoney, toNumber } from '../lib/api'

interface CapitalSource {
  id?: string
  name?: string
  type?: string
  currency?: string
  allocatedCents?: string | number | null
  availableCents?: string | number | null
  costRate?: string | number | null
}

interface CapitalSummary {
  totalAllocatedCents?: string | number | null
  totalAvailableCents?: string | number | null
  sourcesCount?: number
}

interface CapitalPayload {
  summary?: CapitalSummary
  sources?: CapitalSource[]
}

const summaryCards: ReadonlyArray<{
  key: keyof CapitalSummary
  label: string
  isMoney: boolean
}> = [
  { key: 'totalAllocatedCents', label: 'Total allocated', isMoney: true },
  { key: 'totalAvailableCents', label: 'Total available', isMoney: true },
  { key: 'sourcesCount', label: 'Sources', isMoney: false },
]

export function CapitalGridView() {
  const [data, setData] = useState<CapitalPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Create form
  const [name, setName] = useState('')
  const [type, setType] = useState('own')
  const [currency, setCurrency] = useState('ZAR')
  const [amount, setAmount] = useState('')
  const [creating, setCreating] = useState(false)

  // Allocate form
  const [sourceId, setSourceId] = useState('')
  const [purpose, setPurpose] = useState('')
  const [allocateAmount, setAllocateAmount] = useState('')
  const [allocating, setAllocating] = useState(false)

  const reload = () => {
    setLoading(true)
    apiGet<CapitalPayload>('/capital')
      .then((payload) => {
        setData(payload)
        setError(null)
      })
      .catch((err: unknown) => {
        console.warn('Capital load failed:', err)
        setError('Unable to load capital grid right now.')
        setData(null)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    reload()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !amount) {
      toast.error('Name and amount are required')
      return
    }
    const cents = Math.round(Number(amount) * 100)
    if (Number.isNaN(cents) || cents <= 0) {
      toast.error('Amount must be a positive number')
      return
    }
    setCreating(true)
    try {
      await apiPost('/capital/sources', {
        name,
        type,
        currency,
        amountCents: String(cents),
      })
      toast.success('Capital source created')
      setName('')
      setAmount('')
      reload()
    } catch (err) {
      console.error('Create source failed:', err)
      toast.error('Failed to create source')
    } finally {
      setCreating(false)
    }
  }

  const handleAllocate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sourceId || !allocateAmount) {
      toast.error('Source and amount are required')
      return
    }
    const cents = Math.round(Number(allocateAmount) * 100)
    if (Number.isNaN(cents) || cents <= 0) {
      toast.error('Amount must be a positive number')
      return
    }
    setAllocating(true)
    try {
      await apiPost(`/capital/sources/${sourceId}/allocate`, {
        amountCents: String(cents),
        currency,
        purpose: purpose || undefined,
      })
      toast.success('Capital allocated')
      setSourceId('')
      setPurpose('')
      setAllocateAmount('')
      reload()
    } catch (err) {
      console.error('Allocate capital failed:', err)
      toast.error('Failed to allocate capital')
    } finally {
      setAllocating(false)
    }
  }

  const summary = data?.summary ?? {}
  const sources = data?.sources ?? []

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Capital grid</h2>
        <p className="text-sm text-slate-600">
          Multi-source capital pool. Own funds, partner facilities, donor
          grants — allocated by cost and risk band.
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {summaryCards.map((card) => (
          <Card key={card.key} className="border-slate-200">
            <CardContent className="p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {card.label}
              </p>
              {loading ? (
                <Skeleton className="mt-3 h-7 w-28" />
              ) : (
                <p className="mt-3 text-2xl font-bold text-slate-900">
                  {card.isMoney
                    ? formatMoney(summary[card.key])
                    : new Intl.NumberFormat('en-ZA').format(
                        toNumber(summary[card.key])
                      )}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Sources table */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <Grid3x3 className="h-4 w-4 text-[#0F766E]" />
            Capital sources
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
          ) : sources.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              No items yet
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead className="text-right">Allocated</TableHead>
                  <TableHead className="text-right">Available</TableHead>
                  <TableHead className="text-right">Cost rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sources.map((src, idx) => (
                  <TableRow key={src.id ?? idx}>
                    <TableCell className="font-medium text-slate-900">
                      {src.name ?? '—'}
                    </TableCell>
                    <TableCell>
                      {src.type ? (
                        <Badge
                          variant="outline"
                          className="border-slate-300 text-slate-700"
                        >
                          {src.type}
                        </Badge>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell className="text-slate-700">
                      {src.currency ?? '—'}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(src.allocatedCents, src.currency)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(src.availableCents, src.currency)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-slate-700">
                      {src.costRate !== null && src.costRate !== undefined
                        ? `${Number(src.costRate).toFixed(2)}%`
                        : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create + Allocate */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-900">
              Create capital source
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="e.g. Own funds"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Input
                    id="type"
                    placeholder="own | partner | grant"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Input
                    id="currency"
                    placeholder="ZAR | MWK"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
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
              <Button
                type="submit"
                className="bg-[#0F766E] text-white hover:bg-[#0F6258]"
                disabled={creating}
              >
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create source'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-900">
              Allocate capital
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAllocate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sourceId">Source ID</Label>
                <Input
                  id="sourceId"
                  placeholder="source id"
                  value={sourceId}
                  onChange={(e) => setSourceId(e.target.value)}
                  list="capital-sources"
                  required
                />
                <datalist id="capital-sources">
                  {sources.map((s, idx) => (
                    <option
                      key={s.id ?? idx}
                      value={s.id ?? ''}
                    >
                      {s.name ?? 'Source'}
                    </option>
                  ))}
                </datalist>
              </div>
              <div className="space-y-2">
                <Label htmlFor="purpose">Purpose</Label>
                <Input
                  id="purpose"
                  placeholder="advances | device | vouchers"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="allocateAmount">Amount ({currency})</Label>
                <Input
                  id="allocateAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={allocateAmount}
                  onChange={(e) => setAllocateAmount(e.target.value)}
                  required
                />
              </div>
              <Button
                type="submit"
                variant="outline"
                className="border-[#0F766E] text-[#0F766E] hover:bg-[#F0FDFA]"
                disabled={allocating}
              >
                {allocating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Allocating...
                  </>
                ) : (
                  'Allocate'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
