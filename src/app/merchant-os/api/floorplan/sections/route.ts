import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Fetch all sections
export async function GET() {
  try {
    const sections = await db.floorSection.findMany({
      include: {
        RestaurantTable: {
          include: {
            Server: true,
            TableOrder: true,
            TableReservation: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })
    
    // Transform to match expected format
    const transformedSections = sections.map(section => ({
      ...section,
      tables: section.RestaurantTable?.map((table: any) => ({
        ...table,
        section: {
          id: section.id,
          name: section.name,
          color: section.color,
        },
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
      })),
    }))
    
    return NextResponse.json(transformedSections)
  } catch (error) {
    console.error('Error fetching sections:', error)
    return NextResponse.json({ error: 'Failed to fetch sections' }, { status: 500 })
  }
}

// POST - Create a new section
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, color, merchantId } = body

    if (!name) {
      return NextResponse.json({ error: 'Section name is required' }, { status: 400 })
    }

    const section = await db.floorSection.create({
      data: {
        id: `section-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        name,
        color: color || '#00897B',
        merchantId,
        updatedAt: new Date(),
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
    
    return NextResponse.json(transformedSection, { status: 201 })
  } catch (error) {
    console.error('Error creating section:', error)
    return NextResponse.json({ error: 'Failed to create section' }, { status: 500 })
  }
}
