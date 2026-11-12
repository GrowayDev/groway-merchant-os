import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getMerchantIdWithDevFallback } from '@/lib/auth-context'

// GET /api/accounting/budgets/compare - Budget vs Actual comparison
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
    const periodType = searchParams.get('periodType') || 'monthly'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const category = searchParams.get('category')

    // Get all active budgets for the period
    const budgets = await db.budget.findMany({
      where: {
        merchantId,
        status: 'active',
        ...(periodType && { periodType }),
        ...(category && { category }),
      },
      orderBy: { category: 'asc' },
    })

    // Calculate actual spending for each budget
    const comparisons = await Promise.all(
      budgets.map(async (budget) => {
        let actualSpent = budget.spentAmount
        let variance = 0
        let variancePercentage = 0

        // Get actual spending from journal entries
        if (budget.accountCode) {
          const journalLines = await db.journalEntryLine.aggregate({
            where: {
              accountCode: budget.accountCode,
              entry: {
                merchantId,
                status: 'posted',
                entryDate: {
                  gte: budget.startDate,
                  lte: budget.endDate,
                },
              },
            },
            _sum: {
              debit: true,
              credit: true,
            },
          })

          actualSpent = (journalLines._sum.debit || 0) - (journalLines._sum.credit || 0)
          actualSpent = Math.max(0, actualSpent)
        }

        variance = budget.budgetAmount - actualSpent
        variancePercentage =
          budget.budgetAmount > 0 ? (variance / budget.budgetAmount) * 100 : 0

        // Determine status
        let status: 'on_track' | 'warning' | 'over_budget' = 'on_track'
        const percentageUsed = budget.budgetAmount > 0 ? (actualSpent / budget.budgetAmount) * 100 : 0

        if (percentageUsed > 100) {
          status = 'over_budget'
        } else if (percentageUsed >= budget.alertThreshold) {
          status = 'warning'
        }

        return {
          id: budget.id,
          name: budget.name,
          category: budget.category || 'Uncategorized',
          accountCode: budget.accountCode,
          accountName: budget.accountName,
          periodType: budget.periodType,
          startDate: budget.startDate,
          endDate: budget.endDate,
          budgetAmount: budget.budgetAmount,
          actualAmount: actualSpent,
          variance,
          variancePercentage: Math.round(variancePercentage * 100) / 100,
          percentageUsed: Math.round(percentageUsed * 100) / 100,
          remainingAmount: budget.budgetAmount - actualSpent,
          status,
          alertThreshold: budget.alertThreshold,
        }
      })
    )

    // Group by category
    const byCategory = comparisons.reduce((acc, item) => {
      const cat = item.category
      if (!acc[cat]) {
        acc[cat] = {
          category: cat,
          budgets: [],
          totalBudget: 0,
          totalActual: 0,
          totalVariance: 0,
        }
      }
      acc[cat].budgets.push(item)
      acc[cat].totalBudget += item.budgetAmount
      acc[cat].totalActual += item.actualAmount
      acc[cat].totalVariance += item.variance
      return acc
    }, {} as Record<string, any>)

    // Calculate summary statistics
    const summary = {
      totalBudgets: comparisons.length,
      totalBudgetAmount: comparisons.reduce((sum, b) => sum + b.budgetAmount, 0),
      totalActualAmount: comparisons.reduce((sum, b) => sum + b.actualAmount, 0),
      totalVariance: comparisons.reduce((sum, b) => sum + b.variance, 0),
      onTrackCount: comparisons.filter((b) => b.status === 'on_track').length,
      warningCount: comparisons.filter((b) => b.status === 'warning').length,
      overBudgetCount: comparisons.filter((b) => b.status === 'over_budget').length,
    }

    // Get monthly breakdown for trend analysis
    const monthlyTrend = await getMonthlyTrend(merchantId, startDate, endDate)

    return NextResponse.json({
      success: true,
      data: {
        comparisons,
        byCategory: Object.values(byCategory),
        summary,
        monthlyTrend,
      },
    })
  } catch (error) {
    console.error('Error comparing budgets:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to compare budgets' },
      { status: 500 }
    )
  }
}

// Helper function to get monthly trend data
async function getMonthlyTrend(merchantId: string, startDate?: string | null, endDate?: string | null) {
  const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1)
  const end = endDate ? new Date(endDate) : new Date()

  const budgets = await db.budget.findMany({
    where: {
      merchantId,
      status: 'active',
    },
  })

  // Generate monthly data points
  const months = []
  const current = new Date(start)

  while (current <= end) {
    const monthStart = current.toISOString().slice(0, 7) + '-01'
    const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0)
      .toISOString()
      .slice(0, 10)

    // Calculate budget for this month
    let monthlyBudget = 0
    let monthlyActual = 0

    for (const budget of budgets) {
      // Check if budget covers this month
      if (budget.startDate <= monthEnd && budget.endDate >= monthStart) {
        // Calculate pro-rated budget for monthly period
        if (budget.periodType === 'monthly') {
          monthlyBudget += budget.budgetAmount
        } else if (budget.periodType === 'quarterly') {
          monthlyBudget += budget.budgetAmount / 3
        } else if (budget.periodType === 'annual') {
          monthlyBudget += budget.budgetAmount / 12
        }
      }
    }

    months.push({
      month: current.toISOString().slice(0, 7),
      budget: monthlyBudget,
      actual: monthlyActual,
    })

    current.setMonth(current.getMonth() + 1)
  }

  return months
}
