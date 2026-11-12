import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - List all routes with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const salesRepId = searchParams.get('salesRepId')
    const date = searchParams.get('date')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build where clause
    const where: any = {}

    if (status && status !== 'all') {
      where.status = status
    }

    if (salesRepId) {
      where.salesRepId = salesRepId
    }

    if (date) {
      where.routeDate = date
    }

    // Try to fetch from database
    let routes: any[] = []
    let total = 0

    try {
      routes = await db.salesRoute.findMany({
        where,
        orderBy: { routeDate: 'desc' },
        take: limit,
        skip: offset,
      })

      total = await db.salesRoute.count({ where })
    } catch (dbError) {
      // Table might not exist, return demo data
      console.log('SalesRoute table not found, returning demo data')
    }

    // If no routes found, return demo data
    if (routes.length === 0) {
      const demoRoutes = generateDemoRoutes()
      
      // Apply filters to demo data
      let filteredRoutes = demoRoutes
      
      if (status && status !== 'all') {
        filteredRoutes = filteredRoutes.filter(r => r.status === status)
      }
      if (salesRepId) {
        filteredRoutes = filteredRoutes.filter(r => r.salesRepId === salesRepId)
      }
      if (date) {
        filteredRoutes = filteredRoutes.filter(r => r.routeDate === date)
      }

      return NextResponse.json({
        success: true,
        data: filteredRoutes.slice(offset, offset + limit),
        pagination: {
          total: filteredRoutes.length,
          limit,
          offset,
          hasMore: offset + limit < filteredRoutes.length,
        },
        stats: {
          totalRoutes: demoRoutes.length,
          activeRoutes: demoRoutes.filter(r => r.status === 'in_progress').length,
          completedRoutes: demoRoutes.filter(r => r.status === 'completed').length,
          totalVisits: demoRoutes.reduce((sum, r) => sum + r.totalVisits, 0),
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: routes.map(formatRoute),
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + routes.length < total,
      }
    })
  } catch (error) {
    console.error('Error fetching routes:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch routes' },
      { status: 500 }
    )
  }
}

// POST - Create new route
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      salesRepId,
      salesRepName,
      routeDate,
      routeName,
      visits,
    } = body

    // Validate required fields
    if (!salesRepId || !salesRepName || !routeDate) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: salesRepId, salesRepName, routeDate' },
        { status: 400 }
      )
    }

    // Calculate route stats
    const totalVisits = visits?.length || 0
    const optimizedOrder = visits ? JSON.stringify(visits.map((v: any) => v.id)) : null
    
    // Simple optimization score (would be calculated by actual algorithm in production)
    const optimizationScore = visits ? calculateOptimizationScore(visits) : 0

    // Create route
    const route = await db.salesRoute.create({
      data: {
        id: `route-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        salesRepId,
        salesRepName,
        routeDate,
        routeName: routeName || `Route ${routeDate}`,
        totalVisits,
        completedVisits: 0,
        totalDistance: 0,
        totalDuration: 0,
        optimizedOrder,
        optimizationScore,
        status: 'planned',
      }
    })

    // Update visit route orders if provided
    if (visits) {
      for (let i = 0; i < visits.length; i++) {
        try {
          await db.salesVisit.update({
            where: { id: visits[i].id },
            data: { 
              routeOrder: i + 1,
              plannedDate: routeDate,
            }
          })
        } catch (e) {
          // Visit may not exist
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: formatRoute(route),
      message: 'Route created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating route:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create route' },
      { status: 500 }
    )
  }
}

// PATCH - Update route status
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { routeId, action, data } = body

    if (!routeId || !action) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: routeId, action' },
        { status: 400 }
      )
    }

    const validActions = ['start', 'complete', 'cancel', 'optimize']
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { success: false, error: `Invalid action. Must be one of: ${validActions.join(', ')}` },
        { status: 400 }
      )
    }

    const route = await db.salesRoute.findUnique({
      where: { id: routeId },
    })

    if (!route) {
      return NextResponse.json(
        { success: false, error: 'Route not found' },
        { status: 404 }
      )
    }

    let updateData: any = {}

    switch (action) {
      case 'start':
        updateData = {
          status: 'in_progress',
          startedAt: new Date(),
        }
        break

      case 'complete':
        updateData = {
          status: 'completed',
          completedAt: new Date(),
          completedVisits: data?.completedVisits || route.totalVisits,
          totalDistance: data?.totalDistance || route.totalDistance,
          totalDuration: data?.totalDuration || route.totalDuration,
        }
        break

      case 'cancel':
        updateData = {
          status: 'cancelled',
        }
        break

      case 'optimize':
        // Re-optimize the route order
        if (data?.visits) {
          updateData = {
            optimizedOrder: JSON.stringify(data.visits.map((v: any) => v.id)),
            optimizationScore: calculateOptimizationScore(data.visits),
          }
          
          // Update visit route orders
          for (let i = 0; i < data.visits.length; i++) {
            try {
              await db.salesVisit.update({
                where: { id: data.visits[i].id },
                data: { routeOrder: i + 1 }
              })
            } catch (e) {
              // Visit may not exist
            }
          }
        }
        break
    }

    const updatedRoute = await db.salesRoute.update({
      where: { id: routeId },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      data: formatRoute(updatedRoute),
      message: `Route ${action} successful`
    })
  } catch (error) {
    console.error('Error updating route:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update route' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a route
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const routeId = searchParams.get('id')

    if (!routeId) {
      return NextResponse.json(
        { success: false, error: 'Missing route ID' },
        { status: 400 }
      )
    }

    await db.salesRoute.delete({
      where: { id: routeId },
    })

    return NextResponse.json({
      success: true,
      message: 'Route deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting route:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete route' },
      { status: 500 }
    )
  }
}

// Helper function to format route response
function formatRoute(route: any) {
  return {
    id: route.id,
    salesRepId: route.salesRepId,
    salesRepName: route.salesRepName,
    routeDate: route.routeDate,
    routeName: route.routeName,
    totalVisits: route.totalVisits,
    completedVisits: route.completedVisits,
    totalDistance: route.totalDistance,
    totalDuration: route.totalDuration,
    optimizedOrder: route.optimizedOrder ? JSON.parse(route.optimizedOrder) : null,
    optimizationScore: route.optimizationScore,
    status: route.status,
    startedAt: route.startedAt,
    completedAt: route.completedAt,
    createdAt: route.createdAt,
    updatedAt: route.updatedAt,
  }
}

// Simple optimization score calculation
function calculateOptimizationScore(visits: any[]): number {
  if (!visits || visits.length === 0) return 0
  
  // In production, this would use actual distance/time calculations
  // For demo, we calculate a score based on clustering
  
  if (visits.length === 1) return 100
  
  // Simulate optimization score (0-100)
  const baseScore = 70
  const visitBonus = Math.min(visits.length * 2, 20)
  const randomVariance = Math.random() * 10
  
  return Math.round(baseScore + visitBonus + randomVariance)
}

// Generate demo routes
function generateDemoRoutes() {
  const today = new Date().toISOString().split('T')[0]
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  
  const salesReps = [
    { id: 'sr-001', name: 'Thabo Molefe' },
    { id: 'sr-002', name: 'Nomsa Dlamini' },
    { id: 'sr-003', name: 'Johan van der Berg' },
    { id: 'sr-004', name: 'Priya Naidoo' },
    { id: 'sr-005', name: 'Sipho Zulu' },
  ]
  
  const statuses = ['planned', 'in_progress', 'completed', 'cancelled']
  
  const routes: any[] = []
  
  // Generate routes for each sales rep
  for (const rep of salesReps) {
    // Today's route
    routes.push({
      id: `route-${rep.id}-today`,
      salesRepId: rep.id,
      salesRepName: rep.name,
      routeDate: today,
      routeName: `${rep.name.split(' ')[0]}'s Daily Route`,
      totalVisits: Math.floor(Math.random() * 5) + 3,
      completedVisits: Math.floor(Math.random() * 3),
      totalDistance: Math.round((Math.random() * 50 + 20) * 10) / 10,
      totalDuration: Math.floor(Math.random() * 180) + 60,
      optimizedOrder: JSON.stringify(['v-001', 'v-002', 'v-003', 'v-004']),
      optimizationScore: Math.floor(Math.random() * 20) + 80,
      status: rep.id === 'sr-002' ? 'in_progress' : 'planned',
      startedAt: rep.id === 'sr-002' ? new Date(Date.now() - 3600000) : null,
      completedAt: null,
      createdAt: new Date(Date.now() - Math.random() * 86400000),
      updatedAt: new Date(),
    })
    
    // Yesterday's completed route
    if (Math.random() > 0.3) {
      const totalVisits = Math.floor(Math.random() * 5) + 3
      routes.push({
        id: `route-${rep.id}-yesterday`,
        salesRepId: rep.id,
        salesRepName: rep.name,
        routeDate: yesterday,
        routeName: `${rep.name.split(' ')[0]}'s Route`,
        totalVisits,
        completedVisits: totalVisits,
        totalDistance: Math.round((Math.random() * 50 + 20) * 10) / 10,
        totalDuration: Math.floor(Math.random() * 180) + 120,
        optimizedOrder: JSON.stringify(['v-101', 'v-102', 'v-103']),
        optimizationScore: Math.floor(Math.random() * 15) + 75,
        status: 'completed',
        startedAt: new Date(Date.now() - 86400000),
        completedAt: new Date(Date.now() - 82800000),
        createdAt: new Date(Date.now() - 2 * 86400000),
        updatedAt: new Date(Date.now() - 82800000),
      })
    }
    
    // Tomorrow's planned route
    if (Math.random() > 0.5) {
      routes.push({
        id: `route-${rep.id}-tomorrow`,
        salesRepId: rep.id,
        salesRepName: rep.name,
        routeDate: tomorrow,
        routeName: `${rep.name.split(' ')[0]}'s Planned Route`,
        totalVisits: Math.floor(Math.random() * 4) + 2,
        completedVisits: 0,
        totalDistance: Math.round((Math.random() * 40 + 15) * 10) / 10,
        totalDuration: Math.floor(Math.random() * 120) + 90,
        optimizedOrder: JSON.stringify(['v-201', 'v-202', 'v-203']),
        optimizationScore: Math.floor(Math.random() * 20) + 70,
        status: 'planned',
        startedAt: null,
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }
  }
  
  return routes
}
