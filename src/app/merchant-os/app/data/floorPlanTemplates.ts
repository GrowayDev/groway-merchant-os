// Floor Plan Layout Templates for Different Restaurant Types

export type TableShape = 'circle' | 'square' | 'rectangle' | 'booth'

export interface FloorPlanTemplateTable {
  number: string
  shape: TableShape
  x: number
  y: number
  width: number
  height: number
  seats: number
  serverId?: string
  minSpending?: number
}

export interface FloorPlanTemplateSection {
  name: string
  color: string
  tables: FloorPlanTemplateTable[]
}

export interface FloorPlanTemplate {
  id: string
  name: string
  description: string
  icon: string
  tableCount: number
  sections: FloorPlanTemplateSection[]
}

// Helper function to generate table positions in a grid
function generateGridTables(
  startX: number,
  startY: number,
  rows: number,
  cols: number,
  spacingX: number,
  spacingY: number,
  shape: TableShape,
  seats: number,
  startNumber: number = 1,
  width: number = 50,
  height: number = 50
): FloorPlanTemplateTable[] {
  const tables: FloorPlanTemplateTable[] = []
  let num = startNumber
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      tables.push({
        number: `${num}`,
        shape,
        x: startX + col * spacingX,
        y: startY + row * spacingY,
        width,
        height,
        seats,
      })
      num++
    }
  }
  
  return tables
}

// 1. Fine Dining (20 tables) - Elegant spacing, round tables, private sections
const fineDiningTemplate: FloorPlanTemplate = {
  id: 'fine-dining',
  name: 'Fine Dining',
  description: 'Elegant spacing with round tables and private dining sections. Perfect for upscale restaurants.',
  icon: 'Wine',
  tableCount: 20,
  sections: [
    {
      name: 'Main Dining',
      color: '#00897B',
      tables: [
        // Center cluster of round tables
        ...generateGridTables(100, 100, 2, 4, 120, 120, 'circle', 4, 1, 55, 55),
        // Additional round tables
        { number: '9', shape: 'circle', x: 100, y: 350, width: 55, height: 55, seats: 4 },
        { number: '10', shape: 'circle', x: 250, y: 350, width: 55, height: 55, seats: 4 },
        { number: '11', shape: 'circle', x: 400, y: 350, width: 55, height: 55, seats: 4 },
        { number: '12', shape: 'circle', x: 550, y: 350, width: 55, height: 55, seats: 4 },
      ],
    },
    {
      name: 'Private Room',
      color: '#9C27B0',
      tables: [
        { number: 'P1', shape: 'circle', x: 100, y: 100, width: 60, height: 60, seats: 6, minSpending: 500 },
        { number: 'P2', shape: 'circle', x: 200, y: 100, width: 60, height: 60, seats: 6, minSpending: 500 },
        { number: 'P3', shape: 'rectangle', x: 100, y: 200, width: 90, height: 60, seats: 8, minSpending: 1000 },
      ],
    },
    {
      name: 'Wine Cellar',
      color: '#7B1FA2',
      tables: [
        { number: 'W1', shape: 'circle', x: 100, y: 100, width: 50, height: 50, seats: 2, minSpending: 300 },
        { number: 'W2', shape: 'circle', x: 200, y: 100, width: 50, height: 50, seats: 2, minSpending: 300 },
        { number: 'W3', shape: 'circle', x: 100, y: 180, width: 50, height: 50, seats: 2, minSpending: 300 },
        { number: 'W4', shape: 'circle', x: 200, y: 180, width: 50, height: 50, seats: 2, minSpending: 300 },
      ],
    },
  ],
}

// 2. Casual Restaurant (30 tables) - Mix of 2-tops and 4-tops, open layout
const casualRestaurantTemplate: FloorPlanTemplate = {
  id: 'casual-restaurant',
  name: 'Casual Restaurant',
  description: 'Open layout with mix of 2-tops and 4-tops. Great for family dining.',
  icon: 'UtensilsCrossed',
  tableCount: 30,
  sections: [
    {
      name: 'Main Floor',
      color: '#4CAF50',
      tables: [
        // 2-tops
        ...generateGridTables(50, 50, 3, 5, 110, 100, 'square', 2, 1, 40, 40),
        // 4-tops
        ...generateGridTables(50, 350, 3, 5, 110, 110, 'square', 4, 16, 50, 50),
      ],
    },
    {
      name: 'Patio',
      color: '#00BCD4',
      tables: [
        ...generateGridTables(50, 50, 2, 3, 130, 120, 'circle', 4, 25, 55, 55),
        { number: '31', shape: 'rectangle', x: 450, y: 50, width: 80, height: 50, seats: 6 },
        { number: '32', shape: 'rectangle', x: 450, y: 170, width: 80, height: 50, seats: 6 },
      ],
    },
  ],
}

// 3. Fast Food/QSR (15 tables) - Counter seating + small tables
const fastFoodTemplate: FloorPlanTemplate = {
  id: 'fast-food',
  name: 'Fast Food / QSR',
  description: 'Quick service layout with counter seating and small tables for fast turnover.',
  icon: 'CookingPot',
  tableCount: 15,
  sections: [
    {
      name: 'Counter Area',
      color: '#FF9800',
      tables: [
        // Counter/bar seating
        { number: 'C1', shape: 'square', x: 50, y: 50, width: 35, height: 35, seats: 1 },
        { number: 'C2', shape: 'square', x: 95, y: 50, width: 35, height: 35, seats: 1 },
        { number: 'C3', shape: 'square', x: 140, y: 50, width: 35, height: 35, seats: 1 },
        { number: 'C4', shape: 'square', x: 185, y: 50, width: 35, height: 35, seats: 1 },
        { number: 'C5', shape: 'square', x: 230, y: 50, width: 35, height: 35, seats: 1 },
        { number: 'C6', shape: 'square', x: 275, y: 50, width: 35, height: 35, seats: 1 },
        { number: 'C7', shape: 'square', x: 320, y: 50, width: 35, height: 35, seats: 1 },
        { number: 'C8', shape: 'square', x: 365, y: 50, width: 35, height: 35, seats: 1 },
      ],
    },
    {
      name: 'Dining Area',
      color: '#FFC107',
      tables: [
        // Small square tables
        ...generateGridTables(50, 150, 2, 4, 100, 100, 'square', 2, 1, 40, 40),
        { number: '9', shape: 'square', x: 50, y: 350, width: 45, height: 45, seats: 4 },
        { number: '10', shape: 'square', x: 150, y: 350, width: 45, height: 45, seats: 4 },
        { number: '11', shape: 'square', x: 250, y: 350, width: 45, height: 45, seats: 4 },
      ],
    },
  ],
}

// 4. Coffee Shop (12 tables) - Small tables, bar counter
const coffeeShopTemplate: FloorPlanTemplate = {
  id: 'coffee-shop',
  name: 'Coffee Shop',
  description: 'Cozy layout with small tables and counter seating. Perfect for cafes.',
  icon: 'Coffee',
  tableCount: 12,
  sections: [
    {
      name: 'Counter',
      color: '#795548',
      tables: [
        // Bar counter seating
        { number: 'B1', shape: 'square', x: 50, y: 50, width: 30, height: 30, seats: 1 },
        { number: 'B2', shape: 'square', x: 90, y: 50, width: 30, height: 30, seats: 1 },
        { number: 'B3', shape: 'square', x: 130, y: 50, width: 30, height: 30, seats: 1 },
        { number: 'B4', shape: 'square', x: 170, y: 50, width: 30, height: 30, seats: 1 },
        { number: 'B5', shape: 'square', x: 210, y: 50, width: 30, height: 30, seats: 1 },
      ],
    },
    {
      name: 'Seating Area',
      color: '#8D6E63',
      tables: [
        // Small round tables
        { number: '1', shape: 'circle', x: 50, y: 150, width: 40, height: 40, seats: 2 },
        { number: '2', shape: 'circle', x: 150, y: 150, width: 40, height: 40, seats: 2 },
        { number: '3', shape: 'circle', x: 250, y: 150, width: 40, height: 40, seats: 2 },
        { number: '4', shape: 'circle', x: 50, y: 250, width: 40, height: 40, seats: 2 },
        { number: '5', shape: 'circle', x: 150, y: 250, width: 40, height: 40, seats: 2 },
        { number: '6', shape: 'circle', x: 250, y: 250, width: 40, height: 40, seats: 2 },
        { number: '7', shape: 'circle', x: 100, y: 350, width: 45, height: 45, seats: 4 },
      ],
    },
  ],
}

// 5. Bar/Pub (25 tables) - High tables, bar seating, booth sections
const barPubTemplate: FloorPlanTemplate = {
  id: 'bar-pub',
  name: 'Bar / Pub',
  description: 'Layout with bar seating, high tables, and booth sections. Great for nightlife.',
  icon: 'Beer',
  tableCount: 25,
  sections: [
    {
      name: 'Bar Area',
      color: '#E91E63',
      tables: [
        // Bar counter
        ...generateGridTables(50, 50, 1, 10, 50, 0, 'square', 1, 1, 30, 30),
        // High tables behind bar
        { number: '11', shape: 'circle', x: 50, y: 150, width: 45, height: 45, seats: 2 },
        { number: '12', shape: 'circle', x: 150, y: 150, width: 45, height: 45, seats: 2 },
        { number: '13', shape: 'circle', x: 250, y: 150, width: 45, height: 45, seats: 2 },
        { number: '14', shape: 'circle', x: 350, y: 150, width: 45, height: 45, seats: 2 },
        { number: '15', shape: 'circle', x: 450, y: 150, width: 45, height: 45, seats: 2 },
      ],
    },
    {
      name: 'Booths',
      color: '#9C27B0',
      tables: [
        // Booth seating
        { number: 'B1', shape: 'booth', x: 50, y: 50, width: 80, height: 50, seats: 4 },
        { number: 'B2', shape: 'booth', x: 180, y: 50, width: 80, height: 50, seats: 4 },
        { number: 'B3', shape: 'booth', x: 310, y: 50, width: 80, height: 50, seats: 4 },
        { number: 'B4', shape: 'booth', x: 440, y: 50, width: 80, height: 50, seats: 4 },
        { number: 'B5', shape: 'booth', x: 50, y: 130, width: 80, height: 50, seats: 4 },
        { number: 'B6', shape: 'booth', x: 180, y: 130, width: 80, height: 50, seats: 4 },
        { number: 'B7', shape: 'booth', x: 310, y: 130, width: 80, height: 50, seats: 4 },
        { number: 'B8', shape: 'booth', x: 440, y: 130, width: 80, height: 50, seats: 4 },
      ],
    },
    {
      name: 'Sports Area',
      color: '#3F51B5',
      tables: [
        { number: 'S1', shape: 'rectangle', x: 50, y: 50, width: 70, height: 50, seats: 4 },
        { number: 'S2', shape: 'rectangle', x: 150, y: 50, width: 70, height: 50, seats: 4 },
      ],
    },
  ],
}

// 6. Family Restaurant (35 tables) - Large tables, kid-friendly sections
const familyRestaurantTemplate: FloorPlanTemplate = {
  id: 'family-restaurant',
  name: 'Family Restaurant',
  description: 'Spacious layout with large tables and kid-friendly sections. Ideal for family dining.',
  icon: 'Users',
  tableCount: 35,
  sections: [
    {
      name: 'Main Dining',
      color: '#4CAF50',
      tables: [
        // Large family tables
        ...generateGridTables(50, 50, 3, 4, 140, 130, 'rectangle', 6, 1, 80, 55),
        // Additional 4-tops
        ...generateGridTables(50, 450, 2, 4, 120, 110, 'square', 4, 13, 55, 55),
      ],
    },
    {
      name: 'Kids Zone',
      color: '#FF9800',
      tables: [
        // Family booths near play area
        { number: 'K1', shape: 'booth', x: 50, y: 50, width: 90, height: 55, seats: 6 },
        { number: 'K2', shape: 'booth', x: 180, y: 50, width: 90, height: 55, seats: 6 },
        { number: 'K3', shape: 'booth', x: 50, y: 140, width: 90, height: 55, seats: 6 },
        { number: 'K4', shape: 'booth', x: 180, y: 140, width: 90, height: 55, seats: 6 },
        { number: 'K5', shape: 'rectangle', x: 320, y: 50, width: 90, height: 60, seats: 8 },
      ],
    },
    {
      name: 'Party Room',
      color: '#E91E63',
      tables: [
        { number: 'P1', shape: 'rectangle', x: 50, y: 50, width: 120, height: 70, seats: 10 },
        { number: 'P2', shape: 'rectangle', x: 200, y: 50, width: 120, height: 70, seats: 10 },
      ],
    },
  ],
}

// 7. Buffet Style (20 tables) - Open layout near food stations
const buffetTemplate: FloorPlanTemplate = {
  id: 'buffet-style',
  name: 'Buffet Style',
  description: 'Open layout designed for easy access to food stations with clear pathways.',
  icon: 'ChefHat',
  tableCount: 20,
  sections: [
    {
      name: 'Buffet Area',
      color: '#FF5722',
      tables: [
        // Tables arranged in arcs around buffet stations
        { number: '1', shape: 'circle', x: 100, y: 80, width: 50, height: 50, seats: 4 },
        { number: '2', shape: 'circle', x: 200, y: 80, width: 50, height: 50, seats: 4 },
        { number: '3', shape: 'circle', x: 300, y: 80, width: 50, height: 50, seats: 4 },
        { number: '4', shape: 'circle', x: 400, y: 80, width: 50, height: 50, seats: 4 },
        { number: '5', shape: 'circle', x: 500, y: 80, width: 50, height: 50, seats: 4 },
        // Second row
        { number: '6', shape: 'circle', x: 150, y: 180, width: 50, height: 50, seats: 4 },
        { number: '7', shape: 'circle', x: 250, y: 180, width: 50, height: 50, seats: 4 },
        { number: '8', shape: 'circle', x: 350, y: 180, width: 50, height: 50, seats: 4 },
        { number: '9', shape: 'circle', x: 450, y: 180, width: 50, height: 50, seats: 4 },
      ],
    },
    {
      name: 'Extended Seating',
      color: '#FF9800',
      tables: [
        // More spread out tables
        { number: '10', shape: 'rectangle', x: 80, y: 50, width: 70, height: 50, seats: 4 },
        { number: '11', shape: 'rectangle', x: 200, y: 50, width: 70, height: 50, seats: 4 },
        { number: '12', shape: 'rectangle', x: 320, y: 50, width: 70, height: 50, seats: 4 },
        { number: '13', shape: 'rectangle', x: 80, y: 140, width: 70, height: 50, seats: 4 },
        { number: '14', shape: 'rectangle', x: 200, y: 140, width: 70, height: 50, seats: 4 },
        { number: '15', shape: 'rectangle', x: 320, y: 140, width: 70, height: 50, seats: 4 },
      ],
    },
    {
      name: 'Private Dining',
      color: '#9C27B0',
      tables: [
        { number: 'P1', shape: 'rectangle', x: 80, y: 80, width: 100, height: 60, seats: 8 },
        { number: 'P2', shape: 'rectangle', x: 220, y: 80, width: 100, height: 60, seats: 8 },
        { number: 'P3', shape: 'circle', x: 150, y: 180, width: 60, height: 60, seats: 6 },
        { number: 'P4', shape: 'circle', x: 280, y: 180, width: 60, height: 60, seats: 6 },
      ],
    },
  ],
}

// 8. Outdoor Patio (15 tables) - Spread out, weather-protected
const outdoorPatioTemplate: FloorPlanTemplate = {
  id: 'outdoor-patio',
  name: 'Outdoor Patio',
  description: 'Spread out layout with umbrellas and weather-protected seating areas.',
  icon: 'Sun',
  tableCount: 15,
  sections: [
    {
      name: 'Open Air',
      color: '#4CAF50',
      tables: [
        // Spaced out tables with umbrellas
        { number: '1', shape: 'circle', x: 80, y: 80, width: 55, height: 55, seats: 4 },
        { number: '2', shape: 'circle', x: 220, y: 80, width: 55, height: 55, seats: 4 },
        { number: '3', shape: 'circle', x: 360, y: 80, width: 55, height: 55, seats: 4 },
        { number: '4', shape: 'circle', x: 80, y: 200, width: 55, height: 55, seats: 4 },
        { number: '5', shape: 'circle', x: 220, y: 200, width: 55, height: 55, seats: 4 },
        { number: '6', shape: 'circle', x: 360, y: 200, width: 55, height: 55, seats: 4 },
        { number: '7', shape: 'circle', x: 80, y: 320, width: 55, height: 55, seats: 4 },
        { number: '8', shape: 'circle', x: 220, y: 320, width: 55, height: 55, seats: 4 },
        { number: '9', shape: 'circle', x: 360, y: 320, width: 55, height: 55, seats: 4 },
      ],
    },
    {
      name: 'Covered Area',
      color: '#607D8B',
      tables: [
        // Covered patio tables
        { number: '10', shape: 'rectangle', x: 80, y: 80, width: 75, height: 50, seats: 4 },
        { number: '11', shape: 'rectangle', x: 200, y: 80, width: 75, height: 50, seats: 4 },
        { number: '12', shape: 'rectangle', x: 80, y: 170, width: 75, height: 50, seats: 4 },
        { number: '13', shape: 'rectangle', x: 200, y: 170, width: 75, height: 50, seats: 4 },
        { number: '14', shape: 'rectangle', x: 80, y: 260, width: 90, height: 55, seats: 6 },
        { number: '15', shape: 'rectangle', x: 210, y: 260, width: 90, height: 55, seats: 6 },
      ],
    },
  ],
}

// 9. Private Dining (8 tables) - Partitioned sections, intimate
const privateDiningTemplate: FloorPlanTemplate = {
  id: 'private-dining',
  name: 'Private Dining',
  description: 'Intimate partitioned sections for exclusive dining experiences.',
  icon: 'Crown',
  tableCount: 8,
  sections: [
    {
      name: 'VIP Room 1',
      color: '#9C27B0',
      tables: [
        { number: 'V1', shape: 'circle', x: 80, y: 80, width: 65, height: 65, seats: 6, minSpending: 800 },
      ],
    },
    {
      name: 'VIP Room 2',
      color: '#7B1FA2',
      tables: [
        { number: 'V2', shape: 'circle', x: 80, y: 80, width: 65, height: 65, seats: 6, minSpending: 800 },
      ],
    },
    {
      name: 'Chef\'s Table',
      color: '#E91E63',
      tables: [
        { number: 'C1', shape: 'rectangle', x: 80, y: 80, width: 150, height: 60, seats: 8, minSpending: 1500 },
        { number: 'C2', shape: 'rectangle', x: 80, y: 180, width: 150, height: 60, seats: 8, minSpending: 1500 },
      ],
    },
    {
      name: 'Wine Room',
      color: '#5D4037',
      tables: [
        { number: 'W1', shape: 'circle', x: 80, y: 80, width: 50, height: 50, seats: 4, minSpending: 500 },
        { number: 'W2', shape: 'circle', x: 180, y: 80, width: 50, height: 50, seats: 4, minSpending: 500 },
        { number: 'W3', shape: 'circle', x: 80, y: 180, width: 50, height: 50, seats: 4, minSpending: 500 },
        { number: 'W4', shape: 'circle', x: 180, y: 180, width: 50, height: 50, seats: 4, minSpending: 500 },
      ],
    },
  ],
}

// 10. Food Court (10 tables) - Linear layout, shared seating
const foodCourtTemplate: FloorPlanTemplate = {
  id: 'food-court',
  name: 'Food Court',
  description: 'Linear layout with shared seating and easy access to food stalls.',
  icon: 'Store',
  tableCount: 10,
  sections: [
    {
      name: 'Central Seating',
      color: '#00BCD4',
      tables: [
        // Long shared tables
        { number: '1', shape: 'rectangle', x: 50, y: 50, width: 200, height: 45, seats: 8 },
        { number: '2', shape: 'rectangle', x: 50, y: 130, width: 200, height: 45, seats: 8 },
        { number: '3', shape: 'rectangle', x: 50, y: 210, width: 200, height: 45, seats: 8 },
        { number: '4', shape: 'rectangle', x: 300, y: 50, width: 200, height: 45, seats: 8 },
        { number: '5', shape: 'rectangle', x: 300, y: 130, width: 200, height: 45, seats: 8 },
        { number: '6', shape: 'rectangle', x: 300, y: 210, width: 200, height: 45, seats: 8 },
      ],
    },
    {
      name: 'Individual Seating',
      color: '#FF9800',
      tables: [
        // Smaller tables
        { number: '7', shape: 'square', x: 50, y: 50, width: 40, height: 40, seats: 2 },
        { number: '8', shape: 'square', x: 130, y: 50, width: 40, height: 40, seats: 2 },
        { number: '9', shape: 'square', x: 50, y: 130, width: 40, height: 40, seats: 2 },
        { number: '10', shape: 'square', x: 130, y: 130, width: 40, height: 40, seats: 2 },
      ],
    },
  ],
}

// Export all templates
export const floorPlanTemplates: FloorPlanTemplate[] = [
  fineDiningTemplate,
  casualRestaurantTemplate,
  fastFoodTemplate,
  coffeeShopTemplate,
  barPubTemplate,
  familyRestaurantTemplate,
  buffetTemplate,
  outdoorPatioTemplate,
  privateDiningTemplate,
  foodCourtTemplate,
]

// Get template by ID
export function getTemplateById(id: string): FloorPlanTemplate | undefined {
  return floorPlanTemplates.find(t => t.id === id)
}

// Get all template names and IDs for quick reference
export function getTemplateList(): { id: string; name: string; icon: string; tableCount: number }[] {
  return floorPlanTemplates.map(t => ({
    id: t.id,
    name: t.name,
    icon: t.icon,
    tableCount: t.tableCount,
  }))
}
