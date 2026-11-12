import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/grosupply/suggest-suppliers - Get suggested suppliers for given SKUs
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { skus, vertical, subVertical } = body

    if (!skus || !Array.isArray(skus) || skus.length === 0) {
      return NextResponse.json({ error: 'SKUs array is required' }, { status: 400 })
    }

    // Find suppliers that can fulfill the requested SKUs
    const supplierProducts = await db.supplierProduct.findMany({
      where: {
        sku: { in: skus }
      },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            tier: true,
            bbbeeLevel: true,
            website: true,
            deliveryDays: true,
            minOrderUnit: true,
            minOrderValue: true,
            rating: true,
            reviewCount: true,
            verticals: true,
            subVerticals: true
          }
        }
      }
    })

    // Group by supplier
    const supplierMap = new Map<string, {
      supplier: typeof supplierProducts[0]['supplier']
      products: typeof supplierProducts
      canFulfillAll: boolean
      totalCost: number
      avgLeadDays: number
    }>()

    for (const sp of supplierProducts) {
      if (!supplierMap.has(sp.supplierId)) {
        supplierMap.set(sp.supplierId, {
          supplier: sp.supplier,
          products: [],
          canFulfillAll: false,
          totalCost: 0,
          avgLeadDays: 0
        })
      }
      
      const entry = supplierMap.get(sp.supplierId)
      if (entry) {
        entry.products.push(sp)
        entry.totalCost += sp.costPrice
      }
    }

    // Calculate if each supplier can fulfill all requested SKUs
    for (const entry of supplierMap.values()) {
      entry.canFulfillAll = entry.products.length === skus.length
      entry.avgLeadDays = Math.round(
        entry.products.reduce((sum, p) => sum + (p.leadDays || 3), 0) / entry.products.length
      )
    }

    // Sort suppliers by: 1) Can fulfill all, 2) Tier (gold > silver > bronze), 3) Total cost
    const tierOrder = { platinum: 0, gold: 1, silver: 2, bronze: 3 }
    const suggestions = Array.from(supplierMap.values()).sort((a, b) => {
      // Prioritize suppliers that can fulfill all
      if (a.canFulfillAll !== b.canFulfillAll) {
        return a.canFulfillAll ? -1 : 1
      }
      // Then by tier
      const tierA = tierOrder[a.supplier.tier as keyof typeof tierOrder] ?? 4
      const tierB = tierOrder[b.supplier.tier as keyof typeof tierOrder] ?? 4
      if (tierA !== tierB) {
        return tierA - tierB
      }
      // Then by cost
      return a.totalCost - b.totalCost
    })

    return NextResponse.json({ 
      suggestions: suggestions.map(s => ({
        ...s,
        supplier: {
          ...s.supplier,
          verticals: s.supplier.verticals ? JSON.parse(s.supplier.verticals) : [],
          subVerticals: s.supplier.subVerticals ? JSON.parse(s.supplier.subVerticals) : []
        }
      })),
      requestedSKUs: skus,
      totalSuppliers: suggestions.length
    })
  } catch (error) {
    console.error('Error suggesting suppliers:', error)
    return NextResponse.json({ error: 'Failed to suggest suppliers' }, { status: 500 })
  }
}

// GET /api/grosupply/suggest-suppliers - Get suppliers by vertical/sub-vertical
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const vertical = searchParams.get('vertical')
    const subVertical = searchParams.get('subVertical')

    if (!vertical) {
      return NextResponse.json({ error: 'Vertical parameter is required' }, { status: 400 })
    }

    const where: Record<string, unknown> = {
      verticals: { contains: vertical }
    }

    if (subVertical) {
      where.subVerticals = { contains: subVertical }
    }

    const suppliers = await db.supplier.findMany({
      where,
      orderBy: [
        { tier: 'asc' },
        { name: 'asc' }
      ],
      include: {
        _count: {
          select: {
            products: true,
            purchaseOrders: true
          }
        }
      }
    })

    // Parse JSON fields
    const processedSuppliers = suppliers.map(supplier => ({
      ...supplier,
      verticals: supplier.verticals ? JSON.parse(supplier.verticals) : [],
      subVerticals: supplier.subVerticals ? JSON.parse(supplier.subVerticals) : []
    }))

    return NextResponse.json({ 
      suppliers: processedSuppliers,
      total: processedSuppliers.length 
    })
  } catch (error) {
    console.error('Error fetching suppliers by vertical:', error)
    return NextResponse.json({ error: 'Failed to fetch suppliers' }, { status: 500 })
  }
}
