import { NextRequest, NextResponse } from 'next/server'
import { checkPermission } from '@/lib/permissions'

const AUTO_REORDER_PORT = 3004

async function forwardToAutoReorderService(path: string, options: RequestInit = {}) {
  const response = await fetch(`http://localhost:${AUTO_REORDER_PORT}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  return response.json()
}

// POST /api/auto-reorder/rfq - Generate RFQ for selected products
export async function POST(request: NextRequest) {
  const permissionCheck = await checkPermission(request, 'can_create_rfq')
  
  if (!permissionCheck.allowed) {
    return permissionCheck.error
  }

  const session = permissionCheck.session!

  try {
    const body = await request.json()
    const { productIds } = body

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json(
        { error: 'productIds array required' },
        { status: 400 }
      )
    }

    const result = await forwardToAutoReorderService('/rfq', {
      method: 'POST',
      body: JSON.stringify({
        merchantId: session.merchantId,
        productIds,
        userId: session.userId,
      }),
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to generate RFQ:', error)
    return NextResponse.json(
      { error: 'Auto-reorder service unavailable' },
      { status: 503 }
    )
  }
}
