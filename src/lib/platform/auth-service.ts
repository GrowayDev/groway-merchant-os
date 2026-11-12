/**
 * Platform Authentication Service
 * Unified authentication across all applications with SSO support
 */

import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { createTenant, addUserToTenant, type TenantContext } from './tenant-context'

export interface AuthResult {
  success: boolean
  user?: {
    id: string
    type: 'consumer' | 'merchant' | 'admin' | 'agent' | 'field_sales'
    email?: string
    phone?: string
    name: string
  }
  tenant?: TenantContext
  token?: string
  error?: string
  requiresMFA?: boolean
  requiresKYC?: boolean
}

export interface RegisterResult {
  success: boolean
  user?: {
    id: string
    type: 'consumer' | 'merchant'
    email?: string
    phone: string
    name: string
  }
  tenant?: TenantContext
  error?: string
}

export interface PlatformUser {
  id: string
  type: 'consumer' | 'merchant' | 'admin' | 'agent' | 'field_sales'
  email?: string
  phone?: string
  firstName?: string
  lastName?: string
  status: string
  kycStatus?: string
  createdAt: Date
  lastLoginAt?: Date
}

// Session configuration
const SESSION_CONFIG = {
  consumer: {
    duration: 30 * 24 * 60 * 60 * 1000, // 30 days
    refreshThreshold: 7 * 24 * 60 * 60 * 1000, // Refresh if < 7 days left
  },
  merchant: {
    duration: 7 * 24 * 60 * 60 * 1000, // 7 days
    refreshThreshold: 2 * 24 * 60 * 60 * 1000, // Refresh if < 2 days left
  },
  admin: {
    duration: 8 * 60 * 60 * 1000, // 8 hours
    refreshThreshold: 2 * 60 * 60 * 1000, // Refresh if < 2 hours left
  },
  agent: {
    duration: 7 * 24 * 60 * 60 * 1000, // 7 days
    refreshThreshold: 2 * 24 * 60 * 60 * 1000, // Refresh if < 2 days left
  },
  field_sales: {
    duration: 7 * 24 * 60 * 60 * 1000, // 7 days
    refreshThreshold: 2 * 24 * 60 * 60 * 1000, // Refresh if < 2 days left
  },
}

/**
 * Generate secure session token
 */
function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let token = ''
  for (let i = 0; i < 64; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return token
}

/**
 * Generate unique ID
 */
function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Hash password (simplified - use bcrypt in production)
 */
async function hashPassword(password: string): Promise<string> {
  // In production, use bcrypt or argon2
  const encoder = new TextEncoder()
  const data = encoder.encode(password + 'salt_' + Date.now())
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Verify password
 */
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  // Simplified - in production use bcrypt.compare
  return password.length >= 4 // For demo purposes
}

/**
 * Login consumer user
 */
export async function loginConsumer(phone: string, pin: string): Promise<AuthResult> {
  try {
    const user = await db.consumerUser.findUnique({
      where: { phone },
    })
    
    if (!user) {
      return { success: false, error: 'User not found' }
    }
    
    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return { success: false, error: 'Account temporarily locked. Try again later.' }
    }
    
    // Verify PIN (simplified)
    if (!await verifyPassword(pin, user.pinHash || '')) {
      // Increment failed attempts
      await db.consumerUser.update({
        where: { id: user.id },
        data: {
          failedPinAttempts: (user.failedPinAttempts || 0) + 1,
          lockedUntil: (user.failedPinAttempts || 0) >= 4 ? new Date(Date.now() + 30 * 60 * 1000) : null, // Lock for 30 mins after 5 attempts
        },
      })
      return { success: false, error: 'Invalid PIN' }
    }
    
    // Reset failed attempts
    await db.consumerUser.update({
      where: { id: user.id },
      data: {
        failedPinAttempts: 0,
        lockedUntil: null,
      },
    })
    
    // Create session
    const token = generateToken()
    const expiresAt = new Date(Date.now() + SESSION_CONFIG.consumer.duration)
    
    await db.consumerSession.create({
      data: {
        id: generateId('session'),
        userId: user.id,
        refreshToken: token,
        refreshTokenExpiry: expiresAt,
        status: 'active',
      },
    })
    
    // Get tenant context
    const tenantUser = await db.tenantUser.findFirst({
      where: { userId: user.id, status: 'active' },
      include: { PlatformTenant: true },
    })
    
    let tenant: TenantContext | undefined
    if (tenantUser?.PlatformTenant) {
      tenant = {
        tenantId: tenantUser.PlatformTenant.id,
        tenantSlug: tenantUser.PlatformTenant.slug,
        tenantName: tenantUser.PlatformTenant.name,
        plan: tenantUser.PlatformTenant.plan,
        status: tenantUser.PlatformTenant.status,
        features: tenantUser.PlatformTenant.features ? JSON.parse(tenantUser.PlatformTenant.features) : [],
        settings: tenantUser.PlatformTenant.settings ? JSON.parse(tenantUser.PlatformTenant.settings) : {},
        maxUsers: tenantUser.PlatformTenant.maxUsers,
        maxMerchants: tenantUser.PlatformTenant.maxMerchants,
      }
    }
    
    return {
      success: true,
      token,
      user: {
        id: user.id,
        type: 'consumer',
        phone: user.phone,
        email: user.email || undefined,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.phone,
      },
      tenant,
      requiresKYC: user.kycStatus !== 'verified',
    }
  } catch (error) {
    console.error('Consumer login error:', error)
    return { success: false, error: 'Login failed. Please try again.' }
  }
}

/**
 * Login merchant user
 */
export async function loginMerchant(email: string, password: string): Promise<AuthResult> {
  try {
    // Find merchant user - check AdminMerchant or User model
    const merchant = await db.adminMerchant.findFirst({
      where: { contactEmail: email },
    })
    
    if (!merchant) {
      return { success: false, error: 'Invalid credentials' }
    }
    
    // For demo, accept any password
    // In production, verify password hash
    
    // Create or get tenant
    let tenant = await db.platformTenant.findFirst({
      where: { id: merchant.id },
    })
    
    if (!tenant) {
      // Create tenant for merchant
      const result = await createTenant({
        name: merchant.businessName,
        slug: merchant.businessName.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 30),
        plan: merchant.tier,
      })
      
      if (result.success && result.tenant) {
        tenant = await db.platformTenant.findUnique({ where: { id: result.tenant.tenantId } })
      }
    }
    
    // Generate token
    const token = generateToken()
    
    // Set session cookie
    const cookieStore = await cookies()
    cookieStore.set('session_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_CONFIG.merchant.duration / 1000,
    })
    
    if (tenant) {
      cookieStore.set('tenant_id', tenant.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: SESSION_CONFIG.merchant.duration / 1000,
      })
    }
    
    return {
      success: true,
      token,
      user: {
        id: merchant.id,
        type: 'merchant',
        email: merchant.contactEmail || undefined,
        phone: merchant.contactPhone || undefined,
        name: merchant.businessName,
      },
      tenant: tenant ? {
        tenantId: tenant.id,
        tenantSlug: tenant.slug,
        tenantName: tenant.name,
        plan: tenant.plan,
        status: tenant.status,
        features: tenant.features ? JSON.parse(tenant.features) : [],
        settings: tenant.settings ? JSON.parse(tenant.settings) : {},
        maxUsers: tenant.maxUsers,
        maxMerchants: tenant.maxMerchants,
      } : undefined,
    }
  } catch (error) {
    console.error('Merchant login error:', error)
    return { success: false, error: 'Login failed. Please try again.' }
  }
}

/**
 * Login admin user
 */
export async function loginAdmin(email: string, password: string, mfaCode?: string): Promise<AuthResult> {
  try {
    const admin = await db.adminUser.findUnique({
      where: { email },
    })
    
    if (!admin) {
      return { success: false, error: 'Invalid credentials' }
    }
    
    // Check status
    if (admin.status !== 'active') {
      return { success: false, error: 'Account is not active' }
    }
    
    // Verify password (simplified for demo)
    // In production, verify against passwordHash
    
    // Check MFA
    if (admin.mfaEnabled && !mfaCode) {
      return { success: false, requiresMFA: true }
    }
    
    // Create session
    const token = generateToken()
    const expiresAt = new Date(Date.now() + SESSION_CONFIG.admin.duration)
    
    await db.adminSession.create({
      data: {
        id: generateId('as'),
        adminId: admin.id,
        token,
        expiresAt,
      },
    })
    
    // Update last login
    await db.adminUser.update({
      where: { id: admin.id },
      data: { lastLogin: new Date() },
    })
    
    // Set session cookie
    const cookieStore = await cookies()
    cookieStore.set('session_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: SESSION_CONFIG.admin.duration / 1000,
    })
    
    return {
      success: true,
      token,
      user: {
        id: admin.id,
        type: 'admin',
        email: admin.email,
        name: admin.name,
      },
    }
  } catch (error) {
    console.error('Admin login error:', error)
    return { success: false, error: 'Login failed. Please try again.' }
  }
}

/**
 * Register new consumer
 */
export async function registerConsumer(data: {
  phone: string
  firstName?: string
  lastName?: string
  email?: string
  pin: string
}): Promise<RegisterResult> {
  try {
    // Check if phone already exists
    const existing = await db.consumerUser.findUnique({
      where: { phone: data.phone },
    })
    
    if (existing) {
      return { success: false, error: 'Phone number already registered' }
    }
    
    // Create user
    const user = await db.consumerUser.create({
      data: {
        id: generateId('user'),
        phone: data.phone,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        pinHash: await hashPassword(data.pin),
        kycStatus: 'pending',
        accountStatus: 'active',
      },
    })
    
    // Create wallet
    await db.consumerWallet.create({
      data: {
        id: generateId('wallet'),
        userId: user.id,
        balanceCents: BigInt(0),
        reservedCents: BigInt(0),
        pendingCents: BigInt(0),
      },
    })
    
    // Create loyalty account
    await db.consumerLoyalty.create({
      data: {
        id: generateId('loyalty'),
        userId: user.id,
        tier: 'bronze',
        points: 0,
        totalEarned: 0,
        totalRedeemed: 0,
      },
    })
    
    return {
      success: true,
      user: {
        id: user.id,
        type: 'consumer',
        phone: user.phone,
        email: user.email || undefined,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.phone,
      },
    }
  } catch (error) {
    console.error('Consumer registration error:', error)
    return { success: false, error: 'Registration failed. Please try again.' }
  }
}

/**
 * Register new merchant
 */
export async function registerMerchant(data: {
  businessName: string
  tradingName?: string
  contactName: string
  contactEmail: string
  contactPhone: string
  password: string
  tier?: string
  vertical?: string
  subVertical?: string
}): Promise<RegisterResult> {
  try {
    // Check if email exists
    const existing = await db.adminMerchant.findFirst({
      where: { contactEmail: data.contactEmail },
    })
    
    if (existing) {
      return { success: false, error: 'Email already registered' }
    }
    
    // Create merchant
    const merchant = await db.adminMerchant.create({
      data: {
        id: generateId('merchant'),
        businessName: data.businessName,
        tradingName: data.tradingName,
        contactName: data.contactName,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        tier: data.tier || 'starter',
        vertical: data.vertical,
        subVertical: data.subVertical,
        status: 'pending',
        kybStatus: 'pending',
      },
    })
    
    // Create tenant
    const slug = data.businessName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 30)
    
    const tenantResult = await createTenant({
      name: data.businessName,
      slug: `${slug}-${Date.now().toString(36)}`,
      plan: data.tier || 'starter',
    })
    
    if (tenantResult.success && tenantResult.tenant) {
      // Add merchant to tenant
      await addUserToTenant({
        tenantId: tenantResult.tenant.tenantId,
        userId: merchant.id,
        userType: 'merchant',
        role: 'owner',
        permissions: ['*'],
      })
    }
    
    return {
      success: true,
      user: {
        id: merchant.id,
        type: 'merchant',
        email: merchant.contactEmail || undefined,
        phone: merchant.contactPhone || undefined,
        name: merchant.businessName,
      },
      tenant: tenantResult.tenant,
    }
  } catch (error) {
    console.error('Merchant registration error:', error)
    return { success: false, error: 'Registration failed. Please try again.' }
  }
}

/**
 * Logout user
 */
export async function logout(): Promise<{ success: boolean }> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('session_token')?.value
    
    if (token) {
      // Invalidate sessions
      await db.consumerSession.updateMany({
        where: { refreshToken: token },
        data: { status: 'revoked' },
      })
      
      await db.adminSession.updateMany({
        where: { token },
        data: { expiresAt: new Date() },
      })
    }
    
    // Clear cookies
    cookieStore.delete('session_token')
    cookieStore.delete('tenant_id')
    
    return { success: true }
  } catch (error) {
    console.error('Logout error:', error)
    return { success: true } // Still return success to clear client state
  }
}

/**
 * Get current session
 */
export async function getCurrentSession(): Promise<{
  user?: PlatformUser
  tenant?: TenantContext
}> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('session_token')?.value
    
    if (!token) return {}
    
    // Check consumer session
    const consumerSession = await db.consumerSession.findFirst({
      where: {
        refreshToken: token,
        status: 'active',
        refreshTokenExpiry: { gt: new Date() },
      },
      include: { ConsumerUser: true },
    })
    
    if (consumerSession?.ConsumerUser) {
      const user = consumerSession.ConsumerUser
      
      // Get tenant
      const tenantUser = await db.tenantUser.findFirst({
        where: { userId: user.id, status: 'active' },
        include: { PlatformTenant: true },
      })
      
      let tenant: TenantContext | undefined
      if (tenantUser?.PlatformTenant) {
        tenant = {
          tenantId: tenantUser.PlatformTenant.id,
          tenantSlug: tenantUser.PlatformTenant.slug,
          tenantName: tenantUser.PlatformTenant.name,
          plan: tenantUser.PlatformTenant.plan,
          status: tenantUser.PlatformTenant.status,
          features: tenantUser.PlatformTenant.features ? JSON.parse(tenantUser.PlatformTenant.features) : [],
          settings: tenantUser.PlatformTenant.settings ? JSON.parse(tenantUser.PlatformTenant.settings) : {},
          maxUsers: tenantUser.PlatformTenant.maxUsers,
          maxMerchants: tenantUser.PlatformTenant.maxMerchants,
        }
      }
      
      return {
        user: {
          id: user.id,
          type: 'consumer',
          phone: user.phone,
          email: user.email || undefined,
          firstName: user.firstName || undefined,
          lastName: user.lastName || undefined,
          status: user.accountStatus,
          kycStatus: user.kycStatus,
          createdAt: user.createdAt,
        },
        tenant,
      }
    }
    
    // Check admin session
    const adminSession = await db.adminSession.findFirst({
      where: {
        token,
        expiresAt: { gt: new Date() },
      },
      include: { AdminUser: true },
    })
    
    if (adminSession?.AdminUser) {
      const user = adminSession.AdminUser
      
      return {
        user: {
          id: user.id,
          type: 'admin',
          email: user.email,
          firstName: user.name,
          status: user.status,
          createdAt: user.createdAt,
          lastLoginAt: user.lastLogin || undefined,
        },
      }
    }
    
    return {}
  } catch (error) {
    console.error('Get session error:', error)
    return {}
  }
}

/**
 * Switch tenant context
 */
export async function switchTenant(tenantId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('session_token')?.value
    
    if (!token) {
      return { success: false, error: 'Not authenticated' }
    }
    
    // Get user from session
    const consumerSession = await db.consumerSession.findFirst({
      where: { refreshToken: token, status: 'active' },
    })
    
    if (!consumerSession) {
      return { success: false, error: 'Session not found' }
    }
    
    // Check if user has access to this tenant
    const tenantUser = await db.tenantUser.findFirst({
      where: {
        userId: consumerSession.userId,
        tenantId,
        status: 'active',
      },
    })
    
    if (!tenantUser) {
      return { success: false, error: 'Access denied to this tenant' }
    }
    
    // Set tenant cookie
    cookieStore.set('tenant_id', tenantId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    })
    
    return { success: true }
  } catch (error) {
    console.error('Switch tenant error:', error)
    return { success: false, error: 'Failed to switch tenant' }
  }
}
