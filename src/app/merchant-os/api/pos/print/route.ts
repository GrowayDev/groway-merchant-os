import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST - Print order tickets
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      orderId,
      orderNumber,
      tableNumber,
      staffName,
      items,
      subtotal,
      taxAmount,
      total,
      notes,
      printType, // 'all', 'kitchen', 'bar', 'receipt'
    } = body;

    // Group items by station type
    const kitchenItems = items.filter((item: any) =>
      item.station?.startsWith('kitchen-') || item.station?.includes('grill') || item.station?.includes('fryer') || item.station?.includes('cold') || item.station?.includes('dessert')
    );

    const barItems = items.filter((item: any) =>
      item.station?.startsWith('bar-') || item.isBeverage
    );

    // Generate print jobs based on type
    const printJobs = [];

    if (printType === 'all' || printType === 'kitchen') {
      if (kitchenItems.length > 0) {
        printJobs.push({
          type: 'kitchen',
          title: 'KITCHEN ORDER',
          orderNumber,
          tableNumber,
          staffName,
          items: kitchenItems.map((item: any) => ({
            name: item.name,
            quantity: item.quantity,
            notes: item.notes,
            station: item.stationName || item.station,
          })),
          notes,
          printedAt: new Date().toISOString(),
        });
      }
    }

    if (printType === 'all' || printType === 'bar') {
      if (barItems.length > 0) {
        printJobs.push({
          type: 'bar',
          title: 'BAR ORDER',
          orderNumber,
          tableNumber,
          staffName,
          items: barItems.map((item: any) => ({
            name: item.name,
            quantity: item.quantity,
            notes: item.notes,
            isAlcoholic: item.isAlcoholic,
          })),
          notes,
          printedAt: new Date().toISOString(),
        });
      }
    }

    if (printType === 'all' || printType === 'receipt') {
      printJobs.push({
        type: 'receipt',
        title: 'CUSTOMER RECEIPT',
        orderNumber,
        tableNumber,
        staffName,
        items: items.map((item: any) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.unitPrice || item.price,
          total: (item.unitPrice || item.price) * item.quantity,
        })),
        subtotal,
        taxAmount,
        total,
        notes,
        printedAt: new Date().toISOString(),
      });
    }

    // Log print activity
    if (orderId) {
      // Could update order with print timestamp
      await db.pOSOrder.update({
        where: { id: orderId },
        data: { printedAt: new Date() },
      }).catch(() => {
        // Order might not exist, ignore error
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        printJobs,
        printedAt: new Date().toISOString(),
        printerStatus: 'online',
      },
      message: `Printed ${printJobs.length} ticket(s) successfully`,
    });
  } catch (error) {
    console.error('Error printing:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to print tickets' },
      { status: 500 }
    );
  }
}
