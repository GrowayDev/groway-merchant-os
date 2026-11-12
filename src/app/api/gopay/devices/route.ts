import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthContext, unauthorizedResponse, forbiddenResponse } from '@/lib/auth-context'

/**
 * GET /api/gopay/devices
 * List all devices
 * 
 * SECURITY: Requires authentication
 * - Only authenticated users can access
 * - Results are filtered based on merchant access
 */
export async function GET(request: NextRequest) {
  // Authentication check
  const context = await getAuthContext(request)
  if (!context) {
    return unauthorizedResponse('Authentication required to access devices')
  }

  try {
    const { searchParams } = new URL(request.url)
    const queryMerchantId = searchParams.get('merchantId')
    const status = searchParams.get('status')
    
    const where: Record<string, unknown> = {}
    
    // Security: Filter by merchant access
    if ('role' in context && context.role !== 'platform_admin' && context.role !== 'super_admin') {
      if ('merchantId' in context && context.merchantId) {
        where.merchantId = context.merchantId
      }
    } else if (queryMerchantId) {
      // Platform admin can query by merchantId
      where.merchantId = queryMerchantId
    }
    
    if (status) where.status = status
    
    const devices = await db.gopayDevice.findMany({
      where,
      include: {
        _count: { select: { transactions: true } }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json({ devices })
  } catch (error) {
    console.error('Error fetching devices:', error)
    return NextResponse.json({ error: 'Failed to fetch devices' }, { status: 500 })
  }
}

/**
 * POST /api/gopay/devices
 * Create new device
 * 
 * SECURITY: Requires authentication
 * - Only authenticated users with admin role can create devices
 * - Device can only be created for the authenticated user's merchant
 */
export async function POST(request: NextRequest) {
  // Authentication check
  const context = await getAuthContext(request)
  if (!context) {
    return unauthorizedResponse('Authentication required to create devices')
  }

  // Check for admin role
  if (!('role' in context) || (context.role !== 'admin' && context.role !== 'owner' && context.role !== 'platform_admin' && context.role !== 'super_admin')) {
    return forbiddenResponse('Admin access required to create devices')
  }

  if (!('merchantId' in context)) {
    return forbiddenResponse('Merchant context required')
  }

  try {
    const body = await request.json()
    const {
      serialNumber,
      name,
      type = 'qr_terminal',
      location
    } = body

    // Validate required fields
    if (!serialNumber || !name) {
      return NextResponse.json({ error: 'Serial number and name are required' }, { status: 400 })
    }

    // Check if serial number exists
    const existing = await db.GopayDevice.findUnique({
      where: { serialNumber }
    })
    
    if (existing) {
      return NextResponse.json({ error: 'Serial number already registered' }, { status: 400 })
    }

    // SECURITY: Use merchantId from authenticated context
    const merchantId = context.merchantId

    const device = await db.GopayDevice.create({
      data: {
        serialNumber,
        name,
        type,
        merchantId,
        location,
        status: 'inactive',
        lastActive: new Date()
      }
    })

    return NextResponse.json({ device })
  } catch (error) {
    console.error('Error creating device:', error)
    return NextResponse.json({ error: 'Failed to create device' }, { status: 500 })
  }
}
