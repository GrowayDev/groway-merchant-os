/**
 * Multi-Tenant Context Service
 * Manages tenant context for all requests with automatic isolation
 */

import { cookies, headers } from 'next/headers'
import { db } from '@/lib/db'

export interface TenantContext {
  tenantId: string
  tenantSlug: string
  tenantName: string
  plan: string
  status: string
  features: string[]
  settings: Record<string, unknown>
  maxUsers: number
  maxMerchants: number
}

export interface UserContext {
  userId: string
  userType: 'consumer' | 'merchant' | 'admin' | 'agent' | 'field_sales'
  email?: string
  phone?: string
  name?: string
  roles: string[]
  permissions: string[]
  tenants: string[]
  currentTenant: TenantContext | null
}

// Application registry
export const APPLICATIONS = {
  'merchant-os': {
    name: 'Merchant OS',
    description: 'Point of Sale & Business Management',
    route: '/merchant-os/app',
    userTypes: ['merchant'],
    features: ['pos', 'inventory', 'accounting', 'customers', 'staff'],
  },
  'grosupply': {
    name: 'GroSupply',
    description: 'B2B Wholesale Marketplace',
    route: '/grosupply/marketplace',
    userTypes: ['merchant', 'agent'],
    features: ['marketplace', 'orders', 'rfq', 'suppliers'],
  },
  'field-salesforce': {
    name: 'Field Salesforce',
    description: 'Field Sales & Territory Management',
    route: '/salesforce/portal',
    userTypes: ['field_sales'],
    features: ['visits', 'leads', 'commissions', 'training'],
  },
  'agent-network': {
    name: 'Agent Network',
    description: 'Agent Commission & Referral Platform',
    route: '/agent-network/portal',
    userTypes: ['agent'],
    features: ['referrals', 'commissions', 'milestones', 'payouts'],
  },
  'consumer-wallet': {
    name: 'Consumer Wallet',
    description: 'Digital Wallet & Payments',
    route: '/consumer-wallet/app',
    userTypes: ['consumer'],
    features: ['wallet', 'payments', 'cards', 'transfers'],
  },
  'enterprise': {
    name: 'Enterprise Portal',
    description: 'Multi-location Management',
    route: '/enterprise/portal',
    userTypes: ['merchant'],
    features: ['locations', 'inventory', 'analytics', 'users'],
    requiredPlan: ['professional', 'enterprise'],
  },
  'grosell': {
    name: 'GroSell',
    description: 'E-commerce & WhatsApp Store',
    route: '/grosell/app',
    userTypes: ['merchant'],
    features: ['products', 'orders', 'customers', 'analytics'],
  },
  'admin-console': {
    name: 'Admin Console',
    description: 'Platform Administration',
    route: '/admin-console/app',
    userTypes: ['admin'],
    features: ['merchants', 'users', 'compliance', 'support'],
  },
} as const

export type ApplicationId = keyof typeof APPLICATIONS

/**
 * Get tenant context from request
 */
export async function getTenantContext(): Promise<TenantContext | null> {
  const cookieStore = await cookies()
  const headerStore = await headers()
  
  // Try to get tenant from multiple sources
  const tenantId = 
    cookieStore.get('tenant_id')?.value ||
    headerStore.get('x-tenant-id') ||
    headerStore.get('x-tenant-slug')
  
  if (!tenantId) return null
  
  try {
    const tenant = await db.platformTenant.findFirst({
      where: {
        OR: [
          { id: tenantId },
          { slug: tenantId },
          { domain: headerStore.get('host') || undefined },
        ],
        status: 'active',
      },
    })
    
    if (!tenant) return null
    
    return {
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      tenantName: tenant.name,
      plan: tenant.plan,
      status: tenant.status,
      features: tenant.features ? JSON.parse(tenant.features) : [],
      settings: tenant.settings ? JSON.parse(tenant.settings) : {},
      maxUsers: tenant.maxUsers,
      maxMerchants: tenant.maxMerchants,
    }
  } catch (error) {
    console.error('Error fetching tenant context:', error)
    return null
  }
}

/**
 * Get user context with tenant membership
 */
export async function getUserContext(): Promise<UserContext | null> {
  const cookieStore = await cookies()
  const headerStore = await headers()
  
  const sessionToken = 
    cookieStore.get('session_token')?.value ||
    headerStore.get('authorization')?.replace('Bearer ', '')
  
  if (!sessionToken) return null
  
  try {
    // Check consumer session
    const consumerSession = await db.consumerSession.findFirst({
      where: {
        refreshToken: sessionToken,
        status: 'active',
        refreshTokenExpiry: { gt: new Date() },
      },
      include: {
        ConsumerUser: true,
      },
    })
    
    if (consumerSession?.ConsumerUser) {
      const user = consumerSession.ConsumerUser
      const tenantUsers = await db.tenantUser.findMany({
        where: { userId: user.id, status: 'active' },
        include: { PlatformTenant: true },
      })
      
      const currentTenantId = cookieStore.get('tenant_id')?.value
      const currentTenantMembership = tenantUsers.find(t => t.tenantId === currentTenantId)
      
      return {
        userId: user.id,
        userType: 'consumer',
        email: user.email || undefined,
        phone: user.phone,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        roles: tenantUsers.map(t => t.role),
        permissions: tenantUsers.flatMap(t => t.permissions ? JSON.parse(t.permissions) : []),
        tenants: tenantUsers.map(t => t.tenantId),
        currentTenant: currentTenantMembership?.PlatformTenant ? {
          tenantId: currentTenantMembership.PlatformTenant.id,
          tenantSlug: currentTenantMembership.PlatformTenant.slug,
          tenantName: currentTenantMembership.PlatformTenant.name,
          plan: currentTenantMembership.PlatformTenant.plan,
          status: currentTenantMembership.PlatformTenant.status,
          features: currentTenantMembership.PlatformTenant.features ? JSON.parse(currentTenantMembership.PlatformTenant.features) : [],
          settings: currentTenantMembership.PlatformTenant.settings ? JSON.parse(currentTenantMembership.PlatformTenant.settings) : {},
          maxUsers: currentTenantMembership.PlatformTenant.maxUsers,
          maxMerchants: currentTenantMembership.PlatformTenant.maxMerchants,
        } : null,
      }
    }
    
    // Check admin session
    const adminSession = await db.adminSession.findFirst({
      where: {
        token: sessionToken,
        expiresAt: { gt: new Date() },
      },
      include: {
        AdminUser: true,
      },
    })
    
    if (adminSession?.AdminUser) {
      const user = adminSession.AdminUser
      return {
        userId: user.id,
        userType: 'admin',
        email: user.email,
        name: user.name,
        roles: [user.role],
        permissions: ['*'], // Admin has all permissions
        tenants: [],
        currentTenant: null,
      }
    }
    
    return null
  } catch (error) {
    console.error('Error fetching user context:', error)
    return null
  }
}

/**
 * Check if user has access to application
 */
export function hasApplicationAccess(
  userContext: UserContext,
  applicationId: ApplicationId
): { allowed: boolean; reason?: string } {
  const app = APPLICATIONS[applicationId]
  if (!app) {
    return { allowed: false, reason: 'Application not found' }
  }
  
  // Check user type
  if (!app.userTypes.includes(userContext.userType)) {
    return { allowed: false, reason: 'User type not authorized for this application' }
  }
  
  // Check plan requirements
  if (app.requiredPlan && userContext.currentTenant) {
    if (!app.requiredPlan.includes(userContext.currentTenant.plan)) {
      return { allowed: false, reason: 'Plan upgrade required' }
    }
  }
  
  return { allowed: true }
}

/**
 * Check if user has specific permission
 */
export function hasPermission(
  userContext: UserContext,
  permission: string
): boolean {
  if (userContext.permissions.includes('*')) return true
  if (userContext.permissions.includes(permission)) return true
  
  // Check wildcard permissions (e.g., 'pos.*' matches 'pos.sales')
  const wildcardPerms = userContext.permissions.filter(p => p.endsWith('.*'))
  for (const wild of wildcardPerms) {
    const prefix = wild.slice(0, -1) // Remove '*'
    if (permission.startsWith(prefix)) return true
  }
  
  return false
}

/**
 * Get all applications user can access
 */
export function getAccessibleApplications(
  userContext: UserContext
): Array<{ id: ApplicationId; name: string; route: string }> {
  const accessible: Array<{ id: ApplicationId; name: string; route: string }> = []
  
  for (const [id, app] of Object.entries(APPLICATIONS)) {
    const access = hasApplicationAccess(userContext, id as ApplicationId)
    if (access.allowed) {
      accessible.push({
        id: id as ApplicationId,
        name: app.name,
        route: app.route,
      })
    }
  }
  
  return accessible
}

/**
 * Set tenant context in response
 */
export function setTenantContext(tenantId: string): void {
  // This would be used in API responses to set cookies
  // In Next.js, this is done via Response cookies
}

/**
 * Tenant isolation helper - adds tenant filter to queries
 */
export function withTenantFilter<T extends Record<string, unknown>>(
  query: T,
  tenantId: string,
  tenantField: string = 'merchantId'
): T {
  return {
    ...query,
    where: {
      ...(query.where as Record<string, unknown> || {}),
      [tenantField]: tenantId,
    },
  }
}

/**
 * Create new tenant with initial setup
 */
export async function createTenant(data: {
  name: string
  slug: string
  plan?: string
  domain?: string
  features?: string[]
  settings?: Record<string, unknown>
}): Promise<{ success: boolean; tenant?: TenantContext; error?: string }> {
  try {
    // Check if slug exists
    const existing = await db.platformTenant.findUnique({
      where: { slug: data.slug },
    })
    
    if (existing) {
      return { success: false, error: 'Tenant slug already exists' }
    }
    
    // Determine limits based on plan
    const planLimits: Record<string, { users: number; merchants: number }> = {
      starter: { users: 10, merchants: 1 },
      professional: { users: 50, merchants: 5 },
      enterprise: { users: 500, merchants: 50 },
    }
    
    const limits = planLimits[data.plan || 'starter'] || planLimits.starter
    
    const tenant = await db.platformTenant.create({
      data: {
        id: `tenant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: data.name,
        slug: data.slug,
        domain: data.domain,
        plan: data.plan || 'starter',
        maxUsers: limits.users,
        maxMerchants: limits.merchants,
        features: JSON.stringify(data.features || []),
        settings: JSON.stringify(data.settings || {}),
        status: 'active',
        updatedAt: new Date(),
      },
    })
    
    return {
      success: true,
      tenant: {
        tenantId: tenant.id,
        tenantSlug: tenant.slug,
        tenantName: tenant.name,
        plan: tenant.plan,
        status: tenant.status,
        features: data.features || [],
        settings: data.settings || {},
        maxUsers: tenant.maxUsers,
        maxMerchants: tenant.maxMerchants,
      },
    }
  } catch (error) {
    console.error('Error creating tenant:', error)
    return { success: false, error: 'Failed to create tenant' }
  }
}

/**
 * Add user to tenant
 */
export async function addUserToTenant(data: {
  tenantId: string
  userId: string
  userType: 'consumer' | 'merchant' | 'admin' | 'agent' | 'field_sales'
  role?: string
  permissions?: string[]
  invitedBy?: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    // Check tenant exists and is active
    const tenant = await db.platformTenant.findFirst({
      where: { id: data.tenantId, status: 'active' },
    })
    
    if (!tenant) {
      return { success: false, error: 'Tenant not found or inactive' }
    }
    
    // Check user limit
    const currentUsers = await db.tenantUser.count({
      where: { tenantId: data.tenantId, status: 'active' },
    })
    
    if (currentUsers >= tenant.maxUsers) {
      return { success: false, error: 'Tenant user limit reached' }
    }
    
    // Check if already a member
    const existing = await db.tenantUser.findUnique({
      where: {
        tenantId_userId: {
          tenantId: data.tenantId,
          userId: data.userId,
        },
      },
    })
    
    if (existing) {
      // Update existing membership
      await db.tenantUser.update({
        where: { id: existing.id },
        data: {
          status: 'active',
          role: data.role || existing.role,
          permissions: data.permissions ? JSON.stringify(data.permissions) : existing.permissions,
          acceptedAt: new Date(),
          updatedAt: new Date(),
        },
      })
    } else {
      // Create new membership
      await db.tenantUser.create({
        data: {
          id: `tu_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          tenantId: data.tenantId,
          userId: data.userId,
          userType: data.userType,
          role: data.role || 'member',
          permissions: data.permissions ? JSON.stringify(data.permissions) : null,
          status: 'active',
          invitedBy: data.invitedBy,
          invitedAt: new Date(),
          acceptedAt: new Date(),
          updatedAt: new Date(),
        },
      })
    }
    
    return { success: true }
  } catch (error) {
    console.error('Error adding user to tenant:', error)
    return { success: false, error: 'Failed to add user to tenant' }
  }
}
