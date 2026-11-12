import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - List all transfers
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const corporateId = searchParams.get('corporateId')
    const status = searchParams.get('status')
    
    const where: Record<string, unknown> = {}
    if (corporateId) where.corporateId = corporateId
    if (status) where.status = status
    
    const transfers = await db.enterpriseTransfer.findMany({
      where,
      include: {
        fromMerchant: { select: { id: true, name: true, location: true } },
        toMerchant: { select: { id: true, name: true, location: true } },
        corporate: { select: { id: true, name: true } },
        items: true
      },
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json({ transfers })
  } catch (error) {
    console.error('Error fetching transfers:', error)
    return NextResponse.json({ error: 'Failed to fetch transfers' }, { status: 500 })
  }
}

// POST - Create new transfer
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      corporateId,
      fromMerchantId,
      toMerchantId,
      items = [],
      notes
    } = body

    // Generate unique code
    const count = await db.enterpriseTransfer.count()
    const code = `TRF-${String(count + 1).padStart(3, '0')}`

    // Calculate totals
    const itemsCount = items.length
    const totalValue = items.reduce((sum: number, item: { totalValue: number }) => sum + (item.totalValue || 0), 0)

    const transfer = await db.enterpriseTransfer.create({
      data: {
        code,
        corporateId,
        fromMerchantId,
        toMerchantId,
        itemsCount,
        totalValue,
        notes,
        items: {
          create: items.map((item: { sku: string; name: string; quantity: number; unit: string; unitValue: number; totalValue: number; notes?: string }) => ({
            sku: item.sku,
            name: item.name,
            quantity: parseFloat(item.quantity) || 0,
            unit: item.unit || 'units',
            unitValue: parseFloat(item.unitValue) || 0,
            totalValue: parseFloat(item.totalValue) || 0,
            notes: item.notes
          }))
        }
      },
      include: {
        fromMerchant: true,
        toMerchant: true,
        items: true
      }
    })

    // Log activity
    await db.enterpriseActivity.create({
      data: {
        corporateId,
        type: 'transfer',
        message: `New transfer created: ${transfer.fromMerchant.name} → ${transfer.toMerchant.name}`,
        entityType: 'transfer',
        entityId: transfer.id
      }
    })

    return NextResponse.json({ transfer })
  } catch (error) {
    console.error('Error creating transfer:', error)
    return NextResponse.json({ error: 'Failed to create transfer' }, { status: 500 })
  }
}
