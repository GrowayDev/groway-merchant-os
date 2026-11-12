import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/accounting/bills/[id] - Get a single bill
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get('merchantId');

    const bill = await db.accountingBill.findFirst({
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

    if (!bill) {
      return NextResponse.json(
        { error: 'Bill not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(bill);
  } catch (error) {
    console.error('Error fetching bill:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bill' },
      { status: 500 }
    );
  }
}

// PUT /api/accounting/bills/[id] - Update a bill
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      supplierId,
      supplierName,
      supplierEmail,
      supplierPhone,
      billDate,
      dueDate,
      category,
      description,
      reference,
      items,
      paymentTerms,
      notes,
      internalNotes,
      status,
      approvedBy,
      approvedAt,
      paidAt,
    } = body;

    // Check if bill exists
    const existingBill = await db.accountingBill.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!existingBill) {
      return NextResponse.json(
        { error: 'Bill not found' },
        { status: 404 }
      );
    }

    // Only allow updates to draft bills (or specific status changes)
    if (existingBill.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Cannot update a cancelled bill' },
        { status: 403 }
      );
    }

    // Calculate new totals if items are provided
    let subtotal = existingBill.subtotal;
    let vatAmount = existingBill.vatAmount;
    let totalAmount = existingBill.totalAmount;
    let processedItems: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      vatRate: number;
      vatAmount: number;
      lineTotal: number;
      accountCode?: string;
      sortOrder: number;
    }> = [];

    if (items && Array.isArray(items)) {
      subtotal = 0;
      vatAmount = 0;

      processedItems = items.map((item: {
        description: string;
        quantity?: number;
        unitPrice?: number;
        vatRate?: number;
        accountCode?: string;
      }, index: number) => {
        const quantity = item.quantity || 1;
        const unitPrice = item.unitPrice || 0;
        const vatRate = item.vatRate !== undefined ? item.vatRate : 15;

        const lineSubtotal = quantity * unitPrice;
        const vatAmountLine = lineSubtotal * (vatRate / 100);
        const lineTotal = lineSubtotal + vatAmountLine;

        subtotal += lineSubtotal;
        vatAmount += vatAmountLine;

        return {
          description: item.description,
          quantity,
          unitPrice,
          vatRate,
          vatAmount: vatAmountLine,
          lineTotal,
          accountCode: item.accountCode,
          sortOrder: index,
        };
      });

      totalAmount = subtotal + vatAmount;
    }

    // Update bill in a transaction
    const bill = await db.$transaction(async (tx) => {
      const updateData: Record<string, unknown> = {};
      
      if (supplierId !== undefined) updateData.supplierId = supplierId;
      if (supplierName !== undefined) updateData.supplierName = supplierName;
      if (supplierEmail !== undefined) updateData.supplierEmail = supplierEmail;
      if (supplierPhone !== undefined) updateData.supplierPhone = supplierPhone;
      if (billDate !== undefined) updateData.billDate = billDate;
      if (dueDate !== undefined) updateData.dueDate = dueDate;
      if (category !== undefined) updateData.category = category;
      if (description !== undefined) updateData.description = description;
      if (reference !== undefined) updateData.reference = reference;
      if (paymentTerms !== undefined) updateData.paymentTerms = paymentTerms;
      if (notes !== undefined) updateData.notes = notes;
      if (internalNotes !== undefined) updateData.internalNotes = internalNotes;
      if (status !== undefined) updateData.status = status;
      if (approvedBy !== undefined) updateData.approvedBy = approvedBy;
      if (approvedAt !== undefined) updateData.approvedAt = approvedAt ? new Date(approvedAt) : null;
      if (paidAt !== undefined) updateData.paidAt = paidAt ? new Date(paidAt) : null;

      if (items && Array.isArray(items)) {
        updateData.subtotal = subtotal;
        updateData.vatAmount = vatAmount;
        updateData.totalAmount = totalAmount;
        updateData.balanceDue = totalAmount - existingBill.amountPaid;
      }

      const updatedBill = await tx.accountingBill.update({
        where: { id },
        data: updateData,
      });

      // Update items if provided
      if (items && Array.isArray(items)) {
        await tx.billItem.deleteMany({
          where: { billId: id },
        });

        await tx.billItem.createMany({
          data: processedItems.map((item) => ({
            billId: id,
            ...item,
          })),
        });
      }

      return tx.accountingBill.findUnique({
        where: { id },
        include: {
          items: {
            orderBy: { sortOrder: 'asc' },
          },
        },
      });
    });

    return NextResponse.json(bill);
  } catch (error) {
    console.error('Error updating bill:', error);
    return NextResponse.json(
      { error: 'Failed to update bill' },
      { status: 500 }
    );
  }
}

// DELETE /api/accounting/bills/[id] - Delete a bill
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if bill exists
    const existingBill = await db.accountingBill.findUnique({
      where: { id },
    });

    if (!existingBill) {
      return NextResponse.json(
        { error: 'Bill not found' },
        { status: 404 }
      );
    }

    // Only allow deletion of draft bills
    if (existingBill.status !== 'draft') {
      return NextResponse.json(
        { error: 'Only draft bills can be deleted. Cancel the bill instead.' },
        { status: 403 }
      );
    }

    // Delete in a transaction (cascade will delete items)
    await db.$transaction(async (tx) => {
      await tx.billItem.deleteMany({
        where: { billId: id },
      });
      await tx.accountingBill.delete({
        where: { id },
      });
    });

    return NextResponse.json(
      { message: 'Bill deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting bill:', error);
    return NextResponse.json(
      { error: 'Failed to delete bill' },
      { status: 500 }
    );
  }
}
