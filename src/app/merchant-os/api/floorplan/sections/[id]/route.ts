import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface Params {
  params: Promise<{ id: string }>
}

// GET - Fetch a single section
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const section = await db.floorSection.findUnique({
      where: { id },
      include: {
        RestaurantTable: {
          include: {
            Server: true,
            TableReservation: true,
            TableOrder: true,
          },
        },
      },
    })
    
    if (!section) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 })
    }
    
    // Transform to match expected format
    const transformedSection = {
      ...section,
      tables: section.RestaurantTable?.map((table: any) => ({
        ...table,
        server: table.Server,
        reservation: table.TableReservation,
        currentOrder: table.TableOrder,
      })),
    }
    
    return NextResponse.json(transformedSection)
  } catch (error) {
    console.error('Error fetching section:', error)
    return NextResponse.json({ error: 'Failed to fetch section' }, { status: 500 })
  }
}

// PUT - Update a section
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, color } = body

    const section = await db.floorSection.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(color && { color }),
      },
      include: {
        RestaurantTable: true,
      },
    })
    
    // Transform to match expected format
    const transformedSection = {
      ...section,
      tables: section.RestaurantTable,
    }
    
    return NextResponse.json(transformedSection)
  } catch (error) {
    console.error('Error updating section:', error)
    return NextResponse.json({ error: 'Failed to update section' }, { status: 500 })
  }
}

// DELETE - Delete a section
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    
    // Check if section has tables
    const tablesCount = await db.restaurantTable.count({
      where: { sectionId: id },
    })
    
    if (tablesCount > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete section with tables. Move or delete tables first.' 
      }, { status: 400 })
    }

    await db.floorSection.delete({
      where: { id },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting section:', error)
    return NextResponse.json({ error: 'Failed to delete section' }, { status: 500 })
  }
}
