import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthContext, unauthorizedResponse, forbiddenResponse } from '@/lib/auth-context'

/**
 * GET /api/gopay/transactions
 * List all transactions
 * 
 * SECURITY: Requires authentication
 * - Only authenticated users can access
 * - Results are filtered based on merchant/device access
 */
export async function GET(request: NextRequest) {
  // Authentication check
  const context = await getAuthContext(request)
  if (!context) {
    return unauthorizedResponse('Authentication required to access transactions')
  }

  try {
    const { searchParams } = new URL(request.url)
    const deviceId = searchParams.get('deviceId')
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const merchantId = searchParams.get('merchantId')
    const limit = parseInt(searchParams.get('limit') || '50')
    
    const where: Record<string, unknown> = {}
    
    // Security: Filter by merchant access
    if ('role' in context && context.role !== 'platform_admin' && context.role !== 'super_admin') {
      if ('merchantId' in context && context.merchantId) {
        where.device = { merchantId: context.merchantId }
      }
    } else if (merchantId) {
      // Platform admin can query by merchantId
      where.device = { merchantId }
    }
    
    if (deviceId) where.deviceId = deviceId
    if (status) where.status = status
    if (type) where.type = type
    
    const transactions = await db.GopayTransaction.findMany({
      where,
      include: {
        device: {
          select: { id: true, name: true, serialNumber: true, merchantId: true }
        }
      },
      take: limit,
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json({ transactions })
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
  }
}

/**
 * POST /api/gopay/transactions
 * Create new transaction
 * 
 * SECURITY: Requires authentication
 * - Transaction can only be created for devices owned by authenticated merchant
 */
export async function POST(request: NextRequest) {
  // Authentication check
  const context = await getAuthContext(request)
  if (!context) {
    return unauthorizedResponse('Authentication required to create transactions')
  }

  if (!('merchantId' in context)) {
    return forbiddenResponse('Merchant context required')
  }

  try {
    const body = await request.json()
    const {
      amount,
      currency = 'ZAR',
      type = 'payment',
      paymentMethod = 'card',
      deviceId,
      customerMaskedCard
    } = body

    // Validate required fields
    if (!amount || !deviceId) {
      return NextResponse.json({ error: 'Amount and deviceId are required' }, { status: 400 })
    }

    // SECURITY: Verify device belongs to authenticated merchant
    const device = await db.GopayDevice.findFirst({
      where: { 
        id: deviceId,
        merchantId: context.merchantId
      }
    })

    if (!device) {
      return forbiddenResponse('Device not found or access denied')
    }

    // Generate transaction ID
    const count = await db.GopayTransaction.count()
    const transactionId = `GP${String(count + 1).padStart(8, '0')}`

    const transaction = await db.GopayTransaction.create({
      data: {
        transactionId,
        amount: parseFloat(amount),
        currency,
        type,
        paymentMethod,
        deviceId,
        customerMaskedCard,
        status: type === 'payment' ? 'completed' : 'pending',
        settlementStatus: 'pending'
      },
      include: {
        device: true
      }
    })

    // Update device stats
    if (type === 'payment') {
      await db.GopayDevice.update({
        where: { id: deviceId },
        data: {
          totalTransactions: { increment: 1 },
          totalRevenue: { increment: parseFloat(amount) },
          lastActive: new Date()
        }
      })
    }

    return NextResponse.json({ transaction })
  } catch (error) {
    console.error('Error creating transaction:', error)
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 })
  }
}
