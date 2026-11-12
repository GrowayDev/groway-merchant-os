import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST void item or order
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const {
      voidType, // 'item' or 'order'
      itemId,
      quantity = 1,
      reasonId,
      customReason,
      voidedBy,
      pin,
      managerPin,
      notes,
    } = body;

    // Validate required fields
    if (!voidType || !voidedBy || !pin) {
      return NextResponse.json(
        { success: false, error: 'voidType, voidedBy, and pin are required' },
        { status: 400 }
      );
    }

    if (!['item', 'order'].includes(voidType)) {
      return NextResponse.json(
        { success: false, error: 'voidType must be "item" or "order"' },
        { status: 400 }
      );
    }

    // Verify staff and PIN
    const staff = await db.restaurantStaff.findUnique({
      where: { id: voidedBy },
    });

    if (!staff) {
      return NextResponse.json(
        { success: false, error: 'Staff not found' },
        { status: 404 }
      );
    }

    if (staff.pin !== pin) {
      return NextResponse.json(
        { success: false, error: 'Invalid PIN' },
        { status: 401 }
      );
    }

    // Check void permissions
    if (!staff.canVoid) {
      return NextResponse.json(
        { success: false, error: 'Staff does not have void permission' },
        { status: 403 }
      );
    }

    // Get order
    const order = await db.pOSOrder.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Check if order can be voided
    if (['closed', 'cancelled'].includes(order.status)) {
      return NextResponse.json(
        { success: false, error: 'Cannot void closed or cancelled order' },
        { status: 400 }
      );
    }

    // Check if reason requires manager approval
    let requireManagerApproval = false;
    let voidReason = null;

    if (reasonId) {
      voidReason = await db.voidReason.findUnique({ where: { id: reasonId } });
      if (voidReason?.requireManager) {
        requireManagerApproval = true;
      }
    }

    // Handle manager approval if required
    if (requireManagerApproval && !managerPin) {
      return NextResponse.json(
        { success: false, error: 'Manager PIN required for this void reason', requiresManager: true },
        { status: 403 }
      );
    }

    if (requireManagerApproval && managerPin) {
      // Verify manager PIN
      const managers = await db.restaurantStaff.findMany({
        where: {
          role: { in: ['manager', 'admin'] },
          status: 'active',
        },
      });
      
      const validManager = managers.find(m => m.pin === managerPin);
      if (!validManager) {
        return NextResponse.json(
          { success: false, error: 'Invalid manager PIN' },
          { status: 401 }
        );
      }
    }

    let voidAmount = 0;
    let voidLogData: any = {};

    if (voidType === 'order') {
      // Void entire order
      voidAmount = order.total;
      
      // Mark all items as voided
      await db.pOSOrderItem.updateMany({
        where: { orderId: id, status: { not: 'voided' } },
        data: {
          status: 'voided',
          voidedAt: new Date(),
          voidReason: customReason || voidReason?.reason,
          voidedBy,
        },
      });

      // Update order status
      await db.pOSOrder.update({
        where: { id },
        data: {
          status: 'cancelled',
          closedAt: new Date(),
        },
      });

      voidLogData = {
        orderId: id,
        voidedBy,
        reasonId,
        customReason,
        itemType: 'order',
        itemName: order.orderNumber,
        quantity: 1,
        amount: voidAmount,
        managerApproved: requireManagerApproval ? managerPin : null,
        notes,
      };
    } else {
      // Void specific item
      if (!itemId) {
        return NextResponse.json(
          { success: false, error: 'itemId required for item void' },
          { status: 400 }
        );
      }

      const item = await db.pOSOrderItem.findUnique({ where: { id: itemId } });
      if (!item || item.orderId !== id) {
        return NextResponse.json(
          { success: false, error: 'Item not found in this order' },
          { status: 404 }
        );
      }

      if (item.status === 'voided') {
        return NextResponse.json(
          { success: false, error: 'Item already voided' },
          { status: 400 }
        );
      }

      // Calculate void amount based on quantity
      const voidQty = Math.min(quantity, item.quantity);
      voidAmount = item.unitPrice * voidQty;

      // Update item
      if (voidQty >= item.quantity) {
        // Void entire item
        await db.pOSOrderItem.update({
          where: { id: itemId },
          data: {
            status: 'voided',
            voidedAt: new Date(),
            voidReason: customReason || voidReason?.reason,
            voidedBy,
          },
        });
      } else {
        // Partial void - reduce quantity
        const newQty = item.quantity - voidQty;
        await db.pOSOrderItem.update({
          where: { id: itemId },
          data: {
            quantity: newQty,
            totalPrice: item.unitPrice * newQty,
          },
        });

        // Create a voided record for the voided portion
        voidLogData.quantity = voidQty;
      }

      // Recalculate order totals
      const remainingItems = await db.pOSOrderItem.findMany({ 
        where: { orderId: id, status: { not: 'voided' } } 
      });
      const newSubtotal = remainingItems.reduce((sum, i) => sum + i.totalPrice, 0);
      const newTaxAmount = newSubtotal * 0.15;
      const newTotal = newSubtotal + newTaxAmount - (order.discountAmount || 0);

      await db.pOSOrder.update({
        where: { id },
        data: {
          subtotal: newSubtotal,
          taxAmount: newTaxAmount,
          total: newTotal,
        },
      });

      voidLogData = {
        orderId: id,
        orderItemId: itemId,
        voidedBy,
        reasonId,
        customReason,
        itemType: 'item',
        itemName: item.name,
        quantity: voidQty,
        amount: voidAmount,
        managerApproved: requireManagerApproval ? managerPin : null,
        notes,
      };
    }

    // Create void log
    const voidLog = await db.voidLog.create({
      data: voidLogData,
      include: {
        staff: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        reason: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        voidLog,
        voidAmount,
        orderUpdated: true,
      },
      message: voidType === 'order' 
        ? 'Order voided successfully' 
        : 'Item voided successfully',
    });
  } catch (error) {
    console.error('Error voiding:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process void' },
      { status: 500 }
    );
  }
}
