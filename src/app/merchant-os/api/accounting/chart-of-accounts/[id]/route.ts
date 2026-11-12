import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getMerchantIdWithDevFallback, requireAuth } from '@/lib/auth-context'

// GET /api/accounting/chart-of-accounts/[id] - Get a single account
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    // Get merchant ID from auth context with dev fallback
    const merchantId = getMerchantIdWithDevFallback(request)
    if (!merchantId) {
      return NextResponse.json({ 
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      }, { status: 401 })
    }

    const account = await db.chartOfAccount.findFirst({
      where: { id, merchantId }
    })

    if (!account) {
      return NextResponse.json({ 
        success: false,
        error: 'Account not found' 
      }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true,
      account: {
        id: account.id,
        code: account.code,
        name: account.name,
        type: account.type,
        subType: account.subType,
        balance: account.currentBalance,
        currency: 'ZAR',
        isActive: account.isActive,
        parentCode: account.parentId,
        description: account.description,
        taxDeductible: account.taxDeductible,
        merchantId: account.merchantId,
        createdAt: account.createdAt.toISOString(),
        updatedAt: account.updatedAt.toISOString()
      }
    })
  } catch (error) {
    console.error('Error fetching account:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Failed to fetch account' 
    }, { status: 500 })
  }
}

// PUT /api/accounting/chart-of-accounts/[id] - Update an account
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    // Require authentication
    const auth = requireAuth(request)
    if (auth.error) return auth.error
    const merchantId = auth.context.merchantId
    
    const body = await request.json()

    // Check if account exists
    const existing = await db.chartOfAccount.findFirst({
      where: { id, merchantId }
    })

    if (!existing) {
      return NextResponse.json({ 
        success: false,
        error: 'Account not found' 
      }, { status: 404 })
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date()
    }

    if (body.name !== undefined) updateData.name = body.name
    if (body.type !== undefined) updateData.type = body.type
    if (body.subType !== undefined) updateData.subType = body.subType
    if (body.isActive !== undefined) updateData.isActive = body.isActive
    if (body.normalBalance !== undefined) updateData.normalBalance = body.normalBalance
    if (body.balance !== undefined) {
      updateData.currentBalance = body.balance
      updateData.openingBalance = body.balance
    }
    if (body.description !== undefined) updateData.description = body.description
    if (body.taxDeductible !== undefined) updateData.taxDeductible = body.taxDeductible

    // Update account
    const account = await db.chartOfAccount.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({ 
      success: true,
      account: {
        id: account.id,
        code: account.code,
        name: account.name,
        type: account.type,
        subType: account.subType,
        balance: account.currentBalance,
        currency: 'ZAR',
        isActive: account.isActive,
        parentCode: account.parentId,
        description: account.description,
        taxDeductible: account.taxDeductible,
        merchantId: account.merchantId,
        createdAt: account.createdAt.toISOString(),
        updatedAt: account.updatedAt.toISOString()
      }
    })
  } catch (error) {
    console.error('Error updating account:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Failed to update account' 
    }, { status: 500 })
  }
}

// DELETE /api/accounting/chart-of-accounts/[id] - Delete an account
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    // Get merchant ID from auth context with dev fallback
    const merchantId = getMerchantIdWithDevFallback(request)
    if (!merchantId) {
      return NextResponse.json({ 
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      }, { status: 401 })
    }

    // Check if account exists
    const existing = await db.chartOfAccount.findFirst({
      where: { id, merchantId }
    })

    if (!existing) {
      return NextResponse.json({ 
        success: false,
        error: 'Account not found' 
      }, { status: 404 })
    }

    // Don't allow deletion of system accounts
    if (existing.isSystemAccount) {
      return NextResponse.json({ 
        success: false,
        error: 'Cannot delete system accounts' 
      }, { status: 400 })
    }

    // Soft delete by setting isActive to false
    await db.chartOfAccount.update({
      where: { id },
      data: { isActive: false, updatedAt: new Date() }
    })

    return NextResponse.json({ 
      success: true,
      message: 'Account deleted successfully' 
    })
  } catch (error) {
    console.error('Error deleting account:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Failed to delete account' 
    }, { status: 500 })
  }
}
