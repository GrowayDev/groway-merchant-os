import { NextRequest } from 'next/server'
import { randomUUID } from 'crypto'
import { getRepository, GroCoreError } from '@/lib/grocore'
import { getTenantId, handleError, ok } from '../_helpers'

export async function GET(request: NextRequest) {
  try {
    const tenantId = getTenantId(request)
    const accounts = await getRepository().listAccounts(tenantId)
    return ok({ items: accounts, count: accounts.length })
  } catch (e) { return handleError(e) }
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = getTenantId(request)
    const body = await request.json()
    if (!body.code) throw new GroCoreError('VALIDATION_ERROR', 'code is required')
    if (!body.name) throw new GroCoreError('VALIDATION_ERROR', 'name is required')
    if (!body.kind) throw new GroCoreError('VALIDATION_ERROR', 'kind is required')
    const account = {
      id: body.id || `acc-${randomUUID()}`, tenantId, code: body.code, name: body.name,
      kind: body.kind, subKind: body.subKind || 'cash', currency: body.currency || 'ZAR',
      active: body.active !== false, metaJson: body.metaJson,
    }
    const saved = await getRepository().upsertAccount(account)
    return ok(saved, 201)
  } catch (e) { return handleError(e) }
}
