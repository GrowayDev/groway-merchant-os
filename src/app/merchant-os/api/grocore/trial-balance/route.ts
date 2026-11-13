import { NextRequest } from 'next/server'
import { getRepository, trialBalance } from '@/lib/grocore'
import { getTenantId, handleError, ok } from '../_helpers'

export async function GET(request: NextRequest) {
  try {
    const tenantId = getTenantId(request)
    const accounts = await getRepository().listAccounts(tenantId)
    const allLines: any[] = []
    for (const acc of accounts) { const lines = await getRepository().listLinesForAccount(tenantId, acc.id); allLines.push(...lines) }
    const rows = trialBalance(accounts, allLines)
    return ok({ rows })
  } catch (e) { return handleError(e) }
}
