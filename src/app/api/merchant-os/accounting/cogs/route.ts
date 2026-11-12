import { NextRequest, NextResponse } from 'next/server'

// Types
interface COGSEntry {
  id: string
  date: string
  productId: string
  productName: string
  sku: string
  category: string
  quantity: number
  unitCost: number
  totalCost: number
  saleId?: string
  movementType: 'sale' | 'adjustment' | 'variance'
}

interface COGSSummary {
  category: string
  totalCost: number
  quantity: number
  percentage: number
}

interface DailyCOGS {
  date: string
  totalCost: number
  transactionCount: number
  avgTransaction: number
}

// GET /api/merchant-os/accounting/cogs - Get COGS report
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const startDate = searchParams.get('startDate') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const endDate = searchParams.get('endDate') || new Date().toISOString().split('T')[0]
    const category = searchParams.get('category')
    const groupBy = searchParams.get('groupBy') || 'category' // 'category', 'product', 'daily'

    // Generate mock COGS data
    const cogsEntries = generateCOGSData(startDate, endDate, category)

    if (groupBy === 'daily') {
      // Group by day
      const dailyMap = new Map<string, { cost: number; count: number }>()
      
      cogsEntries.forEach(entry => {
        const existing = dailyMap.get(entry.date) || { cost: 0, count: 0 }
        dailyMap.set(entry.date, {
          cost: existing.cost + entry.totalCost,
          count: existing.count + 1
        })
      })

      const dailyCOGS: DailyCOGS[] = Array.from(dailyMap.entries())
        .map(([date, data]) => ({
          date,
          totalCost: data.cost,
          transactionCount: data.count,
          avgTransaction: data.cost / data.count
        }))
        .sort((a, b) => a.date.localeCompare(b.date))

      return NextResponse.json({
        groupBy: 'daily',
        period: { startDate, endDate },
        dailyCOGS,
        summary: {
          totalCost: dailyCOGS.reduce((sum, d) => sum + d.totalCost, 0),
          totalTransactions: dailyCOGS.reduce((sum, d) => sum + d.transactionCount, 0),
          avgDailyCost: dailyCOGS.reduce((sum, d) => sum + d.totalCost, 0) / dailyCOGS.length
        }
      })
    }

    if (groupBy === 'product') {
      // Group by product
      const productMap = new Map<string, { 
        entries: COGSEntry[]; 
        totalCost: number; 
        totalQty: number 
      }>()
      
      cogsEntries.forEach(entry => {
        const existing = productMap.get(entry.productId) || { entries: [], totalCost: 0, totalQty: 0 }
        existing.entries.push(entry)
        existing.totalCost += entry.totalCost
        existing.totalQty += entry.quantity
        productMap.set(entry.productId, existing)
      })

      const products = Array.from(productMap.entries())
        .map(([productId, data]) => ({
          productId,
          productName: data.entries[0].productName,
          sku: data.entries[0].sku,
          category: data.entries[0].category,
          totalQuantity: data.totalQty,
          avgUnitCost: data.totalCost / data.totalQty,
          totalCost: data.totalCost,
          transactionCount: data.entries.length
        }))
        .sort((a, b) => b.totalCost - a.totalCost)

      return NextResponse.json({
        groupBy: 'product',
        period: { startDate, endDate },
        products,
        summary: {
          totalCost: products.reduce((sum, p) => sum + p.totalCost, 0),
          totalQuantity: products.reduce((sum, p) => sum + p.totalQuantity, 0),
          productCount: products.length
        }
      })
    }

    // Default: Group by category
    const totalCost = cogsEntries.reduce((sum, e) => sum + e.totalCost, 0)
    const categoryMap = new Map<string, { cost: number; qty: number }>()
    
    cogsEntries.forEach(entry => {
      const existing = categoryMap.get(entry.category) || { cost: 0, qty: 0 }
      categoryMap.set(entry.category, {
        cost: existing.cost + entry.totalCost,
        qty: existing.qty + entry.quantity
      })
    })

    const cogsByCategory: COGSSummary[] = Array.from(categoryMap.entries())
      .map(([cat, data]) => ({
        category: cat,
        totalCost: data.cost,
        quantity: data.qty,
        percentage: totalCost > 0 ? (data.cost / totalCost) * 100 : 0
      }))
      .sort((a, b) => b.totalCost - a.totalCost)

    return NextResponse.json({
      groupBy: 'category',
      period: { startDate, endDate },
      cogsByCategory,
      entries: cogsEntries.slice(0, 100), // Limit entries returned
      summary: {
        totalCost,
        totalQuantity: cogsEntries.reduce((sum, e) => sum + e.quantity, 0),
        transactionCount: cogsEntries.length,
        avgUnitCost: totalCost / cogsEntries.reduce((sum, e) => sum + e.quantity, 0)
      }
    })
  } catch (error) {
    console.error('Error fetching COGS data:', error)
    return NextResponse.json({ error: 'Failed to fetch COGS data' }, { status: 500 })
  }
}

// Helper: Generate mock COGS data
function generateCOGSData(startDate: string, endDate: string, categoryFilter?: string | null): COGSEntry[] {
  const products = [
    { name: 'Beef Patty (Frozen)', sku: 'ING-BP-001', category: 'Ingredients', unitCost: 12.00 },
    { name: 'Burger Buns (6-pack)', sku: 'ING-BB-001', category: 'Ingredients', unitCost: 14.00 },
    { name: 'Cheddar Cheese Slices', sku: 'ING-CS-001', category: 'Ingredients', unitCost: 5.20 },
    { name: 'Coca-Cola 500ml', sku: 'BEV-CC-001', category: 'Beverages', unitCost: 9.50 },
    { name: 'Fanta 500ml', sku: 'BEV-FA-001', category: 'Beverages', unitCost: 9.50 },
    { name: 'Chicken Wings (Frozen)', sku: 'CHK-WI-001', category: 'Chicken', unitCost: 42.00 },
    { name: 'Frozen Chips 2kg', sku: 'ING-FC-001', category: 'Ingredients', unitCost: 28.00 },
    { name: 'Cooking Oil 5L', sku: 'ING-CO-001', category: 'Ingredients', unitCost: 89.00 },
  ]

  const start = new Date(startDate)
  const end = new Date(endDate)
  const days = Math.floor((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1

  const entries: COGSEntry[] = []
  let entryId = 1

  for (let d = 0; d < days; d++) {
    const date = new Date(start.getTime() + d * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    
    // Generate 5-15 entries per day
    const entriesPerDay = 5 + Math.floor(Math.random() * 11)
    
    for (let i = 0; i < entriesPerDay; i++) {
      const product = products[Math.floor(Math.random() * products.length)]
      
      if (categoryFilter && product.category !== categoryFilter) continue

      const quantity = 5 + Math.floor(Math.random() * 50)
      const unitCostVariation = product.unitCost * (0.95 + Math.random() * 0.1) // +/- 5%
      const totalCost = quantity * unitCostVariation
      
      const types: COGSEntry['movementType'][] = ['sale', 'sale', 'sale', 'sale', 'adjustment']
      
      entries.push({
        id: `COGS-${String(entryId++).padStart(6, '0')}`,
        date,
        productId: `PROD-${String(products.indexOf(product) + 1).padStart(4, '0')}`,
        productName: product.name,
        sku: product.sku,
        category: product.category,
        quantity,
        unitCost: Math.round(unitCostVariation * 100) / 100,
        totalCost: Math.round(totalCost * 100) / 100,
        saleId: `SALE-${Math.floor(Math.random() * 10000)}`,
        movementType: types[Math.floor(Math.random() * types.length)]
      })
    }
  }

  return entries
}
