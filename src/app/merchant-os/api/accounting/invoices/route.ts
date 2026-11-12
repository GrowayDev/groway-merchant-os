import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Helper function to generate invoice number: INV-YYYYMMDD-XXXX
async function generateInvoiceNumber(merchantId: string, invoiceDate: string): Promise<string> {
  const dateStr = invoiceDate.replace(/-/g, '');
  
  const latestInvoice = await db.accountingInvoice.findFirst({
    where: {
      merchantId,
      invoiceNumber: {
        startsWith: `INV-${dateStr}`,
      },
    },
    orderBy: {
      invoiceNumber: 'desc',
    },
  });

  let sequence = 1;
  if (latestInvoice) {
    const parts = latestInvoice.invoiceNumber.split('-');
    if (parts.length === 3) {
      sequence = parseInt(parts[2], 10) + 1;
    }
  }

  return `INV-${dateStr}-${sequence.toString().padStart(4, '0')}`;
}

// GET /api/accounting/invoices - List invoices
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get('merchantId');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const customerId = searchParams.get('customerId');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    if (!merchantId) {
      return NextResponse.json(
        { error: 'merchantId is required' },
        { status: 400 }
      );
    }

    const where: Record<string, unknown> = { merchantId };

    if (status) {
      where.status = status;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    if (startDate || endDate) {
      const dateFilter: Record<string, string> = {};
      if (startDate) dateFilter.gte = startDate;
      if (endDate) dateFilter.lte = endDate;
      where.invoiceDate = dateFilter;
    }

    const [invoices, total] = await Promise.all([
      db.accountingInvoice.findMany({
        where,
        include: {
          InvoiceItem: {
            orderBy: { sortOrder: 'asc' },
          },
        },
        orderBy: [
          { invoiceDate: 'desc' },
          { createdAt: 'desc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.accountingInvoice.count({ where }),
    ]);

    // Calculate summary stats
    const stats = await db.accountingInvoice.aggregate({
      where: { merchantId },
      _count: { id: true },
      _sum: {
        totalAmount: true,
        amountPaid: true,
        balanceDue: true,
      },
    });

    const statusCounts = await db.accountingInvoice.groupBy({
      by: ['status'],
      where: { merchantId },
      _count: { id: true },
      _sum: { totalAmount: true },
    });

    return NextResponse.json({
      invoices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        totalInvoices: stats._count.id,
        totalAmount: stats._sum.totalAmount || 0,
        totalPaid: stats._sum.amountPaid || 0,
        totalBalance: stats._sum.balanceDue || 0,
        byStatus: statusCounts,
      },
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    );
  }
}

// POST /api/accounting/invoices - Create an invoice with items
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      merchantId,
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
      createdBy,
      discountAmount = 0,
    } = body;

    // Validate required fields
    if (!merchantId || !customerName || !invoiceDate || !dueDate || !items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: 'merchantId, customerName, invoiceDate, dueDate, and items array are required' },
        { status: 400 }
      );
    }

    if (items.length === 0) {
      return NextResponse.json(
        { error: 'At least one invoice item is required' },
        { status: 400 }
      );
    }

    // Validate and calculate totals for each item
    let subtotal = 0;
    let totalVat = 0;

    const processedItems = items.map((item: {
      description: string;
      quantity?: number;
      unitPrice?: number;
      discountPercent?: number;
      vatRate?: number;
      taxable?: boolean;
      accountCode?: string;
    }, index: number) => {
      if (!item.description) {
        throw new Error(`Item ${index + 1} must have a description`);
      }

      const quantity = item.quantity || 1;
      const unitPrice = item.unitPrice || 0;
      const discountPercent = item.discountPercent || 0;
      const vatRate = item.vatRate !== undefined ? item.vatRate : 15;
      const taxable = item.taxable !== false;

      // Calculate line totals
      const lineSubtotal = quantity * unitPrice;
      const discountAmount = lineSubtotal * (discountPercent / 100);
      const lineAfterDiscount = lineSubtotal - discountAmount;
      const vatAmount = taxable ? lineAfterDiscount * (vatRate / 100) : 0;
      const lineTotal = lineAfterDiscount + vatAmount;

      subtotal += lineAfterDiscount;
      totalVat += vatAmount;

      return {
        description: item.description,
        quantity,
        unitPrice,
        discountPercent,
        vatRate,
        vatAmount,
        lineTotal,
        accountCode: item.accountCode,
        taxable,
        sortOrder: index,
      };
    });

    const totalAmount = subtotal + totalVat - discountAmount;

    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber(merchantId, invoiceDate);

    // Create invoice with items in a transaction
    const invoice = await db.$transaction(async (tx) => {
      const newInvoice = await tx.accountingInvoice.create({
        data: {
          invoiceNumber,
          merchantId,
          customerId,
          customerName,
          customerEmail,
          customerPhone,
          invoiceDate,
          dueDate,
          description,
          subtotal,
          vatAmount: totalVat,
          discountAmount,
          totalAmount,
          amountPaid: 0,
          balanceDue: totalAmount,
          status: 'draft',
          paymentTerms,
          notes,
          internalNotes,
          createdBy,
        },
      });

      await tx.invoiceItem.createMany({
        data: processedItems.map((item) => ({
          invoiceId: newInvoice.id,
          ...item,
        })),
      });

      return tx.accountingInvoice.findUnique({
        where: { id: newInvoice.id },
        include: {
          InvoiceItem: {
            orderBy: { sortOrder: 'asc' },
          },
        },
      });
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error('Error creating invoice:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create invoice';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
