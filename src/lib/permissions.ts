/**
 * Role-Based Permissions System for Merchant OS
 * 
 * Permissions are organized by role with granular control
 * Owner has all permissions, others inherit based on role
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Permission types
export type Permission = 
  // Pricing permissions
  | 'can_edit_prices'
  | 'can_view_pricing'
  | 'can_approve_price_changes'
  
  // Reports & Analytics
  | 'can_view_reports'
  | 'can_view_sales_reports'
  | 'can_view_inventory_reports'
  | 'can_view_financial_reports'
  | 'can_export_reports'
  
  // Supplier Management (GroSupply)
  | 'can_manage_suppliers'
  | 'can_create_rfq'
  | 'can_approve_purchase_orders'
  | 'can_receive_goods'
  
  // Inventory
  | 'can_edit_inventory'
  | 'can_adjust_stock'
  | 'can_view_inventory'
  
  // Staff Management
  | 'can_manage_staff'
  | 'can_view_staff'
  
  // Settings
  | 'can_edit_settings'
  | 'can_view_settings'
  
  // Sales/POS
  | 'can_process_sales'
  | 'can_void_sales'
  | 'can_apply_discounts'
  | 'can_refund'

// Role-based default permissions
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  owner: [
    // Full access
    'can_edit_prices',
    'can_view_pricing',
    'can_approve_price_changes',
    'can_view_reports',
    'can_view_sales_reports',
    'can_view_inventory_reports',
    'can_view_financial_reports',
    'can_export_reports',
    'can_manage_suppliers',
    'can_create_rfq',
    'can_approve_purchase_orders',
    'can_receive_goods',
    'can_edit_inventory',
    'can_adjust_stock',
    'can_view_inventory',
    'can_manage_staff',
    'can_view_staff',
    'can_edit_settings',
    'can_view_settings',
    'can_process_sales',
    'can_void_sales',
    'can_apply_discounts',
    'can_refund',
  ],
  admin: [
    // Almost full access except some financial
    'can_edit_prices',
    'can_view_pricing',
    'can_approve_price_changes',
    'can_view_reports',
    'can_view_sales_reports',
    'can_view_inventory_reports',
    'can_view_financial_reports',
    'can_export_reports',
    'can_manage_suppliers',
    'can_create_rfq',
    'can_approve_purchase_orders',
    'can_receive_goods',
    'can_edit_inventory',
    'can_adjust_stock',
    'can_view_inventory',
    'can_manage_staff',
    'can_view_staff',
    'can_edit_settings',
    'can_view_settings',
    'can_process_sales',
    'can_void_sales',
    'can_apply_discounts',
    'can_refund',
  ],
  manager: [
    // Operational access
    'can_edit_prices',
    'can_view_pricing',
    'can_view_reports',
    'can_view_sales_reports',
    'can_view_inventory_reports',
    'can_export_reports',
    'can_create_rfq',
    'can_receive_goods',
    'can_edit_inventory',
    'can_adjust_stock',
    'can_view_inventory',
    'can_view_staff',
    'can_view_settings',
    'can_process_sales',
    'can_void_sales',
    'can_apply_discounts',
    'can_refund',
  ],
  cashier: [
    // Sales-focused
    'can_view_pricing',
    'can_view_inventory',
    'can_process_sales',
    'can_apply_discounts',
  ],
  staff: [
    // Basic access
    'can_view_inventory',
    'can_process_sales',
  ],
}

// Get session from request
export async function getSession(request: NextRequest) {
  const sessionToken = request.cookies.get('groway_session')?.value
  if (!sessionToken) return null
  
  try {
    return await db.merchantSession.findFirst({
      where: { 
        token: sessionToken,
        expiresAt: { gt: new Date() }
      },
      include: { 
        user: true, 
        merchant: true,
      },
    })
  } catch {
    return null
  }
}

// Get user's role and permissions for a merchant
export async function getUserPermissions(userId: string, merchantId: string): Promise<{
  role: string
  permissions: Permission[]
  customPermissions?: Permission[]
}> {
  const merchantUser = await db.merchantUser.findUnique({
    where: {
      merchantId_userId: {
        merchantId,
        userId,
      },
    },
  })

  if (!merchantUser) {
    return { role: 'staff', permissions: ROLE_PERMISSIONS.staff }
  }

  const role = merchantUser.role
  const basePermissions = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.staff
  
  // Parse custom permissions if set
  let customPermissions: Permission[] = []
  if (merchantUser.permissions) {
    try {
      customPermissions = JSON.parse(merchantUser.permissions)
    } catch {
      // Invalid JSON, ignore
    }
  }

  // Merge base permissions with custom additions
  const allPermissions = [...new Set([...basePermissions, ...customPermissions])]

  return {
    role,
    permissions: allPermissions,
    customPermissions,
  }
}

// Check if user has a specific permission
export function hasPermission(userPermissions: Permission[], permission: Permission): boolean {
  return userPermissions.includes(permission)
}

// Check multiple permissions (any of them)
export function hasAnyPermission(userPermissions: Permission[], permissions: Permission[]): boolean {
  return permissions.some(p => userPermissions.includes(p))
}

// Check multiple permissions (all of them)
export function hasAllPermissions(userPermissions: Permission[], permissions: Permission[]): boolean {
  return permissions.every(p => userPermissions.includes(p))
}

// Middleware factory for API routes
export function withPermission(permission: Permission) {
  return async function(
    request: NextRequest,
    handler: (request: NextRequest, context: { session: NonNullable<Awaited<ReturnType<typeof getSession>>>; permissions: Permission[]; role: string }) => Promise<NextResponse>
  ) {
    const session = await getSession(request)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { permissions, role } = await getUserPermissions(session.userId, session.merchantId)
    
    if (!hasPermission(permissions, permission)) {
      return NextResponse.json(
        { error: 'Forbidden', message: `Missing required permission: ${permission}` },
        { status: 403 }
      )
    }

    return handler(request, { session, permissions, role })
  }
}

// Middleware for multiple permissions
export function withPermissions(requiredPermissions: Permission[], requireAll = false) {
  return async function(
    request: NextRequest,
    handler: (request: NextRequest, context: { session: NonNullable<Awaited<ReturnType<typeof getSession>>>; permissions: Permission[]; role: string }) => Promise<NextResponse>
  ) {
    const session = await getSession(request)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { permissions, role } = await getUserPermissions(session.userId, session.merchantId)
    
    const hasAccess = requireAll
      ? hasAllPermissions(permissions, requiredPermissions)
      : hasAnyPermission(permissions, requiredPermissions)
    
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Forbidden', message: `Missing required permissions: ${requiredPermissions.join(', ')}` },
        { status: 403 }
      )
    }

    return handler(request, { session, permissions, role })
  }
}

// Quick permission check for use in API routes
export async function checkPermission(request: NextRequest, permission: Permission): Promise<{
  allowed: boolean
  session?: Awaited<ReturnType<typeof getSession>>
  permissions?: Permission[]
  role?: string
  error?: NextResponse
}> {
  const session = await getSession(request)
  
  if (!session) {
    return {
      allowed: false,
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }

  const { permissions, role } = await getUserPermissions(session.userId, session.merchantId)
  
  if (!hasPermission(permissions, permission)) {
    return {
      allowed: false,
      session,
      permissions,
      role,
      error: NextResponse.json(
        { error: 'Forbidden', message: `Missing required permission: ${permission}` },
        { status: 403 }
      ),
    }
  }

  return {
    allowed: true,
    session,
    permissions,
    role,
  }
}

// Audit log entry
export async function logPermissionAction(
  merchantId: string,
  userId: string,
  action: string,
  details: Record<string, unknown>
) {
  try {
    // Could log to a dedicated audit table or external service
    console.log(`[AUDIT] Merchant: ${merchantId}, User: ${userId}, Action: ${action}`, details)
  } catch (error) {
    console.error('Failed to log audit action:', error)
  }
}
