import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/health - Simple health check endpoint for offline detection
export async function GET() {
  try {
    // Quick database ping to verify connectivity
    const startTime = Date.now()
    await db.$queryRaw`SELECT 1`
    const dbLatency = Date.now() - startTime
    
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      db: 'connected',
      latency: dbLatency
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Access-Control-Allow-Origin': '*'
      }
    })
  } catch (error) {
    console.error('Health check failed:', error)
    
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      db: 'disconnected',
      error: error instanceof Error ? error.message : 'Database connection failed'
    }, {
      status: 503,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Access-Control-Allow-Origin': '*'
      }
    })
  }
}

// HEAD /api/health - Simple health check for quick ping
export async function HEAD() {
  try {
    await db.$queryRaw`SELECT 1`
    return new NextResponse(null, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      }
    })
  } catch {
    return new NextResponse(null, { status: 503 })
  }
}
