import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Generate unique dispute number
async function generateDisputeNumber() {
  const date = new Date()
  const year = date.getFullYear()
  
  const lastDispute = await db.supplierDispute.findFirst({
    where: { number: { startsWith: `DSP-${year}` } },
    orderBy: { number: 'desc' }
  })
  
  if (lastDispute) {
    const lastNum = parseInt(lastDispute.number.split('-').pop() || '0')
    return `DSP-${year}-${String(lastNum + 1).padStart(4, '0')}`
  }
  
  return `DSP-${year}-0001`
}

// GET /api/supplier/disputes - Get supplier disputes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const supplierId = searchParams.get('supplierId')
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const priority = searchParams.get('priority')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!supplierId) {
      return NextResponse.json({ error: 'Supplier ID is required' }, { status: 400 })
    }

    const where: any = { supplierId }

    if (status) {
      where.status = status
    }

    if (type) {
      where.type = type
    }

    if (priority) {
      where.priority = priority
    }

    if (search) {
      where.OR = [
        { number: { contains: search } },
        { subject: { contains: search } },
        { buyerName: { contains: search } }
      ]
    }

    const [disputes, total] = await Promise.all([
      db.supplierDispute.findMany({
        where,
        include: {
          documents: {
            orderBy: { uploadedAt: 'desc' }
          },
          conversation: {
            include: {
              messages: {
                orderBy: { createdAt: 'desc' },
                take: 5
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      db.supplierDispute.count({ where })
    ])

    // Calculate stats
    const stats = {
      total,
      open: await db.supplierDispute.count({ where: { supplierId, status: 'open' } }),
      inProgress: await db.supplierDispute.count({ where: { supplierId, status: 'in_progress' } }),
      resolved: await db.supplierDispute.count({ where: { supplierId, status: 'resolved' } }),
      escalated: await db.supplierDispute.count({ where: { supplierId, status: 'escalated' } }),
      byType: {
        order: await db.supplierDispute.count({ where: { supplierId, type: 'order' } }),
        invoice: await db.supplierDispute.count({ where: { supplierId, type: 'invoice' } }),
        delivery: await db.supplierDispute.count({ where: { supplierId, type: 'delivery' } }),
        quality: await db.supplierDispute.count({ where: { supplierId, type: 'quality' } }),
        payment: await db.supplierDispute.count({ where: { supplierId, type: 'payment' } })
      },
      totalCreditIssued: await db.supplierDispute.aggregate({
        where: { supplierId, status: 'resolved', resolutionType: 'credit_note' },
        _sum: { creditAmount: true }
      })
    }

    return NextResponse.json({
      disputes,
      total,
      stats: {
        ...stats,
        totalCreditIssued: stats.totalCreditIssued._sum.creditAmount || 0
      }
    })
  } catch (error) {
    console.error('Error fetching disputes:', error)
    return NextResponse.json({ error: 'Failed to fetch disputes' }, { status: 500 })
  }
}

// POST /api/supplier/disputes - Create a new dispute
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { supplierId, type, priority, subject, description, poId, invoiceId, buyerId, buyerName } = body

    const dispute = await db.supplierDispute.create({
      data: {
        number: await generateDisputeNumber(),
        supplierId,
        type: type || 'order',
        priority: priority || 'medium',
        subject,
        description,
        poId,
        invoiceId,
        buyerId,
        buyerName,
        status: 'open',
        openedAt: new Date()
      },
      include: { documents: true }
    })

    // Create conversation for this dispute
    await db.supplierConversation.create({
      data: {
        supplierId,
        buyerId,
        buyerName,
        disputeId: dispute.id,
        subject: `Re: ${subject}`,
        status: 'open'
      }
    })

    return NextResponse.json({ dispute })
  } catch (error) {
    console.error('Error creating dispute:', error)
    return NextResponse.json({ error: 'Failed to create dispute' }, { status: 500 })
  }
}

// PUT /api/supplier/disputes - Update dispute
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, action, ...updates } = body

    const dispute = await db.supplierDispute.findUnique({
      where: { id }
    })

    if (!dispute) {
      return NextResponse.json({ error: 'Dispute not found' }, { status: 404 })
    }

    let newStatus = dispute.status
    let updateData: any = {}

    switch (action) {
      case 'respond':
        newStatus = 'in_progress'
        updateData.respondedAt = new Date()
        break

      case 'resolve':
        newStatus = 'resolved'
        updateData.resolvedAt = new Date()
        updateData.resolution = updates.resolution
        updateData.resolutionType = updates.resolutionType
        updateData.creditAmount = updates.creditAmount || 0
        break

      case 'close':
        newStatus = 'closed'
        updateData.closedAt = new Date()
        break

      case 'escalate':
        newStatus = 'escalated'
        updateData.escalatedAt = new Date()
        updateData.escalatedTo = updates.escalatedTo
        break

      case 'update_priority':
        updateData.priority = updates.priority
        break
    }

    const updated = await db.supplierDispute.update({
      where: { id },
      data: {
        ...updateData,
        status: newStatus
      },
      include: {
        documents: true,
        conversation: true
      }
    })

    // Update conversation status if needed
    if (dispute.conversation) {
      await db.supplierConversation.update({
        where: { id: dispute.conversation.id },
        data: { status: newStatus === 'closed' ? 'closed' : 'open' }
      })
    }

    return NextResponse.json({ dispute: updated })
  } catch (error) {
    console.error('Error updating dispute:', error)
    return NextResponse.json({ error: 'Failed to update dispute' }, { status: 500 })
  }
}
