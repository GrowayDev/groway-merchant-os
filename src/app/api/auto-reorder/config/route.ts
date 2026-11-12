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

// GET /api/auto-reorder/config - Get auto-reorder configuration
export async function GET(request: NextRequest) {
  const permissionCheck = await checkPermission(request, 'can_view_settings')
  
  if (!permissionCheck.allowed) {
    return permissionCheck.error
  }

  const merchantId = permissionCheck.session!.merchantId

  try {
    const result = await forwardToAutoReorderService(`/config?merchantId=${merchantId}`)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to get auto-reorder config:', error)
    return NextResponse.json(
      { error: 'Auto-reorder service unavailable' },
      { status: 503 }
    )
  }
}

// PUT /api/auto-reorder/config - Update auto-reorder configuration
export async function PUT(request: NextRequest) {
  const permissionCheck = await checkPermission(request, 'can_edit_settings')
  
  if (!permissionCheck.allowed) {
    return permissionCheck.error
  }

  const merchantId = permissionCheck.session!.merchantId

  try {
    const body = await request.json()
    
    const result = await forwardToAutoReorderService('/config', {
      method: 'PUT',
      body: JSON.stringify({
        merchantId,
        config: body,
      }),
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to update auto-reorder config:', error)
    return NextResponse.json(
      { error: 'Auto-reorder service unavailable' },
      { status: 503 }
    )
  }
}
