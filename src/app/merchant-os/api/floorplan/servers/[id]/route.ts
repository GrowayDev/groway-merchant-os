import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface Params {
  params: Promise<{ id: string }>
}

// GET - Fetch a single server
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const server = await db.server.findUnique({
      where: { id },
      include: {
        RestaurantTable: true,
      },
    })
    
    if (!server) {
      return NextResponse.json({ error: 'Server not found' }, { status: 404 })
    }
    
    // Transform to match expected format
    const transformedServer = {
      ...server,
      tables: server.RestaurantTable,
    }
    
    return NextResponse.json(transformedServer)
  } catch (error) {
    console.error('Error fetching server:', error)
    return NextResponse.json({ error: 'Failed to fetch server' }, { status: 500 })
  }
}

// PUT - Update a server
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, status } = body

    const server = await db.server.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(status && { status }),
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
    
    return NextResponse.json(transformedServer)
  } catch (error) {
    console.error('Error updating server:', error)
    return NextResponse.json({ error: 'Failed to update server' }, { status: 500 })
  }
}

// DELETE - Delete a server
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    
    // Remove server from all tables first
    await db.restaurantTable.updateMany({
      where: { serverId: id },
      data: { serverId: null },
    })

    await db.server.delete({
      where: { id },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting server:', error)
    return NextResponse.json({ error: 'Failed to delete server' }, { status: 500 })
  }
}
