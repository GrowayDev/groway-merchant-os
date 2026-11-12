import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthContext, unauthorizedResponse, forbiddenResponse } from '@/lib/auth-context'

/**
 * GET /api/merchants
 * List all merchants with pagination, search, and status filter
 * 
 * SECURITY: Requires authentication
 * - Regular users can only see their own merchant
 * - Platform admins can see all merchants
 */
export async function GET(request: NextRequest) {
  // Authentication check
  const context = await getAuthContext(request)
  if (!context) {
    return unauthorizedResponse('Authentication required to access merchants')
  }

  try {
    const { searchParams } = new URL(request.url)
    
    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit
    
    // Search and filter parameters
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const vertical = searchParams.get('vertical') || ''
    const plan = searchParams.get('plan') || ''
    
    // Build where clause
    const where: Record<string, unknown> = {}
    
    // Security: Non-platform admins can only see their own merchant
    if (!('role' in context) || (context.role !== 'platform_admin' && context.role !== 'super_admin')) {
      if ('merchantId' in context && context.merchantId) {
        where.id = context.merchantId
      } else {
        return NextResponse.json({ merchants: [], pagination: { page: 1, limit, total: 0, totalPages: 0, hasMore: false } })
      }
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { tradingName: { contains: search } },
        { code: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } }
      ]
    }
    
    if (status) {
      where.status = status
    }
    
    if (vertical) {
      where.vertical = vertical
    }
    
    if (plan) {
      where.plan = plan
    }
    
    // Get total count for pagination
    const total = await db.merchant.count({ where })
    
    // Get merchants with related data
    const merchants = await db.merchant.findMany({
      where,
      skip,
      take: limit,
      include: {
        branches: {
          select: {
            id: true,
            name: true,
            type: true,
            city: true,
            isActive: true
          }
        },
        users: {
          select: {
            id: true,
            role: true,
            isActive: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        _count: {
          select: {
            branches: true,
            users: true,
            products: true,
            transactions: true,
            customers: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json({
      merchants,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + limit < total
      }
    })
  } catch (error) {
    console.error('Error fetching merchants:', error)
    return NextResponse.json(
      { error: 'Failed to fetch merchants' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/merchants
 * Create a new merchant with onboarding data
 * 
 * SECURITY: Requires authentication + admin/platform role
 * - Only platform admins or specific registration flows can create merchants
 * - Activity is logged for audit trail
 */
export async function POST(request: NextRequest) {
  // Authentication check
  const context = await getAuthContext(request)
  if (!context) {
    return unauthorizedResponse('Authentication required to create merchants')
  }

  // Check for admin role - either platform admin or tenant admin
  const canCreateMerchant = 'role' in context && (
    context.role === 'platform_admin' || 
    context.role === 'super_admin'
  )

  // Also allow if this is a registration flow (has specific header)
  const isRegistrationFlow = request.headers.get('x-registration-flow') === 'true'
  
  if (!canCreateMerchant && !isRegistrationFlow) {
    return forbiddenResponse('Admin access required to create merchants')
  }

  try {
    const body = await request.json()
    
    const {
      // Required fields
      name,
      vertical,
      
      // Optional business details
      tradingName,
      registrationNumber,
      vatNumber,
      subVertical,
      logo,
      coverImage,
      description,
      
      // Contact details
      phone,
      email,
      website,
      
      // Address
      addressLine1,
      addressLine2,
      city,
      province,
      postalCode,
      country,
      
      // Settings
      currency,
      timezone,
      language,
      vatRate,
      vatRegistered,
      
      // Feature flags
      posEnabled,
      onlineStoreEnabled,
      bookingEnabled,
      deliveryEnabled,
      loyaltyEnabled,
      
      // Subscription
      plan,
      planStatus,
      trialEndsAt,
      
      // Onboarding data
      onboardingStep,
      
      // First user (owner)
      ownerUser
    } = body
    
    // Validate required fields
    if (!name || !vertical) {
      return NextResponse.json(
        { error: 'Name and vertical are required' },
        { status: 400 }
      )
    }
    
    // Generate unique merchant code
    const count = await db.merchant.count()
    const code = `M${String(count + 1).padStart(5, '0')}`
    
    // Create merchant with related data in a transaction
    const result = await db.$transaction(async (tx) => {
      // Create the merchant
      const merchant = await tx.merchant.create({
        data: {
          code,
          name,
          tradingName,
          registrationNumber,
          vatNumber,
          vertical,
          subVertical,
          logo,
          coverImage,
          description,
          phone,
          email,
          website,
          addressLine1,
          addressLine2,
          city,
          province,
          postalCode,
          country: country || 'South Africa',
          currency: currency || 'ZAR',
          timezone: timezone || 'Africa/Johannesburg',
          language: language || 'en',
          vatRate: vatRate ?? 15.0,
          vatRegistered: vatRegistered ?? false,
          posEnabled: posEnabled ?? true,
          onlineStoreEnabled: onlineStoreEnabled ?? false,
          bookingEnabled: bookingEnabled ?? false,
          deliveryEnabled: deliveryEnabled ?? false,
          loyaltyEnabled: loyaltyEnabled ?? true,
          plan: plan || 'starter',
          planStatus: planStatus || 'trial',
          trialEndsAt: trialEndsAt ? new Date(trialEndsAt) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days trial
          status: 'pending',
          onboardingComplete: false,
          onboardingStep: onboardingStep || 'started',
          kycStatus: 'pending'
        }
      })
      
      // Create default branch
      const branch = await tx.branch.create({
        data: {
          merchantId: merchant.id,
          code: 'HQ',
          name: `${name} - Main`,
          type: 'headquarters',
          isDefault: true,
          isActive: true
        }
      })
      
      // If owner user data is provided, create the user and merchant user
      if (ownerUser) {
        let userId = ownerUser.userId
        
        // If no existing userId, create new user
        if (!userId && ownerUser.email) {
          // Check if user exists
          let user = await tx.user.findUnique({
            where: { email: ownerUser.email }
          })
          
          if (!user) {
            user = await tx.user.create({
              data: {
                email: ownerUser.email,
                name: ownerUser.name || name
              }
            })
          }
          
          userId = user.id
        }
        
        if (userId) {
          // Create merchant user relationship
          await tx.merchantUser.create({
            data: {
              merchantId: merchant.id,
              userId,
              role: 'owner',
              branchId: branch.id,
              isActive: true,
              acceptedAt: new Date()
            }
          })
        }
      }
      
      // Return the created merchant with all related data
      return await tx.merchant.findUnique({
        where: { id: merchant.id },
        include: {
          branches: true,
          users: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        }
      })
    })
    
    // Create audit log for merchant creation
    await db.auditLog.create({
      data: {
        action: 'merchant_created',
        category: 'merchant',
        actorId: 'userId' in context ? context.userId : null,
        actorName: 'userId' in context ? context.userId : 'System',
        targetType: 'merchant',
        targetId: result!.id,
        targetName: name,
        details: JSON.stringify({ code, vertical, plan: plan || 'starter' }),
      },
    })
    
    return NextResponse.json({ merchant: result }, { status: 201 })
  } catch (error) {
    console.error('Error creating merchant:', error)
    
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'Merchant with this code or email already exists' },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create merchant' },
      { status: 500 }
    )
  }
}
