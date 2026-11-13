import { GroCoreError } from './errors'
export interface TenantContext { tenantId: string; merchantId?: string; actorId?: string; isAdmin?: boolean }
export function requireTenant(ctx: TenantContext | null | undefined): TenantContext {
  if (!ctx || !ctx.tenantId) throw new GroCoreError('TENANT_MISMATCH', 'Tenant context is required')
  return ctx
}
