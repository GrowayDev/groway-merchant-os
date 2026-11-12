import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Generate unique invoice number
async function generateInvoiceNumber() {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  
  const lastInvoice = await db.supplierInvoice.findFirst({
    where: { number: { startsWith: `INV-${year}${month}` } },
    orderBy: { number: 'desc' }
  })
  
  if (lastInvoice) {
    const lastNum = parseInt(lastInvoice.number.split('-').pop() || '0')
    return `INV-${year}${month}-${String(lastNum + 1).padStart(4, '0')}`
  }
  
  return `INV-${year}${month}-0001`
}

// GET /api/supplier/invoices - Get supplier invoices
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const supplierId = searchParams.get('supplierId')
    const status = searchParams.get('status')
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

    if (search) {
      where.OR = [
        { number: { contains: search } },
        { buyerName: { contains: search } },
        { poNumber: { contains: search } }
      ]
    }

    const [invoices, total] = await Promise.all([
      db.supplierInvoice.findMany({
        where,
        include: {
          items: true,
          payments: {
            orderBy: { createdAt: 'desc' },
            take: 5
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      db.supplierInvoice.count({ where })
    ])

    // Calculate stats
    const stats = {
      total,
      draft: await db.supplierInvoice.count({ where: { supplierId, status: 'draft' } }),
      submitted: await db.supplierInvoice.count({ where: { supplierId, status: 'submitted' } }),
      approved: await db.supplierInvoice.count({ where: { supplierId, status: 'approved' } }),
      paid: await db.supplierInvoice.count({ where: { supplierId, status: 'paid' } }),
      overdue: await db.supplierInvoice.count({ where: { supplierId, status: 'overdue' } }),
      totalValue: await db.supplierInvoice.aggregate({
        where: { supplierId, status: { notIn: ['draft', 'cancelled'] } },
        _sum: { totalAmount: true }
      }),
      paidValue: await db.supplierInvoice.aggregate({
        where: { supplierId, status: 'paid' },
        _sum: { totalAmount: true }
      })
    }

    return NextResponse.json({
      invoices,
      total,
      stats: {
        ...stats,
        totalValue: stats.totalValue._sum.totalAmount || 0,
        paidValue: stats.paidValue._sum.totalAmount || 0
      }
    })
  } catch (error) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 })
  }
}

// POST /api/supplier/invoices - Create a new invoice
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { supplierId, items, ...data } = body

    // Calculate totals
    const subtotal = items.reduce((sum: number, i: any) => sum + i.lineTotal, 0)
    const vatAmount = items.reduce((sum: number, i: any) => sum + (i.vatAmount || 0), 0)
    const discountAmount = data.discountAmount || 0
    const totalAmount = subtotal + vatAmount - discountAmount

    // If linked to a PO, verify it
    let poData = null
    if (data.poId) {
      const po = await db.purchaseOrder.findUnique({
        where: { id: data.poId },
        include: { items: true }
      })
      if (po) {
        poData = { poNumber: po.number }
      }
    }

    const invoice = await db.supplierInvoice.create({
      data: {
        number: await generateInvoiceNumber(),
        supplierId,
        poId: data.poId,
        poNumber: poData?.poNumber,
        buyerId: data.buyerId,
        buyerName: data.buyerName,
        invoiceDate: data.invoiceDate || new Date().toISOString().split('T')[0],
        dueDate: data.dueDate,
        subtotal,
        vatAmount,
        discountAmount,
        totalAmount,
        balanceDue: totalAmount,
        paymentTerms: data.paymentTerms,
        notes: data.notes,
        items: {
          create: items.map((i: any) => ({
            sku: i.sku,
            description: i.description,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            discountPercent: i.discountPercent || 0,
            vatRate: i.vatRate || 15,
            vatAmount: i.vatAmount || 0,
            lineTotal: i.lineTotal,
            poItemId: i.poItemId,
            grnItemId: i.grnItemId
          }))
        }
      },
      include: { items: true }
    })

    return NextResponse.json({ invoice })
  } catch (error) {
    console.error('Error creating invoice:', error)
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 })
  }
}

// PUT /api/supplier/invoices - Update invoice
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, action, ...updates } = body

    const invoice = await db.supplierInvoice.findUnique({
      where: { id },
      include: { items: true }
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    let newStatus = invoice.status
    let updateData: any = { ...updates }

    switch (action) {
      case 'submit':
        newStatus = 'submitted'
        updateData.submittedAt = new Date()
        break

      case 'approve':
        newStatus = 'approved'
        updateData.approvedAt = new Date()
        break

      case 'mark_paid':
        newStatus = 'paid'
        updateData.paidAt = new Date()
        updateData.amountPaid = invoice.totalAmount
        updateData.balanceDue = 0
        break

      case 'cancel':
        newStatus = 'cancelled'
        updateData.cancelledAt = new Date()
        break

      case 'update_items':
        // Recalculate totals
        const subtotal = updates.items.reduce((sum: number, i: any) => sum + i.lineTotal, 0)
        const vatAmount = updates.items.reduce((sum: number, i: any) => sum + (i.vatAmount || 0), 0)
        const totalAmount = subtotal + vatAmount - (updates.discountAmount || invoice.discountAmount)

        // Delete existing items
        await db.supplierInvoiceItem.deleteMany({
          where: { invoiceId: id }
        })

        // Create new items
        await db.supplierInvoiceItem.createMany({
          data: updates.items.map((i: any) => ({
            invoiceId: id,
            sku: i.sku,
            description: i.description,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            discountPercent: i.discountPercent || 0,
            vatRate: i.vatRate || 15,
            vatAmount: i.vatAmount || 0,
            lineTotal: i.lineTotal
          }))
        })

        updateData = {
          subtotal,
          vatAmount,
          totalAmount,
          balanceDue: totalAmount - invoice.amountPaid,
          discountAmount: updates.discountAmount || invoice.discountAmount,
          notes: updates.notes,
          paymentTerms: updates.paymentTerms
        }
        break
    }

    const updated = await db.supplierInvoice.update({
      where: { id },
      data: {
        ...updateData,
        status: newStatus
      },
      include: { items: true }
    })

    return NextResponse.json({ invoice: updated })
  } catch (error) {
    console.error('Error updating invoice:', error)
    return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 })
  }
}
