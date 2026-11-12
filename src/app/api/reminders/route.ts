import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, unauthorizedResponse, forbiddenResponse } from '@/lib/auth-context'

const REMINDER_SERVICE_URL = 'http://localhost:3006'

async function forwardToReminderService(path: string, options: RequestInit = {}) {
  const response = await fetch(`${REMINDER_SERVICE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  return response.json()
}

/**
 * GET /api/reminders
 * Get reminder stats
 * 
 * SECURITY: Requires authentication
 * - merchantId is extracted from authenticated context, NOT from query params
 * - This prevents users from accessing other merchants' reminder data
 */
export async function GET(request: NextRequest) {
  // Authentication check
  const context = await getAuthContext(request)
  if (!context) {
    return unauthorizedResponse('Authentication required to access reminders')
  }

  // Get merchantId from authenticated context
  const { searchParams } = new URL(request.url)
  const queryMerchantId = searchParams.get('merchantId')
  
  // Determine merchantId with security validation
  let merchantId: string | undefined
  
  if ('merchantId' in context) {
    // User has merchant context
    if (queryMerchantId && queryMerchantId !== context.merchantId) {
      // User is trying to access a different merchant's data
      // Only allow if they're a platform admin
      if (context.role !== 'platform_admin' && context.role !== 'super_admin') {
        return forbiddenResponse('Access denied to this merchant\'s data')
      }
      merchantId = queryMerchantId
    } else {
      merchantId = context.merchantId
    }
  } else if (queryMerchantId) {
    // No merchant context but trying to query - only for platform admins
    return forbiddenResponse('Merchant context required')
  }
  
  try {
    const result = await forwardToReminderService(`/stats?merchantId=${merchantId || ''}`)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Get reminders error:', error)
    return NextResponse.json(
      { error: 'Reminder service unavailable' },
      { status: 503 }
    )
  }
}

/**
 * POST /api/reminders
 * Create reminder
 * 
 * SECURITY: Requires authentication
 * - merchantId is extracted from authenticated context
 * - Reminder can only be created for the authenticated user's merchant
 */
export async function POST(request: NextRequest) {
  // Authentication check
  const context = await getAuthContext(request)
  if (!context) {
    return unauthorizedResponse('Authentication required to create reminders')
  }

  if (!('merchantId' in context)) {
    return forbiddenResponse('Merchant context required')
  }
  
  try {
    const body = await request.json()
    
    // SECURITY: Override merchantId in body with authenticated user's merchantId
    // This prevents users from creating reminders for other merchants
    const secureBody = {
      ...body,
      merchantId: context.merchantId,
      userId: context.userId, // Also set userId from context
    }
    
    const result = await forwardToReminderService('/create', {
      method: 'POST',
      body: JSON.stringify(secureBody),
    })
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Create reminder error:', error)
    return NextResponse.json(
      { error: 'Reminder service unavailable' },
      { status: 503 }
    )
  }
}

/**
 * DELETE /api/reminders
 * Cancel reminder
 * 
 * SECURITY: Requires authentication
 * - User can only cancel their own merchant's reminders
 */
export async function DELETE(request: NextRequest) {
  // Authentication check
  const context = await getAuthContext(request)
  if (!context) {
    return unauthorizedResponse('Authentication required to cancel reminders')
  }

  if (!('merchantId' in context)) {
    return forbiddenResponse('Merchant context required')
  }
  
  try {
    const body = await request.json()
    
    // SECURITY: Add merchantId from context to verify ownership
    const secureBody = {
      ...body,
      merchantId: context.merchantId,
    }
    
    const result = await forwardToReminderService('/cancel', {
      method: 'POST',
      body: JSON.stringify(secureBody),
    })
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Cancel reminder error:', error)
    return NextResponse.json(
      { error: 'Reminder service unavailable' },
      { status: 503 }
    )
  }
}
