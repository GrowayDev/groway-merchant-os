import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - List all merchants
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const corporateId = searchParams.get('corporateId')
    
    const where = corporateId ? { corporateId } : {}
    
    const merchants = await db.enterpriseMerchant.findMany({
      where,
      include: {
        corporate: {
          select: { id: true, name: true, tier: true }
        },
        _count: {
          select: { inventory: true, customers: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json({ merchants })
  } catch (error) {
    console.error('Error fetching merchants:', error)
    return NextResponse.json({ error: 'Failed to fetch merchants' }, { status: 500 })
  }
}

// POST - Create new merchant
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      corporateId,
      name,
      location,
      address,
      city,
      province,
      postalCode,
      vertical,
      managerName,
      managerPhone,
      managerEmail,
      notes
    } = body

    // Generate unique code
    const count = await db.enterpriseMerchant.count()
    const code = `M${String(count + 1).padStart(3, '0')}`

    const merchant = await db.enterpriseMerchant.create({
      data: {
        code,
        name,
        corporateId,
        location,
        address,
        city,
        province,
        postalCode,
        vertical,
        managerName,
        managerPhone,
        managerEmail,
        notes
      },
      include: {
        corporate: true
      }
    })

    // Update merchant count on corporate client
    await db.enterpriseCorporateClient.update({
      where: { id: corporateId },
      data: {
        merchantsCount: {
          increment: 1
        }
      }
    })

    // Log activity
    await db.enterpriseActivity.create({
      data: {
        corporateId,
        type: 'merchant_added',
        message: `New merchant "${name}" added`,
        entityType: 'merchant',
        entityId: merchant.id
      }
    })

    return NextResponse.json({ merchant })
  } catch (error) {
    console.error('Error creating merchant:', error)
    return NextResponse.json({ error: 'Failed to create merchant' }, { status: 500 })
  }
}
