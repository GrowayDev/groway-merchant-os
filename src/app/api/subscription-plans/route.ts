import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - List all active subscription plans
export async function GET(request: NextRequest) {
  try {
    const plans = await db.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' }
    })

    return NextResponse.json({
      success: true,
      plans: plans.map(plan => ({
        id: plan.id,
        code: plan.code,
        name: plan.name,
        description: plan.description,
        priceMonthly: plan.priceMonthly,
        priceAnnual: plan.priceAnnual,
        currency: plan.currency,
        maxUsers: plan.maxUsers,
        maxBranches: plan.maxBranches,
        maxProducts: plan.maxProducts,
        maxTransactions: plan.maxTransactions,
        features: JSON.parse(plan.features),
        trialDays: plan.trialDays,
        isPopular: plan.isPopular,
        color: plan.color,
        icon: plan.icon
      }))
    })
  } catch (error) {
    console.error('Error fetching subscription plans:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch subscription plans' },
      { status: 500 }
    )
  }
}
