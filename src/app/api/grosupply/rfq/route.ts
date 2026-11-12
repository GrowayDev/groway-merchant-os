import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/permissions'

// GET /api/grosupply/rfq - Get RFQs
export async function GET(request: NextRequest) {
  const permissionCheck = await checkPermission(request, 'can_create_rfq')
  
  if (!permissionCheck.allowed) {
    return permissionCheck.error
  }

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const supplierId = searchParams.get('supplierId')

    const where: any = {}

    if (status && status !== 'all') {
      where.status = status
    }

    if (supplierId) {
      where.supplierId = supplierId
    }

    const rfqs = await db.rFQ.findMany({
      where,
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        items: true,
        quotes: {
          select: {
            id: true,
            supplierId: true,
            total: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    const stats = {
      total: rfqs.length,
      open: rfqs.filter(r => r.status === 'open').length,
      quoted: rfqs.filter(r => r.status === 'quoted').length,
      awarded: rfqs.filter(r => r.status === 'awarded').length,
      totalValue: rfqs.reduce((sum, r) => {
        const bestQuote = r.quotes.sort((a, b) => a.total - b.total)[0]
        return sum + (bestQuote?.total || 0)
      }, 0),
    }

    return NextResponse.json({
      success: true,
      rfqs,
      stats,
    })
  } catch (error) {
    console.error('Get RFQs error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch RFQs' },
      { status: 500 }
    )
  }
}

// POST /api/grosupply/rfq - Create new RFQ
export async function POST(request: NextRequest) {
  const permissionCheck = await checkPermission(request, 'can_create_rfq')
  
  if (!permissionCheck.allowed) {
    return permissionCheck.error
  }

  const session = permissionCheck.session!

  try {
    const body = await request.json()
    const {
      supplierId,
      items,
      requiredBy,
      deliveryAddress,
      notes,
    } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Items array required' },
        { status: 400 }
      )
    }

    // Generate RFQ number
    const count = await db.rFQ.count()
    const number = `RFQ-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`

    const rfq = await db.rFQ.create({
      data: {
        number,
        supplierId,
        status: supplierId ? 'open' : 'draft',
        requiredBy: requiredBy || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        deliveryAddress,
        notes,
        createdBy: session.userId,
        items: {
          create: items.map((item: any) => ({
            sku: item.sku,
            description: item.description,
            quantity: item.quantity || 1,
            unit: item.unit || 'each',
            notes: item.notes,
          })),
        },
      },
      include: {
        items: true,
      },
    })

    return NextResponse.json({
      success: true,
      rfq,
    })
  } catch (error) {
    console.error('Create RFQ error:', error)
    return NextResponse.json(
      { error: 'Failed to create RFQ' },
      { status: 500 }
    )
  }
}
