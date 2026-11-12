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

// POST /api/auto-reorder/check - Trigger manual stock check
export async function POST(request: NextRequest) {
  const permissionCheck = await checkPermission(request, 'can_view_reports')
  
  if (!permissionCheck.allowed) {
    return permissionCheck.error
  }

  const session = permissionCheck.session!

  try {
    const result = await forwardToAutoReorderService('/check', {
      method: 'POST',
      body: JSON.stringify({ merchantId: session.merchantId }),
    })
    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to trigger stock check:', error)
    return NextResponse.json(
      { error: 'Auto-reorder service unavailable' },
      { status: 503 }
    )
  }
}
