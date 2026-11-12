import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface HealthCheck {
  name: string
  status: 'healthy' | 'degraded' | 'unhealthy'
  latency?: number
  message?: string
  details?: Record<string, unknown>
}

// GET /api/platform/health - Health check endpoint for monitoring
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  const checks: HealthCheck[] = []
  
  // Check 1: Database connectivity
  try {
    const dbStart = Date.now()
    await db.$queryRaw`SELECT 1`
    const dbLatency = Date.now() - dbStart
    
    checks.push({
      name: 'database',
      status: dbLatency < 100 ? 'healthy' : dbLatency < 500 ? 'degraded' : 'unhealthy',
      latency: dbLatency,
      message: 'Database connection successful'
    })
  } catch (error) {
    checks.push({
      name: 'database',
      status: 'unhealthy',
      message: 'Database connection failed',
      details: { error: error instanceof Error ? error.message : 'Unknown error' }
    })
  }
  
  // Check 2: Database table count (quick sanity check)
  try {
    const merchantCount = await db.merchant.count({ take: 1 })
    checks.push({
      name: 'database_tables',
      status: 'healthy',
      message: 'Database tables accessible'
    })
  } catch (error) {
    checks.push({
      name: 'database_tables',
      status: 'unhealthy',
      message: 'Database tables check failed'
    })
  }
  
  // Check 3: Memory usage (Node.js process)
  const memoryUsage = process.memoryUsage()
  const heapUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024)
  const heapTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024)
  const heapUsagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100
  
  checks.push({
    name: 'memory',
    status: heapUsagePercent < 80 ? 'healthy' : heapUsagePercent < 95 ? 'degraded' : 'unhealthy',
    message: `Heap: ${heapUsedMB}MB / ${heapTotalMB}MB (${heapUsagePercent.toFixed(1)}%)`,
    details: {
      heapUsedMB,
      heapTotalMB,
      heapUsagePercent: Math.round(heapUsagePercent * 100) / 100,
      rssMB: Math.round(memoryUsage.rss / 1024 / 1024),
      externalMB: Math.round(memoryUsage.external / 1024 / 1024)
    }
  })
  
  // Check 4: Response time
  const totalLatency = Date.now() - startTime
  
  // Determine overall status
  const overallStatus = checks.some(c => c.status === 'unhealthy')
    ? 'unhealthy'
    : checks.some(c => c.status === 'degraded')
    ? 'degraded'
    : 'healthy'
  
  const response = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: Math.round(process.uptime()),
    latency: {
      total: totalLatency,
      unit: 'ms'
    },
    checks,
    region: process.env.VERCEL_REGION || process.env.AWS_REGION || 'local'
  }
  
  const statusCode = overallStatus === 'unhealthy' ? 503 : overallStatus === 'degraded' ? 200 : 200
  
  return NextResponse.json(response, {
    status: statusCode,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'X-Health-Status': overallStatus,
      'X-Response-Time': `${totalLatency}ms`
    }
  })
}

// HEAD /api/platform/health - Simple health check (for load balancers)
export async function HEAD(request: NextRequest) {
  try {
    // Quick database ping
    await db.$queryRaw`SELECT 1`
    return new NextResponse(null, { status: 200 })
  } catch (error) {
    return new NextResponse(null, { status: 503 })
  }
}
