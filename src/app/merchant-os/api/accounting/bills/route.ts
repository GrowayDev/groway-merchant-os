import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Helper function to generate bill number: BIL-YYYYMMDD-XXXX
async function generateBillNumber(merchantId: string, billDate: string): Promise<string> {
  const dateStr = billDate.replace(/-/g, '');
  
  const latestBill = await db.accountingBill.findFirst({
    where: {
      merchantId,
      billNumber: {
        startsWith: `BIL-${dateStr}`,
      },
    },
    orderBy: {
      billNumber: 'desc',
    },
  });

  let sequence = 1;
  if (latestBill) {
    const parts = latestBill.billNumber.split('-');
    if (parts.length === 3) {
      sequence = parseInt(parts[2], 10) + 1;
    }
  }

  return `BIL-${dateStr}-${sequence.toString().padStart(4, '0')}`;
}

// GET /api/accounting/bills - List bills
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get('merchantId');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const supplierId = searchParams.get('supplierId');
    const category = searchParams.get('category');
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

    if (supplierId) {
      where.supplierId = supplierId;
    }

    if (category) {
      where.category = category;
    }

    if (startDate || endDate) {
      const dateFilter: Record<string, string> = {};
      if (startDate) dateFilter.gte = startDate;
      if (endDate) dateFilter.lte = endDate;
      where.billDate = dateFilter;
    }

    const [bills, total] = await Promise.all([
      db.accountingBill.findMany({
        where,
        include: {
          BillItem: {
            orderBy: { sortOrder: 'asc' },
          },
        },
        orderBy: [
          { billDate: 'desc' },
          { createdAt: 'desc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.accountingBill.count({ where }),
    ]);

    // Calculate summary stats
    const stats = await db.accountingBill.aggregate({
      where: { merchantId },
      _count: { id: true },
      _sum: {
        totalAmount: true,
        amountPaid: true,
        balanceDue: true,
      },
    });

    const statusCounts = await db.accountingBill.groupBy({
      by: ['status'],
      where: { merchantId },
      _count: { id: true },
      _sum: { totalAmount: true },
    });

    const categoryCounts = await db.accountingBill.groupBy({
      by: ['category'],
      where: { merchantId },
      _count: { id: true },
      _sum: { totalAmount: true },
    });

    return NextResponse.json({
      bills,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        totalBills: stats._count.id,
        totalAmount: stats._sum.totalAmount || 0,
        totalPaid: stats._sum.amountPaid || 0,
        totalBalance: stats._sum.balanceDue || 0,
        byStatus: statusCounts,
        byCategory: categoryCounts,
      },
    });
  } catch (error) {
    console.error('Error fetching bills:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bills' },
      { status: 500 }
    );
  }
}

// POST /api/accounting/bills - Create a bill with items
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      merchantId,
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
      createdBy,
    } = body;

    // Validate required fields
    if (!merchantId || !supplierName || !billDate || !dueDate || !items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: 'merchantId, supplierName, billDate, dueDate, and items array are required' },
        { status: 400 }
      );
    }

    if (items.length === 0) {
      return NextResponse.json(
        { error: 'At least one bill item is required' },
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
      vatRate?: number;
      accountCode?: string;
    }, index: number) => {
      if (!item.description) {
        throw new Error(`Item ${index + 1} must have a description`);
      }

      const quantity = item.quantity || 1;
      const unitPrice = item.unitPrice || 0;
      const vatRate = item.vatRate !== undefined ? item.vatRate : 15;

      // Calculate line totals
      const lineSubtotal = quantity * unitPrice;
      const vatAmount = lineSubtotal * (vatRate / 100);
      const lineTotal = lineSubtotal + vatAmount;

      subtotal += lineSubtotal;
      totalVat += vatAmount;

      return {
        description: item.description,
        quantity,
        unitPrice,
        vatRate,
        vatAmount,
        lineTotal,
        accountCode: item.accountCode,
        sortOrder: index,
      };
    });

    const totalAmount = subtotal + totalVat;

    // Generate bill number
    const billNumber = await generateBillNumber(merchantId, billDate);

    // Create bill with items in a transaction
    const bill = await db.$transaction(async (tx) => {
      const newBill = await tx.accountingBill.create({
        data: {
          billNumber,
          merchantId,
          supplierId,
          supplierName,
          supplierEmail,
          supplierPhone,
          billDate,
          dueDate,
          category,
          description,
          reference,
          subtotal,
          vatAmount: totalVat,
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

      await tx.billItem.createMany({
        data: processedItems.map((item) => ({
          billId: newBill.id,
          ...item,
        })),
      });

      return tx.accountingBill.findUnique({
        where: { id: newBill.id },
        include: {
          BillItem: {
            orderBy: { sortOrder: 'asc' },
          },
        },
      });
    });

    return NextResponse.json(bill, { status: 201 });
  } catch (error) {
    console.error('Error creating bill:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create bill';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
