import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { processSaleIntegrations } from '../../integrations/route';

// GET single order
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const order = await db.pOSOrder.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { createdAt: 'asc' },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
        },
        staff: {
          select: {
            id: true,
            name: true,
            role: true,
            avatar: true,
            color: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Calculate order timing
    const openedAt = new Date(order.openedAt);
    const closedAt = order.closedAt ? new Date(order.closedAt) : null;
    const durationMinutes = closedAt 
      ? Math.floor((closedAt.getTime() - openedAt.getTime()) / (1000 * 60))
      : Math.floor((Date.now() - openedAt.getTime()) / (1000 * 60));

    // Calculate item counts by status
    const itemStatusCounts = order.items.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      success: true,
      data: {
        ...order,
        calculatedDuration: durationMinutes,
        itemStatusCounts,
      },
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}

// PUT update order
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check if order exists
    const existingOrder = await db.pOSOrder.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!existingOrder) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Don't allow updates to closed/cancelled orders
    if (['closed', 'cancelled'].includes(existingOrder.status)) {
      return NextResponse.json(
        { success: false, error: 'Cannot update closed or cancelled order' },
        { status: 400 }
      );
    }

    const {
      action,
      status,
      kitchenStatus,
      customerName,
      customerPhone,
      customerEmail,
      guests,
      staffId,
      staffName,
      notes,
      specialRequests,
      tableId,
      tableNumber,
      sectionId,
      sectionName,
      discountAmount,
      discountType,
      discountReason,
      tipAmount,
      items,
    } = body;

    const updateData: any = {};
    let message = 'Order updated';

    // Handle specific actions
    if (action) {
      switch (action) {
        case 'addItem':
          if (!items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json(
              { success: false, error: 'Items required for addItem action' },
              { status: 400 }
            );
          }
          
          // Add new items
          for (const item of items) {
            await db.pOSOrderItem.create({
              data: {
                orderId: id,
                menuItemId: item.menuItemId,
                name: item.name,
                quantity: item.quantity || 1,
                unitPrice: item.unitPrice,
                totalPrice: item.unitPrice * (item.quantity || 1),
                modifiers: item.modifiers ? JSON.stringify(item.modifiers) : null,
                notes: item.notes,
                station: item.station || 'grill',
                status: 'pending',
                preparationTime: item.preparationTime || 15,
              },
            });
          }
          
          // Recalculate totals
          const allItems = await db.pOSOrderItem.findMany({ where: { orderId: id } });
          const newSubtotal = allItems.reduce((sum, item) => sum + item.totalPrice, 0);
          updateData.subtotal = newSubtotal;
          updateData.taxAmount = newSubtotal * 0.15;
          updateData.total = newSubtotal + (newSubtotal * 0.15) - (existingOrder.discountAmount || 0);
          message = `Added ${items.length} item(s) to order`;
          break;

        case 'removeItem':
          if (!body.itemId) {
            return NextResponse.json(
              { success: false, error: 'itemId required for removeItem action' },
              { status: 400 }
            );
          }
          
          await db.pOSOrderItem.delete({ where: { id: body.itemId } });
          
          // Recalculate totals
          const remainingItems = await db.pOSOrderItem.findMany({ where: { orderId: id } });
          const updatedSubtotal = remainingItems.reduce((sum, item) => sum + item.totalPrice, 0);
          updateData.subtotal = updatedSubtotal;
          updateData.taxAmount = updatedSubtotal * 0.15;
          updateData.total = updatedSubtotal + (updatedSubtotal * 0.15) - (existingOrder.discountAmount || 0);
          message = 'Item removed from order';
          break;

        case 'updateItemQuantity':
          if (!body.itemId || body.quantity === undefined) {
            return NextResponse.json(
              { success: false, error: 'itemId and quantity required' },
              { status: 400 }
            );
          }
          
          const itemToUpdate = await db.pOSOrderItem.findUnique({ where: { id: body.itemId } });
          if (!itemToUpdate) {
            return NextResponse.json(
              { success: false, error: 'Item not found' },
              { status: 404 }
            );
          }
          
          await db.pOSOrderItem.update({
            where: { id: body.itemId },
            data: {
              quantity: body.quantity,
              totalPrice: itemToUpdate.unitPrice * body.quantity,
            },
          });
          
          // Recalculate totals
          const qtyUpdatedItems = await db.pOSOrderItem.findMany({ where: { orderId: id } });
          const qtyUpdatedSubtotal = qtyUpdatedItems.reduce((sum, item) => sum + item.totalPrice, 0);
          updateData.subtotal = qtyUpdatedSubtotal;
          updateData.taxAmount = qtyUpdatedSubtotal * 0.15;
          updateData.total = qtyUpdatedSubtotal + (qtyUpdatedSubtotal * 0.15) - (existingOrder.discountAmount || 0);
          message = 'Item quantity updated';
          break;

        case 'close':
          updateData.status = 'closed';
          updateData.closedAt = new Date();
          message = 'Order closed';
          
          // Trigger inventory and accounting integrations if order is paid
          // This handles cases where order is closed directly without going through payment flow
          if (existingOrder.paymentStatus === 'paid' && existingOrder.paidAmount >= existingOrder.total) {
            try {
              // Get the last payment for accounting entry reference
              const lastPayment = await db.pOSPayment.findFirst({
                where: { orderId: id },
                orderBy: { createdAt: 'desc' },
              });
              
              if (lastPayment) {
                const integrationResult = await processSaleIntegrations(id, lastPayment.id);
                console.log(`[ORDER CLOSE INTEGRATION] Order ${existingOrder.orderNumber}:`, {
                  inventory: integrationResult.inventory?.success,
                  accounting: integrationResult.accounting?.success,
                });
              }
            } catch (integrationError) {
              // Don't fail the order close if integration fails - just log it
              console.error('[ORDER CLOSE INTEGRATION ERROR]', integrationError);
            }
          }
          break;

        case 'sendToKitchen':
          updateData.status = 'sent';
          updateData.kitchenStatus = 'received';
          // Mark all items as sent
          await db.pOSOrderItem.updateMany({
            where: { orderId: id, status: 'pending' },
            data: { sentToKitchen: true, sentAt: new Date() },
          });
          message = 'Order sent to kitchen';
          break;

        case 'markReady':
          updateData.kitchenStatus = 'ready';
          await db.pOSOrderItem.updateMany({
            where: { orderId: id, status: 'preparing' },
            data: { status: 'ready', readyAt: new Date() },
          });
          message = 'Order marked as ready';
          break;

        case 'markServed':
          updateData.status = 'served';
          updateData.kitchenStatus = 'completed';
          await db.pOSOrderItem.updateMany({
            where: { orderId: id, status: 'ready' },
            data: { status: 'served', servedAt: new Date() },
          });
          message = 'Order marked as served';
          break;

        default:
          return NextResponse.json(
            { success: false, error: 'Invalid action' },
            { status: 400 }
          );
      }
    } else {
      // Direct field updates
      if (status) updateData.status = status;
      if (kitchenStatus) updateData.kitchenStatus = kitchenStatus;
      if (customerName !== undefined) updateData.customerName = customerName;
      if (customerPhone !== undefined) updateData.customerPhone = customerPhone;
      if (customerEmail !== undefined) updateData.customerEmail = customerEmail;
      if (guests !== undefined) updateData.guests = guests;
      if (staffId !== undefined) updateData.staffId = staffId;
      if (staffName !== undefined) updateData.staffName = staffName;
      if (notes !== undefined) updateData.notes = notes;
      if (specialRequests !== undefined) updateData.specialRequests = specialRequests;
      if (tableId !== undefined) updateData.tableId = tableId;
      if (tableNumber !== undefined) updateData.tableNumber = tableNumber;
      if (sectionId !== undefined) updateData.sectionId = sectionId;
      if (sectionName !== undefined) updateData.sectionName = sectionName;
      if (discountAmount !== undefined) updateData.discountAmount = discountAmount;
      if (discountType !== undefined) updateData.discountType = discountType;
      if (discountReason !== undefined) updateData.discountReason = discountReason;
      if (tipAmount !== undefined) updateData.tipAmount = tipAmount;
      
      // Recalculate total if discount changed
      if (discountAmount !== undefined) {
        updateData.total = existingOrder.subtotal + existingOrder.taxAmount - discountAmount;
      }
    }

    const order = await db.pOSOrder.update({
      where: { id },
      data: updateData,
      include: {
        items: true,
        payments: true,
        staff: {
          select: {
            id: true,
            name: true,
            role: true,
            avatar: true,
            color: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: order,
      message,
    });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update order' },
      { status: 500 }
    );
  }
}
