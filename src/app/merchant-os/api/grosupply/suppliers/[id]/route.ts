import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/grosupply/suppliers/[id] - Get supplier details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const supplier = await db.supplier.findUnique({
      where: { id },
      include: {
        rfqs: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            _count: { select: { items: true, quotes: true } }
          }
        },
        purchaseOrders: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            _count: { select: { items: true, grns: true } }
          }
        },
        quotes: {
          take: 10,
          orderBy: { submittedAt: 'desc' }
        },
        _count: {
          select: {
            rfqs: true,
            purchaseOrders: true,
            quotes: true
          }
        }
      }
    })

    if (!supplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })
    }

    return NextResponse.json({ supplier })
  } catch (error) {
    console.error('Error fetching supplier:', error)
    return NextResponse.json({ error: 'Failed to fetch supplier' }, { status: 500 })
  }
}

// PUT /api/grosupply/suppliers/[id] - Update supplier
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const supplier = await db.supplier.update({
      where: { id },
      data: {
        name: body.name,
        contactPerson: body.contactPerson,
        email: body.email,
        phone: body.phone,
        address: body.address,
        city: body.city,
        province: body.province,
        postalCode: body.postalCode,
        bankName: body.bankName,
        bankAccount: body.bankAccount,
        bankBranch: body.bankBranch,
        tier: body.tier,
        rating: body.rating,
        reviewCount: body.reviewCount,
        deliveryDays: body.deliveryDays,
        minOrderValue: body.minOrderValue,
        paymentTerms: body.paymentTerms,
        categories: body.categories ? JSON.stringify(body.categories) : undefined,
        notes: body.notes,
        status: body.status,
        verificationStatus: body.verificationStatus,
        verifiedAt: body.verifiedAt ? new Date(body.verifiedAt) : undefined
      }
    })

    return NextResponse.json({ supplier })
  } catch (error) {
    console.error('Error updating supplier:', error)
    return NextResponse.json({ error: 'Failed to update supplier' }, { status: 500 })
  }
}

// DELETE /api/grosupply/suppliers/[id] - Delete supplier
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check if supplier has related records
    const supplier = await db.supplier.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            rfqs: true,
            purchaseOrders: true,
            quotes: true
          }
        }
      }
    })

    if (!supplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })
    }

    if (supplier._count.rfqs > 0 || supplier._count.purchaseOrders > 0 || supplier._count.quotes > 0) {
      // Soft delete - just mark as inactive
      const updated = await db.supplier.update({
        where: { id },
        data: { status: 'inactive' }
      })
      return NextResponse.json({ 
        message: 'Supplier marked as inactive due to existing records',
        supplier: updated 
      })
    }

    await db.supplier.delete({ where: { id } })
    return NextResponse.json({ message: 'Supplier deleted successfully' })
  } catch (error) {
    console.error('Error deleting supplier:', error)
    return NextResponse.json({ error: 'Failed to delete supplier' }, { status: 500 })
  }
}
