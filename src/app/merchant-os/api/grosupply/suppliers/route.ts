import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/grosupply/suppliers - List all suppliers with vertical filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const tier = searchParams.get('tier')
    const search = searchParams.get('search')
    const vertical = searchParams.get('vertical')
    const subVertical = searchParams.get('subVertical')

    // Build where clause
    const where: {
      status?: string
      tier?: string
      OR?: Array<{
        name?: { contains: string; mode: 'insensitive' }
        code?: { contains: string; mode: 'insensitive' }
        contactPerson?: { contains: string; mode: 'insensitive' }
      }>
      AND?: Array<{
        OR?: Array<{
          verticals?: { contains: string }
          subVerticals?: { contains: string }
        }>
        verticals?: { contains: string }
        subVerticals?: { contains: string }
      }>
    } = {}

    if (status) where.status = status
    if (tier) where.tier = tier
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { contactPerson: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Filter by vertical - suppliers must serve this vertical
    // Uses JSON string contains check (stored as JSON array string)
    if (vertical || subVertical) {
      const verticalConditions: Array<{ OR?: Array<{ verticals?: { contains: string }; subVerticals?: { contains: string } }> }> = []
      
      if (vertical) {
        // Check if supplier serves this vertical (or serves all verticals if not specified)
        verticalConditions.push({
          OR: [
            { verticals: { contains: vertical } },
            { verticals: null }, // Include suppliers with no vertical restriction
            { verticals: '' }
          ]
        })
      }
      
      if (subVertical) {
        verticalConditions.push({
          OR: [
            { subVerticals: { contains: subVertical } },
            { subVerticals: null }, // Include suppliers with no sub-vertical restriction
            { subVerticals: '' }
          ]
        })
      }
      
      if (verticalConditions.length > 0) {
        where.AND = verticalConditions
      }
    }

    const suppliers = await db.supplier.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            PurchaseOrder: true,
            SupplierQuote: true,
            RFQ: true
          }
        }
      }
    })

    // Transform suppliers to parse JSON fields
    const transformedSuppliers = suppliers.map(supplier => ({
      ...supplier,
      categories: supplier.categories ? JSON.parse(supplier.categories) : [],
      verticals: supplier.verticals ? JSON.parse(supplier.verticals) : [],
      subVerticals: supplier.subVerticals ? JSON.parse(supplier.subVerticals) : []
    }))

    return NextResponse.json({ suppliers: transformedSuppliers })
  } catch (error) {
    console.error('Error fetching suppliers:', error)
    return NextResponse.json({ error: 'Failed to fetch suppliers' }, { status: 500 })
  }
}

// POST /api/grosupply/suppliers - Create a new supplier
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Generate supplier code if not provided
    const code = body.code || `SUP-${Date.now().toString(36).toUpperCase()}`

    const supplier = await db.supplier.create({
      data: {
        name: body.name,
        code,
        contactPerson: body.contactPerson,
        email: body.email,
        phone: body.phone,
        website: body.website,
        address: body.address,
        city: body.city,
        province: body.province,
        postalCode: body.postalCode,
        bankName: body.bankName,
        bankAccount: body.bankAccount,
        bankBranch: body.bankBranch,
        supplierType: body.supplierType || 'distributor',
        tier: body.tier || 'bronze',
        bbbeeLevel: body.bbbeeLevel,
        deliveryDays: body.deliveryDays || 3,
        minOrderValue: body.minOrderValue || 0,
        minOrderUnit: body.minOrderUnit,
        paymentTerms: body.paymentTerms || 'net30',
        categories: body.categories ? JSON.stringify(body.categories) : null,
        verticals: body.verticals ? JSON.stringify(body.verticals) : null,
        subVerticals: body.subVerticals ? JSON.stringify(body.subVerticals) : null,
        fulfillmentRate: body.fulfillmentRate || 95.0,
        notes: body.notes,
        status: body.status || 'active',
        verificationStatus: body.verificationStatus || 'pending'
      }
    })

    return NextResponse.json({ supplier }, { status: 201 })
  } catch (error) {
    console.error('Error creating supplier:', error)
    return NextResponse.json({ error: 'Failed to create supplier' }, { status: 500 })
  }
}

// PUT /api/grosupply/suppliers - Bulk update suppliers
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { ids, tier, status } = body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Supplier IDs are required' }, { status: 400 })
    }

    const updateData: { tier?: string; status?: string } = {}
    if (tier) updateData.tier = tier
    if (status) updateData.status = status

    const result = await db.supplier.updateMany({
      where: { id: { in: ids } },
      data: updateData
    })

    return NextResponse.json({ updated: result.count })
  } catch (error) {
    console.error('Error updating suppliers:', error)
    return NextResponse.json({ error: 'Failed to update suppliers' }, { status: 500 })
  }
}
