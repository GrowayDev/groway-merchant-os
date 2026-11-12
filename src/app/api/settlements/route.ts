import { NextRequest, NextResponse } from 'next/server'
import { checkPermission } from '@/lib/permissions'

const SETTLEMENT_SERVICE_URL = 'http://localhost:3005'

async function forwardToSettlementService(path: string, options: RequestInit = {}) {
  const response = await fetch(`${SETTLEMENT_SERVICE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  return response.json()
}

// GET /api/settlements - Get settlement batches
export async function GET(request: NextRequest) {
  const permissionCheck = await checkPermission(request, 'can_view_reports')
  
  if (!permissionCheck.allowed) {
    return permissionCheck.error
  }
  
  const merchantId = permissionCheck.session!.merchantId
  const { searchParams } = new URL(request.url)
  const batchId = searchParams.get('batchId')
  const statusOnly = searchParams.get('status') === 'true'
  
  try {
    if (statusOnly) {
      const result = await forwardToSettlementService(`/status?merchantId=${merchantId}`)
      return NextResponse.json(result)
    }
    
    const result = await forwardToSettlementService(`/batches?merchantId=${merchantId}`)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Get settlements error:', error)
    return NextResponse.json(
      { error: 'Settlement service unavailable' },
      { status: 503 }
    )
  }
}

// POST /api/settlements - Trigger settlement
export async function POST(request: NextRequest) {
  const permissionCheck = await checkPermission(request, 'can_edit_settings')
  
  if (!permissionCheck.allowed) {
    return permissionCheck.error
  }
  
  const merchantId = permissionCheck.session!.merchantId
  
  try {
    const body = await request.json().catch(() => ({}))
    
    // Trigger settlement for specific merchant or all
    const result = await forwardToSettlementService('/run', {
      method: 'POST',
      body: JSON.stringify({ merchantId, ...body }),
    })
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Run settlement error:', error)
    return NextResponse.json(
      { error: 'Settlement service unavailable' },
      { status: 503 }
    )
  }
}

// PUT /api/settlements - Process pending batches
export async function PUT(request: NextRequest) {
  const permissionCheck = await checkPermission(request, 'can_edit_settings')
  
  if (!permissionCheck.allowed) {
    return permissionCheck.error
  }
  
  try {
    const result = await forwardToSettlementService('/process', {
      method: 'POST',
    })
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Process settlements error:', error)
    return NextResponse.json(
      { error: 'Settlement service unavailable' },
      { status: 503 }
    )
  }
}
