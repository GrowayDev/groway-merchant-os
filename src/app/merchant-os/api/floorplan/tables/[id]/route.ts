import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface Params {
  params: Promise<{ id: string }>
}

// GET - Fetch a single table
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const table = await db.restaurantTable.findUnique({
      where: { id },
      include: {
        FloorSection: true,
        Server: true,
        TableOrder: true,
        TableReservation: true,
      },
    })
    
    if (!table) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 })
    }
    
    // Transform to match expected format
    const transformedTable = {
      ...table,
      section: table.FloorSection,
      server: table.Server,
      currentOrder: table.TableOrder,
      reservation: table.TableReservation,
    }
    
    return NextResponse.json(transformedTable)
  } catch (error) {
    console.error('Error fetching table:', error)
    return NextResponse.json({ error: 'Failed to fetch table' }, { status: 500 })
  }
}

// PUT - Update a table
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const body = await request.json()
    const { 
      number, 
      shape, 
      x, 
      y, 
      width, 
      height, 
      rotation, 
      seats, 
      status, 
      minSpending,
      sectionId,
      serverId 
    } = body

    const table = await db.restaurantTable.update({
      where: { id },
      data: {
        ...(number !== undefined && { number }),
        ...(shape !== undefined && { shape }),
        ...(x !== undefined && { x }),
        ...(y !== undefined && { y }),
        ...(width !== undefined && { width }),
        ...(height !== undefined && { height }),
        ...(rotation !== undefined && { rotation }),
        ...(seats !== undefined && { seats }),
        ...(status !== undefined && { status }),
        ...(minSpending !== undefined && { minSpending }),
        ...(sectionId !== undefined && { sectionId }),
        ...(serverId !== undefined && { serverId }),
        updatedAt: new Date(),
      },
      include: {
        FloorSection: true,
        Server: true,
      },
    })
    
    // Transform to match expected format
    const transformedTable = {
      ...table,
      section: table.FloorSection,
      server: table.Server,
    }
    
    return NextResponse.json(transformedTable)
  } catch (error) {
    console.error('Error updating table:', error)
    return NextResponse.json({ error: 'Failed to update table' }, { status: 500 })
  }
}

// DELETE - Delete a table
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params

    // Delete related records first
    await db.tableReservation.deleteMany({
      where: { tableId: id },
    }).catch(() => {}) // Ignore if not found
    
    await db.tableOrder.deleteMany({
      where: { tableId: id },
    }).catch(() => {}) // Ignore if not found

    await db.restaurantTable.delete({
      where: { id },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting table:', error)
    return NextResponse.json({ error: 'Failed to delete table' }, { status: 500 })
  }
}
