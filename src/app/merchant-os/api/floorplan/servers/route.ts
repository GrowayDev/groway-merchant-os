import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Fetch all servers
export async function GET() {
  try {
    const servers = await db.server.findMany({
      include: {
        RestaurantTable: true,
      },
      orderBy: { name: 'asc' },
    })
    
    // Transform to match expected format
    const transformedServers = servers.map(server => ({
      ...server,
      tables: server.RestaurantTable,
    }))
    
    return NextResponse.json(transformedServers)
  } catch (error) {
    console.error('Error fetching servers:', error)
    return NextResponse.json({ error: 'Failed to fetch servers' }, { status: 500 })
  }
}

// POST - Create a new server
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, status } = body

    if (!name) {
      return NextResponse.json({ error: 'Server name is required' }, { status: 400 })
    }

    const server = await db.server.create({
      data: {
        id: `server-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        name,
        status: status || 'active',
        updatedAt: new Date(),
      },
      include: {
        RestaurantTable: true,
      },
    })
    
    // Transform to match expected format
    const transformedServer = {
      ...server,
      tables: server.RestaurantTable,
    }
    
    return NextResponse.json(transformedServer, { status: 201 })
  } catch (error) {
    console.error('Error creating server:', error)
    return NextResponse.json({ error: 'Failed to create server' }, { status: 500 })
  }
}
