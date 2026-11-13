import { NextRequest } from 'next/server'
import { getRepository, GroCoreError, validateBalanced, debit, credit } from '@/lib/grocore'
import { getTenantId, handleError, ok, parseMoney } from '../_helpers'

export async function GET(request: NextRequest) {
  try {
    const tenantId = getTenantId(request)
    const entries = await getRepository().listEntries(tenantId)
    return ok({ items: entries, count: entries.length })
  } catch (e) { return handleError(e) }
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = getTenantId(request)
    const body = await request.json()
    if (!body.entryId) throw new GroCoreError('VALIDATION_ERROR', 'entryId is required')
    if (!body.description) throw new GroCoreError('VALIDATION_ERROR', 'description is required')
    if (!body.lines || !Array.isArray(body.lines) || body.lines.length < 2) throw new GroCoreError('VALIDATION_ERROR', 'At least 2 lines required')
    const lines = body.lines.map((l: any) => {
      const amount = parseMoney(l.amount || { cents: l.debit || l.credit, currency: l.currency || 'ZAR' })
      const isDebit = l.debit !== undefined && l.debit !== '0' && l.debit !== 0
      const isCredit = l.credit !== undefined && l.credit !== '0' && l.credit !== 0
      return { accountCode: l.accountCode, amount: isDebit ? debit({ cents: amount.cents, currency: amount.currency as any }) : credit({ cents: amount.cents, currency: amount.currency as any }) }
    })
    const entryInput = { tenantId, entryId: body.entryId, sourceType: body.sourceType || 'manual', sourceId: body.sourceId || `src-${Date.now()}`, description: body.description, lines }
    validateBalanced(entryInput)
    const accountCodes = [...new Set(lines.map((l: any) => l.accountCode))]
    const accounts = await Promise.all(accountCodes.map((code: string) => getRepository().getAccount(tenantId, code)))
    const accountMap = new Map(accountCodes.map((code, i) => [code, accounts[i]]))
    for (const [code, acc] of accountMap) { if (!acc) throw new GroCoreError('LEDGER_ACCOUNT_NOT_FOUND', `Account ${code} not found`) }
    const dbLines = lines.map((l: any) => ({ accountId: accountMap.get(l.accountCode)!.id, amountCents: l.amount.signedCents, currency: l.amount.currency }))
    const result = await getRepository().postEntry(entryInput, dbLines)
    return ok(result, 201)
  } catch (e) { return handleError(e) }
}
