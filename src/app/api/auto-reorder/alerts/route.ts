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

// GET /api/auto-reorder/alerts - Get stock alerts for merchant
export async function GET(request: NextRequest) {
  const permissionCheck = await checkPermission(request, 'can_view_inventory')
  
  if (!permissionCheck.allowed) {
    return permissionCheck.error
  }

  const { searchParams } = new URL(request.url)
  const merchantId = permissionCheck.session!.merchantId

  try {
    const result = await forwardToAutoReorderService(`/alerts?merchantId=${merchantId}`)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to get auto-reorder alerts:', error)
    return NextResponse.json(
      { error: 'Auto-reorder service unavailable' },
      { status: 503 }
    )
  }
}
