/**
 * Platform Users API
 * Unified user management across all applications
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  searchUsers, 
  getUserById, 
  getUserStats, 
  updateUserStatus,
  getTenantUsers,
  inviteUserToTenant,
} from '@/lib/platform/user-directory'
import { getTenantContext } from '@/lib/platform/tenant-context'
import { getRateLimitHeaders, checkCombinedRateLimit } from '@/lib/platform/rate-limiter'

// GET /api/platform/users - Search users
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Check if requesting stats
    if (searchParams.get('stats') === 'true') {
      const tenant = await getTenantContext()
      const stats = await getUserStats(tenant?.tenantId)
      return NextResponse.json(stats)
    }
    
    // Check if requesting tenant users
    const tenantId = searchParams.get('tenantId')
    if (tenantId) {
      const limit = parseInt(searchParams.get('limit') || '50')
      const offset = parseInt(searchParams.get('offset') || '0')
      
      const result = await getTenantUsers(tenantId, { limit, offset })
      return NextResponse.json(result)
    }
    
    // Check if requesting specific user
    const userId = searchParams.get('id')
    if (userId) {
      const userType = searchParams.get('userType') || undefined
      const user = await getUserById(userId, userType || undefined)
      
      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }
      
      return NextResponse.json(user)
    }
    
    // Search users
    const params = {
      query: searchParams.get('query') || undefined,
      type: searchParams.get('type') as 'consumer' | 'merchant' | 'admin' | 'agent' | 'field_sales' | undefined,
      tenantId: searchParams.get('tenantId') || undefined,
      status: searchParams.get('status') || undefined,
      kycStatus: searchParams.get('kycStatus') || undefined,
      limit: parseInt(searchParams.get('limit') || '20'),
      offset: parseInt(searchParams.get('offset') || '0'),
    }
    
    // Rate limit check
    const currentTenant = await getTenantContext()
    const rateLimit = checkCombinedRateLimit(
      currentTenant?.tenantId || 'anonymous', 
      '/api/platform/users', 
      currentTenant?.plan || 'starter'
    )
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAfter: rateLimit.retryAfter },
        { status: 429, headers: getRateLimitHeaders(rateLimit) }
      )
    }
    
    const result = await searchUsers(params)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Users API error:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}

// POST /api/platform/users - Invite user or update user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, ...data } = body
    
    // Rate limit check
    const currentTenant = await getTenantContext()
    const rateLimit = checkCombinedRateLimit(
      currentTenant?.tenantId || 'anonymous', 
      '/api/platform/users', 
      currentTenant?.plan || 'starter'
    )
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAfter: rateLimit.retryAfter },
        { status: 429, headers: getRateLimitHeaders(rateLimit) }
      )
    }
    
    switch (action) {
      case 'invite':
        if (!data.tenantId || !data.email || !data.userType || !data.role) {
          return NextResponse.json(
            { error: 'Missing required fields for invitation' },
            { status: 400 }
          )
        }
        
        const inviteResult = await inviteUserToTenant({
          tenantId: data.tenantId,
          email: data.email,
          userType: data.userType,
          role: data.role,
          invitedBy: data.invitedBy || 'system',
        })
        
        return NextResponse.json(inviteResult, { 
          status: inviteResult.success ? 201 : 400 
        })
      
      case 'updateStatus':
        if (!data.userId || !data.userType || !data.status) {
          return NextResponse.json(
            { error: 'Missing required fields for status update' },
            { status: 400 }
          )
        }
        
        const statusResult = await updateUserStatus(
          data.userId,
          data.userType,
          data.status
        )
        
        return NextResponse.json(statusResult, {
          status: statusResult.success ? 200 : 400
        })
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Users POST API error:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}
