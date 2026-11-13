import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserId, ok, error, serialize } from '../_lib/helpers'

/**
 * /api/consumer/export
 *
 * Exports the user's transactions as CSV (or a text-based statement when
 * PDF is requested — real PDF generation is intentionally out of scope).
 *
 * Query params:
 *   - format: csv | pdf  (default csv; pdf falls back to CSV with a note)
 *   - from: ISO date string (optional)
 *   - to:   ISO date string (optional)
 *   - type: transactionType filter (optional)
 */

function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) return ''
  const str = typeof value === 'bigint' ? value.toString() : String(value)
  // Quote if it contains commas, quotes or newlines
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function toCsv(
  rows: Array<Record<string, unknown>>,
  columns: Array<{ key: string; header: string }>,
): string {
  const headerLine = columns.map((c) => escapeCsv(c.header)).join(',')
  const dataLines = rows.map((row) =>
    columns.map((c) => escapeCsv(row[c.key])).join(','),
  )
  return [headerLine, ...dataLines].join('\n')
}

export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request)
    const { searchParams } = new URL(request.url)
    const format = (searchParams.get('format') || 'csv').toLowerCase()
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const type = searchParams.get('type')

    const where: Record<string, unknown> = { userId }
    if (type) where.transactionType = type
    if (from || to) {
      const createdAt: Record<string, Date> = {}
      if (from) createdAt.gte = new Date(from)
      if (to) createdAt.lte = new Date(to)
      where.createdAt = createdAt
    }

    const transactions = await db.consumerTransaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 5000,
    })

    const columns = [
      { key: 'id', header: 'ID' },
      { key: 'createdAt', header: 'Date' },
      { key: 'transactionType', header: 'Type' },
      { key: 'direction', header: 'Direction' },
      { key: 'amountCents', header: 'Amount (cents)' },
      { key: 'feeCents', header: 'Fee (cents)' },
      { key: 'netAmountCents', header: 'Net (cents)' },
      { key: 'currency', header: 'Currency' },
      { key: 'status', header: 'Status' },
      { key: 'description', header: 'Description' },
      { key: 'reference', header: 'Reference' },
      { key: 'category', header: 'Category' },
      { key: 'counterpartyName', header: 'Counterparty' },
      { key: 'counterpartyType', header: 'Counterparty Type' },
      { key: 'paymentMethod', header: 'Payment Method' },
    ]

    const rows = transactions.map((tx) =>
      serialize({
        id: tx.id,
        createdAt: tx.createdAt,
        transactionType: tx.transactionType,
        direction: tx.direction,
        amountCents: tx.amountCents,
        feeCents: tx.feeCents,
        netAmountCents: tx.netAmountCents,
        currency: tx.currency,
        status: tx.status,
        description: tx.description,
        reference: tx.reference,
        category: tx.category,
        counterpartyName: tx.counterpartyName,
        counterpartyType: tx.counterpartyType,
        paymentMethod: tx.paymentMethod,
      }) as Record<string, unknown>,
    )

    const csv = toCsv(rows, columns)

    if (format === 'pdf') {
      // Real PDF generation is out of scope here — return CSV with a note.
      const note =
        '# Groway Wallet Statement\n' +
        '# Note: PDF rendering is coming soon. This is a CSV-formatted statement.\n' +
        `# User: ${userId}\n` +
        `# Generated: ${new Date().toISOString()}\n` +
        (from || to ? `# Period: ${from || 'start'} to ${to || 'now'}\n` : '') +
        '\n'
      return new NextResponse(note + csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Disposition': `attachment; filename="groway-statement-${userId}.txt"`,
        },
      })
    }

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="groway-transactions-${userId}.csv"`,
      },
    })
  } catch (err) {
    console.error('Export transactions error:', err)
    return error('Failed to export transactions', 500)
  }
}
