import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/accounting/budgets/[id] - Get single budget with details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const budget = await db.budget.findUnique({
      where: { id },
    })

    if (!budget) {
      return NextResponse.json(
        { success: false, error: 'Budget not found' },
        { status: 404 }
      )
    }

    const remainingAmount = budget.budgetAmount - budget.spentAmount
    const percentage = budget.budgetAmount > 0 ? (budget.spentAmount / budget.budgetAmount) * 100 : 0

    return NextResponse.json({
      success: true,
      data: {
        ...budget,
        remainingAmount,
        percentage: Math.round(percentage * 100) / 100,
      },
    })
  } catch (error) {
    console.error('Error fetching budget:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch budget' },
      { status: 500 }
    )
  }
}

// PUT /api/accounting/budgets/[id] - Update budget
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const existingBudget = await db.budget.findUnique({
      where: { id },
    })

    if (!existingBudget) {
      return NextResponse.json(
        { success: false, error: 'Budget not found' },
        { status: 404 }
      )
    }

    const {
      name,
      description,
      periodType,
      startDate,
      endDate,
      accountCode,
      accountName,
      category,
      budgetAmount,
      alertEnabled,
      alertThreshold,
      status,
      notes,
    } = body

    const budget = await db.budget.update({
      where: { id },
      data: {
        name,
        description,
        periodType,
        startDate,
        endDate,
        accountCode,
        accountName,
        category,
        budgetAmount,
        remainingAmount: budgetAmount !== undefined ? budgetAmount - existingBudget.spentAmount : undefined,
        alertEnabled,
        alertThreshold,
        status,
        notes,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      data: budget,
      message: 'Budget updated successfully',
    })
  } catch (error) {
    console.error('Error updating budget:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update budget' },
      { status: 500 }
    )
  }
}

// DELETE /api/accounting/budgets/[id] - Delete budget
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const budget = await db.budget.findUnique({
      where: { id },
    })

    if (!budget) {
      return NextResponse.json(
        { success: false, error: 'Budget not found' },
        { status: 404 }
      )
    }

    await db.budget.update({
      where: { id },
      data: { status: 'cancelled', updatedAt: new Date() },
    })

    return NextResponse.json({
      success: true,
      message: 'Budget deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting budget:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete budget' },
      { status: 500 }
    )
  }
}
