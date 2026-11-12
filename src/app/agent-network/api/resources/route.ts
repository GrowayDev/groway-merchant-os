import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Mock agent ID for authentication (will be replaced with real auth later)
const MOCK_AGENT_ID = 'agent-demo-001'

// GET /api/agent-network/resources - List training resources and materials
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type') || undefined
    const category = searchParams.get('category') || undefined
    const featured = searchParams.get('featured') === 'true'
    const search = searchParams.get('search') || undefined

    // Build where clause
    const where: Record<string, unknown> = {
      active: true,
    }

    if (type && type !== 'all') {
      where.type = type
    }

    if (category && category !== 'all') {
      where.category = category
    }

    if (featured) {
      where.featured = true
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ]
    }

    // Get resources
    const resources = await db.agentResource.findMany({
      where,
      orderBy: [
        { featured: 'desc' },
        { sortOrder: 'asc' },
        { createdAt: 'desc' },
      ],
    })

    // Get agent profile to check training status
    const agent = await db.agentProfile.findUnique({
      where: { id: MOCK_AGENT_ID },
      select: {
        trainingCompleted: true,
        certificationLevel: true,
        tier: true,
      },
    })

    // Group resources by category
    const groupedByCategory = resources.reduce((acc, resource) => {
      if (!acc[resource.category]) {
        acc[resource.category] = []
      }
      acc[resource.category].push(resource)
      return acc
    }, {} as Record<string, typeof resources>)

    // Group resources by type
    const groupedByType = resources.reduce((acc, resource) => {
      if (!acc[resource.type]) {
        acc[resource.type] = []
      }
      acc[resource.type].push(resource)
      return acc
    }, {} as Record<string, typeof resources>)

    // Get featured resources
    const featuredResources = resources.filter((r) => r.featured)

    // Get categories and types for filtering
    const categories = [...new Set(resources.map((r) => r.category))]
    const types = [...new Set(resources.map((r) => r.type))]

    // Calculate stats
    const totalViews = resources.reduce((sum, r) => sum + r.viewCount, 0)
    const totalDownloads = resources.reduce((sum, r) => sum + r.downloadCount, 0)

    return NextResponse.json({
      resources,
      grouped: {
        byCategory: groupedByCategory,
        byType: groupedByType,
      },
      featured: featuredResources,
      filters: {
        categories,
        types,
      },
      stats: {
        total: resources.length,
        totalViews,
        totalDownloads,
      },
      agent: {
        trainingCompleted: agent?.trainingCompleted || false,
        certificationLevel: agent?.certificationLevel || null,
        tier: agent?.tier || 'starter',
      },
    })
  } catch (error) {
    console.error('Error fetching resources:', error)
    return NextResponse.json(
      { error: 'Failed to fetch resources' },
      { status: 500 }
    )
  }
}

// POST /api/agent-network/resources - Track resource view/download (for stats)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { resourceId, action } = body // action: 'view' | 'download'

    if (!resourceId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: resourceId, action' },
        { status: 400 }
      )
    }

    const resource = await db.agentResource.findUnique({
      where: { id: resourceId },
    })

    if (!resource) {
      return NextResponse.json(
        { error: 'Resource not found' },
        { status: 404 }
      )
    }

    // Update stats
    const updateData = action === 'view'
      ? { viewCount: { increment: 1 } }
      : { downloadCount: { increment: 1 } }

    await db.agentResource.update({
      where: { id: resourceId },
      data: updateData,
    })

    return NextResponse.json({
      message: `${action} tracked successfully`,
    })
  } catch (error) {
    console.error('Error tracking resource:', error)
    return NextResponse.json(
      { error: 'Failed to track resource' },
      { status: 500 }
    )
  }
}
