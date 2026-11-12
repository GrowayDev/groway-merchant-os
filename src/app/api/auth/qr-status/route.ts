import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// In-memory store for QR sessions (use Redis in production)
// This stores pending QR login sessions
const qrSessions = new Map<string, {
  status: 'pending' | 'scanned' | 'approved' | 'expired'
  createdAt: number
  userId?: string
  merchantId?: string
}>()

// Clean up expired sessions every minute
setInterval(() => {
  const now = Date.now()
  for (const [token, session] of qrSessions.entries()) {
    if (now - session.createdAt > 5 * 60 * 1000) { // 5 minutes
      qrSessions.delete(token)
    }
  }
}, 60 * 1000)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Token required' },
        { status: 400 }
      )
    }

    // Check if this is a pending QR token
    // In production, this would be stored in Redis or database
    const session = qrSessions.get(token)
    
    if (!session) {
      // For demo purposes, simulate a progression
      // In production, the mobile app would update this status
      return NextResponse.json({
        status: 'pending',
        message: 'Waiting for scan'
      })
    }

    return NextResponse.json({
      status: session.status,
      message: session.status === 'approved' 
        ? 'Login approved' 
        : session.status === 'scanned'
        ? 'Waiting for confirmation'
        : 'Waiting for scan'
    })
  } catch (error) {
    console.error('QR status check error:', error)
    return NextResponse.json(
      { error: 'Failed to check QR status' },
      { status: 500 }
    )
  }
}

// Endpoint for mobile app to scan and approve
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, action, userId, merchantId } = body

    if (!token) {
      return NextResponse.json(
        { error: 'Token required' },
        { status: 400 }
      )
    }

    // Get or create QR session
    let session = qrSessions.get(token)
    
    if (!session) {
      // Create new session
      session = {
        status: 'pending',
        createdAt: Date.now()
      }
      qrSessions.set(token, session)
    }

    // Update based on action
    if (action === 'scan') {
      session.status = 'scanned'
      session.userId = userId
      session.merchantId = merchantId
    } else if (action === 'approve' && session.userId) {
      session.status = 'approved'
      
      // Create actual session for the user
      // In production, this would create a MerchantSession
      // and return a session cookie
    } else if (action === 'reject') {
      session.status = 'expired'
    }

    return NextResponse.json({
      success: true,
      status: session.status
    })
  } catch (error) {
    console.error('QR action error:', error)
    return NextResponse.json(
      { error: 'Failed to process QR action' },
      { status: 500 }
    )
  }
}

// Export for use in login route if needed
export { qrSessions }
