import { NextRequest, NextResponse } from 'next/server'

// GET /api/merchant-os/electronics/warranty - List warranty claims
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Mock data for warranty claims
    const mockClaims = [
      {
        id: 'warranty_001',
        claimNumber: 'WC-2024-00001',
        imei: '359847621234575',
        productId: 'prod_002',
        productName: 'Samsung Galaxy S24 Ultra',
        customerId: 'cust_001',
        customerName: 'John Smith',
        customerPhone: '+27 82 123 4567',
        customerEmail: 'john.smith@email.com',
        purchaseDate: '2024-01-12',
        claimDate: '2024-01-20',
        warrantyMonths: 24,
        warrantyEndDate: '2026-01-12',
        status: 'pending',
        issueDescription: 'Battery drains quickly, only lasts 4 hours on full charge',
        faultCategory: 'battery',
        resolution: null,
        resolvedAt: null,
        replacementIMEI: null,
        notes: 'Customer reported issue started after 1 week of use',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'warranty_002',
        claimNumber: 'WC-2024-00002',
        imei: '359847621234583',
        productId: 'prod_001',
        productName: 'iPhone 15 Pro Max 256GB',
        customerId: 'cust_003',
        customerName: 'Thabo Molefe',
        customerPhone: '+27 79 234 5678',
        customerEmail: 'thabo.m@email.com',
        purchaseDate: '2023-12-15',
        claimDate: '2024-01-18',
        warrantyMonths: 12,
        warrantyEndDate: '2024-12-15',
        status: 'approved',
        issueDescription: 'Screen has dead pixels in the top right corner',
        faultCategory: 'screen',
        resolution: 'Approved for replacement',
        resolvedAt: null,
        replacementIMEI: null,
        notes: 'Photos attached showing defect',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'warranty_003',
        claimNumber: 'WC-2024-00003',
        imei: '359847621234591',
        productId: 'prod_003',
        productName: 'Google Pixel 8 Pro',
        customerId: 'cust_004',
        customerName: 'Lisa Chen',
        customerPhone: '+27 83 890 1234',
        customerEmail: 'lisa.chen@email.com',
        purchaseDate: '2023-11-20',
        claimDate: '2024-01-10',
        warrantyMonths: 24,
        warrantyEndDate: '2025-11-20',
        status: 'replaced',
        issueDescription: 'Device overheats and shuts down during normal use',
        faultCategory: 'other',
        resolution: 'Device replaced with new unit',
        resolvedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        replacementIMEI: '359847621234617',
        notes: 'New IMEI: 359847621234617',
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'warranty_004',
        claimNumber: 'WC-2024-00004',
        imei: '359847621234609',
        productId: 'prod_004',
        productName: 'OnePlus 12',
        customerId: 'cust_005',
        customerName: 'David Williams',
        customerPhone: '+27 76 567 8901',
        customerEmail: 'd.williams@email.com',
        purchaseDate: '2023-10-05',
        claimDate: '2024-01-15',
        warrantyMonths: 12,
        warrantyEndDate: '2024-10-05',
        status: 'rejected',
        issueDescription: 'Water damage - device stopped working after exposure to rain',
        faultCategory: 'other',
        resolution: 'Claim rejected - water damage not covered under warranty',
        resolvedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        replacementIMEI: null,
        notes: 'Liquid indicator shows water exposure',
        createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'warranty_005',
        claimNumber: 'WC-2024-00005',
        imei: '359847621234625',
        productId: 'prod_005',
        productName: 'Xiaomi 14 Ultra',
        customerId: 'cust_006',
        customerName: 'Amanda Naidoo',
        customerPhone: '+27 84 123 4567',
        customerEmail: 'amanda.n@email.com',
        purchaseDate: '2024-01-05',
        claimDate: '2024-01-21',
        warrantyMonths: 24,
        warrantyEndDate: '2026-01-05',
        status: 'repaired',
        issueDescription: 'Charging port loose, intermittent charging issues',
        faultCategory: 'charging',
        resolution: 'Charging port replaced successfully',
        resolvedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        replacementIMEI: null,
        notes: 'Repaired in-house',
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ]

    // Apply filters
    let filtered = mockClaims
    if (status) {
      filtered = filtered.filter(c => c.status === status)
    }
    if (search) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter(c => 
        c.claimNumber.toLowerCase().includes(searchLower) ||
        c.imei.includes(search) ||
        c.customerName.toLowerCase().includes(searchLower)
      )
    }

    // Apply pagination
    const total = filtered.length
    const paginated = filtered.slice(offset, offset + limit)

    return NextResponse.json({
      data: paginated,
      total,
      limit,
      offset,
    })
  } catch (error) {
    console.error('Error fetching warranty claims:', error)
    return NextResponse.json(
      { error: 'Failed to fetch warranty claims' },
      { status: 500 }
    )
  }
}

// POST /api/merchant-os/electronics/warranty - Create warranty claim
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      imei,
      customerName,
      customerPhone,
      customerEmail,
      faultCategory,
      issueDescription,
    } = body
    
    // Validate required fields
    if (!imei || !issueDescription) {
      return NextResponse.json(
        { error: 'IMEI and issue description are required' },
        { status: 400 }
      )
    }
    
    // Validate IMEI format
    if (!/^\d{15}$/.test(imei)) {
      return NextResponse.json(
        { error: 'Invalid IMEI format. Must be 15 digits.' },
        { status: 400 }
      )
    }
    
    // Generate claim number
    const claimNumber = `WC-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`
    
    // Mock lookup of device info
    const productInfo = {
      productId: 'prod_lookup',
      productName: 'Device Lookup',
      purchaseDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      warrantyMonths: 12,
    }
    
    // Calculate warranty end date
    const purchaseDate = new Date(productInfo.purchaseDate)
    const warrantyEndDate = new Date(purchaseDate)
    warrantyEndDate.setMonth(warrantyEndDate.getMonth() + productInfo.warrantyMonths)
    
    // Check if still under warranty
    const isUnderWarranty = warrantyEndDate > new Date()
    
    if (!isUnderWarranty) {
      return NextResponse.json(
        { error: 'Device is out of warranty' },
        { status: 400 }
      )
    }
    
    // Create claim
    const claim = {
      id: `warranty_${Date.now()}`,
      claimNumber,
      imei,
      productId: productInfo.productId,
      productName: productInfo.productName,
      customerId: `cust_${Date.now()}`,
      customerName: customerName || 'Unknown',
      customerPhone: customerPhone || null,
      customerEmail: customerEmail || null,
      purchaseDate: productInfo.purchaseDate,
      claimDate: new Date().toISOString().split('T')[0],
      warrantyMonths: productInfo.warrantyMonths,
      warrantyEndDate: warrantyEndDate.toISOString().split('T')[0],
      status: 'pending',
      issueDescription,
      faultCategory: faultCategory || 'other',
      resolution: null,
      resolvedAt: null,
      replacementIMEI: null,
      notes: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    // In production, save to database
    // await db.warrantyClaim.create({ data: claim })
    
    return NextResponse.json({
      success: true,
      data: claim,
    })
  } catch (error) {
    console.error('Error creating warranty claim:', error)
    return NextResponse.json(
      { error: 'Failed to create warranty claim' },
      { status: 500 }
    )
  }
}
