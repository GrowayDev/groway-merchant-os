import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getMerchantIdWithDevFallback, requireAuth } from '@/lib/auth-context'

// Create a fresh Prisma client instance - this is a NEW route to bypass cache
const client = new PrismaClient()

// GET /api/budgets-new - List budgets (new route)
export async function GET(request: NextRequest) {
  try {
    // Get merchant ID from auth context with dev fallback
    const merchantId = getMerchantIdWithDevFallback(request)
    if (!merchantId) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      }, { status: 401 })
    }
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const periodType = searchParams.get('periodType')
    const category = searchParams.get('category')

    const where: any = { merchantId }
    if (status) where.status = status
    if (periodType) where.periodType = periodType
    if (category) where.category = category

    const budgets = await client.budget.findMany({
      where,
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    })

    // Calculate summary statistics
    const summary = {
      totalBudgets: budgets.length,
      activeBudgets: budgets.filter((b) => b.status === 'active').length,
      totalBudgetAmount: budgets.reduce((sum, b) => sum + b.budgetAmount, 0),
      totalSpent: budgets.reduce((sum, b) => sum + b.spentAmount, 0),
      totalRemaining: budgets.reduce((sum, b) => sum + b.remainingAmount, 0),
      overBudgetCount: budgets.filter((b) => b.remainingAmount < 0).length,
      alertCount: 0,
    }

    return NextResponse.json({
      success: true,
      data: budgets,
      summary,
    })
  } catch (error) {
    console.error('Error fetching budgets (new route):', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch budgets' },
      { status: 500 }
    )
  }
}

// POST /api/budgets-new - Create new budget
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const auth = requireAuth(request)
    if (auth.error) return auth.error
    const merchantId = auth.context.merchantId
    
    const body = await request.json()
    const {
      name,
      description,
      periodType = 'monthly',
      startDate,
      endDate,
      accountCode,
      accountName,
      category,
      budgetAmount,
      alertEnabled = true,
      alertThreshold = 80,
      status = 'draft',
      notes,
    } = body

    // Validate required fields
    if (!name || !startDate || !endDate || budgetAmount === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: name, startDate, endDate, budgetAmount' },
        { status: 400 }
      )
    }

    // Create budget
    const budget = await client.budget.create({
      data: {
        merchantId,
        name,
        description,
        periodType,
        startDate,
        endDate,
        accountCode,
        accountName,
        category,
        budgetAmount,
        remainingAmount: budgetAmount,
        alertEnabled,
        alertThreshold,
        status,
        notes,
      },
    })

    return NextResponse.json({
      success: true,
      data: budget,
      message: 'Budget created successfully',
    })
  } catch (error) {
    console.error('Error creating budget:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create budget' },
      { status: 500 }
    )
  }
}
