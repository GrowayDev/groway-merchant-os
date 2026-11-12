import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST() {
  try {
    const results = {
      sections: { created: 0, existing: 0 },
      tables: { created: 0, existing: 0 },
      servers: { created: 0, existing: 0 },
    }

    // Check if sections already exist
    const existingSections = await db.floorSection.findMany()
    
    if (existingSections.length === 0) {
      // Create default sections
      const sectionsData = [
        { id: `section-${Date.now()}-main`, name: 'Main Dining', color: '#00897B' },
        { id: `section-${Date.now()}-patio`, name: 'Patio', color: '#4CAF50' },
        { id: `section-${Date.now()}-bar`, name: 'Bar Area', color: '#FF9800' },
      ]

      for (const section of sectionsData) {
        await db.floorSection.create({
          data: {
            id: section.id,
            name: section.name,
            color: section.color,
            updatedAt: new Date(),
          },
        })
        results.sections.created++
      }

      // Create tables for Main Dining section
      const mainSectionId = sectionsData[0].id
      const tablesData = [
        // Row 1 - Round tables
        { number: '1', shape: 'circle', x: 80, y: 80, width: 55, height: 55, seats: 4, sectionId: mainSectionId },
        { number: '2', shape: 'circle', x: 200, y: 80, width: 55, height: 55, seats: 4, sectionId: mainSectionId },
        { number: '3', shape: 'circle', x: 320, y: 80, width: 55, height: 55, seats: 4, sectionId: mainSectionId },
        { number: '4', shape: 'circle', x: 440, y: 80, width: 55, height: 55, seats: 4, sectionId: mainSectionId },
        // Row 2 - Square tables
        { number: '5', shape: 'square', x: 80, y: 200, width: 50, height: 50, seats: 2, sectionId: mainSectionId },
        { number: '6', shape: 'square', x: 200, y: 200, width: 50, height: 50, seats: 2, sectionId: mainSectionId },
        { number: '7', shape: 'square', x: 320, y: 200, width: 50, height: 50, seats: 2, sectionId: mainSectionId },
        { number: '8', shape: 'square', x: 440, y: 200, width: 50, height: 50, seats: 2, sectionId: mainSectionId },
        // Row 3 - Rectangle tables
        { number: '9', shape: 'rectangle', x: 80, y: 320, width: 80, height: 50, seats: 6, sectionId: mainSectionId },
        { number: '10', shape: 'rectangle', x: 200, y: 320, width: 80, height: 50, seats: 6, sectionId: mainSectionId },
        { number: '11', shape: 'rectangle', x: 320, y: 320, width: 80, height: 50, seats: 6, sectionId: mainSectionId },
        { number: '12', shape: 'rectangle', x: 440, y: 320, width: 80, height: 50, seats: 6, sectionId: mainSectionId },
        // Row 4 - Booths
        { number: 'B1', shape: 'booth', x: 80, y: 440, width: 85, height: 55, seats: 4, sectionId: mainSectionId },
        { number: 'B2', shape: 'booth', x: 200, y: 440, width: 85, height: 55, seats: 4, sectionId: mainSectionId },
        { number: 'B3', shape: 'booth', x: 320, y: 440, width: 85, height: 55, seats: 4, sectionId: mainSectionId },
        { number: 'B4', shape: 'booth', x: 440, y: 440, width: 85, height: 55, seats: 4, sectionId: mainSectionId },
      ]

      for (const table of tablesData) {
        await db.restaurantTable.create({
          data: {
            id: `table-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            number: table.number,
            shape: table.shape,
            x: table.x,
            y: table.y,
            width: table.width,
            height: table.height,
            seats: table.seats,
            status: 'available',
            sectionId: table.sectionId,
            updatedAt: new Date(),
          },
        })
        results.tables.created++
      }

      // Create tables for Patio section
      const patioSectionId = sectionsData[1].id
      const patioTables = [
        { number: 'P1', shape: 'circle', x: 80, y: 80, width: 60, height: 60, seats: 4, sectionId: patioSectionId },
        { number: 'P2', shape: 'circle', x: 200, y: 80, width: 60, height: 60, seats: 4, sectionId: patioSectionId },
        { number: 'P3', shape: 'circle', x: 80, y: 200, width: 60, height: 60, seats: 4, sectionId: patioSectionId },
        { number: 'P4', shape: 'circle', x: 200, y: 200, width: 60, height: 60, seats: 4, sectionId: patioSectionId },
        { number: 'P5', shape: 'rectangle', x: 80, y: 320, width: 100, height: 60, seats: 8, sectionId: patioSectionId },
      ]

      for (const table of patioTables) {
        await db.restaurantTable.create({
          data: {
            id: `table-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            number: table.number,
            shape: table.shape,
            x: table.x,
            y: table.y,
            width: table.width,
            height: table.height,
            seats: table.seats,
            status: 'available',
            sectionId: table.sectionId,
            updatedAt: new Date(),
          },
        })
        results.tables.created++
      }

      // Create tables for Bar section
      const barSectionId = sectionsData[2].id
      const barTables = [
        { number: 'BAR1', shape: 'square', x: 80, y: 80, width: 35, height: 35, seats: 1, sectionId: barSectionId },
        { number: 'BAR2', shape: 'square', x: 130, y: 80, width: 35, height: 35, seats: 1, sectionId: barSectionId },
        { number: 'BAR3', shape: 'square', x: 180, y: 80, width: 35, height: 35, seats: 1, sectionId: barSectionId },
        { number: 'BAR4', shape: 'square', x: 230, y: 80, width: 35, height: 35, seats: 1, sectionId: barSectionId },
        { number: 'BAR5', shape: 'square', x: 280, y: 80, width: 35, height: 35, seats: 1, sectionId: barSectionId },
        { number: 'BAR6', shape: 'square', x: 330, y: 80, width: 35, height: 35, seats: 1, sectionId: barSectionId },
        { number: 'BT1', shape: 'circle', x: 100, y: 180, width: 45, height: 45, seats: 2, sectionId: barSectionId },
        { number: 'BT2', shape: 'circle', x: 200, y: 180, width: 45, height: 45, seats: 2, sectionId: barSectionId },
        { number: 'BT3', shape: 'circle', x: 300, y: 180, width: 45, height: 45, seats: 2, sectionId: barSectionId },
      ]

      for (const table of barTables) {
        await db.restaurantTable.create({
          data: {
            id: `table-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            number: table.number,
            shape: table.shape,
            x: table.x,
            y: table.y,
            width: table.width,
            height: table.height,
            seats: table.seats,
            status: 'available',
            sectionId: table.sectionId,
            updatedAt: new Date(),
          },
        })
        results.tables.created++
      }
    } else {
      results.sections.existing = existingSections.length
      const existingTables = await db.restaurantTable.findMany()
      results.tables.existing = existingTables.length
    }

    // Check if servers already exist
    const existingServers = await db.server.findMany()
    
    if (existingServers.length === 0) {
      // Create default servers
      const serversData = [
        { name: 'Thabo M.', status: 'active' },
        { name: 'Nomsa K.', status: 'active' },
        { name: 'Johan P.', status: 'active' },
        { name: 'Sarah L.', status: 'break' },
      ]

      for (const server of serversData) {
        await db.server.create({
          data: {
            id: `server-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            name: server.name,
            status: server.status,
            updatedAt: new Date(),
          },
        })
        results.servers.created++
      }
    } else {
      results.servers.existing = existingServers.length
    }

    return NextResponse.json({
      success: true,
      message: 'Floor plan seed data initialized successfully',
      results,
    })
  } catch (error) {
    console.error('Error seeding floor plan data:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to seed floor plan data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // Get current floor plan stats
    const sections = await db.floorSection.findMany({
      include: {
        RestaurantTable: true,
      },
    })
    
    const servers = await db.server.findMany()
    
    return NextResponse.json({
      success: true,
      data: {
        sections: sections.length,
        tables: sections.reduce((sum, s) => sum + s.RestaurantTable.length, 0),
        servers: servers.length,
        sectionsData: sections.map(s => ({
          id: s.id,
          name: s.name,
          color: s.color,
          tables: s.RestaurantTable.length,
        })),
      },
    })
  } catch (error) {
    console.error('Error fetching floor plan stats:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch floor plan stats' },
      { status: 500 }
    )
  }
}
