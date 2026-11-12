import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/grosupply/suppliers - List all suppliers with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tier = searchParams.get('tier')
    const vertical = searchParams.get('vertical')
    const subVertical = searchParams.get('subVertical')
    const status = searchParams.get('status') || 'active'
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build where clause
    const where: Record<string, unknown> = { status }
    
    if (tier && tier !== 'all') {
      where.tier = tier
    }
    
    // Filter by vertical (stored as JSON array string)
    if (vertical && vertical !== 'all') {
      where.verticals = { contains: vertical }
    }
    
    // Filter by sub-vertical
    if (subVertical && subVertical !== 'all') {
      where.subVerticals = { contains: subVertical }
    }
    
    // Search by name
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search } }
      ]
    }

    const suppliers = await db.supplier.findMany({
      where,
      orderBy: [
        { tier: 'asc' },
        { rating: 'desc' }
      ],
      take: limit,
      skip: offset
    })
    
    const total = await db.supplier.count({ where })

    // Transform suppliers for frontend - parse JSON fields
    const transformedSuppliers = suppliers.map(s => {
      const transformed = s as Record<string, unknown>
      transformed.verticals = s.verticals ? JSON.parse(s.verticals as string) : []
      transformed.subVerticals = s.subVerticals ? JSON.parse(s.subVerticals as string) : []
      return transformed
    })

    return NextResponse.json({
      suppliers: transformedSuppliers,
      total,
      limit,
      offset
    })
  } catch (error) {
    console.error('Error fetching suppliers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch suppliers' },
      { status: 500 }
    )
  }
}

// POST /api/grosupply/suppliers - Create a new supplier
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const supplier = await db.supplier.create({
      data: {
        name: data.name,
        code: data.code,
        contactPerson: data.contactPerson,
        email: data.email,
        phone: data.phone,
        address: data.address,
        city: data.city,
        province: data.province,
        postalCode: data.postalCode,
        tier: data.tier || 'bronze',
        rating: data.rating || 0,
        reviewCount: 0,
        deliveryDays: data.deliveryDays || 3,
        minOrderValue: data.minOrderValue || 0,
        paymentTerms: data.paymentTerms || 'net30',
        categories: data.categories,
        bbbeeLevel: data.bbbeeLevel,
        bbbeeExempt: data.bbbeeExempt || false,
        supplierType: data.supplierType,
        verticals: data.verticals ? JSON.stringify(data.verticals) : null,
        subVerticals: data.subVerticals ? JSON.stringify(data.subVerticals) : null,
        website: data.website,
        notes: data.notes,
        status: 'active',
        verificationStatus: 'pending'
      }
    })

    return NextResponse.json({ supplier }, { status: 201 })
  } catch (error) {
    console.error('Error creating supplier:', error)
    return NextResponse.json(
      { error: 'Failed to create supplier' },
      { status: 500 }
    )
  }
}
