'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
import { ShieldCheck, Loader2 } from 'lucide-react'
import { apiGet, apiPost, formatTime } from '../lib/api'

interface ConsentRecord {
  id?: string
  consumer?: string
  consumerName?: string
  purpose?: string
  scope?: string
  status?: string
  grantedAt?: string
  expiresAt?: string
}

interface ConsentPayload {
  consents?: ConsentRecord[]
}

export function ConsentView() {
  const [items, setItems] = useState<ConsentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actioningId, setActioningId] = useState<string | null>(null)

  const reload = () => {
    setLoading(true)
    apiGet<ConsentPayload>('/consent')
      .then((payload) => {
        setItems(payload?.consents ?? [])
        setError(null)
      })
      .catch((err: unknown) => {
        console.warn('Consent load failed:', err)
        setError('Unable to load consents right now.')
        setItems([])
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    reload()
  }, [])

  const handleAction = async (
    id: string,
    action: 'grant' | 'revoke'
  ) => {
    setActioningId(id)
    try {
      await apiPost(`/consent/${id}/${action}`, {})
      toast.success(`Consent ${action}ed`)
      reload()
    } catch (err) {
      console.error('Consent action failed:', err)
      toast.error(`Failed to ${action} consent`)
    } finally {
      setActioningId(null)
    }
  }

  const statusBadge = (status?: string) => {
    if (!status) return null
    const lower = status.toLowerCase()
    const variant =
      lower === 'granted' || lower === 'active'
        ? 'bg-[#0F766E] text-white hover:bg-[#0F766E]'
        : lower === 'revoked' || lower === 'expired'
        ? 'bg-red-600 text-white hover:bg-red-600'
        : 'bg-slate-200 text-slate-700 hover:bg-slate-200'
    return <Badge className={variant}>{status}</Badge>
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Consent</h2>
        <p className="text-sm text-slate-600">
          Consumer consents for decisioning and data processing. POPIA-aligned.
        </p>
      </div>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <ShieldCheck className="h-4 w-4 text-[#0F766E]" />
            Consents
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
                  <TableHead>Consumer</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead>Scope</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Granted</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, idx) => {
                  const id = item.id ?? String(idx)
                  const isActive =
                    (item.status ?? '').toLowerCase() === 'granted' ||
                    (item.status ?? '').toLowerCase() === 'active'
                  return (
                    <TableRow key={id}>
                      <TableCell className="font-medium text-slate-900">
                        {item.consumerName ?? item.consumer ?? '—'}
                      </TableCell>
                      <TableCell className="text-slate-700">
                        {item.purpose ?? '—'}
                      </TableCell>
                      <TableCell className="text-slate-700">
                        {item.scope ?? '—'}
                      </TableCell>
                      <TableCell>{statusBadge(item.status)}</TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {formatTime(item.grantedAt)}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {formatTime(item.expiresAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 border-slate-300 text-slate-700 hover:bg-slate-50"
                            disabled={isActive || actioningId === id}
                            onClick={() => handleAction(id, 'grant')}
                          >
                            {actioningId === id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              'Grant'
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 border-red-300 text-red-600 hover:bg-red-50"
                            disabled={!isActive || actioningId === id}
                            onClick={() => handleAction(id, 'revoke')}
                          >
                            Revoke
                          </Button>
                        </div>
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
