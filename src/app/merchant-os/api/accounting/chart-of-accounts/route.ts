import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { randomUUID } from 'crypto'
import { getMerchantIdWithDevFallback, requireAuth } from '@/lib/auth-context'

// GET /api/accounting/chart-of-accounts - List all accounts
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
    const type = searchParams.get('type')
    const search = searchParams.get('search')

    const where: any = { merchantId, isActive: true }
    
    if (type && type !== 'all') {
      where.type = type
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } }
      ]
    }

    const accounts = await db.chartOfAccount.findMany({
      where,
      orderBy: [
        { type: 'asc' },
        { code: 'asc' }
      ]
    })

    // Format response
    const formattedAccounts = accounts.map(account => ({
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
    }))

    return NextResponse.json({ 
      success: true,
      accounts: formattedAccounts 
    })
  } catch (error) {
    console.error('Error fetching accounts:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Failed to fetch accounts' 
    }, { status: 500 })
  }
}

// POST /api/accounting/chart-of-accounts - Create a new account
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const auth = requireAuth(request)
    if (auth.error) return auth.error
    const merchantId = auth.context.merchantId
    
    const body = await request.json()

    // Validate required fields
    if (!body.code || !body.name || !body.type) {
      return NextResponse.json({ 
        success: false,
        error: 'Code, name, and type are required' 
      }, { status: 400 })
    }

    // Check for duplicate code for same merchant
    const existing = await db.chartOfAccount.findFirst({
      where: { merchantId, code: body.code }
    })
    
    if (existing) {
      return NextResponse.json({ 
        success: false,
        error: 'An account with this code already exists' 
      }, { status: 400 })
    }

    // Create account
    const account = await db.chartOfAccount.create({
      data: {
        id: randomUUID(),
        merchantId,
        code: body.code,
        name: body.name,
        type: body.type,
        subType: body.subType || null,
        parentId: body.parentCode || null,
        isActive: body.isActive ?? true,
        isSystemAccount: false,
        normalBalance: body.normalBalance || 'debit',
        openingBalance: body.balance || 0,
        currentBalance: body.balance || 0,
        description: body.description || null,
        taxDeductible: body.taxDeductible ?? false,
        updatedAt: new Date()
      }
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
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating account:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Failed to create account' 
    }, { status: 500 })
  }
}
