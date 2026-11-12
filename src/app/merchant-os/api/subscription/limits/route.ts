import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withDevModeBypass } from '@/lib/auth-middleware'
import { getPlanLimits, checkLimit, canAddMore } from '@/lib/subscription-limits'

// GET /merchant-os/api/subscription/limits - Get subscription limits for a merchant
export const GET = withDevModeBypass(async (request, { user, isDevBypass }) => {
  try {
    const { searchParams } = new URL(request.url)
    const merchantId = user?.merchantId || searchParams.get('merchantId')
    
    if (!merchantId) {
      return NextResponse.json(
        { success: false, error: 'merchantId is required' },
        { status: 400 }
      )
    }
    
    // Get merchant with current counts
    const merchant = await db.merchant.findUnique({
      where: { id: merchantId },
      include: {
        _count: {
          select: {
            Product: true,
            ProductCategory: true,
            Branch: true,
            MerchantUser: true
          }
        }
      }
    })
    
    if (!merchant) {
      return NextResponse.json(
        { success: false, error: 'Merchant not found' },
        { status: 404 }
      )
    }
    
    // Get plan limits
    const plan = merchant.plan || 'starter'
    const limits = getPlanLimits(plan)
    
    // Calculate current usage
    const usage = {
      products: merchant._count.Product,
      categories: merchant._count.ProductCategory,
      branches: merchant._count.Branch,
      staff: merchant._count.MerchantUser
    }
    
    // Check each limit
    const limitChecks = {
      products: checkLimit(plan, 'maxProducts', usage.products),
      categories: checkLimit(plan, 'maxCategories', usage.categories),
      branches: checkLimit(plan, 'maxBranches', usage.branches),
      staff: checkLimit(plan, 'maxStaff', usage.staff)
    }
    
    // Features available
    const features = {
      onlineStore: limits.hasOnlineStore,
      booking: limits.hasBooking,
      delivery: limits.hasDelivery,
      multiLocation: limits.hasMultiLocation,
      advancedReports: limits.hasAdvancedReports,
      apiAccess: limits.hasAPIAccess,
      whiteLabel: limits.hasWhiteLabel,
      groSupply: limits.hasGroSupply,
      groCredit: limits.hasGroCredit,
      groSell: limits.hasGroSell,
      gopay: limits.hasGopay
    }
    
    return NextResponse.json({
      success: true,
      data: {
        plan: {
          name: plan,
          displayName: plan.charAt(0).toUpperCase() + plan.slice(1),
          status: merchant.planStatus,
          trialEndsAt: merchant.trialEndsAt,
          subscriptionEndsAt: merchant.subscriptionEndsAt
        },
        limits: {
          products: limits.maxProducts,
          categories: limits.maxCategories,
          branches: limits.maxBranches,
          staff: limits.maxStaff,
          transactionsPerMonth: limits.maxTransactionsPerMonth,
          transactionAmount: limits.maxTransactionAmount
        },
        usage,
        limitChecks,
        features,
        support: limits.supportLevel,
        pricing: {
          monthly: limits.monthlyPrice,
          annual: limits.annualPrice
        }
      }
    })
  } catch (error) {
    console.error('Error fetching subscription limits:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch subscription limits' },
      { status: 500 }
    )
  }
})

// POST /merchant-os/api/subscription/limits/check - Check if can add more resources
export const POST = withDevModeBypass(async (request, { user, isDevBypass }) => {
  try {
    const body = await request.json()
    const { resourceType, merchantId: bodyMerchantId } = body
    
    const merchantId = user?.merchantId || bodyMerchantId
    
    if (!merchantId) {
      return NextResponse.json(
        { success: false, error: 'merchantId is required' },
        { status: 400 }
      )
    }
    
    if (!resourceType) {
      return NextResponse.json(
        { success: false, error: 'resourceType is required' },
        { status: 400 }
      )
    }
    
    // Get merchant
    const merchant = await db.merchant.findUnique({
      where: { id: merchantId },
      include: {
        _count: {
          select: {
            Product: true,
            ProductCategory: true,
            Branch: true,
            MerchantUser: true
          }
        }
      }
    })
    
    if (!merchant) {
      return NextResponse.json(
        { success: false, error: 'Merchant not found' },
        { status: 404 }
      )
    }
    
    // Get current count based on resource type
    const countMap: Record<string, number> = {
      products: merchant._count.Product,
      categories: merchant._count.ProductCategory,
      branches: merchant._count.Branch,
      staff: merchant._count.MerchantUser,
      users: merchant._count.MerchantUser
    }
    
    const currentCount = countMap[resourceType] || 0
    
    // Check limit
    const result = await canAddMore(merchant.plan || 'starter', resourceType as any, currentCount)
    
    return NextResponse.json({
      success: true,
      data: {
        canAdd: result.canAdd,
        reason: result.reason,
        upgradeNeeded: result.upgradeNeeded,
        currentCount,
        resourceType
      }
    })
  } catch (error) {
    console.error('Error checking subscription limit:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to check subscription limit' },
      { status: 500 }
    )
  }
})
