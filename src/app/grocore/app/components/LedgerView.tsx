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
import { BookOpen, Loader2 } from 'lucide-react'
import { apiGet, apiPost, formatMoney, toNumber } from '../lib/api'

interface TrialBalanceRow {
  account?: string
  accountCode?: string
  debit?: string | number | null
  credit?: string | number | null
}

interface LedgerEntry {
  id?: string
  reference?: string
  description?: string
  account?: string
  debit?: string | number | null
  credit?: string | number | null
  currency?: string
  createdAt?: string
}

interface LedgerPayload {
  trialBalance?: TrialBalanceRow[]
  entries?: LedgerEntry[]
}

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

export function LedgerView() {
  const [data, setData] = useState<LedgerPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [reference, setReference] = useState('')
  const [description, setDescription] = useState('')
  const [debitAccount, setDebitAccount] = useState('')
  const [creditAccount, setCreditAccount] = useState('')
  const [amountCents, setAmountCents] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const reload = () => {
    setLoading(true)
    apiGet<LedgerPayload>('/ledger')
      .then((payload) => {
        setData(payload)
        setError(null)
      })
      .catch((err: unknown) => {
        console.warn('Ledger load failed:', err)
        setError('Unable to load ledger right now.')
        setData(null)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    reload()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!debitAccount || !creditAccount || !amountCents) {
      toast.error('Debit account, credit account, and amount are required')
      return
    }
    if (debitAccount === creditAccount) {
      toast.error('Debit and credit accounts must differ')
      return
    }
    const cents = Math.round(Number(amountCents) * 100)
    if (Number.isNaN(cents) || cents <= 0) {
      toast.error('Amount must be a positive number')
      return
    }

    setSubmitting(true)
    try {
      await apiPost('/ledger/entries', {
        reference: reference || undefined,
        description: description || undefined,
        debitAccount,
        creditAccount,
        amountCents: String(cents),
        currency: 'ZAR',
      })
      toast.success('Balanced entry posted')
      setReference('')
      setDescription('')
      setDebitAccount('')
      setCreditAccount('')
      setAmountCents('')
      reload()
    } catch (err) {
      console.error('Post entry failed:', err)
      toast.error('Failed to post entry')
    } finally {
      setSubmitting(false)
    }
  }

  const trialBalance = data?.trialBalance ?? []
  const entries = data?.entries ?? []
  const totalDebit = trialBalance.reduce(
    (sum, r) => sum + toNumber(r.debit),
    0
  )
  const totalCredit = trialBalance.reduce(
    (sum, r) => sum + toNumber(r.credit),
    0
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Ledger</h2>
        <p className="text-sm text-slate-600">
          Double-entry trial balance and recent postings. Every entry must
          balance.
        </p>
      </div>

      {/* Trial balance */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <BookOpen className="h-4 w-4 text-[#0F766E]" />
            Trial balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-full" />
              ))}
            </div>
          ) : error ? (
            <p className="py-8 text-center text-sm text-slate-500">{error}</p>
          ) : trialBalance.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              No items yet
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account</TableHead>
                  <TableHead className="text-right">Debit</TableHead>
                  <TableHead className="text-right">Credit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trialBalance.map((row, idx) => (
                  <TableRow key={row.accountCode ?? row.account ?? idx}>
                    <TableCell className="font-medium text-slate-900">
                      {row.account ?? row.accountCode ?? '—'}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {toNumber(row.debit) > 0
                        ? formatMoney(row.debit)
                        : '—'}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {toNumber(row.credit) > 0
                        ? formatMoney(row.credit)
                        : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <tfoot>
                <tr className="border-t font-medium">
                  <td className="p-2 text-slate-900">Totals</td>
                  <td className="p-2 text-right tabular-nums text-slate-900">
                    {formatMoney(totalDebit)}
                  </td>
                  <td className="p-2 text-right tabular-nums text-slate-900">
                    {formatMoney(totalCredit)}
                  </td>
                </tr>
              </tfoot>
            </Table>
          )}
          {!loading && !error && trialBalance.length > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <Badge
                className={
                  totalDebit === totalCredit
                    ? 'bg-[#0F766E] text-white hover:bg-[#0F766E]'
                    : 'bg-red-600 text-white hover:bg-red-600'
                }
              >
                {totalDebit === totalCredit ? 'Balanced' : 'Out of balance'}
              </Badge>
              <span className="text-xs text-slate-500">
                Debits must equal credits.
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent entries */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-slate-900">
            Recent entries
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-full" />
              ))}
            </div>
          ) : error ? (
            <p className="py-8 text-center text-sm text-slate-500">{error}</p>
          ) : entries.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              No items yet
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead className="text-right">Debit</TableHead>
                  <TableHead className="text-right">Credit</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry, idx) => (
                  <TableRow key={entry.id ?? idx}>
                    <TableCell className="font-mono text-xs">
                      {entry.reference ?? '—'}
                    </TableCell>
                    <TableCell className="text-slate-700">
                      {entry.description ?? '—'}
                    </TableCell>
                    <TableCell className="text-slate-700">
                      {entry.account ?? '—'}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {toNumber(entry.debit) > 0
                        ? formatMoney(entry.debit, entry.currency)
                        : '—'}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {toNumber(entry.credit) > 0
                        ? formatMoney(entry.credit, entry.currency)
                        : '—'}
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">
                      {formatTime(entry.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Post balanced entry */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-slate-900">
            Post balanced entry
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="reference">Reference</Label>
              <Input
                id="reference"
                placeholder="e.g. INV-2026-0001"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="What is this entry for?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="debitAccount">Debit account</Label>
              <Input
                id="debitAccount"
                placeholder="e.g. 1000:Cash"
                value={debitAccount}
                onChange={(e) => setDebitAccount(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="creditAccount">Credit account</Label>
              <Input
                id="creditAccount"
                placeholder="e.g. 4000:Revenue"
                value={creditAccount}
                onChange={(e) => setCreditAccount(e.target.value)}
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
                value={amountCents}
                onChange={(e) => setAmountCents(e.target.value)}
                required
              />
            </div>
            <div className="flex items-end">
              <Button
                type="submit"
                className="w-full bg-[#0F766E] text-white hover:bg-[#0F6258]"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Posting...
                  </>
                ) : (
                  'Post entry'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
