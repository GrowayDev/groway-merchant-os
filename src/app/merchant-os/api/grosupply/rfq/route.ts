import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

// Generate RFQ number
function generateRFQNumber(): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `RFQ-${year}${month}-${random}`
}

// GET /api/grosupply/rfq - List RFQs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const supplierId = searchParams.get('supplierId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const search = searchParams.get('search')

    const where: Prisma.RFQWhereInput = {}

    if (status) where.status = status
    if (supplierId) where.supplierId = supplierId
    if (startDate && endDate) {
      where.AND = [
        { createdAt: { gte: new Date(startDate) } },
        { createdAt: { lte: new Date(endDate) } }
      ]
    }
    if (search) {
      where.OR = [
        { number: { contains: search } },
        { notes: { contains: search } }
      ]
    }

    const rfqs = await db.rFQ.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            tier: true,
            rating: true
          }
        },
        items: true,
        quotes: {
          include: {
            supplier: {
              select: {
                id: true,
                name: true,
                tier: true,
                rating: true
              }
            }
          }
        },
        _count: {
          select: { items: true, quotes: true }
        }
      }
    })

    // Calculate stats
    const stats = {
      total: rfqs.length,
      draft: rfqs.filter(r => r.status === 'draft').length,
      open: rfqs.filter(r => r.status === 'open').length,
      quoted: rfqs.filter(r => r.status === 'quoted').length,
      awarded: rfqs.filter(r => r.status === 'awarded').length,
      totalValue: rfqs.reduce((sum, r) => sum + (r.quotes.reduce((qs, q) => qs + q.total, 0) || 0), 0)
    }

    return NextResponse.json({ rfqs, stats })
  } catch (error) {
    console.error('Error fetching RFQs:', error)
    return NextResponse.json({ error: 'Failed to fetch RFQs' }, { status: 500 })
  }
}

// POST /api/grosupply/rfq - Create RFQ
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const number = body.number || generateRFQNumber()

    // Create RFQ with items in a transaction
    const rfq = await db.rFQ.create({
      data: {
        number,
        supplierId: body.supplierId,
        status: body.status || 'draft',
        requiredBy: body.requiredBy,
        deliveryAddress: body.deliveryAddress,
        notes: body.notes,
        internalNotes: body.internalNotes,
        createdBy: body.createdBy,
        items: {
          create: body.items?.map((item: { sku: string; description: string; quantity: number; unit: string; notes?: string }) => ({
            sku: item.sku,
            description: item.description,
            quantity: item.quantity || 1,
            unit: item.unit || 'each',
            notes: item.notes
          })) || []
        }
      },
      include: {
        items: true,
        supplier: true
      }
    })

    return NextResponse.json({ rfq }, { status: 201 })
  } catch (error) {
    console.error('Error creating RFQ:', error)
    return NextResponse.json({ error: 'Failed to create RFQ' }, { status: 500 })
  }
}

// PUT /api/grosupply/rfq - Update RFQ (bulk operations)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()

    // Handle sending RFQ to suppliers
    if (body.action === 'send') {
      const rfq = await db.rFQ.update({
        where: { id: body.id },
        data: {
          status: 'open'
        }
      })

      // In production, this would send notifications to suppliers
      console.log(`RFQ ${rfq.number} sent to suppliers`)

      return NextResponse.json({ 
        message: 'RFQ sent to suppliers',
        rfq 
      })
    }

    // Handle cancelling RFQ
    if (body.action === 'cancel') {
      const rfq = await db.rFQ.update({
        where: { id: body.id },
        data: { status: 'cancelled' }
      })

      return NextResponse.json({ 
        message: 'RFQ cancelled',
        rfq 
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error updating RFQ:', error)
    return NextResponse.json({ error: 'Failed to update RFQ' }, { status: 500 })
  }
}
