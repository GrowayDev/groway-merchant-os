import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Fetch all tables
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sectionId = searchParams.get('sectionId')

    const where = sectionId ? { sectionId } : {}
    
    const tables = await db.restaurantTable.findMany({
      where,
      include: {
        FloorSection: true,
        Server: true,
        TableOrder: true,
        TableReservation: true,
      },
      orderBy: { number: 'asc' },
    })
    
    // Transform to match expected format
    const transformedTables = tables.map(table => ({
      ...table,
      sectionId: table.sectionId,
      serverId: table.serverId,
      section: table.FloorSection ? {
        id: table.FloorSection.id,
        name: table.FloorSection.name,
        color: table.FloorSection.color,
      } : null,
      server: table.Server ? {
        id: table.Server.id,
        name: table.Server.name,
      } : null,
      currentOrder: table.TableOrder ? {
        id: table.TableOrder.id,
        orderId: table.TableOrder.orderId,
        items: table.TableOrder.items,
        total: table.TableOrder.total,
        startTime: table.TableOrder.startTime,
        guests: table.TableOrder.guests,
      } : null,
      reservation: table.TableReservation ? {
        id: table.TableReservation.id,
        customerName: table.TableReservation.customerName,
        phone: table.TableReservation.phone || '',
        time: table.TableReservation.time,
        guests: table.TableReservation.guests,
        notes: table.TableReservation.notes || '',
      } : null,
    }))
    
    return NextResponse.json(transformedTables)
  } catch (error) {
    console.error('Error fetching tables:', error)
    return NextResponse.json({ error: 'Failed to fetch tables' }, { status: 500 })
  }
}

// POST - Create a new table
export async function POST(request: NextRequest) {
  try {
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

    if (!number || !sectionId) {
      return NextResponse.json({ error: 'Table number and section are required' }, { status: 400 })
    }

    const table = await db.restaurantTable.create({
      data: {
        id: `table-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        number,
        shape: shape || 'circle',
        x: x || 100,
        y: y || 100,
        width: width || 60,
        height: height || 60,
        rotation: rotation || 0,
        seats: seats || 4,
        status: status || 'available',
        minSpending,
        sectionId,
        serverId,
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
    
    return NextResponse.json(transformedTable, { status: 201 })
  } catch (error) {
    console.error('Error creating table:', error)
    return NextResponse.json({ error: 'Failed to create table' }, { status: 500 })
  }
}
