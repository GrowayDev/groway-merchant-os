import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/accounting/invoices/[id] - Get a single invoice
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get('merchantId');

    const invoice = await db.accountingInvoice.findFirst({
      where: {
        id,
        ...(merchantId && { merchantId }),
      },
      include: {
        items: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoice' },
      { status: 500 }
    );
  }
}

// PUT /api/accounting/invoices/[id] - Update an invoice
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      customerId,
      customerName,
      customerEmail,
      customerPhone,
      invoiceDate,
      dueDate,
      description,
      items,
      paymentTerms,
      notes,
      internalNotes,
      status,
      discountAmount,
      sentAt,
      paidAt,
    } = body;

    // Check if invoice exists
    const existingInvoice = await db.accountingInvoice.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!existingInvoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // Only allow updates to draft invoices (or specific status changes)
    if (existingInvoice.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Cannot update a cancelled invoice' },
        { status: 403 }
      );
    }

    // Calculate new totals if items are provided
    let subtotal = existingInvoice.subtotal;
    let vatAmount = existingInvoice.vatAmount;
    let totalAmount = existingInvoice.totalAmount;
    let processedItems: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      discountPercent: number;
      vatRate: number;
      vatAmount: number;
      lineTotal: number;
      accountCode?: string;
      taxable: boolean;
      sortOrder: number;
    }> = [];

    if (items && Array.isArray(items)) {
      subtotal = 0;
      vatAmount = 0;

      processedItems = items.map((item: {
        description: string;
        quantity?: number;
        unitPrice?: number;
        discountPercent?: number;
        vatRate?: number;
        taxable?: boolean;
        accountCode?: string;
      }, index: number) => {
        const quantity = item.quantity || 1;
        const unitPrice = item.unitPrice || 0;
        const discountPercent = item.discountPercent || 0;
        const vatRate = item.vatRate !== undefined ? item.vatRate : 15;
        const taxable = item.taxable !== false;

        const lineSubtotal = quantity * unitPrice;
        const discountAmountLine = lineSubtotal * (discountPercent / 100);
        const lineAfterDiscount = lineSubtotal - discountAmountLine;
        const vatAmountLine = taxable ? lineAfterDiscount * (vatRate / 100) : 0;
        const lineTotal = lineAfterDiscount + vatAmountLine;

        subtotal += lineAfterDiscount;
        vatAmount += vatAmountLine;

        return {
          description: item.description,
          quantity,
          unitPrice,
          discountPercent,
          vatRate,
          vatAmount: vatAmountLine,
          lineTotal,
          accountCode: item.accountCode,
          taxable,
          sortOrder: index,
        };
      });

      const effectiveDiscount = discountAmount !== undefined ? discountAmount : existingInvoice.discountAmount;
      totalAmount = subtotal + vatAmount - effectiveDiscount;
    }

    // Update invoice in a transaction
    const invoice = await db.$transaction(async (tx) => {
      const updateData: Record<string, unknown> = {};
      
      if (customerId !== undefined) updateData.customerId = customerId;
      if (customerName !== undefined) updateData.customerName = customerName;
      if (customerEmail !== undefined) updateData.customerEmail = customerEmail;
      if (customerPhone !== undefined) updateData.customerPhone = customerPhone;
      if (invoiceDate !== undefined) updateData.invoiceDate = invoiceDate;
      if (dueDate !== undefined) updateData.dueDate = dueDate;
      if (description !== undefined) updateData.description = description;
      if (paymentTerms !== undefined) updateData.paymentTerms = paymentTerms;
      if (notes !== undefined) updateData.notes = notes;
      if (internalNotes !== undefined) updateData.internalNotes = internalNotes;
      if (status !== undefined) updateData.status = status;
      if (discountAmount !== undefined) updateData.discountAmount = discountAmount;
      if (sentAt !== undefined) updateData.sentAt = sentAt ? new Date(sentAt) : null;
      if (paidAt !== undefined) updateData.paidAt = paidAt ? new Date(paidAt) : null;

      if (items && Array.isArray(items)) {
        updateData.subtotal = subtotal;
        updateData.vatAmount = vatAmount;
        updateData.totalAmount = totalAmount;
        updateData.balanceDue = totalAmount - existingInvoice.amountPaid;
      }

      const updatedInvoice = await tx.accountingInvoice.update({
        where: { id },
        data: updateData,
      });

      // Update items if provided
      if (items && Array.isArray(items)) {
        await tx.invoiceItem.deleteMany({
          where: { invoiceId: id },
        });

        await tx.invoiceItem.createMany({
          data: processedItems.map((item) => ({
            invoiceId: id,
            ...item,
          })),
        });
      }

      return tx.accountingInvoice.findUnique({
        where: { id },
        include: {
          items: {
            orderBy: { sortOrder: 'asc' },
          },
        },
      });
    });

    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Error updating invoice:', error);
    return NextResponse.json(
      { error: 'Failed to update invoice' },
      { status: 500 }
    );
  }
}

// DELETE /api/accounting/invoices/[id] - Delete an invoice
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if invoice exists
    const existingInvoice = await db.accountingInvoice.findUnique({
      where: { id },
    });

    if (!existingInvoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // Only allow deletion of draft invoices
    if (existingInvoice.status !== 'draft') {
      return NextResponse.json(
        { error: 'Only draft invoices can be deleted. Cancel the invoice instead.' },
        { status: 403 }
      );
    }

    // Delete in a transaction (cascade will delete items)
    await db.$transaction(async (tx) => {
      await tx.invoiceItem.deleteMany({
        where: { invoiceId: id },
      });
      await tx.accountingInvoice.delete({
        where: { id },
      });
    });

    return NextResponse.json(
      { message: 'Invoice deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting invoice:', error);
    return NextResponse.json(
      { error: 'Failed to delete invoice' },
      { status: 500 }
    );
  }
}
