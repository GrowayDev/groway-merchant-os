import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { randomUUID } from 'crypto'
import { getMerchantIdWithDevFallback, requireAuth } from '@/lib/auth-context'

// GET /api/accounting/budgets - List budgets
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

    const budgets = await db.budget.findMany({
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
      budgets: budgets.map(b => ({
        id: b.id,
        name: b.name,
        accountId: b.accountId || '',
        accountName: b.accountName || b.name,
        period: b.periodType as 'monthly' | 'quarterly' | 'annual',
        amount: b.budgetAmount,
        spent: b.spentAmount,
        remaining: b.remainingAmount,
        percentage: b.budgetAmount > 0 ? Math.round((b.spentAmount / b.budgetAmount) * 100) : 0,
        startDate: b.startDate,
        endDate: b.endDate,
        alerts: b.alertEnabled,
        alertThreshold: b.alertThreshold,
      })),
      summary,
    })
  } catch (error) {
    console.error('Error fetching budgets:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch budgets' },
      { status: 500 }
    )
  }
}

// POST /api/accounting/budgets - Create new budget
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
      fiscalYearId,
      startDate,
      endDate,
      accountId,
      accountCode,
      accountName,
      category,
      budgetAmount,
      monthlyBreakdown,
      alertEnabled = true,
      alertThreshold = 80,
      status = 'draft',
      createdBy,
      notes,
    } = body

    // Validate required fields
    if (!name || !startDate || !endDate || budgetAmount === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: name, startDate, endDate, budgetAmount' },
        { status: 400 }
      )
    }

    // Check for duplicate budget name in same period
    const existing = await db.budget.findFirst({
      where: {
        merchantId,
        name,
        startDate,
      },
    })

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Budget with this name already exists for this period' },
        { status: 400 }
      )
    }

    // Create budget
    const budget = await db.budget.create({
      data: {
        id: randomUUID(),
        merchantId,
        name,
        description,
        periodType,
        fiscalYearId,
        startDate,
        endDate,
        accountId,
        accountCode,
        accountName,
        category,
        budgetAmount,
        remainingAmount: budgetAmount,
        monthlyBreakdown: monthlyBreakdown ? JSON.stringify(monthlyBreakdown) : null,
        alertEnabled,
        alertThreshold,
        status,
        createdBy,
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
