/**
 * Platform User Directory Service
 * Unified user management across all applications
 */

import { db } from '@/lib/db'

export interface UnifiedUser {
  id: string
  type: 'consumer' | 'merchant' | 'admin' | 'agent' | 'field_sales'
  email?: string
  phone?: string
  firstName?: string
  lastName?: string
  businessName?: string
  status: string
  kycStatus?: string
  tenantIds: string[]
  roles: string[]
  createdAt: Date
  lastActiveAt?: Date
}

export interface UserSearchParams {
  query?: string
  type?: 'consumer' | 'merchant' | 'admin' | 'agent' | 'field_sales'
  tenantId?: string
  status?: string
  kycStatus?: string
  limit?: number
  offset?: number
}

export interface UserStats {
  total: number
  byType: Record<string, number>
  byStatus: Record<string, number>
  activeToday: number
  newThisWeek: number
  newThisMonth: number
}

/**
 * Generate unique ID
 */
function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Search users across all user types
 */
export async function searchUsers(params: UserSearchParams): Promise<{
  users: UnifiedUser[]
  total: number
  hasMore: boolean
}> {
  const { query, type, tenantId, status, kycStatus, limit = 20, offset = 0 } = params
  
  const users: UnifiedUser[] = []
  let total = 0
  
  try {
    // Search consumers
    if (!type || type === 'consumer') {
      const where: Record<string, unknown> = {}
      
      if (query) {
        where.OR = [
          { phone: { contains: query } },
          { email: { contains: query } },
          { firstName: { contains: query } },
          { lastName: { contains: query } },
        ]
      }
      
      if (status) where.accountStatus = status
      if (kycStatus) where.kycStatus = kycStatus
      
      if (tenantId) {
        // Join with tenant users
        const tenantUsers = await db.tenantUser.findMany({
          where: { tenantId, userType: 'consumer' },
          select: { userId: true },
        })
        where.id = { in: tenantUsers.map(t => t.userId) }
      }
      
      const [consumerUsers, consumerCount] = await Promise.all([
        db.consumerUser.findMany({
          where,
          take: limit,
          skip: offset,
          orderBy: { createdAt: 'desc' },
        }),
        db.consumerUser.count({ where }),
      ])
      
      for (const user of consumerUsers) {
        const tenantMemberships = await db.tenantUser.findMany({
          where: { userId: user.id, status: 'active' },
          select: { tenantId: true, role: true },
        })
        
        users.push({
          id: user.id,
          type: 'consumer',
          email: user.email || undefined,
          phone: user.phone,
          firstName: user.firstName || undefined,
          lastName: user.lastName || undefined,
          status: user.accountStatus,
          kycStatus: user.kycStatus,
          tenantIds: tenantMemberships.map(t => t.tenantId),
          roles: tenantMemberships.map(t => t.role),
          createdAt: user.createdAt,
          lastActiveAt: undefined,
        })
      }
      
      total += consumerCount
    }
    
    // Search merchants
    if (!type || type === 'merchant') {
      const where: Record<string, unknown> = {}
      
      if (query) {
        where.OR = [
          { businessName: { contains: query } },
          { tradingName: { contains: query } },
          { contactEmail: { contains: query } },
          { contactPhone: { contains: query } },
        ]
      }
      
      if (status) where.status = status
      if (kycStatus) where.kybStatus = kycStatus
      
      const [merchants, merchantCount] = await Promise.all([
        db.adminMerchant.findMany({
          where,
          take: limit,
          skip: offset,
          orderBy: { createdAt: 'desc' },
        }),
        db.adminMerchant.count({ where }),
      ])
      
      for (const merchant of merchants) {
        const tenantMemberships = await db.tenantUser.findMany({
          where: { userId: merchant.id, userType: 'merchant', status: 'active' },
          select: { tenantId: true, role: true },
        })
        
        users.push({
          id: merchant.id,
          type: 'merchant',
          email: merchant.contactEmail || undefined,
          phone: merchant.contactPhone || undefined,
          firstName: merchant.contactName || undefined,
          businessName: merchant.businessName,
          status: merchant.status,
          kycStatus: merchant.kybStatus,
          tenantIds: tenantMemberships.map(t => t.tenantId),
          roles: tenantMemberships.map(t => t.role),
          createdAt: merchant.createdAt,
          lastActiveAt: undefined,
        })
      }
      
      total += merchantCount
    }
    
    // Search admins
    if (!type || type === 'admin') {
      const where: Record<string, unknown> = {}
      
      if (query) {
        where.OR = [
          { email: { contains: query } },
          { name: { contains: query } },
        ]
      }
      
      if (status) where.status = status
      
      const [admins, adminCount] = await Promise.all([
        db.adminUser.findMany({
          where,
          take: limit,
          skip: offset,
          orderBy: { createdAt: 'desc' },
        }),
        db.adminUser.count({ where }),
      ])
      
      for (const admin of admins) {
        users.push({
          id: admin.id,
          type: 'admin',
          email: admin.email,
          firstName: admin.name,
          status: admin.status,
          tenantIds: [],
          roles: [admin.role],
          createdAt: admin.createdAt,
          lastActiveAt: admin.lastLogin || undefined,
        })
      }
      
      total += adminCount
    }
    
    // Sort combined results by createdAt
    users.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    
    return {
      users: users.slice(0, limit),
      total,
      hasMore: offset + limit < total,
    }
  } catch (error) {
    console.error('Error searching users:', error)
    return { users: [], total: 0, hasMore: false }
  }
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string, userType?: string): Promise<UnifiedUser | null> {
  try {
    // Try consumer
    if (!userType || userType === 'consumer') {
      const consumer = await db.consumerUser.findUnique({
        where: { id: userId },
      })
      
      if (consumer) {
        const tenantMemberships = await db.tenantUser.findMany({
          where: { userId: consumer.id, status: 'active' },
        })
        
        return {
          id: consumer.id,
          type: 'consumer',
          email: consumer.email || undefined,
          phone: consumer.phone,
          firstName: consumer.firstName || undefined,
          lastName: consumer.lastName || undefined,
          status: consumer.accountStatus,
          kycStatus: consumer.kycStatus,
          tenantIds: tenantMemberships.map(t => t.tenantId),
          roles: tenantMemberships.map(t => t.role),
          createdAt: consumer.createdAt,
        }
      }
    }
    
    // Try merchant
    if (!userType || userType === 'merchant') {
      const merchant = await db.adminMerchant.findUnique({
        where: { id: userId },
      })
      
      if (merchant) {
        const tenantMemberships = await db.tenantUser.findMany({
          where: { userId: merchant.id, userType: 'merchant', status: 'active' },
        })
        
        return {
          id: merchant.id,
          type: 'merchant',
          email: merchant.contactEmail || undefined,
          phone: merchant.contactPhone || undefined,
          firstName: merchant.contactName || undefined,
          businessName: merchant.businessName,
          status: merchant.status,
          kycStatus: merchant.kybStatus,
          tenantIds: tenantMemberships.map(t => t.tenantId),
          roles: tenantMemberships.map(t => t.role),
          createdAt: merchant.createdAt,
        }
      }
    }
    
    // Try admin
    if (!userType || userType === 'admin') {
      const admin = await db.adminUser.findUnique({
        where: { id: userId },
      })
      
      if (admin) {
        return {
          id: admin.id,
          type: 'admin',
          email: admin.email,
          firstName: admin.name,
          status: admin.status,
          tenantIds: [],
          roles: [admin.role],
          createdAt: admin.createdAt,
          lastActiveAt: admin.lastLogin || undefined,
        }
      }
    }
    
    return null
  } catch (error) {
    console.error('Error getting user by ID:', error)
    return null
  }
}

/**
 * Get user statistics
 */
export async function getUserStats(tenantId?: string): Promise<UserStats> {
  try {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(todayStart)
    weekStart.setDate(weekStart.getDate() - 7)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    
    // Get counts
    const [
      totalConsumers,
      totalMerchants,
      totalAdmins,
      activeConsumersToday,
      newConsumersThisWeek,
      newConsumersThisMonth,
      newMerchantsThisWeek,
      newMerchantsThisMonth,
    ] = await Promise.all([
      db.consumerUser.count(tenantId ? {
        where: {
          TenantUser: { some: { tenantId } }
        }
      } : {}),
      db.adminMerchant.count(),
      db.adminUser.count(),
      db.consumerSession.count({
        where: {
          lastActiveAt: { gte: todayStart },
          status: 'active',
        },
      }),
      db.consumerUser.count({
        where: { createdAt: { gte: weekStart } },
      }),
      db.consumerUser.count({
        where: { createdAt: { gte: monthStart } },
      }),
      db.adminMerchant.count({
        where: { createdAt: { gte: weekStart } },
      }),
      db.adminMerchant.count({
        where: { createdAt: { gte: monthStart } },
      }),
    ])
    
    const total = totalConsumers + totalMerchants + totalAdmins
    
    return {
      total,
      byType: {
        consumer: totalConsumers,
        merchant: totalMerchants,
        admin: totalAdmins,
        agent: 0,
        field_sales: 0,
      },
      byStatus: {
        active: total, // Simplified
        pending: 0,
        suspended: 0,
      },
      activeToday: activeConsumersToday,
      newThisWeek: newConsumersThisWeek + newMerchantsThisWeek,
      newThisMonth: newConsumersThisMonth + newMerchantsThisMonth,
    }
  } catch (error) {
    console.error('Error getting user stats:', error)
    return {
      total: 0,
      byType: {},
      byStatus: {},
      activeToday: 0,
      newThisWeek: 0,
      newThisMonth: 0,
    }
  }
}

/**
 * Update user status
 */
export async function updateUserStatus(
  userId: string,
  userType: 'consumer' | 'merchant' | 'admin',
  status: string
): Promise<{ success: boolean; error?: string }> {
  try {
    switch (userType) {
      case 'consumer':
        await db.consumerUser.update({
          where: { id: userId },
          data: { accountStatus: status },
        })
        break
      
      case 'merchant':
        await db.adminMerchant.update({
          where: { id: userId },
          data: { status },
        })
        break
      
      case 'admin':
        await db.adminUser.update({
          where: { id: userId },
          data: { status },
        })
        break
    }
    
    return { success: true }
  } catch (error) {
    console.error('Error updating user status:', error)
    return { success: false, error: 'Failed to update user status' }
  }
}

/**
 * Get users for tenant
 */
export async function getTenantUsers(
  tenantId: string,
  options?: { limit?: number; offset?: number }
): Promise<{ users: UnifiedUser[]; total: number }> {
  try {
    const { limit = 50, offset = 0 } = options || {}
    
    const tenantUsers = await db.tenantUser.findMany({
      where: { tenantId, status: 'active' },
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
    })
    
    const users: UnifiedUser[] = []
    
    for (const tu of tenantUsers) {
      const user = await getUserById(tu.userId, tu.userType)
      if (user) {
        users.push({
          ...user,
          roles: [tu.role],
        })
      }
    }
    
    const total = await db.tenantUser.count({
      where: { tenantId, status: 'active' },
    })
    
    return { users, total }
  } catch (error) {
    console.error('Error getting tenant users:', error)
    return { users: [], total: 0 }
  }
}

/**
 * Invite user to tenant
 */
export async function inviteUserToTenant(data: {
  tenantId: string
  email: string
  userType: 'consumer' | 'merchant' | 'admin' | 'agent' | 'field_sales'
  role: string
  invitedBy: string
}): Promise<{ success: boolean; error?: string; invitationId?: string }> {
  try {
    // Check if invitation already exists
    const existing = await db.tenantInvitation.findFirst({
      where: {
        tenantId: data.tenantId,
        email: data.email,
        status: 'pending',
        expiresAt: { gt: new Date() },
      },
    })
    
    if (existing) {
      return { success: false, error: 'Invitation already pending' }
    }
    
    // Create invitation
    const invitation = await db.tenantInvitation.create({
      data: {
        id: generateId('inv'),
        tenantId: data.tenantId,
        email: data.email,
        userType: data.userType,
        role: data.role,
        invitedBy: data.invitedBy,
        status: 'pending',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    })
    
    // In production, send email with invitation link
    
    return { success: true, invitationId: invitation.id }
  } catch (error) {
    console.error('Error inviting user:', error)
    return { success: false, error: 'Failed to create invitation' }
  }
}

/**
 * Accept tenant invitation
 */
export async function acceptInvitation(
  invitationId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const invitation = await db.tenantInvitation.findUnique({
      where: { id: invitationId },
    })
    
    if (!invitation) {
      return { success: false, error: 'Invitation not found' }
    }
    
    if (invitation.status !== 'pending') {
      return { success: false, error: 'Invitation already processed' }
    }
    
    if (invitation.expiresAt < new Date()) {
      return { success: false, error: 'Invitation has expired' }
    }
    
    // Add user to tenant
    const result = await db.tenantUser.create({
      data: {
        id: generateId('tu'),
        tenantId: invitation.tenantId,
        userId,
        userType: invitation.userType as 'consumer' | 'merchant' | 'admin' | 'agent',
        role: invitation.role,
        status: 'active',
        invitedBy: invitation.invitedBy,
        invitedAt: invitation.createdAt,
        acceptedAt: new Date(),
      },
    })
    
    // Update invitation status
    await db.tenantInvitation.update({
      where: { id: invitationId },
      data: { status: 'accepted' },
    })
    
    return { success: true }
  } catch (error) {
    console.error('Error accepting invitation:', error)
    return { success: false, error: 'Failed to accept invitation' }
  }
}
