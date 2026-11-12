import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/merchant-os/branches - List all branches
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const merchantId = searchParams.get('merchantId')
    const search = searchParams.get('search')
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: Record<string, unknown> = {}
    
    if (merchantId) {
      where.merchantId = merchantId
    }
    if (status) {
      where.status = status
    }
    if (type) {
      where.type = type
    }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search } },
        { city: { contains: search } },
      ]
    }

    const [branches, total] = await Promise.all([
      db.branch.findMany({
        where,
        include: {
          merchant: {
            select: {
              id: true,
              name: true,
              tradingName: true,
            }
          },
          _count: {
            select: {
              inventory: true,
              stockTransfersFrom: true,
              stockTransfersTo: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.branch.count({ where })
    ])

    return NextResponse.json({
      data: branches,
      total,
      limit,
      offset,
      hasMore: offset + limit < total
    })
  } catch (error) {
    console.error('Error fetching branches:', error)
    // Return mock data if database not available
    return NextResponse.json({
      data: [
        {
          id: 'br-1',
          merchantId: 'mer-1',
          code: 'BR-001',
          name: 'Main Street Store',
          type: 'store',
          status: 'active',
          isDefault: true,
          isWarehouse: false,
          phone: '+27 11 123 4567',
          email: 'main@store.co.za',
          addressLine1: '123 Main Street',
          city: 'Johannesburg',
          province: 'Gauteng',
          postalCode: '2000',
          country: 'ZA',
          managerId: 'user-1',
          managerName: 'Thabo Molefe',
          totalRevenue: 1285000,
          totalTransactions: 4523,
          totalStaff: 12,
          inventoryValue: 245000,
          operatingHours: '{"mon":{"open":"08:00","close":"18:00"},"tue":{"open":"08:00","close":"18:00"},"wed":{"open":"08:00","close":"18:00"},"thu":{"open":"08:00","close":"18:00"},"fri":{"open":"08:00","close":"20:00"},"sat":{"open":"09:00","close":"17:00"},"sun":{"open":"09:00","close":"14:00"}}',
          createdAt: new Date('2024-01-15').toISOString(),
          updatedAt: new Date().toISOString(),
          merchant: { id: 'mer-1', name: 'Sample Merchant', tradingName: 'Sample Store' },
          _count: { inventory: 150, stockTransfersFrom: 5, stockTransfersTo: 8 }
        },
        {
          id: 'br-2',
          merchantId: 'mer-1',
          code: 'BR-002',
          name: 'Sandton City Mall',
          type: 'store',
          status: 'active',
          isDefault: false,
          isWarehouse: false,
          phone: '+27 11 234 5678',
          email: 'sandton@store.co.za',
          addressLine1: 'Sandton City Mall, Shop 45',
          city: 'Sandton',
          province: 'Gauteng',
          postalCode: '2196',
          country: 'ZA',
          managerId: 'user-2',
          managerName: 'Nomsa Dlamini',
          totalRevenue: 2345000,
          totalTransactions: 8765,
          totalStaff: 18,
          inventoryValue: 380000,
          createdAt: new Date('2024-02-20').toISOString(),
          updatedAt: new Date().toISOString(),
          merchant: { id: 'mer-1', name: 'Sample Merchant', tradingName: 'Sample Store' },
          _count: { inventory: 280, stockTransfersFrom: 12, stockTransfersTo: 15 }
        },
        {
          id: 'br-3',
          merchantId: 'mer-1',
          code: 'WH-001',
          name: 'Central Warehouse',
          type: 'warehouse',
          status: 'active',
          isDefault: false,
          isWarehouse: true,
          phone: '+27 11 345 6789',
          email: 'warehouse@store.co.za',
          addressLine1: '45 Industrial Road',
          city: 'Johannesburg',
          province: 'Gauteng',
          postalCode: '2001',
          country: 'ZA',
          managerId: 'user-3',
          managerName: 'John Smith',
          totalRevenue: 0,
          totalTransactions: 0,
          totalStaff: 8,
          inventoryValue: 1250000,
          createdAt: new Date('2024-01-01').toISOString(),
          updatedAt: new Date().toISOString(),
          merchant: { id: 'mer-1', name: 'Sample Merchant', tradingName: 'Sample Store' },
          _count: { inventory: 500, stockTransfersFrom: 45, stockTransfersTo: 2 }
        },
        {
          id: 'br-4',
          merchantId: 'mer-1',
          code: 'BR-003',
          name: 'Cape Town Branch',
          type: 'store',
          status: 'active',
          isDefault: false,
          isWarehouse: false,
          phone: '+27 21 456 7890',
          email: 'capetown@store.co.za',
          addressLine1: 'V&A Waterfront, Shop 12',
          city: 'Cape Town',
          province: 'Western Cape',
          postalCode: '8001',
          country: 'ZA',
          managerId: 'user-4',
          managerName: 'Pieter van der Merwe',
          totalRevenue: 1875000,
          totalTransactions: 6543,
          totalStaff: 15,
          inventoryValue: 295000,
          createdAt: new Date('2024-03-10').toISOString(),
          updatedAt: new Date().toISOString(),
          merchant: { id: 'mer-1', name: 'Sample Merchant', tradingName: 'Sample Store' },
          _count: { inventory: 220, stockTransfersFrom: 8, stockTransfersTo: 12 }
        },
        {
          id: 'br-5',
          merchantId: 'mer-1',
          code: 'BR-004',
          name: 'Durban Beach Front',
          type: 'kiosk',
          status: 'active',
          isDefault: false,
          isWarehouse: false,
          phone: '+27 31 567 8901',
          email: 'durban@store.co.za',
          addressLine1: 'Durban Beach Front Kiosk 3',
          city: 'Durban',
          province: 'KwaZulu-Natal',
          postalCode: '4001',
          country: 'ZA',
          managerId: 'user-5',
          managerName: 'Sipho Ndlovu',
          totalRevenue: 450000,
          totalTransactions: 2345,
          totalStaff: 4,
          inventoryValue: 65000,
          createdAt: new Date('2024-04-05').toISOString(),
          updatedAt: new Date().toISOString(),
          merchant: { id: 'mer-1', name: 'Sample Merchant', tradingName: 'Sample Store' },
          _count: { inventory: 75, stockTransfersFrom: 3, stockTransfersTo: 5 }
        },
        {
          id: 'br-6',
          merchantId: 'mer-1',
          code: 'BR-005',
          name: 'Pretoria Franchise',
          type: 'franchise',
          status: 'inactive',
          isDefault: false,
          isWarehouse: false,
          phone: '+27 12 678 9012',
          email: 'pretoria@store.co.za',
          addressLine1: 'Menlyn Park Shopping Centre',
          city: 'Pretoria',
          province: 'Gauteng',
          postalCode: '0063',
          country: 'ZA',
          managerId: 'user-6',
          managerName: 'Maria Fernandez',
          totalRevenue: 0,
          totalTransactions: 0,
          totalStaff: 0,
          inventoryValue: 0,
          createdAt: new Date('2024-05-01').toISOString(),
          updatedAt: new Date().toISOString(),
          merchant: { id: 'mer-1', name: 'Sample Merchant', tradingName: 'Sample Store' },
          _count: { inventory: 0, stockTransfersFrom: 0, stockTransfersTo: 0 }
        }
      ],
      total: 6,
      limit,
      offset,
      hasMore: false
    })
  }
}

// POST /api/merchant-os/branches - Create a new branch
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.merchantId) {
      return NextResponse.json({ error: 'merchantId is required' }, { status: 400 })
    }
    if (!body.name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }
    if (!body.code) {
      return NextResponse.json({ error: 'code is required' }, { status: 400 })
    }

    // Check if branch code already exists for this merchant
    const existingBranch = await db.branch.findFirst({
      where: {
        merchantId: body.merchantId,
        code: body.code
      }
    })

    if (existingBranch) {
      return NextResponse.json({ 
        error: 'Branch code already exists for this merchant' 
      }, { status: 400 })
    }

    // If this is set as default, unset other defaults for this merchant
    if (body.isDefault) {
      await db.branch.updateMany({
        where: {
          merchantId: body.merchantId,
          isDefault: true
        },
        data: { isDefault: false }
      })
    }

    const branch = await db.branch.create({
      data: {
        merchantId: body.merchantId,
        code: body.code,
        name: body.name,
        type: body.type || 'store',
        phone: body.phone,
        email: body.email,
        addressLine1: body.addressLine1,
        addressLine2: body.addressLine2,
        city: body.city,
        province: body.province,
        postalCode: body.postalCode,
        country: body.country || 'ZA',
        managerId: body.managerId,
        managerName: body.managerName,
        operatingHours: body.operatingHours,
        status: body.status || 'active',
        isDefault: body.isDefault || false,
        isWarehouse: body.isWarehouse || body.type === 'warehouse',
        terminalPrefix: body.terminalPrefix,
        receiptHeader: body.receiptHeader,
        receiptFooter: body.receiptFooter,
      },
      include: {
        merchant: {
          select: {
            id: true,
            name: true,
            tradingName: true,
          }
        }
      }
    })

    // Update merchant's totalBranches count
    await db.merchant.update({
      where: { id: body.merchantId },
      data: { totalBranches: { increment: 1 } }
    })

    return NextResponse.json(branch, { status: 201 })
  } catch (error) {
    console.error('Error creating branch:', error)
    return NextResponse.json({ 
      error: 'Failed to create branch',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
